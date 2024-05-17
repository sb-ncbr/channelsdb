/**
 * Copyright (c) 2020-2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
import { hashFnv32a } from '../../../mol-data/util';
import { LocationIterator } from '../../../mol-geo/util/location-iterator';
import { calculateTransformBoundingSphere, createTextureImage } from '../../../mol-gl/renderable/util';
import { Sphere3D } from '../../../mol-math/geometry';
import { Vec2, Vec4, Vec3 } from '../../../mol-math/linear-algebra';
import { ValueCell } from '../../../mol-util';
import { ParamDefinition as PD } from '../../../mol-util/param-definition';
import { BaseGeometry } from '../base';
import { createColors } from '../color-data';
import { createMarkers } from '../marker-data';
import { createEmptyOverpaint } from '../overpaint-data';
import { createEmptyTransparency } from '../transparency-data';
import { fillSerial } from '../../../mol-util/array';
import { createEmptyClipping } from '../clipping-data';
import { NullLocation } from '../../../mol-model/location';
import { QuadPositions } from '../../../mol-gl/compute/util';
import { createEmptySubstance } from '../substance-data';
const QuadIndices = new Uint32Array([
    0, 1, 2,
    1, 3, 2
]);
const QuadUvs = new Float32Array([
    0, 1,
    0, 0,
    1, 1,
    1, 0
]);
export const InterpolationTypes = {
    'nearest': 'Nearest',
    'catmulrom': 'Catmulrom (Cubic)',
    'mitchell': 'Mitchell (Cubic)',
    'bspline': 'B-Spline (Cubic)'
};
export const InterpolationTypeNames = Object.keys(InterpolationTypes);
export { Image };
var Image;
(function (Image) {
    function create(imageTexture, corners, groupTexture, image) {
        return image ?
            update(imageTexture, corners, groupTexture, image) :
            fromData(imageTexture, corners, groupTexture);
    }
    Image.create = create;
    function hashCode(image) {
        return hashFnv32a([
            image.cornerBuffer.ref.version
        ]);
    }
    function fromData(imageTexture, corners, groupTexture) {
        const boundingSphere = Sphere3D();
        let currentHash = -1;
        const width = imageTexture.width;
        const height = imageTexture.height;
        const image = {
            kind: 'image',
            imageTexture: ValueCell.create(imageTexture),
            imageTextureDim: ValueCell.create(Vec2.create(width, height)),
            cornerBuffer: ValueCell.create(corners),
            groupTexture: ValueCell.create(groupTexture),
            get boundingSphere() {
                const newHash = hashCode(image);
                if (newHash !== currentHash) {
                    const b = getBoundingSphere(image.cornerBuffer.ref.value);
                    Sphere3D.copy(boundingSphere, b);
                    currentHash = newHash;
                }
                return boundingSphere;
            },
        };
        return image;
    }
    function update(imageTexture, corners, groupTexture, image) {
        const width = imageTexture.width;
        const height = imageTexture.height;
        ValueCell.update(image.imageTexture, imageTexture);
        ValueCell.update(image.imageTextureDim, Vec2.set(image.imageTextureDim.ref.value, width, height));
        ValueCell.update(image.cornerBuffer, corners);
        ValueCell.update(image.groupTexture, groupTexture);
        return image;
    }
    function createEmpty(image) {
        const imageTexture = createTextureImage(0, 4, Uint8Array);
        const corners = image ? image.cornerBuffer.ref.value : new Float32Array(8 * 3);
        const groupTexture = createTextureImage(0, 4, Uint8Array);
        return create(imageTexture, corners, groupTexture, image);
    }
    Image.createEmpty = createEmpty;
    Image.Params = {
        ...BaseGeometry.Params,
        interpolation: PD.Select('bspline', PD.objectToOptions(InterpolationTypes)),
    };
    Image.Utils = {
        Params: Image.Params,
        createEmpty,
        createValues,
        createValuesSimple,
        updateValues,
        updateBoundingSphere,
        createRenderableState,
        updateRenderableState,
        createPositionIterator: () => LocationIterator(1, 1, 1, () => NullLocation)
    };
    function createValues(image, transform, locationIt, theme, props) {
        const { instanceCount, groupCount } = locationIt;
        const positionIt = Image.Utils.createPositionIterator(image, transform);
        const color = createColors(locationIt, positionIt, theme.color);
        const marker = props.instanceGranularity
            ? createMarkers(instanceCount, 'instance')
            : createMarkers(instanceCount * groupCount, 'groupInstance');
        const overpaint = createEmptyOverpaint();
        const transparency = createEmptyTransparency();
        const material = createEmptySubstance();
        const clipping = createEmptyClipping();
        const counts = { drawCount: QuadIndices.length, vertexCount: QuadPositions.length / 3, groupCount, instanceCount };
        const invariantBoundingSphere = Sphere3D.clone(image.boundingSphere);
        const boundingSphere = calculateTransformBoundingSphere(invariantBoundingSphere, transform.aTransform.ref.value, instanceCount, 0);
        return {
            dGeometryType: ValueCell.create('image'),
            ...color,
            ...marker,
            ...overpaint,
            ...transparency,
            ...material,
            ...clipping,
            ...transform,
            ...BaseGeometry.createValues(props, counts),
            aPosition: image.cornerBuffer,
            aUv: ValueCell.create(QuadUvs),
            elements: ValueCell.create(QuadIndices),
            // aGroup is used as a vertex index here, group id is in tGroupTex
            aGroup: ValueCell.create(fillSerial(new Float32Array(4))),
            boundingSphere: ValueCell.create(boundingSphere),
            invariantBoundingSphere: ValueCell.create(invariantBoundingSphere),
            uInvariantBoundingSphere: ValueCell.create(Vec4.ofSphere(invariantBoundingSphere)),
            dInterpolation: ValueCell.create(props.interpolation),
            uImageTexDim: image.imageTextureDim,
            tImageTex: image.imageTexture,
            tGroupTex: image.groupTexture,
        };
    }
    function createValuesSimple(image, props, colorValue, sizeValue, transform) {
        const s = BaseGeometry.createSimple(colorValue, sizeValue, transform);
        const p = { ...PD.getDefaultValues(Image.Params), ...props };
        return createValues(image, s.transform, s.locationIterator, s.theme, p);
    }
    function updateValues(values, props) {
        BaseGeometry.updateValues(values, props);
        ValueCell.updateIfChanged(values.dInterpolation, props.interpolation);
    }
    function updateBoundingSphere(values, image) {
        const invariantBoundingSphere = Sphere3D.clone(image.boundingSphere);
        const boundingSphere = calculateTransformBoundingSphere(invariantBoundingSphere, values.aTransform.ref.value, values.instanceCount.ref.value, 0);
        if (!Sphere3D.equals(boundingSphere, values.boundingSphere.ref.value)) {
            ValueCell.update(values.boundingSphere, boundingSphere);
        }
        if (!Sphere3D.equals(invariantBoundingSphere, values.invariantBoundingSphere.ref.value)) {
            ValueCell.update(values.invariantBoundingSphere, invariantBoundingSphere);
            ValueCell.update(values.uInvariantBoundingSphere, Vec4.fromSphere(values.uInvariantBoundingSphere.ref.value, invariantBoundingSphere));
        }
    }
    function createRenderableState(props) {
        const state = BaseGeometry.createRenderableState(props);
        state.opaque = false;
        return state;
    }
    function updateRenderableState(state, props) {
        BaseGeometry.updateRenderableState(state, props);
        state.opaque = false;
    }
})(Image || (Image = {}));
//
function getBoundingSphere(corners) {
    const center = Vec3();
    const extrema = [];
    for (let i = 0, il = corners.length; i < il; i += 3) {
        const e = Vec3.fromArray(Vec3(), corners, i);
        extrema.push(e);
        Vec3.add(center, center, e);
    }
    Vec3.scale(center, center, 1 / (corners.length / 3));
    let radius = 0;
    for (const e of extrema) {
        const d = Vec3.distance(center, e);
        if (d > radius)
            radius = d;
    }
    const sphere = Sphere3D.create(center, radius);
    Sphere3D.setExtrema(sphere, extrema);
    return sphere;
}