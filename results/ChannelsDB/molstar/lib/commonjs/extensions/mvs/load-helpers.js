"use strict";
/**
 * Copyright (c) 2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Adam Midlik <midlik@gmail.com>
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeNearestReprMap = exports.colorThemeForNode = exports.representationProps = exports.componentFromXProps = exports.labelFromXProps = exports.prettyNameFromSelector = exports.componentPropsFromSelector = exports.structureProps = exports.isPhantomComponent = exports.collectInlineLabels = exports.collectInlineTooltips = exports.collectAnnotationTooltips = exports.collectAnnotationReferences = exports.transformProps = exports.transformFromRotationTranslation = exports.AnnotationFromSourceKinds = exports.AnnotationFromUriKinds = exports.UpdateTarget = exports.loadTree = void 0;
const linear_algebra_1 = require("../../mol-math/linear-algebra");
const representation_1 = require("../../mol-plugin-state/transforms/representation");
const array_1 = require("../../mol-util/array");
const json_1 = require("../../mol-util/json");
const string_1 = require("../../mol-util/string");
const annotation_color_theme_1 = require("./components/annotation-color-theme");
const representation_2 = require("./components/annotation-label/representation");
const multilayer_color_theme_1 = require("./components/multilayer-color-theme");
const selector_1 = require("./components/selector");
const selections_1 = require("./helpers/selections");
const utils_1 = require("./helpers/utils");
const tree_schema_1 = require("./tree/generic/tree-schema");
const tree_utils_1 = require("./tree/generic/tree-utils");
const mvs_defaults_1 = require("./tree/mvs/mvs-defaults");
/** Load a tree into Mol*, by applying loading actions in DFS order and then commiting at once.
 * If `options.replaceExisting`, remove all objects in the current Mol* state; otherwise add to the current state. */
