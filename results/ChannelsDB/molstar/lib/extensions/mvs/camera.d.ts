/**
 * Copyright (c) 2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Adam Midlik <midlik@gmail.com>
 */
import { PluginContext } from '../../mol-plugin/context';
import { StateObjectSelector } from '../../mol-state';
import { ParamsOfKind } from './tree/generic/tree-schema';
import { MolstarTree } from './tree/molstar/molstar-tree';
/** Set the camera based on a camera node params. */
export declare function setCamera(plugin: PluginContext, params: ParamsOfKind<MolstarTree, 'camera'>): Promise<void>;
/** Focus the camera on the bounding sphere of a (sub)structure (or on the whole scene if `structureNodeSelector` is null).
 * Orient the camera based on a focus node params. */
export declare function setFocus(plugin: PluginContext, structureNodeSelector: StateObjectSelector | undefined, params?: ParamsOfKind<MolstarTree, 'focus'>): Promise<void>;
/** Set canvas properties based on a canvas node params. */
export declare function setCanvas(plugin: PluginContext, params: ParamsOfKind<MolstarTree, 'canvas'> | undefined): void;