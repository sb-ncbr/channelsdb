import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Copyright (c) 2022-2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
import { PluginUIComponent } from '../../../mol-plugin-ui/base';
import { Button, ControlGroup, IconButton } from '../../../mol-plugin-ui/controls/common';
import { ArrowDropDownSvg, ArrowRightSvg, CloseSvg, VisibilityOffOutlinedSvg, VisibilityOutlinedSvg, ContentCutSvg, BrushSvg, SearchSvg } from '../../../mol-plugin-ui/controls/icons';
import { PluginCommands } from '../../../mol-plugin/commands';
import { StateSelection } from '../../../mol-state';
import { ParameterControls, ParameterMappingControl, SelectControl } from '../../../mol-plugin-ui/controls/parameters';
import { ParamDefinition as PD } from '../../../mol-util/param-definition';
import { Clip } from '../../../mol-util/clip';
import { Color } from '../../../mol-util/color';
import { CombinedColorControl } from '../../../mol-plugin-ui/controls/color';
import { MarkerAction } from '../../../mol-util/marker-action';
import { EveryLoci, Loci } from '../../../mol-model/loci';
import { deepEqual } from '../../../mol-util';
import { ColorValueParam, ColorParams, DimLightness, LightnessParams, LodParams, MesoscaleGroup, OpacityParams, SimpleClipParams, createClipMapping, getClipObjects, getDistinctGroupColors, RootParams, MesoscaleState, getRoots, getAllGroups, getAllLeafGroups, getFilteredEntities, getAllFilteredEntities, getGroups, getEntities, getAllEntities, getEntityLabel, updateColors, getGraphicsModeProps, MesoscaleStateParams, setGraphicsCanvas3DProps, PatternParams, expandAllGroups } from '../data/state';
import React from 'react';
import { StructureElement } from '../../../mol-model/structure/structure/element';
import { Structure } from '../../../mol-model/structure';
import { Sphere3D } from '../../../mol-math/geometry';
function centerLoci(plugin, loci, durationMs = 250) {
    const { canvas3d } = plugin;
    if (!canvas3d)
        return;
    const sphere = Loci.getBoundingSphere(loci) || Sphere3D();
    const snapshot = canvas3d.camera.getCenter(sphere.center);
    canvas3d.requestCameraReset({ durationMs, snapshot });
}
export class ModelInfo extends PluginUIComponent {
    constructor() {
        super(...arguments);
        this.state = {
            isDisabled: false,
        };
    }
    componentDidMount() {
        this.subscribe(this.plugin.state.data.behaviors.isUpdating, v => {
            this.setState({ isDisabled: v });
        });
        this.subscribe(this.plugin.state.events.cell.stateUpdated, e => {
            if (!this.state.isDisabled && MesoscaleState.has(this.plugin) && MesoscaleState.ref(this.plugin) === e.ref) {
                this.forceUpdate();
            }
        });
    }
    get info() {
        if (!MesoscaleState.has(this.plugin))
            return;
        const state = MesoscaleState.get(this.plugin);
        if (!state.description && !state.link)
            return;
        return {
            description: state.description,
            link: state.link,
        };
    }
    render() {
        const info = this.info;
        return info && _jsx(_Fragment, { children: _jsxs("div", { className: 'msp-help-text', children: [_jsx("div", { children: info.description }), _jsx("div", { children: _jsx("a", { href: info.link, target: '_blank', children: "Source" }) })] }) });
    }
}
const SelectionStyleParam = PD.Select('color+outline', PD.objectToOptions({
    'color+outline': 'Color & Outline',
    'color': 'Color',
    'outline': 'Outline'
}));
export class SelectionInfo extends PluginUIComponent {
    constructor() {
        super(...arguments);
        this.state = {
            isDisabled: false,
        };
    }
    componentDidMount() {
        this.subscribe(this.plugin.state.data.behaviors.isUpdating, v => {
            this.setState({ isDisabled: v });
        });
        this.subscribe(this.plugin.managers.structure.selection.events.changed, e => {
            if (!this.state.isDisabled) {
                this.forceUpdate();
            }
        });
    }
    get info() {
        const info = [];
        this.plugin.managers.structure.selection.entries.forEach((e, k) => {
            var _a;
            if (StructureElement.Loci.is(e.selection) && !StructureElement.Loci.isEmpty(e.selection)) {
                const cell = this.plugin.helpers.substructureParent.get(e.selection.structure);
                info.push({
                    label: ((_a = cell === null || cell === void 0 ? void 0 : cell.obj) === null || _a === void 0 ? void 0 : _a.label) || 'Unknown',
                    key: k,
                });
            }
        });
        return info;
    }
    find(label) {
        MesoscaleState.set(this.plugin, { filter: `"${label}"` });
        if (label)
            expandAllGroups(this.plugin);
    }
    ;
    remove(key) {
        const e = this.plugin.managers.structure.selection.entries.get(key);
        if (!e)
            return;
        const loci = Structure.toStructureElementLoci(e.selection.structure);
        this.plugin.managers.interactivity.lociSelects.deselect({ loci }, false);
    }
    center(key) {
        const e = this.plugin.managers.structure.selection.entries.get(key);
        if (!e)
            return;
        const loci = Structure.toStructureElementLoci(e.selection.structure);
        centerLoci(this.plugin, loci);
    }
    get selection() {
        const info = this.info;
        if (!info.length)
            return _jsx(_Fragment, { children: _jsx("div", { className: 'msp-help-text', children: _jsxs("div", { children: ["Use ", _jsx("i", { children: "ctrl+left click" }), " to select entities, either on the 3D canvas or in the tree below"] }) }) });
        return _jsx(_Fragment, { children: info.map((entry, index) => {
                const label = _jsx(Button, { className: `msp-btn-tree-label`, noOverflow: true, disabled: this.state.isDisabled, onClick: () => this.center(entry.key), children: _jsx("span", { title: entry.label, children: entry.label }) });
                const find = _jsx(IconButton, { svg: SearchSvg, toggleState: false, disabled: this.state.isDisabled, small: true, onClick: () => this.find(entry.label) });
                const remove = _jsx(IconButton, { svg: CloseSvg, toggleState: false, disabled: this.state.isDisabled, onClick: () => this.remove(entry.key) });
                return _jsxs("div", { className: `msp-flex-row`, style: { margin: `1px 5px 1px ${1 * 10 + 5}px` }, children: [label, find, remove] }, index);
            }) });
    }
    get style() {
        var _a;
        const p = (_a = this.plugin.canvas3d) === null || _a === void 0 ? void 0 : _a.props;
        if (!p)
            return;
        if (p.renderer.dimStrength === 1 && p.marking.enabled)
            return 'color+outline';
        if (p.renderer.dimStrength === 1)
            return 'color';
        if (p.marking.enabled)
            return 'outline';
    }
    setStyle(value) {
        var _a, _b, _c, _d;
        if (value.includes('color') && value.includes('outline')) {
            (_a = this.plugin.canvas3d) === null || _a === void 0 ? void 0 : _a.setProps({
                renderer: {
                    dimStrength: 1,
                },
                marking: {
                    enabled: true
                }
            });
        }
        else if (value.includes('color')) {
            (_b = this.plugin.canvas3d) === null || _b === void 0 ? void 0 : _b.setProps({
                renderer: {
                    dimStrength: 1,
                },
                marking: {
                    enabled: false
                }
            });
        }
        else if (value.includes('outline')) {
            (_c = this.plugin.canvas3d) === null || _c === void 0 ? void 0 : _c.setProps({
                renderer: {
                    dimStrength: 0,
                    selectStrength: 0.3,
                },
                marking: {
                    enabled: true
                }
            });
        }
        else {
            (_d = this.plugin.canvas3d) === null || _d === void 0 ? void 0 : _d.setProps({
                renderer: {
                    dimStrength: 0,
                    selectStrength: 0,
                },
                marking: {
                    enabled: false
                }
            });
        }
        this.forceUpdate();
    }
    renderStyle() {
        const style = this.style || '';
        return _jsx("div", { style: { margin: '5px', marginBottom: '10px' }, children: _jsx(SelectControl, { name: 'Style', param: SelectionStyleParam, value: style, onChange: (e) => { this.setStyle(e.value); } }) });
    }
    render() {
        return _jsxs(_Fragment, { children: [this.renderStyle(), this.selection] });
    }
}
export class EntityControls extends PluginUIComponent {
    constructor() {
        super(...arguments);
        this.filterRef = React.createRef();
        this.prevFilter = '';
        this.filterFocus = false;
        this.state = {
            isDisabled: false,
        };
        this.setGroupBy = (value) => {
            this.roots.forEach((c, i) => {
                if (c.state.isHidden && value === i || !c.state.isHidden && value !== i) {
                    PluginCommands.State.ToggleVisibility(this.plugin, { state: c.parent, ref: c.transform.ref });
                }
            });
        };
        this.setFilter = (value) => {
            this.filterFocus = true;
            const filter = value.trim().replace(/\s+/gi, ' ');
            MesoscaleState.set(this.plugin, { filter });
            if (filter)
                expandAllGroups(this.plugin);
        };
        this.setGraphics = (graphics) => {
            MesoscaleState.set(this.plugin, { graphics });
            this.plugin.customState.graphicsMode = graphics;
            if (graphics === 'custom')
                return;
            const update = this.plugin.state.data.build();
            const { lodLevels, approximate, alphaThickness } = getGraphicsModeProps(graphics);
            for (const r of getAllEntities(this.plugin)) {
                update.to(r).update(old => {
                    if (old.type) {
                        old.type.params.lodLevels = lodLevels;
                        old.type.params.approximate = approximate;
                        old.type.params.alphaThickness = alphaThickness;
                    }
                });
            }
            for (const g of getAllGroups(this.plugin)) {
                update.to(g).update(old => {
                    old.lod.lodLevels = lodLevels;
                    old.lod.approximate = approximate;
                });
            }
            update.commit();
            setGraphicsCanvas3DProps(this.plugin, graphics);
        };
    }
    componentDidMount() {
        this.subscribe(this.plugin.state.events.object.created, e => {
            this.forceUpdate();
        });
        this.subscribe(this.plugin.state.events.object.removed, e => {
            this.forceUpdate();
        });
        this.subscribe(this.plugin.state.data.behaviors.isUpdating, v => {
            this.setState({ isDisabled: v });
        });
        this.subscribe(this.plugin.state.events.cell.stateUpdated, e => {
            if (!this.state.isDisabled && this.roots.some(r => e.cell === r) || (MesoscaleState.has(this.plugin) && MesoscaleState.ref(this.plugin) === e.ref)) {
                this.forceUpdate();
            }
        });
    }
    componentDidUpdate() {
        var _a;
        const filter = this.filter;
        if (this.filterFocus) {
            (_a = this.filterRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            this.prevFilter = filter;
        }
    }
    get roots() {
        return getRoots(this.plugin);
    }
    get groupBy() {
        const roots = this.roots;
        for (let i = 0, il = roots.length; i < il; ++i) {
            if (!roots[i].state.isHidden)
                return i;
        }
        return 0;
    }
    get filter() {
        return MesoscaleState.has(this.plugin) ? MesoscaleState.get(this.plugin).filter : '';
    }
    get graphics() {
        const customState = this.plugin.customState;
        return MesoscaleState.has(this.plugin) ? MesoscaleState.get(this.plugin).graphics : customState.graphicsMode;
    }
    renderGraphics() {
        const graphics = this.graphics;
        return _jsx("div", { style: { margin: '5px', marginBottom: '10px' }, children: _jsx(SelectControl, { name: 'Graphics', param: MesoscaleStateParams.graphics, value: `${graphics}`, onChange: (e) => { this.setGraphics(e.value); } }) });
    }
    render() {
        const roots = this.roots;
        if (roots.length === 0 || !MesoscaleState.has(this.plugin)) {
            return _jsx(_Fragment, { children: this.renderGraphics() });
        }
        const disabled = this.state.isDisabled;
        const groupBy = this.groupBy;
        const options = [];
        roots.forEach((c, i) => {
            options.push([`${i}`, c.obj.label]);
        });
        const groupParam = PD.Select(options[0][0], options);
        const root = roots.length === 1 ? roots[0] : roots[groupBy];
        const filter = this.filter;
        return _jsxs(_Fragment, { children: [this.renderGraphics(), _jsxs("div", { className: `msp-flex-row msp-control-row`, style: { margin: '5px', marginBottom: '10px' }, children: [_jsx("input", { type: 'text', ref: this.filterRef, value: filter, placeholder: 'Search', onChange: e => this.setFilter(e.target.value), disabled: disabled, onBlur: () => this.filterFocus = false }), _jsx(IconButton, { svg: CloseSvg, toggleState: false, disabled: disabled, onClick: () => this.setFilter('') })] }), options.length > 1 && _jsx("div", { style: { margin: '5px', marginBottom: '10px' }, children: _jsx(SelectControl, { name: 'Group By', param: groupParam, value: `${groupBy}`, onChange: (e) => { this.setGroupBy(parseInt(e.value)); } }) }), _jsx(GroupNode, { filter: filter, cell: root, depth: 0 })] });
    }
}
class Node extends PluginUIComponent {
    is(e) {
        return e.ref === this.ref && e.state === this.props.cell.parent;
    }
    get ref() {
        return this.props.cell.transform.ref;
    }
    get cell() {
        return this.props.cell;
    }
    get roots() {
        return getRoots(this.plugin);
    }
    componentDidMount() {
        this.subscribe(this.plugin.state.data.behaviors.isUpdating, v => {
            this.setState({ isDisabled: v });
        });
        this.subscribe(this.plugin.state.events.cell.stateUpdated, e => {
            if (!this.state.isDisabled && this.is(e)) {
                this.forceUpdate();
            }
        });
    }
}
export class GroupNode extends Node {
    constructor() {
        super(...arguments);
        this.state = {
            isCollapsed: !!this.props.cell.state.isCollapsed,
            action: undefined,
            isDisabled: false,
        };
        this.toggleExpanded = (e) => {
            PluginCommands.State.ToggleExpanded(this.plugin, { state: this.cell.parent, ref: this.ref });
        };
        this.toggleColor = (e) => {
            this.setState({ action: this.state.action === 'color' ? undefined : 'color' });
        };
        this.toggleClip = () => {
            this.setState({ action: this.state.action === 'clip' ? undefined : 'clip' });
        };
        this.toggleRoot = () => {
            this.setState({ action: this.state.action === 'root' ? undefined : 'root' });
        };
        this.highlight = (e) => {
            var _a, _b, _c;
            e.preventDefault();
            (_a = this.plugin.canvas3d) === null || _a === void 0 ? void 0 : _a.mark({ loci: EveryLoci }, MarkerAction.RemoveHighlight);
            for (const r of this.allFilteredEntities) {
                const repr = (_b = r.obj) === null || _b === void 0 ? void 0 : _b.data.repr;
                if (repr) {
                    (_c = this.plugin.canvas3d) === null || _c === void 0 ? void 0 : _c.mark({ repr, loci: EveryLoci }, MarkerAction.Highlight);
                }
            }
        };
        this.clearHighlight = (e) => {
            var _a;
            e.preventDefault();
            (_a = this.plugin.canvas3d) === null || _a === void 0 ? void 0 : _a.mark({ loci: EveryLoci }, MarkerAction.RemoveHighlight);
            e.currentTarget.blur();
        };
        this.toggleVisible = (e) => {
            PluginCommands.State.ToggleVisibility(this.plugin, { state: this.cell.parent, ref: this.ref });
            const isHidden = this.cell.state.isHidden;
            for (const r of this.allFilteredEntities) {
                this.plugin.state.data.updateCellState(r.transform.ref, { isHidden });
            }
            this.plugin.build().to(this.ref).update(old => {
                old.hidden = isHidden;
            }).commit();
        };
        this.updateColor = (values) => {
            const update = this.plugin.state.data.build();
            const { value, type, lightness, alpha } = values;
            const entities = this.filteredEntities;
            let groupColors = [];
            if (type === 'generate') {
                groupColors = getDistinctGroupColors(entities.length, value, values.variability, values.shift);
            }
            for (let i = 0; i < entities.length; ++i) {
                const c = type === 'generate' ? groupColors[i] : value;
                update.to(entities[i]).update(old => {
                    if (old.type) {
                        old.colorTheme.params.value = c;
                        old.colorTheme.params.lightness = lightness;
                        old.type.params.alpha = alpha;
                        old.type.params.xrayShaded = alpha < 1 ? 'inverted' : false;
                    }
                    else {
                        old.coloring.params.color = c;
                        old.coloring.params.lightness = lightness;
                        old.alpha = alpha;
                        old.xrayShaded = alpha < 1 ? true : false;
                    }
                });
            }
            update.to(this.ref).update(old => {
                old.color = values;
            });
            for (const r of this.roots) {
                update.to(r).update(old => {
                    old.color.type = 'custom';
                });
            }
            update.commit();
        };
        this.updateRoot = async (values) => {
            var _a, _b;
            await updateColors(this.plugin, values, (_a = this.cell.params) === null || _a === void 0 ? void 0 : _a.values.tag, this.props.filter);
            const update = this.plugin.state.data.build();
            for (const r of this.roots) {
                if (r !== this.cell) {
                    update.to(r).update(old => {
                        old.color.type = 'custom';
                    });
                    const others = getAllLeafGroups(this.plugin, (_b = r.params) === null || _b === void 0 ? void 0 : _b.values.tag);
                    for (const o of others) {
                        update.to(o).update(old => {
                            old.color.type = 'custom';
                        });
                    }
                }
            }
            update.to(this.ref).update(old => {
                old.color = values;
            });
            update.commit();
        };
        this.updateClip = (values) => {
            const update = this.plugin.state.data.build();
            const clipObjects = getClipObjects(values, this.plugin.canvas3d.boundingSphere);
            for (const r of this.allFilteredEntities) {
                update.to(r).update(old => {
                    if (old.type) {
                        old.type.params.clip.objects = clipObjects;
                    }
                    else {
                        old.clip.objects = clipObjects;
                    }
                });
            }
            for (const g of this.allGroups) {
                update.to(g).update(old => {
                    old.clip = values;
                });
            }
            update.commit();
        };
        this.updateLod = (values) => {
            MesoscaleState.set(this.plugin, { graphics: 'custom' });
            this.plugin.customState.graphicsMode = 'custom';
            const update = this.plugin.state.data.build();
            for (const r of this.allFilteredEntities) {
                update.to(r).update(old => {
                    if (old.type) {
                        old.type.params.lodLevels = values.lodLevels;
                        old.type.params.cellSize = values.cellSize;
                        old.type.params.batchSize = values.batchSize;
                        old.type.params.approximate = values.approximate;
                    }
                });
            }
            for (const g of this.allGroups) {
                update.to(g).update(old => {
                    old.lod = values;
                });
            }
            update.commit();
        };
        this.update = (props) => {
            this.plugin.state.data.build().to(this.ref).update(props);
        };
    }
    get groups() {
        var _a;
        return getGroups(this.plugin, (_a = this.cell.params) === null || _a === void 0 ? void 0 : _a.values.tag);
    }
    get allGroups() {
        var _a;
        const allGroups = getAllGroups(this.plugin, (_a = this.cell.params) === null || _a === void 0 ? void 0 : _a.values.tag);
        allGroups.push(this.cell);
        return allGroups;
    }
    get entities() {
        var _a;
        return getEntities(this.plugin, (_a = this.cell.params) === null || _a === void 0 ? void 0 : _a.values.tag);
    }
    get filteredEntities() {
        var _a;
        return getFilteredEntities(this.plugin, (_a = this.cell.params) === null || _a === void 0 ? void 0 : _a.values.tag, this.props.filter);
    }
    get allEntities() {
        var _a;
        return getAllEntities(this.plugin, (_a = this.cell.params) === null || _a === void 0 ? void 0 : _a.values.tag);
    }
    get allFilteredEntities() {
        var _a;
        return getAllFilteredEntities(this.plugin, (_a = this.cell.params) === null || _a === void 0 ? void 0 : _a.values.tag, this.props.filter);
    }
    renderColor() {
        var _a, _b, _c;
        const color = (_a = this.cell.params) === null || _a === void 0 ? void 0 : _a.values.color;
        if (((_b = this.cell.params) === null || _b === void 0 ? void 0 : _b.values.color.type) === 'uniform') {
            const style = {
                backgroundColor: Color.toStyle(color.value),
                minWidth: 32,
                width: 32,
                borderRight: `6px solid ${Color.toStyle(Color.lighten(color.value, color.lightness))}`
            };
            return _jsx(Button, { style: style, onClick: this.toggleColor });
        }
        else if (((_c = this.cell.params) === null || _c === void 0 ? void 0 : _c.values.color.type) === 'generate') {
            const style = {
                minWidth: 32,
                width: 32,
                borderRight: `6px solid ${Color.toStyle(Color.lighten(color.value, color.lightness))}`
            };
            return _jsx(IconButton, { style: style, svg: BrushSvg, toggleState: false, small: true, onClick: this.toggleColor });
        }
        else {
            return _jsx(IconButton, { svg: BrushSvg, toggleState: false, small: true, onClick: this.toggleColor });
        }
    }
    render() {
        var _a, _b, _c, _d, _e;
        if (this.allFilteredEntities.length === 0)
            return;
        const state = this.cell.state;
        const disabled = false;
        const groupLabel = this.cell.obj.label;
        const depth = this.props.depth;
        const colorValue = (_a = this.cell.params) === null || _a === void 0 ? void 0 : _a.values.color;
        const rootValue = (_b = this.cell.params) === null || _b === void 0 ? void 0 : _b.values.color;
        const clipValue = (_c = this.cell.params) === null || _c === void 0 ? void 0 : _c.values.clip;
        const lodValue = (_d = this.cell.params) === null || _d === void 0 ? void 0 : _d.values.lod;
        const isRoot = (_e = this.cell.params) === null || _e === void 0 ? void 0 : _e.values.root;
        const groups = this.groups;
        const entities = this.entities;
        const label = _jsx(Button, { className: `msp-btn-tree-label`, noOverflow: true, disabled: disabled, onMouseEnter: this.highlight, onMouseLeave: this.clearHighlight, children: _jsx("span", { title: groupLabel, children: groupLabel }) });
        const expand = _jsx(IconButton, { svg: state.isCollapsed ? ArrowRightSvg : ArrowDropDownSvg, flex: '20px', disabled: disabled, onClick: this.toggleExpanded, transparent: true, className: 'msp-no-hover-outline', style: { visibility: groups.length > 0 || entities.length > 0 ? 'visible' : 'hidden' } });
        const color = (entities.length > 0 && !isRoot) && this.renderColor();
        const root = (isRoot && this.allGroups.length > 1) && _jsx(IconButton, { svg: BrushSvg, toggleState: false, disabled: disabled, small: true, onClick: this.toggleRoot });
        const clip = _jsx(IconButton, { svg: ContentCutSvg, toggleState: false, disabled: disabled, small: true, onClick: this.toggleClip });
        const visibility = _jsx(IconButton, { svg: state.isHidden ? VisibilityOffOutlinedSvg : VisibilityOutlinedSvg, toggleState: false, disabled: disabled, small: true, onClick: this.toggleVisible });
        return _jsxs(_Fragment, { children: [_jsxs("div", { className: `msp-flex-row`, style: { margin: `1px 5px 1px ${depth * 10 + 5}px` }, children: [expand, label, root || color, clip, visibility] }), this.state.action === 'color' && _jsx("div", { style: { marginRight: 5 }, className: 'msp-accent-offset', children: _jsx(ControlGroup, { header: 'Color', initialExpanded: true, hideExpander: true, hideOffset: true, onHeaderClick: this.toggleColor, topRightIcon: CloseSvg, noTopMargin: true, childrenClassName: 'msp-viewport-controls-panel-controls', children: _jsx(ParameterControls, { params: ColorParams, values: colorValue, onChangeValues: this.updateColor }) }) }), this.state.action === 'clip' && _jsx("div", { style: { marginRight: 5 }, className: 'msp-accent-offset', children: _jsxs(ControlGroup, { header: 'Clip', initialExpanded: true, hideExpander: true, hideOffset: true, onHeaderClick: this.toggleClip, topRightIcon: CloseSvg, noTopMargin: true, childrenClassName: 'msp-viewport-controls-panel-controls', children: [_jsx(ParameterControls, { params: SimpleClipParams, values: clipValue, onChangeValues: this.updateClip }), _jsx(ParameterControls, { params: LodParams, values: lodValue, onChangeValues: this.updateLod })] }) }), this.state.action === 'root' && _jsx("div", { style: { marginRight: 5 }, className: 'msp-accent-offset', children: _jsx(ControlGroup, { header: 'Color', initialExpanded: true, hideExpander: true, hideOffset: true, onHeaderClick: this.toggleRoot, topRightIcon: CloseSvg, noTopMargin: true, childrenClassName: 'msp-viewport-controls-panel-controls', children: _jsx(ParameterControls, { params: RootParams, values: rootValue, onChangeValues: this.updateRoot }) }) }), (!state.isCollapsed) && _jsxs(_Fragment, { children: [groups.map(c => {
                            return _jsx(GroupNode, { filter: this.props.filter, cell: c, depth: depth + 1 }, c.transform.ref);
                        }), this.filteredEntities.map(c => {
                            return _jsx(EntityNode, { cell: c, depth: depth + 1 }, c.transform.ref);
                        })] })] });
    }
}
export class EntityNode extends Node {
    constructor() {
        super(...arguments);
        this.state = {
            action: undefined,
            isDisabled: false,
        };
        this.clipMapping = createClipMapping(this);
        this.toggleVisible = (e) => {
            e.preventDefault();
            PluginCommands.State.ToggleVisibility(this.plugin, { state: this.props.cell.parent, ref: this.ref });
            e.currentTarget.blur();
        };
        this.toggleColor = (e) => {
            var _a;
            if (e === null || e === void 0 ? void 0 : e.ctrlKey) {
                this.updateLightness({ lightness: ((_a = this.lightnessValue) === null || _a === void 0 ? void 0 : _a.lightness) ? 0 : DimLightness });
                e.preventDefault();
            }
            else {
                this.setState({ action: this.state.action === 'color' ? undefined : 'color' });
            }
        };
        this.toggleClip = () => {
            this.setState({ action: this.state.action === 'clip' ? undefined : 'clip' });
        };
        this.highlight = (e) => {
            var _a, _b, _c, _d;
            e.preventDefault();
            (_a = this.plugin.canvas3d) === null || _a === void 0 ? void 0 : _a.mark({ loci: EveryLoci }, MarkerAction.RemoveHighlight);
            const repr = (_c = (_b = this.cell) === null || _b === void 0 ? void 0 : _b.obj) === null || _c === void 0 ? void 0 : _c.data.repr;
            if (repr) {
                (_d = this.plugin.canvas3d) === null || _d === void 0 ? void 0 : _d.mark({ repr, loci: EveryLoci }, MarkerAction.Highlight);
            }
            e.currentTarget.blur();
        };
        this.clearHighlight = (e) => {
            var _a;
            e.preventDefault();
            (_a = this.plugin.canvas3d) === null || _a === void 0 ? void 0 : _a.mark({ loci: EveryLoci }, MarkerAction.RemoveHighlight);
            e.currentTarget.blur();
        };
        this.toggleSelect = (e) => {
            var _a;
            e.preventDefault();
            const cell = this.cell;
            if (!(((_a = cell === null || cell === void 0 ? void 0 : cell.obj) === null || _a === void 0 ? void 0 : _a.data.sourceData) instanceof Structure))
                return;
            const loci = Structure.toStructureElementLoci(cell.obj.data.sourceData);
            this.plugin.managers.interactivity.lociSelects.toggle({ loci }, false);
        };
        this.center = (e) => {
            var _a;
            e.preventDefault();
            const cell = this.cell;
            if (!(((_a = cell === null || cell === void 0 ? void 0 : cell.obj) === null || _a === void 0 ? void 0 : _a.data.sourceData) instanceof Structure))
                return;
            const loci = Structure.toStructureElementLoci(cell.obj.data.sourceData);
            centerLoci(this.plugin, loci);
        };
        this.handleClick = (e) => {
            if (e.ctrlKey) {
                this.toggleSelect(e);
            }
            else {
                this.center(e);
            }
        };
        this.updateColor = ({ value }) => {
            const update = this.plugin.state.data.build();
            for (const g of this.groups) {
                update.to(g.transform.ref).update(old => {
                    old.color.type = 'custom';
                });
            }
            for (const r of this.roots) {
                update.to(r).update(old => {
                    old.color.type = 'custom';
                });
            }
            update.to(this.ref).update(old => {
                if (old.colorTheme) {
                    old.colorTheme.params.value = value;
                }
                else if (old.coloring) {
                    old.coloring.params.color = value;
                }
            });
            update.commit();
        };
        this.updateLightness = (values) => {
            return this.plugin.build().to(this.ref).update(old => {
                if (old.colorTheme) {
                    old.colorTheme.params.lightness = values.lightness;
                }
                else if (old.coloring) {
                    old.coloring.params.lightness = values.lightness;
                }
            }).commit();
        };
        this.updateOpacity = (values) => {
            return this.plugin.build().to(this.ref).update(old => {
                if (old.type) {
                    old.type.params.alpha = values.alpha;
                    old.type.params.xrayShaded = values.alpha < 1 ? 'inverted' : false;
                }
                else {
                    old.alpha = values.alpha;
                    old.xrayShaded = values.alpha < 1 ? true : false;
                }
            }).commit();
        };
        this.updateClip = (props) => {
            const params = this.cell.transform.params;
            const clip = params.type ? params.type.params.clip : params.clip;
            if (!PD.areEqual(Clip.Params, clip, props)) {
                this.plugin.build().to(this.ref).update(old => {
                    if (old.type) {
                        old.type.params.clip = props;
                    }
                    else {
                        old.clip = props;
                    }
                }).commit();
            }
        };
        this.updateLod = (values) => {
            const params = this.cell.transform.params;
            if (!params.type)
                return;
            MesoscaleState.set(this.plugin, { graphics: 'custom' });
            this.plugin.customState.graphicsMode = 'custom';
            if (!deepEqual(params.type.params.lodLevels, values.lodLevels) || params.type.params.cellSize !== values.cellSize || params.type.params.batchSize !== values.batchSize || params.type.params.approximate !== values.approximate) {
                this.plugin.build().to(this.ref).update(old => {
                    old.type.params.lodLevels = values.lodLevels;
                    old.type.params.cellSize = values.cellSize;
                    old.type.params.batchSize = values.batchSize;
                    old.type.params.approximate = values.approximate;
                }).commit();
            }
        };
        this.updatePattern = (values) => {
            return this.plugin.build().to(this.ref).update(old => {
                if (!old.type) {
                    old.bumpAmplitude = values.amplitude;
                    old.bumpFrequency = values.frequency / 10;
                }
            }).commit();
        };
    }
    get groups() {
        return this.plugin.state.data.select(StateSelection.Generators.ofTransformer(MesoscaleGroup)
            .filter(c => { var _a, _b; return !!((_a = this.cell.transform.tags) === null || _a === void 0 ? void 0 : _a.includes((_b = c.params) === null || _b === void 0 ? void 0 : _b.values.tag)); }));
    }
    get colorValue() {
        var _a, _b, _c, _d, _e;
        return (_c = (_b = (_a = this.cell.transform.params) === null || _a === void 0 ? void 0 : _a.colorTheme) === null || _b === void 0 ? void 0 : _b.params.value) !== null && _c !== void 0 ? _c : (_e = (_d = this.cell.transform.params) === null || _d === void 0 ? void 0 : _d.coloring) === null || _e === void 0 ? void 0 : _e.params.color;
    }
    get lightnessValue() {
        var _a, _b, _c, _d, _e, _f;
        return {
            lightness: (_f = (_c = (_b = (_a = this.cell.transform.params) === null || _a === void 0 ? void 0 : _a.colorTheme) === null || _b === void 0 ? void 0 : _b.params.lightness) !== null && _c !== void 0 ? _c : (_e = (_d = this.cell.transform.params) === null || _d === void 0 ? void 0 : _d.coloring) === null || _e === void 0 ? void 0 : _e.params.lightness) !== null && _f !== void 0 ? _f : 0
        };
    }
    get opacityValue() {
        var _a, _b, _c, _d, _e;
        return {
            alpha: (_e = (_c = (_b = (_a = this.cell.transform.params) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.params.alpha) !== null && _c !== void 0 ? _c : (_d = this.cell.transform.params) === null || _d === void 0 ? void 0 : _d.alpha) !== null && _e !== void 0 ? _e : 1
        };
    }
    get clipValue() {
        var _a, _b;
        return (_b = (_a = this.cell.transform.params.type) === null || _a === void 0 ? void 0 : _a.params.clip) !== null && _b !== void 0 ? _b : this.cell.transform.params.clip;
    }
    get lodValue() {
        var _a, _b;
        const p = (_b = (_a = this.cell.transform.params) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.params;
        if (!p)
            return;
        return {
            lodLevels: p.lodLevels,
            cellSize: p.cellSize,
            batchSize: p.batchSize,
            approximate: p.approximate,
        };
    }
    get patternValue() {
        const p = this.cell.transform.params;
        if (p.type)
            return;
        return {
            amplitude: p.bumpAmplitude,
            frequency: p.bumpFrequency * 10,
        };
    }
    render() {
        const cellState = this.cell.state;
        const disabled = this.cell.status !== 'error' && this.cell.status !== 'ok';
        const depth = this.props.depth;
        const colorValue = this.colorValue;
        const lightnessValue = this.lightnessValue;
        const opacityValue = this.opacityValue;
        const lodValue = this.lodValue;
        const patternValue = this.patternValue;
        const l = getEntityLabel(this.plugin, this.cell);
        const label = _jsx(Button, { className: `msp-btn-tree-label msp-type-class-${this.cell.obj.type.typeClass}`, noOverflow: true, disabled: disabled, onClick: this.handleClick, onMouseEnter: this.highlight, onMouseLeave: this.clearHighlight, children: _jsx("span", { title: l, children: l }) });
        const color = colorValue !== undefined && _jsx(Button, { style: { backgroundColor: Color.toStyle(colorValue), minWidth: 32, width: 32, borderRight: `6px solid ${Color.toStyle(Color.lighten(colorValue, (lightnessValue === null || lightnessValue === void 0 ? void 0 : lightnessValue.lightness) || 0))}` }, onClick: this.toggleColor });
        const clip = _jsx(IconButton, { svg: ContentCutSvg, toggleState: false, disabled: disabled, small: true, onClick: this.toggleClip });
        const visibility = _jsx(IconButton, { svg: cellState.isHidden ? VisibilityOffOutlinedSvg : VisibilityOutlinedSvg, toggleState: false, disabled: disabled, small: true, onClick: this.toggleVisible });
        return _jsxs(_Fragment, { children: [_jsxs("div", { className: `msp-flex-row`, style: { margin: `1px 5px 1px ${depth * 10 + 5}px` }, children: [label, color, clip, visibility] }), this.state.action === 'color' && colorValue !== void 0 && _jsx("div", { style: { marginRight: 5 }, className: 'msp-accent-offset', children: _jsxs(ControlGroup, { header: 'Color', initialExpanded: true, hideExpander: true, hideOffset: true, onHeaderClick: this.toggleColor, topRightIcon: CloseSvg, noTopMargin: true, childrenClassName: 'msp-viewport-controls-panel-controls', children: [_jsx(CombinedColorControl, { param: ColorValueParam, value: colorValue !== null && colorValue !== void 0 ? colorValue : Color(0xFFFFFF), onChange: this.updateColor, name: 'color', hideNameRow: true }), _jsx(ParameterControls, { params: LightnessParams, values: lightnessValue, onChangeValues: this.updateLightness }), _jsx(ParameterControls, { params: OpacityParams, values: opacityValue, onChangeValues: this.updateOpacity }), patternValue && _jsx(ParameterControls, { params: PatternParams, values: patternValue, onChangeValues: this.updatePattern })] }) }), this.state.action === 'clip' && _jsx("div", { style: { marginRight: 5 }, className: 'msp-accent-offset', children: _jsxs(ControlGroup, { header: 'Clip', initialExpanded: true, hideExpander: true, hideOffset: true, onHeaderClick: this.toggleClip, topRightIcon: CloseSvg, noTopMargin: true, childrenClassName: 'msp-viewport-controls-panel-controls', children: [_jsx(ParameterMappingControl, { mapping: this.clipMapping }), lodValue && _jsx(ParameterControls, { params: LodParams, values: lodValue, onChangeValues: this.updateLod })] }) })] });
    }
}