async function loadTree(plugin, tree, loadingActions, context, options) {
    var _a;
    const mapping = new Map();
    const updateRoot = exports.UpdateTarget.create(plugin, (_a = options === null || options === void 0 ? void 0 : options.replaceExisting) !== null && _a !== void 0 ? _a : false);
    if (options === null || options === void 0 ? void 0 : options.replaceExisting) {
        exports.UpdateTarget.deleteChildren(updateRoot);
    }
    (0, tree_utils_1.dfs)(tree, (node, parent) => {
        const kind = node.kind;
        const action = loadingActions[kind];
        if (action) {
            const updateParent = parent ? mapping.get(parent) : updateRoot;
            if (updateParent) {
                const msNode = action(updateParent, node, context);
                mapping.set(node, msNode);
            }
            else {
                console.warn(`No target found for this "${node.kind}" node`);
                return;
            }
        }
    });
    await exports.UpdateTarget.commit(updateRoot);
}
exports.loadTree = loadTree;
exports.UpdateTarget = {
    /** Create a new update, with `selector` pointing to the root. */
    create(plugin, replaceExisting) {
        const update = plugin.build();
        const msTarget = update.toRoot().selector;
        const refManager = new RefManager(plugin, replaceExisting);
        return { update, selector: msTarget, refManager };
    },
    /** Add a child node to `target.selector`, return a new `UpdateTarget` pointing to the new child. */
    apply(target, transformer, params, options) {
        var _a, _b;
        let refSuffix = transformer.id;
        if (transformer.id === representation_1.StructureRepresentation3D.id) {
            const reprType = (_b = (_a = params === null || params === void 0 ? void 0 : params.type) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '';
            refSuffix += `:${reprType}`;
        }
        const ref = target.refManager.getChildRef(target.selector, refSuffix);
        const msResult = target.update.to(target.selector).apply(transformer, params, { ...options, ref }).selector;
        return { ...target, selector: msResult };
    },
    /** Delete all children of `target.selector`. */
    deleteChildren(target) {
        const children = target.update.currentTree.children.get(target.selector.ref);
        children.forEach(child => target.update.delete(child));
        return target;
    },
    /** Commit all changes done in the current update. */
    commit(target) {
        return target.update.commit();
    },
};
/** Manages transform refs in a deterministic way. Uses refs like !mvs:3ce3664304d32c5d:0 */
class RefManager {
    constructor(plugin, replaceExisting) {
        /** For each hash (e.g. 3ce3664304d32c5d), store the number of already used refs with that hash. */
        this._counter = {};
        if (!replaceExisting) {
            plugin.state.data.cells.forEach(cell => {
                var _a;
                const ref = cell.transform.ref;
                if (ref.startsWith('!mvs:')) {
                    const [_, hash, idNumber] = ref.split(':');
                    const nextIdNumber = parseInt(idNumber) + 1;
                    if (nextIdNumber > ((_a = this._counter[hash]) !== null && _a !== void 0 ? _a : 0)) {
                        this._counter[hash] = nextIdNumber;
                    }
                }
            });
        }
    }
    /** Return ref for a new node with given `hash`; update the counter accordingly. */
    nextRef(hash) {
        var _a;
        var _b;
        (_a = (_b = this._counter)[hash]) !== null && _a !== void 0 ? _a : (_b[hash] = 0);
        const idNumber = this._counter[hash]++;
        return `!mvs:${hash}:${idNumber}`;
    }
    /** Return ref for a new node based on parent and desired suffix. */
    getChildRef(parent, suffix) {
        const hashBase = parent.ref.replace(/^!mvs:/, '') + ':' + suffix;
        const hash = (0, utils_1.stringHash)(hashBase);
        const result = this.nextRef(hash);
        return result;
    }
}
exports.AnnotationFromUriKinds = new Set(['color_from_uri', 'component_from_uri', 'label_from_uri', 'tooltip_from_uri']);
exports.AnnotationFromSourceKinds = new Set(['color_from_source', 'component_from_source', 'label_from_source', 'tooltip_from_source']);
/** Return a 4x4 matrix representing a rotation followed by a translation */
function transformFromRotationTranslation(rotation, translation) {
    if (rotation && rotation.length !== 9)
        throw new Error(`'rotation' param for 'transform' node must be array of 9 elements, found ${rotation}`);
    if (translation && translation.length !== 3)
        throw new Error(`'translation' param for 'transform' node must be array of 3 elements, found ${translation}`);
    const T = linear_algebra_1.Mat4.identity();
    if (rotation) {
        const rotMatrix = linear_algebra_1.Mat3.fromArray((0, linear_algebra_1.Mat3)(), rotation, 0);
        ensureRotationMatrix(rotMatrix, rotMatrix);
        linear_algebra_1.Mat4.fromMat3(T, rotMatrix);
    }
    if (translation) {
        linear_algebra_1.Mat4.setTranslation(T, linear_algebra_1.Vec3.fromArray((0, linear_algebra_1.Vec3)(), translation, 0));
    }
    if (!linear_algebra_1.Mat4.isRotationAndTranslation(T))
        throw new Error(`'rotation' param for 'transform' is not a valid rotation matrix: ${rotation}`);
    return T;
}
exports.transformFromRotationTranslation = transformFromRotationTranslation;
/** Adjust values in a close-to-rotation matrix `a` to ensure it is a proper rotation matrix
 * (i.e. its columns and rows are orthonormal and determinant equal to 1, within available precission). */
function ensureRotationMatrix(out, a) {
    const x = linear_algebra_1.Vec3.fromArray(_tmpVecX, a, 0);
    const y = linear_algebra_1.Vec3.fromArray(_tmpVecY, a, 3);
    const z = linear_algebra_1.Vec3.fromArray(_tmpVecZ, a, 6);
    linear_algebra_1.Vec3.normalize(x, x);
    linear_algebra_1.Vec3.orthogonalize(y, x, y);
    linear_algebra_1.Vec3.normalize(z, linear_algebra_1.Vec3.cross(z, x, y));
    linear_algebra_1.Mat3.fromColumns(out, x, y, z);
    return out;
}
const _tmpVecX = (0, linear_algebra_1.Vec3)();
const _tmpVecY = (0, linear_algebra_1.Vec3)();
const _tmpVecZ = (0, linear_algebra_1.Vec3)();
/** Create an array of props for `TransformStructureConformation` transformers from all 'transform' nodes applied to a 'structure' node. */
function transformProps(node) {
    const result = [];
    const transforms = (0, tree_schema_1.getChildren)(node).filter(c => c.kind === 'transform');
    for (const transform of transforms) {
        const { rotation, translation } = transform.params;
        const matrix = transformFromRotationTranslation(rotation, translation);
        result.push({ transform: { name: 'matrix', params: { data: matrix, transpose: false } } });
    }
    return result;
}
exports.transformProps = transformProps;
/** Collect distinct annotation specs from all nodes in `tree` and set `context.annotationMap[node]` to respective annotationIds */
function collectAnnotationReferences(tree, context) {
    const distinctSpecs = {};
    (0, tree_utils_1.dfs)(tree, node => {
        var _a, _b, _c, _d;
        let spec = undefined;
        if (exports.AnnotationFromUriKinds.has(node.kind)) {
            const p = node.params;
            spec = { source: { name: 'url', params: { url: p.uri, format: p.format } }, schema: p.schema, cifBlock: blockSpec(p.block_header, p.block_index), cifCategory: (_a = p.category_name) !== null && _a !== void 0 ? _a : undefined };
        }
        else if (exports.AnnotationFromSourceKinds.has(node.kind)) {
            const p = node.params;
            spec = { source: { name: 'source-cif', params: {} }, schema: p.schema, cifBlock: blockSpec(p.block_header, p.block_index), cifCategory: (_b = p.category_name) !== null && _b !== void 0 ? _b : undefined };
        }
        if (spec) {
            const key = (0, json_1.canonicalJsonString)(spec);
            (_c = distinctSpecs[key]) !== null && _c !== void 0 ? _c : (distinctSpecs[key] = { ...spec, id: (0, utils_1.stringHash)(key) });
            ((_d = context.annotationMap) !== null && _d !== void 0 ? _d : (context.annotationMap = new Map())).set(node, distinctSpecs[key].id);
        }
    });
    return Object.values(distinctSpecs);
}
exports.collectAnnotationReferences = collectAnnotationReferences;
function blockSpec(header, index) {
    if ((0, utils_1.isDefined)(header)) {
        return { name: 'header', params: { header: header } };
    }
    else {
        return { name: 'index', params: { index: index !== null && index !== void 0 ? index : 0 } };
    }
}
/** Collect annotation tooltips from all nodes in `tree` and map them to annotationIds. */
function collectAnnotationTooltips(tree, context) {
    const annotationTooltips = [];
    (0, tree_utils_1.dfs)(tree, node => {
        var _a;
        if (node.kind === 'tooltip_from_uri' || node.kind === 'tooltip_from_source') {
            const annotationId = (_a = context.annotationMap) === null || _a === void 0 ? void 0 : _a.get(node);
            if (annotationId) {
                annotationTooltips.push({ annotationId, fieldName: node.params.field_name });
            }
            ;
        }
    });
    return (0, array_1.arrayDistinct)(annotationTooltips);
}
exports.collectAnnotationTooltips = collectAnnotationTooltips;
/** Collect inline tooltips from all nodes in `tree`. */
function collectInlineTooltips(tree, context) {
    const inlineTooltips = [];
    (0, tree_utils_1.dfs)(tree, (node, parent) => {
        if (node.kind === 'tooltip') {
            if ((parent === null || parent === void 0 ? void 0 : parent.kind) === 'component') {
                inlineTooltips.push({
                    text: node.params.text,
                    selector: componentPropsFromSelector(parent.params.selector),
                });
            }
            else if ((parent === null || parent === void 0 ? void 0 : parent.kind) === 'component_from_uri' || (parent === null || parent === void 0 ? void 0 : parent.kind) === 'component_from_source') {
                const p = componentFromXProps(parent, context);
                if ((0, utils_1.isDefined)(p.annotationId) && (0, utils_1.isDefined)(p.fieldName) && (0, utils_1.isDefined)(p.fieldValues)) {
                    inlineTooltips.push({
                        text: node.params.text,
                        selector: {
                            name: 'annotation',
                            params: { annotationId: p.annotationId, fieldName: p.fieldName, fieldValues: p.fieldValues },
                        },
                    });
                }
            }
        }
    });
    return inlineTooltips;
}
exports.collectInlineTooltips = collectInlineTooltips;
/** Collect inline labels from all nodes in `tree`. */
function collectInlineLabels(tree, context) {
    const inlineLabels = [];
    (0, tree_utils_1.dfs)(tree, (node, parent) => {
        if (node.kind === 'label') {
            if ((parent === null || parent === void 0 ? void 0 : parent.kind) === 'component') {
                inlineLabels.push({
                    text: node.params.text,
                    position: {
                        name: 'selection',
                        params: {
                            selector: componentPropsFromSelector(parent.params.selector),
                        },
                    },
                });
            }
            else if ((parent === null || parent === void 0 ? void 0 : parent.kind) === 'component_from_uri' || (parent === null || parent === void 0 ? void 0 : parent.kind) === 'component_from_source') {
                const p = componentFromXProps(parent, context);
                if ((0, utils_1.isDefined)(p.annotationId) && (0, utils_1.isDefined)(p.fieldName) && (0, utils_1.isDefined)(p.fieldValues)) {
                    inlineLabels.push({
                        text: node.params.text,
                        position: {
                            name: 'selection',
                            params: {
                                selector: {
                                    name: 'annotation',
                                    params: { annotationId: p.annotationId, fieldName: p.fieldName, fieldValues: p.fieldValues },
                                },
                            },
                        },
                    });
                }
            }
        }
    });
    return inlineLabels;
}
exports.collectInlineLabels = collectInlineLabels;
/** Return `true` for components nodes which only serve for tooltip placement (not to be created in the MolStar object hierarchy) */
function isPhantomComponent(node) {
    return node.children && node.children.every(child => child.kind === 'tooltip' || child.kind === 'label');
    // These nodes could theoretically be removed when converting MVS to Molstar tree, but would get very tricky if we allow nested components
}
exports.isPhantomComponent = isPhantomComponent;
/** Create props for `StructureFromModel` transformer from a structure node. */
function structureProps(node) {
    var _a;
    const params = node.params;
    switch (params.type) {
        case 'model':
            return {
                type: {
                    name: 'model',
                    params: {}
                },
            };
        case 'assembly':
            return {
                type: {
                    name: 'assembly',
                    params: { id: (_a = params.assembly_id) !== null && _a !== void 0 ? _a : undefined }
                },
            };
        case 'symmetry':
            return {
                type: {
                    name: 'symmetry',
                    params: { ijkMin: linear_algebra_1.Vec3.ofArray(params.ijk_min), ijkMax: linear_algebra_1.Vec3.ofArray(params.ijk_max) }
                },
            };
        case 'symmetry_mates':
            return {
                type: {
                    name: 'symmetry-mates',
                    params: { radius: params.radius }
                }
            };
        default:
            throw new Error(`NotImplementedError: Loading action for "structure" node, type "${params.type}"`);
    }
}
exports.structureProps = structureProps;
/** Create value for `type` prop for `StructureComponent` transformer based on a MVS selector. */
function componentPropsFromSelector(selector) {
    if (selector === undefined) {
        return selector_1.SelectorAll;
    }
    else if (typeof selector === 'string') {
        return { name: 'static', params: selector };
    }
    else if (Array.isArray(selector)) {
        return { name: 'expression', params: (0, selections_1.rowsToExpression)(selector) };
    }
    else {
        return { name: 'expression', params: (0, selections_1.rowToExpression)(selector) };
    }
}
exports.componentPropsFromSelector = componentPropsFromSelector;
/** Return a pretty name for a value of selector param, e.g.  "protein" -> 'Protein', {label_asym_id: "A"} -> 'Custom Selection: {label_asym_id: "A"}' */
function prettyNameFromSelector(selector) {
    if (selector === undefined) {
        return 'All';
    }
    else if (typeof selector === 'string') {
        return (0, string_1.stringToWords)(selector);
    }
    else if (Array.isArray(selector)) {
        return `Custom Selection: [${selector.map(tree_utils_1.formatObject).join(', ')}]`;
    }
    else {
        return `Custom Selection: ${(0, tree_utils_1.formatObject)(selector)}`;
    }
}
exports.prettyNameFromSelector = prettyNameFromSelector;
/** Create props for `StructureRepresentation3D` transformer from a label_from_* node. */
function labelFromXProps(node, context) {
    var _a, _b;
    const annotationId = (_a = context.annotationMap) === null || _a === void 0 ? void 0 : _a.get(node);
    const fieldName = node.params.field_name;
    const nearestReprNode = (_b = context.nearestReprMap) === null || _b === void 0 ? void 0 : _b.get(node);
    return {
        type: { name: representation_2.MVSAnnotationLabelRepresentationProvider.name, params: { annotationId, fieldName } },
        colorTheme: colorThemeForNode(nearestReprNode, context),
    };
}
exports.labelFromXProps = labelFromXProps;
/** Create props for `AnnotationStructureComponent` transformer from a component_from_* node. */
function componentFromXProps(node, context) {
    var _a;
    const annotationId = (_a = context.annotationMap) === null || _a === void 0 ? void 0 : _a.get(node);
    const { field_name, field_values } = node.params;
    return {
        annotationId,
        fieldName: field_name,
        fieldValues: field_values ? { name: 'selected', params: field_values.map(v => ({ value: v })) } : { name: 'all', params: {} },
        nullIfEmpty: false,
    };
}
exports.componentFromXProps = componentFromXProps;
/** Create props for `StructureRepresentation3D` transformer from a representation node. */
function representationProps(params) {
    switch (params.type) {
        case 'cartoon':
            return {
                type: { name: 'cartoon', params: {} },
            };
        case 'ball_and_stick':
            return {
                type: { name: 'ball-and-stick', params: { sizeFactor: 0.5, sizeAspectRatio: 0.5 } },
            };
        case 'surface':
            return {
                type: { name: 'molecular-surface', params: {} },
                sizeTheme: { name: 'physical', params: { scale: 1 } },
            };
        default:
            throw new Error('NotImplementedError');
    }
}
exports.representationProps = representationProps;
/** Create value for `colorTheme` prop for `StructureRepresentation3D` transformer from a representation node based on color* nodes in its subtree. */
function colorThemeForNode(node, context) {
    var _a;
    if ((node === null || node === void 0 ? void 0 : node.kind) === 'representation') {
        const children = (0, tree_schema_1.getChildren)(node).filter(c => c.kind === 'color' || c.kind === 'color_from_uri' || c.kind === 'color_from_source');
        if (children.length === 0) {
            return {
                name: 'uniform',
                params: { value: (0, utils_1.decodeColor)(mvs_defaults_1.DefaultColor) },
            };
        }
        else if (children.length === 1 && appliesColorToWholeRepr(children[0])) {
            return colorThemeForNode(children[0], context);
        }
        else {
            const layers = children.map(c => ({ theme: colorThemeForNode(c, context), selection: componentPropsFromSelector(c.kind === 'color' ? c.params.selector : undefined) }));
            return {
                name: multilayer_color_theme_1.MultilayerColorThemeName,
                params: { layers },
            };
        }
    }
    let annotationId = undefined;
    let fieldName = undefined;
    let color = undefined;
    switch (node === null || node === void 0 ? void 0 : node.kind) {
        case 'color_from_uri':
        case 'color_from_source':
            annotationId = (_a = context.annotationMap) === null || _a === void 0 ? void 0 : _a.get(node);
            fieldName = node.params.field_name;
            break;
        case 'color':
            color = node.params.color;
            break;
    }
    if (annotationId) {
        return {
            name: annotation_color_theme_1.MVSAnnotationColorThemeProvider.name,
            params: { annotationId, fieldName, background: multilayer_color_theme_1.NoColor },
        };
    }
    else {
        return {
            name: 'uniform',
            params: { value: (0, utils_1.decodeColor)(color) },
        };
    }
}
exports.colorThemeForNode = colorThemeForNode;
function appliesColorToWholeRepr(node) {
    if (node.kind === 'color') {
        return !(0, utils_1.isDefined)(node.params.selector) || node.params.selector === 'all';
    }
    else {
        return true;
    }
}
/** Create a mapping of nearest representation nodes for each node in the tree
 * (to transfer coloring to label nodes smartly).
 * Only considers nodes within the same 'structure' subtree. */
function makeNearestReprMap(root) {
    const map = new Map();
    // Propagate up:
    (0, tree_utils_1.dfs)(root, undefined, (node, parent) => {
        if (node.kind === 'representation') {
            map.set(node, node);
        }
        if (node.kind !== 'structure' && map.has(node) && parent && !map.has(parent)) { // do not propagate above the lowest structure node
            map.set(parent, map.get(node));
        }
    });
    // Propagate down:
    (0, tree_utils_1.dfs)(root, (node, parent) => {
        if (!map.has(node) && parent && map.has(parent)) {
            map.set(node, map.get(parent));
        }
    });
    return map;
}
exports.makeNearestReprMap = makeNearestReprMap;