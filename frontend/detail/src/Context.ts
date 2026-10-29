/**
 * Copyright (c) 2024 channelsdb contributors, licensed under Apache 2.0, See LICENSE file for more info.
 *
 * @author Dušan Veľký <dvelky@mail.muni.cz>
 */
import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { PluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { ChannelsDBData } from "./DataInterface";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { Color } from "molstar/lib/mol-util/color";
import { Canvas3DProps } from "molstar/lib/mol-canvas3d/canvas3d";
import { QueryHelper, QueryParam, addDefaults } from "./VizualizerMol/helpers";
import { EmptyLoci, Loci } from "molstar/lib/mol-model/loci";
import { PluginStateObject } from "molstar/lib/mol-plugin-state/objects";
import { StructureComponentManager } from "molstar/lib/mol-plugin-state/manager/structure/component";
import { ParamDefinition } from "molstar/lib/mol-util/param-definition";
import { clearStructureOverpaint } from 'molstar/lib/mol-plugin-state/helpers/structure-overpaint';
import { ColorParams } from "./VizualizerMol/spec";
import { Download, ParseCif } from "molstar/lib/mol-plugin-state/transforms/data";
import { TrajectoryFromMmCif, ModelFromTrajectory, StructureFromModel, StructureComponent } from "molstar/lib/mol-plugin-state/transforms/model";
import { StructureRepresentation3D } from "molstar/lib/mol-plugin-state/transforms/representation";
import { TunnelFromRawData, TunnelShapeProvider } from "molstar/lib/extensions/sb-ncbr"
import { Tunnel } from "molstar/lib/extensions/sb-ncbr/tunnels/data-model"
import { StateBuilder } from "molstar/lib/mol-state";
import { Model } from "molstar/lib/mol-model/structure";
import { ModelSymmetry } from "molstar/lib/mol-model-formats/structure/property/symmetry";
import { MolScriptBuilder as MS } from "molstar/lib/mol-script/language/builder";
import { Expression } from "molstar/lib/mol-script/language/expression";
import { formatMolScript } from "molstar/lib/mol-script/language/expression-formatter";
import { Script } from "molstar/lib/mol-script/script";

/** The structure the channels of a category were computed on: the preferred assembly of the PDB entry or its deposited
 * model (the asymmetric unit). Not known for the reviewed channels. */
const COMPUTED_ON: { [category: string]: 'assembly' | 'model' } = {
  CSATunnels_MOLE: 'assembly',
  CofactorTunnels_MOLE: 'assembly',
  TransmembranePores_MOLE: 'assembly',
  CSATunnels_Caver: 'model',
  CofactorTunnels_Caver: 'model',
  TransmembranePores_Caver: 'model',
  ProcognateTunnels_MOLE: 'model',
  ProcognateTunnels_Caver: 'model',
};

/** Transparency of the parts of the structure that the shown channels were not computed with */
const GHOST_TRANSPARENCY = 0.85;

/** Color of the symmetry copies, so that the deposited chains, which residues and annotations refer to, stand out */
const COPIES_COLOR = Color(0x9a9a9a);

/** The parts of the shown structure in only one of the preferred assembly and the deposited model, with the
 * transparency of their representations */
interface AssemblyParts {
  /** Chains of the deposited model not in the assembly (e.g. other copies in the crystal) */
  outside: Expression | undefined,
  /** Transparency of the deposited model's representations, applied to the outside chains */
  modelTransparencies: string[],
  /** Transparency of the representations of the assembly's symmetry copies, which the deposited model does not have */
  copiesTransparencies: string[],
  /** Whether the outside chains and the copies are transparent now */
  dimmed: { outside: boolean, copies: boolean },
}

export class Context {
  plugin: PluginUIContext;
  // Loaded by loadChannelData, before any channel is shown
  data!: ChannelsDBData;
  // The deposited model: the structure the residues of the channels are looked up in
  assemblyRef = '';
  // Set by load when the preferred assembly differs from the deposited model
  assemblyParts?: AssemblyParts;
  selectedParams: any;
  selectedLoci: Loci | null = null;
  // Colors of the 3D view after loading, which visual.reset returns to
  defaultRendererProps?: Canvas3DProps['renderer'];
  defaultMarkingProps?: Canvas3DProps['marking'];
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

  /** The deposited model of the structure at url; with assemblyId (a PDB entry's preferred assembly), also the
   * assembly's symmetry copies, so that all channels are shown with the structure they were computed with */
  async load(url: string, isBinary: boolean, assemblyId?: Promise<string | undefined>) {
    const update = this.plugin.build();
    const model = update.toRoot()
        .apply(Download, { url, isBinary })
        .apply(ParseCif)
        .apply(TrajectoryFromMmCif)
        .apply(ModelFromTrajectory);
    const structure = model.apply(StructureFromModel);
    const modelRepresentations = this.represent(structure, "het");

    await update.commit();

    this.assemblyRef = structure.ref;
    await this.visual.setDefaultColor({r:255,g:0,b:255});
    if (this.plugin.canvas3d) {
      this.defaultRendererProps = { ...this.plugin.canvas3d.props.renderer };
      this.defaultMarkingProps = { ...this.plugin.canvas3d.props.marking };
    }

    const id = await assemblyId;
    if (id !== undefined) await this.addAssembly(model.ref, modelRepresentations, id);
  }

  /** The representations of the polymer, HET groups and water of structure, their refs; with color, the polymer and the
   * carbons of HET groups in that color instead of by chain */
  private represent(structure: StateBuilder.To<PluginStateObject.Molecule.Structure>, hetRef?: string, color?: Color): string[] {
    const polymer = structure.apply(StructureComponent, { type: { name: 'static', params: 'polymer' } });
    const water = structure.apply(StructureComponent, { type: { name: 'static', params: 'water' } });
    const het = structure.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-het' }, hetRef ? { ref: hetRef } : undefined);

    return [
      polymer.apply(StructureRepresentation3D, {
        type: { name: 'cartoon', params: { alpha: 1 } },
        colorTheme: color === undefined ? { name: 'chain-id', params: {} } : { name: 'uniform', params: { value: color } },
      }).ref,
      het.apply(StructureRepresentation3D, {
        type: { name: 'ball-and-stick', params: { alpha: 1 } },
        colorTheme: { name: 'element-symbol', params: color === undefined ? {} : { carbonColor: { name: 'uniform', params: { value: color } } } },
        sizeTheme: { name: 'physical', params: {} },
      }).ref,
      water.apply(StructureRepresentation3D, {
        type: { name: 'ball-and-stick', params: { alpha: 1 } },
        colorTheme: { name: 'element-symbol', params: {} },
        sizeTheme: { name: 'physical', params: {} },
      }).ref,
    ];
  }

  /** Adds the symmetry copies of the assembly to the deposited model, and transparency to the parts that only one of
   * them has, set by updateAssemblyParts. Nothing when the assembly is the deposited model. */
  private async addAssembly(modelRef: string, modelRepresentations: string[], assemblyId: string) {
    const model = this.plugin.state.data.select(modelRef)[0]?.obj?.data as Model | undefined;
    const assembly = model && ModelSymmetry.Provider.get(model)?.assemblies.find(a => a.id === assemblyId);
    if (!model || !assembly) return;

    const chains = Array.from(model.atomicHierarchy.chains.label_asym_id.toArray());
    const atIdentity = new Set<string>();
    const copies: string[] = [];
    for (const group of assembly.operatorGroups) {
      for (const operator of group.operators) {
        if (operator.isIdentity) (group.asymIds ?? chains).forEach(chain => atIdentity.add(chain));
        else copies.push(operator.name);
      }
    }
    const outside = [...new Set(chains)].filter(chain => !atIdentity.has(chain));
    if (copies.length === 0 && outside.length === 0) return;

    const update = this.plugin.build();
    const modelTransparencies = outside.length === 0 ? [] : modelRepresentations.map(ref =>
      update.to(ref).apply(StateTransforms.Representation.TransparencyStructureRepresentation3DFromScript, { layers: [] }).ref);
    let copiesTransparencies: string[] = [];
    if (copies.length > 0) {
      const copiesOnly = MS.struct.generator.atomGroups({
        'chain-test': MS.core.set.has([MS.set(...copies), MS.struct.atomProperty.core.operatorName()]),
      });
      const copiesStructure = update.to(modelRef)
        .apply(StructureFromModel, { type: { name: 'assembly', params: { id: assemblyId } } })
        .apply(StructureComponent, { type: { name: 'expression', params: copiesOnly }, nullIfEmpty: true, label: 'Symmetry copies' });
      copiesTransparencies = this.represent(copiesStructure, undefined, COPIES_COLOR).map(ref =>
        update.to(ref).apply(StateTransforms.Representation.TransparencyStructureRepresentation3DFromScript, { layers: [] }).ref);
    }
    await update.commit();
    // The view was set for the deposited model only
    if (copies.length > 0) await PluginCommands.Camera.Reset(this.plugin, {});

    this.assemblyParts = {
      outside: outside.length === 0 ? undefined : MS.struct.generator.atomGroups({
        'chain-test': MS.core.set.has([MS.set(...outside), MS.struct.atomProperty.macromolecular.label_asym_id()]),
      }),
      modelTransparencies,
      copiesTransparencies,
      dimmed: { outside: false, copies: false },
    };
    await this.updateAssemblyParts();
  }

  /** Makes transparent the parts of the structure that none of the shown channels were computed with: the chains
   * outside the assembly when only channels computed on the assembly are shown, the symmetry copies when only
   * channels computed on the deposited model are. Nothing when no channel or a channel of unknown origin is shown. */
  async updateAssemblyParts() {
    const parts = this.assemblyParts;
    if (!parts || !this.data) return;
    const shown: string[] = Object.entries(this.data.Channels)
      .filter(([, channels]) => (channels as any[] | undefined)?.some(channel => channel.__isVisible))
      .map(([category]) => COMPUTED_ON[category] ?? 'unknown');
    const known = shown.length > 0 && !shown.includes('unknown');
    const dimmed = { outside: known && !shown.includes('model'), copies: known && !shown.includes('assembly') };
    if (dimmed.outside === parts.dimmed.outside && dimmed.copies === parts.dimmed.copies) return;
    parts.dimmed = dimmed;
    const layers = (dim: boolean, selection: Expression) =>
      dim ? [{ script: Script(formatMolScript(selection), 'mol-script'), value: GHOST_TRANSPARENCY }] : [];

    const update = this.plugin.build();
    if (parts.outside) {
      for (const ref of parts.modelTransparencies) update.to(ref).update({ layers: layers(dimmed.outside, parts.outside) });
    }
    for (const ref of parts.copiesTransparencies) {
      update.to(ref).update({ layers: layers(dimmed.copies, MS.struct.generator.all()) });
    }
    await update.commit();
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
        return { Error: await errorDetail(response), apiStatus: response.status };
    }
    const data = await response.json();
    this.data = data;
    return data;
  }

  async loadAnnotations(url:string, pid: string, subDB: string) {
    const response = await fetch(`${url}/annotations/${subDB}/${pid}`)
    if (!response.ok) {
        this.apiError = true;
        return { Error: await errorDetail(response), apiStatus: response.status };
    }
    return await response.json();
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
            // A residue not in the structure (e.g. a chain of an assembly copy) selects nothing, the others still do
            if (Loci.isEmpty(loci)) continue;
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
        const structure = this.plugin.managers.structure.hierarchy.current.structures[structIndex];
        // Nothing more to clear before the structure is loaded (e.g. on Mol*'s initial click event at startup)
        if (!structure) {
            this.selectedParams = undefined;
            return;
        }
        // remove overpaints
        await clearStructureOverpaint(this.plugin, structure.components);
        // remove selection representations
        if (this.selectedParams && this.selectedParams.addedRepr) {
            const selReprCells = [];
            for (const c of structure.components) {
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
            const defaultTheme: any = { color: 'default' };
            const componentGroups = this.plugin.managers.structure.hierarchy.currentComponentGroups;
            for (const compGrp of componentGroups) {
                await this.plugin.managers.structure.component.updateRepresentationsTheme(compGrp, defaultTheme);
            }
        }

        if (params.highlightColor || params.selectColor) {
            if (!this.plugin.canvas3d || !this.defaultRendererProps || !this.defaultMarkingProps) return;
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

/** The error reported by the API, or the status when the response is not the API's (e.g. a gateway error page) */
async function errorDetail(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return { detail: `${response.status} ${response.statusText}`.trim() };
  }
}
