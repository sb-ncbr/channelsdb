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
import ReactDOM from 'react-dom';
import { Viewer } from "./MolViewer/UI";
import { SbNcbrTunnels } from "molstar/lib/extensions/sb-ncbr";

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

    ReactDOM.render(<UI plugin={plugin}/>, document.getElementById('ui') !)

    ReactDOM.render(<Viewer context={plugin}/>, document.getElementById('plugin') !)

    ReactDOM.render(<LayerVizualizer vizualizer={layerVizualizer} controller={plugin}/>, document.getElementById('layer-vizualizer-ui') !)

    ReactDOM.render(<AglomeredParameters controller={plugin} />, document.getElementById('left-tabs-2') !)

    ReactDOM.render(<ChannelsDescriptions controller={plugin} />, document.getElementById('left-tabs-3') !)

    ReactDOM.render(<LayerProperties controller={plugin}/>, document.getElementById('layer-properties') !)

    ReactDOM.render(<LayerResidues controller={plugin}/>, document.getElementById('layer-residues') !)

    ReactDOM.render(<LiningResidues controller={plugin}/>, document.getElementById('right-tabs-2') !)

    ReactDOM.render(<ResidueAnnotations controller={plugin}/>, document.getElementById('right-tabs-3') !)

    ReactDOM.render(<ProteinAnnotations controller={plugin}/>, document.getElementById('right-panel-tabs-1') !)

    ReactDOM.render(<Controls controller={plugin}/>, document.getElementById('controls') !)

})();
