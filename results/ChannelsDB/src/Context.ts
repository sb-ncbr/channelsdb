/**
 * Copyright (c) 2024 channelsdb contributors, licensed under Apache 2.0, See LICENSE file for more info.
 *
 * @author Dušan Veľký <dvelky@mail.muni.cz>
 */
import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { PluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { ChannelsDBData, Annotations } from "./DataInterface";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { Color } from "molstar/lib/mol-util/color";
import { Canvas3DProps } from "molstar/lib/mol-canvas3d/canvas3d";
import { QueryHelper, QueryParam, addDefaults } from "./VizualizerMol/helpers";
import { EmptyLoci, Loci } from "molstar/lib/mol-model/loci";
import { PluginStateObject } from "molstar/lib/mol-plugin-state/objects";
import { StructureComponentManager } from "molstar/lib/mol-plugin-state/manager/structure/component";
import { ParamDefinition } from "molstar/lib/mol-util/param-definition";
import { clearStructureOverpaint } from 'molstar/lib/mol-plugin-state/helpers/structure-overpaint';
import { ColorParams, InitParams } from "./VizualizerMol/spec";
import { CifFile } from "molstar/lib/mol-io/reader/cif";
import { Download, ParseCif } from "molstar/lib/mol-plugin-state/transforms/data";
import { TrajectoryFromMmCif, ModelFromTrajectory, StructureFromModel, StructureComponent } from "molstar/lib/mol-plugin-state/transforms/model";
import { StructureRepresentation3D } from "molstar/lib/mol-plugin-state/transforms/representation";
import { TunnelFromRawData, TunnelShapeProvider } from "molstar/lib/extensions/sb-ncbr"
import { Tunnel } from "molstar/lib/extensions/sb-ncbr/tunnels/data-model"

export class Context {
  plugin: PluginUIContext;
  data: ChannelsDBData;
  annotations: Annotations.ChannelsDBData;
  cif: CifFile;
  
  initParams: InitParams;
  assemblyRef = '';
  selectedParams: any;
  selectedLoci: Loci | null = null;
  defaultRendererProps: Canvas3DProps['renderer'];
  defaultMarkingProps: Canvas3DProps['marking'];
  isHighlightColorUpdated = false;
  isSelectedColorUpdated = false;

  apiError = false;
  private static handlers: {handler:()=>void}[];

  constructor(MySpec: PluginUISpec) {
    this.plugin = new PluginUIContext(MySpec);
    this.plugin.init();
  }

  //TODO: This is just hotfix, maybe it needs refactoring.
    public static subscribeForApiStatus(handler:()=>void){
        if(this.handlers === void 0){
            this.handlers = [];
        }
        this.handlers.push({handler});
    }

    private static invokeHandlers(){
        if(this.handlers === void 0){
            console.log("no handlers attached... Skiping...");
            return;
        }
        for(let h of this.handlers){
            h.handler();
        }
    }

  async renderTunnel(data: Tunnel, color: Color): Promise<[Loci, string]> {
    const update = this.plugin.build();
    const webgl = this.plugin.canvas3dContext?.webgl;
    const repr = await update
      .toRoot()
      .apply(TunnelFromRawData, { data })
    const tunnlRepr = await repr
      .apply(TunnelShapeProvider, {
        webgl,
        colorTheme: color
      })
      .apply(StateTransforms.Representation.ShapeRepresentation3D)
      .commit();
    return [tunnlRepr.data!.repr.getAllLoci()[0], repr.ref];
  }

  async load(url: string, isBinary: boolean) {
    const update = this.plugin.build();
    const structure = await update.toRoot()
        .apply(Download, { url, isBinary })
        .apply(ParseCif)
        .apply(TrajectoryFromMmCif)
        .apply(ModelFromTrajectory)
        .apply(StructureFromModel);

    const polymer = structure.apply(StructureComponent, { type: { name: 'static', params: 'polymer' } });
    const water = structure.apply(StructureComponent, { type: { name: 'static', params: 'water' } });
    const het = structure.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-het' }, { ref: "het" });

    polymer.apply(StructureRepresentation3D, {
        type: { name: 'cartoon', params: { alpha: 1 } },
        colorTheme: { name: 'chain-id', params: {} },
    });
    het.apply(StructureRepresentation3D, {
        type: { name: 'ball-and-stick', params: { alpha: 1 } },
        colorTheme: { name: 'element-symbol', params: {} },
        sizeTheme: { name: 'physical', params: {} },
    });
    water.apply(StructureRepresentation3D, {
        type: { name: 'ball-and-stick', params: { alpha: 1 } },
        colorTheme: { name: 'element-symbol', params: {} },
        sizeTheme: { name: 'physical', params: {} },
    });

    await update.commit();

    const pivotIndex = this.plugin.managers.structure.hierarchy.selection.structures.length - 1;
    const pivot = this.plugin.managers.structure.hierarchy.selection.structures[pivotIndex];
    if (pivot && pivot.cell.parent) { 
      this.assemblyRef = pivot.cell.transform.ref;
      this.assemblyRef = pivot.cell.transform.ref;
    };
    this.visual.setDefaultColor({r:255,g:0,b:255});
  }

  getData() {
    if (this.data) {
      return this.data;
    }
    return undefined;
  }

  async loadChannelData(url:string, pid: string, subDB: string) {
    const response = await fetch(`${url}/channels/${subDB}/${pid}`);
    if (!response.ok) { 
        this.apiError = true;
        Context.invokeHandlers()
        return { Error: await response.json(), apiStatus: response.status };
    }
    const data = await response.json();
    this.data = data;
    return data;
  }

  async loadAnnotations(url:string, pid: string, subDB: string) {
    const response = await fetch(`${url}/annotations/${subDB}/${pid}`)
    if (!response.ok) {
        this.apiError = true;
        return { Error: await response.json(), apiStatus: response.status };
    }
    const data = await response.json();
    this.annotations = data;
    return data;
  }

  // Following code is based on 'PDBe Molstar' (https://github.com/molstar/pdbe-molstar)
  getLociForParams(params: QueryParam[], structureNumber?: number) {
    let assemblyRef = this.assemblyRef;
    if (structureNumber) {
        assemblyRef = this.plugin.managers.structure.hierarchy.current.structures[structureNumber - 1].cell.transform.ref;
    }

    if (assemblyRef === '') return EmptyLoci;
    const data = (this.plugin.state.data.select(assemblyRef)[0].obj as PluginStateObject.Molecule.Structure).data;
    if (!data) return EmptyLoci;
    return QueryHelper.getInteractivityLoci(params, data);
  }

  normalizeColor(colorVal: any, defaultColor?: Color) {
    let color = Color.fromRgb(170, 170, 170);
    try {
        if (typeof colorVal.r !== 'undefined') {
            color = Color.fromRgb(colorVal.r, colorVal.g, colorVal.b);
        } else if (colorVal[0] === '#') {
            color = Color(Number(`0x${colorVal.substr(1)}`));
        } else {
            color = Color(colorVal);
        }
    } catch (e) {
        if (defaultColor) color = defaultColor;
    }
    return color;
  }

  visual = {
    highlight: (params: { data: QueryParam[], color?: any, focus?: boolean, structureNumber?: number }) => {
        const loci = this.getLociForParams(params.data, params.structureNumber);
        if (Loci.isEmpty(loci)) return;
        if (params.color) {
            this.visual.setColor({ highlight: params.color });
        }
        this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
        if (params.focus) this.plugin.managers.camera.focusLoci(loci);

    },
    clearHighlight: async () => {
        this.plugin.managers.interactivity.lociHighlights.highlightOnly({ loci: EmptyLoci });
        if (this.isHighlightColorUpdated) this.visual.reset({ highlightColor: true });
    },
    select: async (params: { data: QueryParam[], nonSelectedColor?: any, addedRepr?: boolean, structureNumber?: number, forceClear?: boolean }) => {

        // clear prvious selection
        if (this.selectedParams || params.forceClear) {
            await this.visual.clearSelection(params.structureNumber);
        }

        // Structure list to apply selection
        let structureData = this.plugin.managers.structure.hierarchy.current.structures;
        if (params.structureNumber) {
            structureData = [this.plugin.managers.structure.hierarchy.current.structures[params.structureNumber - 1]];
        }

        // set non selected theme color
        if (params.nonSelectedColor) {
            for await (const s of structureData) {
                await this.plugin.managers.structure.component.updateRepresentationsTheme(s.components, { color: 'uniform', colorParams: { value: this.normalizeColor(params.nonSelectedColor) } });
            }
        }

        // apply individual selections
        for await (const param of params.data) {
            // get loci from param
            const loci = this.getLociForParams([param], params.structureNumber);
            if (Loci.isEmpty(loci)) return;
            // set default selection color to minimise change display
            this.visual.setColor({ select: param.color ? param.color : { r: 255, g: 112, b: 3 } });
            // apply selection
            this.plugin.managers.interactivity.lociSelects.selectOnly({ loci });
            // create theme param values and apply them to create overpaint
            const themeParams = StructureComponentManager.getThemeParams(this.plugin, this.plugin.managers.structure.component.pivotStructure);
            const colorValue = ParamDefinition.getDefaultValues(themeParams);
            colorValue.action.params = { color: param.color ? this.normalizeColor(param.color) : Color.fromRgb(255, 112, 3), opacity: 1 };
            await this.plugin.managers.structure.component.applyTheme(colorValue, structureData);
            // add new representations
            if (param.sideChain || param.representation) {
                let repr = 'ball-and-stick';
                if (param.representation) repr = param.representation;
                const defaultParams = StructureComponentManager.getAddParams(this.plugin, { allowNone: false, hideSelection: true, checkExisting: true });
                const defaultValues = ParamDefinition.getDefaultValues(defaultParams);
                defaultValues.options = { label: '[Focus] Target - Lining Residues', checkExisting: params.structureNumber ? false : true };
                const values = { ...defaultValues, ...{ representation: repr } };
                const structures = this.plugin.managers.structure.hierarchy.getStructuresWithSelection();
                await this.plugin.managers.structure.component.add(values, structures);

                // Apply uniform theme
                if (param.representationColor) {
                    let updatedStructureData = this.plugin.managers.structure.hierarchy.current.structures;
                    if (params.structureNumber) {
                        updatedStructureData = [this.plugin.managers.structure.hierarchy.current.structures[params.structureNumber - 1]];
                    }
                    const comps = updatedStructureData[0].components;
                    const lastCompsIndex = comps.length - 1;
                    const recentRepComp = [comps[lastCompsIndex]];
                    const uniformColor = param.representationColor ? this.normalizeColor(param.representationColor) : Color.fromRgb(255, 112, 3);
                    this.plugin.managers.structure.component.updateRepresentationsTheme(recentRepComp, { color: 'uniform', colorParams: { value: uniformColor } });
                }

                params.addedRepr = true;
            }
            // focus loci
            if (param.focus) this.plugin.managers.camera.focusLoci(loci);
            // remove selection
            this.plugin.managers.interactivity.lociSelects.deselect({ loci });
        }

        // reset selection color
        this.visual.reset({ selectColor: true });
        // save selection params to optimise clear
        this.selectedParams = params;

    },
    clearSelection: async (structureNumber?: number) => {
        const structIndex = structureNumber ? structureNumber - 1 : 0;
        this.plugin.managers.interactivity.lociSelects.deselectAll();
        // reset theme to default
        if (this.selectedParams && this.selectedParams.nonSelectedColor) {
            this.visual.reset({ theme: true });
        }
        // remove overpaints
        await clearStructureOverpaint(this.plugin, this.plugin.managers.structure.hierarchy.current.structures[structIndex].components);
        // remove selection representations
        if (this.selectedParams && this.selectedParams.addedRepr) {
            const selReprCells = [];
            for (const c of this.plugin.managers.structure.hierarchy.current.structures[structIndex].components) {
                if (c.cell && c.cell.params && c.cell.params.values && c.cell.params.values.label === '[Focus] Target - Lining Residues') selReprCells.push(c.cell);
            }
            if (selReprCells.length > 0) {
                for await (const selReprCell of selReprCells) {
                    await PluginCommands.State.RemoveObject(this.plugin, { state: selReprCell.parent!, ref: selReprCell.transform.ref });
                };
            }

        }
        this.selectedParams = undefined;
    },
    toggleSpin: async (isSpinning?: boolean, resetCamera?: boolean) => {
        if (!this.plugin.canvas3d) return;
        const trackball = this.plugin.canvas3d.props.trackball;

        let toggleSpinParam: any = trackball.animate.name === 'spin' ? { name: 'off', params: {} } : { name: 'spin', params: { speed: 1 } };

        if (typeof isSpinning !== 'undefined') {
            toggleSpinParam = { name: 'off', params: {} };
            if (isSpinning) toggleSpinParam = { name: 'spin', params: { speed: 1 } };
        }
        await PluginCommands.Canvas3D.SetSettings(this.plugin, { settings: { trackball: { ...trackball, animate: toggleSpinParam } } });
        if (resetCamera) await PluginCommands.Camera.Reset(this.plugin, {});
    },
    focus: async (params: QueryParam[], structureNumber?: number) => {
        const loci = this.getLociForParams(params, structureNumber);
        this.plugin.managers.camera.focusLoci(loci);
    },
    setColor: async (param: { highlight?: ColorParams, select?: ColorParams }) => {
        if (!this.plugin.canvas3d) return;
        if (!param.highlight && !param.select) return;
        const renderer = { ...this.plugin.canvas3d.props.renderer };
        const marking = { ...this.plugin.canvas3d.props.marking };
        if (param.highlight) {
            renderer.highlightColor = this.normalizeColor(param.highlight);
            marking.highlightEdgeColor = Color.darken(this.normalizeColor(param.highlight), 1);
            this.isHighlightColorUpdated = true;
        }
        if (param.select) {
            renderer.selectColor = this.normalizeColor(param.select);
            marking.selectEdgeColor = Color.darken(this.normalizeColor(param.select), 1);
            this.isSelectedColorUpdated = true;
        }
        await PluginCommands.Canvas3D.SetSettings(this.plugin, { settings: { renderer, marking } });
    },
    setDefaultColor: async (color: ColorParams) => {
        if (!this.plugin.canvas3d) return;
        const renderer = { ...this.plugin.canvas3d.props.renderer };
        const marking = { ...this.plugin.canvas3d.props.marking };
        renderer.selectColor = this.normalizeColor(color);
        marking.selectEdgeColor = Color.darken(this.normalizeColor(color), 1);
        this.isSelectedColorUpdated = true;
        await PluginCommands.Canvas3D.SetSettings(this.plugin, { settings: { renderer, marking } });
    },
    reset: async (params: { camera?: boolean, theme?: boolean, highlightColor?: boolean, selectColor?: boolean }) => {
        if (params.camera) await PluginCommands.Camera.Reset(this.plugin, { durationMs: 250 });

        if (params.theme) {
            const defaultTheme: any = { color: this.initParams.alphafoldView ? 'plddt-confidence' : 'default' };
            const componentGroups = this.plugin.managers.structure.hierarchy.currentComponentGroups;
            for (const compGrp of componentGroups) {
                await this.plugin.managers.structure.component.updateRepresentationsTheme(compGrp, defaultTheme);
            }
        }

        if (params.highlightColor || params.selectColor) {
            if (!this.plugin.canvas3d) return;
            const renderer = { ...this.plugin.canvas3d.props.renderer };
            const marking = { ...this.plugin.canvas3d.props.marking };
            if (params.highlightColor) {
                renderer.highlightColor = this.defaultRendererProps.highlightColor;
                marking.highlightEdgeColor = this.defaultMarkingProps.highlightEdgeColor;
                this.isHighlightColorUpdated = false;
            }
            if (params.selectColor) {
                renderer.selectColor = this.defaultRendererProps.selectColor;
                marking.selectEdgeColor = this.defaultMarkingProps.selectEdgeColor;
                this.isSelectedColorUpdated = false;
            }
            await PluginCommands.Canvas3D.SetSettings(this.plugin, { settings: { renderer, marking } });
        }
    },
};

canvas = {
  toggleControls: (isVisible?: boolean) => {
      if (typeof isVisible === 'undefined') isVisible = !this.plugin.layout.state.showControls;
      PluginCommands.Layout.Update(this.plugin, { state: { showControls: isVisible } });
  },

  toggleExpanded: (isExpanded?: boolean) => {
      if (typeof isExpanded === 'undefined') isExpanded = !this.plugin.layout.state.isExpanded;
      PluginCommands.Layout.Update(this.plugin, { state: { isExpanded: isExpanded } });
  },

  setBgColor: async (color?: { r: number, g: number, b: number }) => {
      if (!color) return;
      await this.canvas.applySettings({ color });
  },

  applySettings: async (settings?: { color?: { r: number, g: number, b: number }, lighting?: string }) => {
      if (!settings) return;
      if (!this.plugin.canvas3d) return;
      const renderer = { ...this.plugin.canvas3d.props.renderer };
      if (settings.color) {
          renderer.backgroundColor = Color.fromRgb(settings.color.r, settings.color.g, settings.color.b);
      }
      // if (settings.lighting) {
      //     (renderer as any).style = { name: settings.lighting }; // I don't think this does anything and I don't see how it could ever have worked
      // }
      await PluginCommands.Canvas3D.SetSettings(this.plugin, { settings: { renderer } });
  },

};

}