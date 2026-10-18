/*
* Copyright (c) 2016 - now David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
*/
import { GlobalRouter } from "./SimpleRouter";
import UI from "./UI";
import AglomeredParameters from "./AglomeredParameters/UI";
import ChannelsDescriptions from "./ChannelsDescriptions/UI";
import LayerProperties from "./LayerProperties/UI";
import LayerVizualizer from "./LayerVizualizer/UI";
import LayerResidues from "./LayerResidues/UI";
import LiningResidues from "./LiningResidues/UI";
import ResidueAnnotations from "./ResidueAnnotations/UI";
import ProteinAnnotations from "./ProteinAnnotations/UI";
import { Context } from "./Context";
import {
    DefaultPluginUISpec,
    PluginUISpec,
  } from "molstar/lib/mol-plugin-ui/spec";
import { PluginLayoutControlsDisplay } from "molstar/lib/mol-plugin/layout";
import { DefaultPluginSpec, PluginSpec } from "molstar/lib/mol-plugin/spec";
import { SelectionHelper } from "./CommonUtils/Selection";
import { LayersVizualizerSettings, Vizualizer } from "./LayerVizualizer/Vizualizer";
import { Color } from "molstar/lib/mol-util/color";
import { Controls } from "./Controls/UI";
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { JSX } from 'react';
import { Viewer } from "./MolViewer/UI";
import { SbNcbrTunnels } from "molstar/lib/extensions/sb-ncbr";
import { TunnelsServerConfig } from "molstar/lib/extensions/sb-ncbr/tunnels/props";

(function() {
    const ROUTING_OPTIONS:any = {
        "local":{defaultContextPath: "/detail", defaultPid:"3tbg", defaultDB: "pdb", useParameterAsPid:true},
        "chdb-test":{defaultContextPath: "/detail", defaultPid:"3tbg", defaultDB: "pdb", useLastPathPartAsPid:true},
        // "test":{defaultContextPath: "/test/detail", defaultPid:"3tbg", defaultDB: "pdb", useLastPathPartAsPid:true},
        "chdb-prod":{defaultContextPath: "/detail", defaultPid:"1ymg", defaultDB: "pdb", useParameterAsPid: true},
        // "chdb-prod":{defaultContextPath: "/detail", defaultPid:"3tbg", defaultDB: "pdb", useParameterAsPid: true},
        //"chdb-prod":{defaultContextPath: "/detail", defaultPid:"P10635", defaultDB: "alphafill", useParameterAsPid: true},
    };
    
    const ROUTING_MODE = "chdb-prod";

    const lvSettings: LayersVizualizerSettings = {
        coloringProperty: "Hydropathy",
        useColorMinMax: true,
        skipMiddleColor: false,
        topMargin: 0,
        customRadiusProperty: "MinRadius"
    }
    
    GlobalRouter.init(ROUTING_OPTIONS[ROUTING_MODE]);

    const layerVizualizer = new Vizualizer('layer-vizualizer-ui', lvSettings);

    const MySpec: PluginUISpec = {
        ...DefaultPluginUISpec(),
        layout: {
            initial: {
                isExpanded: false,
                showControls: false,
                controlsDisplay: 'landscape' as PluginLayoutControlsDisplay,
                regionState: {
                bottom: "full",
                left: "full",
                right: "full",
                top: "full",
                },
            },
        },
        config: [
            // Mol* defaults to the production ChannelsDB API, use the one serving this page instead
            [TunnelsServerConfig.DefaultServerUrl, '/api'],
        ],
        behaviors: [
            PluginSpec.Behavior(SbNcbrTunnels),
            ...DefaultPluginUISpec().behaviors,
            ...DefaultPluginSpec().behaviors,
        ],
        canvas3d: {
            renderer : {
                backgroundColor: Color(0),
                selectColor: Color(0xffffff)
            }
        }
    };
    
    const plugin = new Context(MySpec);
    SelectionHelper.attachClearSelectionToEventHandler(plugin);

    // Synchronously, as the panels are laid out right after (see initLayout in main.ts)
    const render = (element: JSX.Element, id: string) => {
        const root = createRoot(document.getElementById(id)!);
        flushSync(() => root.render(element));
    };

    render(<UI plugin={plugin}/>, 'ui');
    render(<Viewer context={plugin}/>, 'plugin');
    render(<LayerVizualizer vizualizer={layerVizualizer} controller={plugin}/>, 'layer-vizualizer-ui');
    render(<AglomeredParameters controller={plugin} />, 'left-tabs-2');
    render(<ChannelsDescriptions controller={plugin} />, 'left-tabs-3');
    render(<LayerProperties controller={plugin}/>, 'layer-properties');
    render(<LayerResidues controller={plugin}/>, 'layer-residues');
    render(<LiningResidues controller={plugin}/>, 'right-tabs-2');
    render(<ResidueAnnotations controller={plugin}/>, 'right-tabs-3');
    render(<ProteinAnnotations controller={plugin}/>, 'right-panel-tabs-1');
    render(<Controls controller={plugin}/>, 'controls');

})();
