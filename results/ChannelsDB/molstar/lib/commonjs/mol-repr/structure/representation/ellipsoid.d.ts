/**
 * Copyright (c) 2019-2022 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
import { ParamDefinition as PD } from '../../../mol-util/param-definition';
import { RepresentationParamsGetter, RepresentationContext } from '../../../mol-repr/representation';
import { ThemeRegistryContext } from '../../../mol-theme/theme';
import { Structure } from '../../../mol-model/structure';
import { StructureRepresentation, StructureRepresentationProvider } from '../../../mol-repr/structure/representation';
export declare const EllipsoidParams: {
    includeParent: PD.BooleanParam;
    adjustCylinderLength: PD.BooleanParam;
    unitKinds: PD.MultiSelect<"spheres" | "atomic" | "gaussians">;
    sizeFactor: PD.Numeric;
    sizeAspectRatio: PD.Numeric;
    linkCap: PD.BooleanParam;
    visuals: PD.MultiSelect<"intra-bond" | "inter-bond" | "ellipsoid-mesh">;
    bumpFrequency: PD.Numeric;
    tryUseImpostor: PD.BooleanParam;
    includeTypes: PD.MultiSelect<"covalent" | "computed" | "aromatic" | "metal-coordination" | "hydrogen-bond" | "disulfide">;
    excludeTypes: PD.MultiSelect<"covalent" | "computed" | "aromatic" | "metal-coordination" | "hydrogen-bond" | "disulfide">;
    ignoreHydrogens: PD.BooleanParam;
    ignoreHydrogensVariant: PD.Select<"all" | "non-polar">;
    aromaticBonds: PD.BooleanParam;
    multipleBonds: PD.Select<"off" | "symmetric" | "offset">;
    linkScale: PD.Numeric;
    linkSpacing: PD.Numeric;
    aromaticScale: PD.Numeric;
    aromaticSpacing: PD.Numeric;
    aromaticDashCount: PD.Numeric;
    dashCount: PD.Numeric;
    dashScale: PD.Numeric;
    dashCap: PD.BooleanParam;
    stubCap: PD.BooleanParam;
    radialSegments: PD.Numeric;
    colorMode: PD.Select<"default" | "interpolate">;
    doubleSided: PD.BooleanParam;
    ignoreLight: PD.BooleanParam;
    xrayShaded: PD.Select<boolean | "inverted">;
    transparentBackfaces: PD.Select<"off" | "on" | "opaque">;
    solidInterior: PD.BooleanParam;
    bumpAmplitude: PD.Numeric;
    alpha: PD.Numeric;
    quality: PD.Select<"custom" | "auto" | "highest" | "higher" | "high" | "medium" | "low" | "lower" | "lowest">;
    material: PD.Group<PD.Normalize<{
        metalness: number;
        roughness: number;
        bumpiness: number;
    }>>;
    clip: PD.Group<PD.Normalize<{
        variant: import("../../../mol-util/clip").Clip.Variant;
        objects: PD.Normalize<{
            type: any;
            invert: any;
            position: any;
            rotation: any;
            scale: any;
        }>[];
    }>>;
    instanceGranularity: PD.BooleanParam;
    lod: PD.Vec3;
    cellSize: PD.Numeric;
    batchSize: PD.Numeric;
    flipSided: PD.BooleanParam;
    flatShaded: PD.BooleanParam;
    detail: PD.Numeric;
};
export type EllipsoidParams = typeof EllipsoidParams;
export declare function getEllipsoidParams(ctx: ThemeRegistryContext, structure: Structure): {
    includeParent: PD.BooleanParam;
    adjustCylinderLength: PD.BooleanParam;
    unitKinds: PD.MultiSelect<"spheres" | "atomic" | "gaussians">;
    sizeFactor: PD.Numeric;
    sizeAspectRatio: PD.Numeric;
    linkCap: PD.BooleanParam;
    visuals: PD.MultiSelect<"intra-bond" | "inter-bond" | "ellipsoid-mesh">;
    bumpFrequency: PD.Numeric;
    tryUseImpostor: PD.BooleanParam;
    includeTypes: PD.MultiSelect<"covalent" | "computed" | "aromatic" | "metal-coordination" | "hydrogen-bond" | "disulfide">;
    excludeTypes: PD.MultiSelect<"covalent" | "computed" | "aromatic" | "metal-coordination" | "hydrogen-bond" | "disulfide">;
    ignoreHydrogens: PD.BooleanParam;
    ignoreHydrogensVariant: PD.Select<"all" | "non-polar">;
    aromaticBonds: PD.BooleanParam;
    multipleBonds: PD.Select<"off" | "symmetric" | "offset">;
    linkScale: PD.Numeric;
    linkSpacing: PD.Numeric;
    aromaticScale: PD.Numeric;
    aromaticSpacing: PD.Numeric;
    aromaticDashCount: PD.Numeric;
    dashCount: PD.Numeric;
    dashScale: PD.Numeric;
    dashCap: PD.BooleanParam;
    stubCap: PD.BooleanParam;
    radialSegments: PD.Numeric;
    colorMode: PD.Select<"default" | "interpolate">;
    doubleSided: PD.BooleanParam;
    ignoreLight: PD.BooleanParam;
    xrayShaded: PD.Select<boolean | "inverted">;
    transparentBackfaces: PD.Select<"off" | "on" | "opaque">;
    solidInterior: PD.BooleanParam;
    bumpAmplitude: PD.Numeric;
    alpha: PD.Numeric;
    quality: PD.Select<"custom" | "auto" | "highest" | "higher" | "high" | "medium" | "low" | "lower" | "lowest">;
    material: PD.Group<PD.Normalize<{
        metalness: number;
        roughness: number;
        bumpiness: number;
    }>>;
    clip: PD.Group<PD.Normalize<{
        variant: import("../../../mol-util/clip").Clip.Variant;
        objects: PD.Normalize<{
            type: any;
            invert: any;
            position: any;
            rotation: any;
            scale: any;
        }>[];
    }>>;
    instanceGranularity: PD.BooleanParam;
    lod: PD.Vec3;
    cellSize: PD.Numeric;
    batchSize: PD.Numeric;
    flipSided: PD.BooleanParam;
    flatShaded: PD.BooleanParam;
    detail: PD.Numeric;
};
export type EllipsoidRepresentation = StructureRepresentation<EllipsoidParams>;
export declare function EllipsoidRepresentation(ctx: RepresentationContext, getParams: RepresentationParamsGetter<Structure, EllipsoidParams>): EllipsoidRepresentation;
export declare const EllipsoidRepresentationProvider: StructureRepresentationProvider<{
    includeParent: PD.BooleanParam;
    adjustCylinderLength: PD.BooleanParam;
    unitKinds: PD.MultiSelect<"spheres" | "atomic" | "gaussians">;
    sizeFactor: PD.Numeric;
    sizeAspectRatio: PD.Numeric;
    linkCap: PD.BooleanParam;
    visuals: PD.MultiSelect<"intra-bond" | "inter-bond" | "ellipsoid-mesh">;
    bumpFrequency: PD.Numeric;
    tryUseImpostor: PD.BooleanParam;
    includeTypes: PD.MultiSelect<"covalent" | "computed" | "aromatic" | "metal-coordination" | "hydrogen-bond" | "disulfide">;
    excludeTypes: PD.MultiSelect<"covalent" | "computed" | "aromatic" | "metal-coordination" | "hydrogen-bond" | "disulfide">;
    ignoreHydrogens: PD.BooleanParam;
    ignoreHydrogensVariant: PD.Select<"all" | "non-polar">;
    aromaticBonds: PD.BooleanParam;
    multipleBonds: PD.Select<"off" | "symmetric" | "offset">;
    linkScale: PD.Numeric;
    linkSpacing: PD.Numeric;
    aromaticScale: PD.Numeric;
    aromaticSpacing: PD.Numeric;
    aromaticDashCount: PD.Numeric;
    dashCount: PD.Numeric;
    dashScale: PD.Numeric;
    dashCap: PD.BooleanParam;
    stubCap: PD.BooleanParam;
    radialSegments: PD.Numeric;
    colorMode: PD.Select<"default" | "interpolate">;
    doubleSided: PD.BooleanParam;
    ignoreLight: PD.BooleanParam;
    xrayShaded: PD.Select<boolean | "inverted">;
    transparentBackfaces: PD.Select<"off" | "on" | "opaque">;
    solidInterior: PD.BooleanParam;
    bumpAmplitude: PD.Numeric;
    alpha: PD.Numeric;
    quality: PD.Select<"custom" | "auto" | "highest" | "higher" | "high" | "medium" | "low" | "lower" | "lowest">;
    material: PD.Group<PD.Normalize<{
        metalness: number;
        roughness: number;
        bumpiness: number;
    }>>;
    clip: PD.Group<PD.Normalize<{
        variant: import("../../../mol-util/clip").Clip.Variant;
        objects: PD.Normalize<{
            type: any;
            invert: any;
            position: any;
            rotation: any;
            scale: any;
        }>[];
    }>>;
    instanceGranularity: PD.BooleanParam;
    lod: PD.Vec3;
    cellSize: PD.Numeric;
    batchSize: PD.Numeric;
    flipSided: PD.BooleanParam;
    flatShaded: PD.BooleanParam;
    detail: PD.Numeric;
}, "ellipsoid">;