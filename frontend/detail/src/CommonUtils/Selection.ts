import { Tunnel, Layers, TunnelMetaInfo, ChannelSourceData } from "../DataInterface";
import { Context } from "../Context";
import { Representation } from "molstar/lib/mol-repr/representation";
import { Loci } from "molstar/lib/mol-model/loci";
import { ShapeGroup } from "molstar/lib/mol-model/shape";
import { Tunnels } from "./Tunnels";
import { AnnotationDataProvider } from "../AnnotationDataProvider";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { MarkerAction } from "molstar/lib/mol-util/marker-action";
import { StructureComponentManager } from "molstar/lib/mol-plugin-state/manager/structure/component";
import { ParamDefinition } from "molstar/lib/mol-util/param-definition";
import { Color } from "molstar/lib/mol-util/color";

export interface LightResidueInfo{
    authSeqNumber: number, 
    chain:{
        authAsymId:string
    }
};

export interface SelectionObject{
    elements: number[]
};
export interface ResidueLight{type:"light", info:LightResidueInfo};

export class SelectionHelper{
    private static selectedChannelRef: string|undefined;

    private static selectedChannelData: Layers|undefined;
    private static selectedChannelLoci: ShapeGroup.Loci|undefined;
    private static selectedChannelReprLoci: Representation.Loci<Loci>|undefined;

    private static onSelectionHandlers:{handler:(label:string|string[])=>void}[];
    private static onChannelSelectHandlers:{handler:(data:Layers)=>void}[];

    public static attachOnSelect(handler:(label: string|string[])=>void) {
        if(this.onSelectionHandlers===void 0){
            this.onSelectionHandlers = [];
        }

        this.onSelectionHandlers.push({handler});
    }

    private static invokeOnSelectionHandlers(label:string|string[]){
        if(this.onSelectionHandlers === void 0){
            return;
        }

        for(let h of this.onSelectionHandlers){
            h.handler(label);
        }
    }

    public static attachOnChannelSelectHandler(handler:(data:Layers)=>void){
        if(this.onChannelSelectHandlers===void 0){
            this.onChannelSelectHandlers = [];
        }

        this.onChannelSelectHandlers.push({handler});
    }
    private static invokeOnChannelSelectHandlers(data: Layers){
        if(this.onChannelSelectHandlers === void 0){
            return;
        }

        for(let h of this.onChannelSelectHandlers){
            h.handler(data);
        }
    }

    public static getSelectedChannelData(){
        return (this.selectedChannelData===void 0)?null:this.selectedChannelData;
    }

    public static getSelectedChannelRef(){
        return (this.selectedChannelRef===void 0)?"":this.selectedChannelRef;
    }

    public static attachClearSelectionToEventHandler(plugin: Context){
        plugin.plugin.behaviors.interaction.click.subscribe(async ({current, button, modifiers}) => {
            if (!plugin.plugin.selectionMode) {
                await plugin.visual.clearSelection(); // TODO: do we want this or we want selection to stay
                this.objectSelected(current, plugin);
            }
        })
        plugin.plugin.managers.structure.focus.behaviors.current.subscribe((selected) => {
            if (selected?.label) this.invokeOnSelectionHandlers(selected.label);
        })
    }

    public static getSelectedChannelLoci(): ShapeGroup.Loci | undefined {
        return this.selectedChannelLoci;
    }

    public static channelSelected(current: (Tunnel & TunnelMetaInfo), plugin: Context, preserveSelection:boolean) {
        this.invokeOnSelectionHandlers(current.Type + " " + current.Id);
        this.invokeOnChannelSelectHandlers(current.Layers);
        if (this.selectedChannelReprLoci?.loci === current.__loci) {
            if (!preserveSelection) this.removeHighlightSelectedChannel(plugin);
        } else {
            this.removeHighlightSelectedChannel(plugin);
            plugin.plugin.managers.camera.focusLoci(current.__loci);
            this.selectedChannelReprLoci = {loci: current.__loci} as Representation.Loci<Loci>;
            this.highlightSelectedChannel(plugin);
        }
    }

    public static updateSelectionLabel(labels: string|string[]) {
        this.invokeOnSelectionHandlers(labels);
    }

    public static highlightSelectedChannel(plugin: Context) {
        if (this.selectedChannelReprLoci)
            plugin.plugin.canvas3d?.mark(this.selectedChannelReprLoci, MarkerAction.Select);
    }

    public static removeHighlightSelectedChannel(plugin: Context) {
        if (this.selectedChannelReprLoci)
            plugin.plugin.canvas3d?.mark(this.selectedChannelReprLoci, MarkerAction.Deselect);
        this.selectedChannelReprLoci = undefined;
    }

    private static async objectSelected(current: Representation.Loci<Loci>, plugin: Context) {
        if (current.loci.kind == "group-loci") {
            const loci = current.loci as ShapeGroup.Loci;
            this.selectedChannelLoci = loci;
            const data = loci.shape.sourceData as ChannelSourceData;
            const channelsData = plugin.data.Channels;
            if (channelsData) {
                for (const channels of Object.values(channelsData)) {
                    const array = channels as (Tunnel & TunnelMetaInfo)[];
                    for (const tunnel of array) {
                        if (tunnel.Id === data.id && tunnel.Type === data.type) {
                            let len = Tunnels.getLength(tunnel);
                            let annotations = AnnotationDataProvider.getChannelAnnotations(tunnel.Id);
                            let selectLabel;
                            if (annotations !== null && annotations !== void 0) {
                                selectLabel = `<b>${annotations[0].text}</b>, Length: ${len} Å`;
                            } else {
                                selectLabel = `<b>${tunnel.Type}</b>, Length: ${len} Å`;
                            }
                            this.selectedChannelData = tunnel.Layers;
                            this.removeHighlightSelectedChannel(plugin);
                            this.selectedChannelReprLoci = current;
                            this.highlightSelectedChannel(plugin);
                            this.invokeOnSelectionHandlers(selectLabel);
                            this.invokeOnChannelSelectHandlers(this.selectedChannelData);
                            return;
                        }
                    }
                }
            }
        } else if (current.loci.kind === "element-loci") {
            plugin.plugin.managers.interactivity.lociSelects.deselect({ loci: current.loci });
            if (plugin.selectedLoci === null || !Loci.areEqual(current.loci, plugin.selectedLoci)) {
                plugin.visual.setColor({ select: { r: 255, g: 0, b: 255 } });
                plugin.plugin.managers.interactivity.lociSelects.selectOnly({ loci: current.loci });
                let structureData = plugin.plugin.managers.structure.hierarchy.current.structures;
                const themeParams = StructureComponentManager.getThemeParams(plugin.plugin, plugin.plugin.managers.structure.component.pivotStructure);
                const colorValue = ParamDefinition.getDefaultValues(themeParams);
                colorValue.action.params = { color: Color.fromRgb(255, 0, 255), opacity: 1 };
                await plugin.plugin.managers.structure.component.applyTheme(colorValue, structureData);
    
                plugin.plugin.managers.camera.focusLoci(current.loci);
                plugin.plugin.managers.interactivity.lociSelects.deselect({ loci: current.loci });
    
                plugin.visual.reset({ selectColor: true });
    
                plugin.selectedLoci = current.loci;
            } else {
                // await plugin.visual.clearSelection();
                await PluginCommands.Camera.Reset(plugin.plugin, {})
                plugin.selectedLoci = null;
            }
        } else {
            this.invokeOnSelectionHandlers("");
            this.selectedChannelLoci = undefined;
            this.selectedChannelReprLoci = undefined;
        }
    }
}
