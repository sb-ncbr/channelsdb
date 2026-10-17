/*
* Copyright (c) 2016 - now David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
*/

import { Tunnel, TunnelMetaInfo } from "./DataInterface";
import { Tunnel as DataTunnel } from "./DataInterface";
import { Context } from "./Context";
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { UUID } from 'molstar/lib/mol-util/uuid'
import { ColorGenerator } from "molstar/lib/extensions/meshes/mesh-utils";
import { AnnotationDataProvider } from "./AnnotationDataProvider";
import { Tunnels } from "./CommonUtils/Tunnels";
import { Color } from "molstar/lib/mol-util/color";
import { Shape } from "molstar/lib/mol-model/shape";

export interface SurfaceTag { type: string, element?: any }

export async function showDefaultVisuals(plugin: Context, data: any, channelCount: number) {
    return new Promise((res, rej) => {
        let toShow = [];
        if(data.ReviewedChannels_MOLE.length > 0){
            toShow = data.ReviewedChannels_MOLE;
        }
        else if(data.ReviewedChannels_Caver.length > 0){
            toShow = data.ReviewedChannels_Caver;
        }
        else if(data.CSATunnels_MOLE.length > 0){
            toShow = data.CSATunnels_MOLE;
        }
        else if(data.CSATunnels_Caver.length > 0){
            toShow = data.CSATunnels_Caver;
        }
        else if(data.TransmembranePores_MOLE.length > 0){
            toShow = data.TransmembranePores_MOLE;
        }
        else if(data.TransmembranePores_Caver.length > 0){
            toShow = data.TransmembranePores_Caver;
        }
        else if(data.CofactorTunnels_MOLE.length > 0){
            toShow = data.CofactorTunnels_MOLE;
        }
        else if(data.CofactorTunnels_Caver.length > 0){
            toShow = data.CofactorTunnels_Caver;
        }
        else if(data.ProcognateTunnels_MOLE.length > 0){
            toShow = data.ProcognateTunnels_MOLE;
        }
        else if(data.ProcognateTunnels_Caver.length > 0){
            toShow = data.ProcognateTunnels_Caver;
        }
        else if(data.AlphaFillTunnels_MOLE.length > 0){
            toShow = data.AlphaFillTunnels_MOLE;
        }
        else if(data.AlphaFillTunnels_Caver.length > 0){
            toShow = data.AlphaFillTunnels_Caver;
        }
        
        return showChannelVisuals(plugin, toShow/*.slice(0, channelCount)*/, true).then(() => {
            if(data.Cavities === void 0){
                res(null);
                return;
            }
            let cavity = data.Cavities.Cavities[0];
            if (!cavity) {
                res(null);
                return;
            }
            showCavityVisuals(plugin, [cavity ], true).then(() => res(null));
        })});
}

// Right now not used, may be reused in the future
function showSurfaceVisuals(plugin: Context, elements: any[], visible: boolean, type: string, label: (e: any) => string, alpha: number): Promise<any> {
    // I am modifying the original JSON response. In general this is not a very good
    // idea and should be avoided in "real" apps.

    // let t = plugin.createTransform();
    // let needsApply = false;

    // for (let element of elements) {
    //     if (!element.__id) element.__id = Bootstrap.Utils.generateUUID();
    //     //console.log(!!element.__isVisible);
    //     if (!!element.__isVisible === visible) continue;
    //     //console.log("for 1");
    //     element.__isVisible = visible;
    //     if (!element.__color) {
    //         // the colors should probably be initialized when the data is loaded
    //         // so that they are deterministic...
    //         element.__color = nextColor();
    //         //console.log("got new color");
    //     }

    //     if (!visible) {
    //         //console.log("node removed");
    //         plugin.command(Bootstrap.Command.Tree.RemoveNode, element.__id);
    //     } else {
    //         //console.log("creating surface from mesh");
    //         //console.log(element.Mesh);
    //         let surface = createSurface(element.Mesh);
    //         t.add('channelsDB-data', CreateSurface, {
    //             label: label(element),
    //             tag: { type, element },
    //             surface,
    //             color: element.__color as Visualization.Color,
    //             isInteractive: true,
    //             transparency: { alpha }
    //         }, { ref: element.__id, isHidden: true });
    //         needsApply = true;
    //     }
    // }

    // if (needsApply) {
    //     //console.log("needs apply = true");
    //     return new Promise<any>((res, rej) => {
    //         plugin.applyTransform(t).then(() => {
    //             for (let element of elements) {
    //                 element.__isBusy = false;
    //             }
    //             res(null);
    //         }).catch(e => rej(e));
    //     });
    // }
    // else {
    //     //console.log("needs apply = false");
    //     return new Promise<any>((res, rej) => {
    //         for (let element of elements) {
    //             element.__isBusy = false;
    //         }
    //         res(null);
    //     });
    // }
    return new Promise<any>((res, rej) => { res(null) });
}

// Right now not used, may be reused in the future
export function showCavityVisuals(plugin: Context, cavities: any[], visible: boolean): Promise<any> {
    return showSurfaceVisuals(plugin, cavities, visible, 'Cavity', (cavity: any) => `${cavity.Type} ${cavity.Id}`, 0.33);
}

function isBrightEnough(c: Color): boolean {
    const r = c >> 16 & 255;
    const g = c >> 8 & 255;
    const b = c & 255;

    const brightnessThreshold = 10;
    const isBrightEnough = r > brightnessThreshold || g > brightnessThreshold || b > brightnessThreshold;
    // const hasHue = r !== g || r !== b;

    return isBrightEnough;
}

//Modified
export async function showChannelVisuals(plugin: Context, channels: Tunnel[]&TunnelMetaInfo[], visible: boolean): Promise<any> {
    for (let channel of channels) {

        if (!channel.__id) channel.__id = UUID.create22();
        if (!!channel.__isVisible === visible) continue;

        channel.__isVisible = visible;
        if (!channel.__color) {
            let color = ColorGenerator.next().value;
            while (!isBrightEnough(color)) {
                color = ColorGenerator.next().value;
            }
            channel.__color = color;
        }

        if (!visible) {
            await PluginCommands.State.RemoveObject(plugin.plugin, { state: plugin.plugin.state.data, ref: channel.__ref });
        } else {
            let annotations = AnnotationDataProvider.getChannelAnnotations(channel.Id);
            let props = {highlight_label: '', id: '', type: '', label: '', description: ''};
            let len = Tunnels.getLength(channel as DataTunnel);

            props.id = channel.Id;
            props.type = channel.Type;

            if (annotations !== null && annotations !== void 0) {
                props.highlight_label = `<b>${annotations[0].text}</b>, Length: ${len} Å`;
                props.label = `${annotations[0].text}`;
                props.description = `${channel.Type} ${channel.Id} | Length: ${len} Å`;
            } else {
                props.highlight_label = `<b>${channel.Type}</b>, Length: ${len} Å`;
                props.label = `${channel.Type} ${channel.Id}`;
                props.description = `Length: ${len} Å`;
            }
            const ref = await plugin.renderTunnel({data: channel.Profile, props }, channel.__color);
            channel.__ref = ref[1];
            channel.__loci = ref[0] as Shape.Loci;
        }
    }

    return Promise.resolve().then(()=>{
        for(let channel of channels){
            channel.__isBusy = false;
        }
    });
}