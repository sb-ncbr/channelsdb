/**
 * Copyright (c) 2018-2022 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
import { Structure, StructureElement, Unit } from '../../../mol-model/structure';
import { EmptyLoci } from '../../../mol-model/loci';
import { Vec3 } from '../../../mol-math/linear-algebra';
import { createLinkCylinderMesh, LinkCylinderParams } from './util/link';
import { OrderedSet, Interval } from '../../../mol-data/int';
import { ComplexMeshVisual } from '../complex-visual';
import { UnitsMeshParams } from '../units-visual';
import { ParamDefinition as PD } from '../../../mol-util/param-definition';
import { LocationIterator } from '../../../mol-geo/util/location-iterator';
import { getAltResidueLociFromId } from './util/common';
import { Sphere3D } from '../../../mol-math/geometry';
function createCarbohydrateLinkCylinderMesh(ctx, structure, theme, props, mesh) {
    const { links, elements } = structure.carbohydrates;
    const { linkSizeFactor } = props;
    const location = StructureElement.Location.create(structure);
    const builderProps = {
        linkCount: links.length,
        position: (posA, posB, edgeIndex) => {
            const l = links[edgeIndex];
            Vec3.copy(posA, elements[l.carbohydrateIndexA].geometry.center);
            Vec3.copy(posB, elements[l.carbohydrateIndexB].geometry.center);
        },
        radius: (edgeIndex) => {
            const l = links[edgeIndex];
            const carbA = elements[l.carbohydrateIndexA];
            const ringA = carbA.unit.rings.all[carbA.ringIndex];
            location.unit = carbA.unit;
            location.element = carbA.unit.elements[ringA[0]];
            return theme.size.size(location) * linkSizeFactor;
        },
    };
    const { mesh: m, boundingSphere } = createLinkCylinderMesh(ctx, builderProps, props, mesh);
    if (boundingSphere) {
        m.setBoundingSphere(boundingSphere);
    }
    else if (m.triangleCount > 0) {
        const sphere = Sphere3D.expand(Sphere3D(), structure.boundary.sphere, 1 * linkSizeFactor);
        m.setBoundingSphere(sphere);
    }
    return m;
}
export const CarbohydrateLinkParams = {
    ...UnitsMeshParams,
    ...LinkCylinderParams,
    linkSizeFactor: PD.Numeric(0.3, { min: 0, max: 3, step: 0.01 }),
};
export function CarbohydrateLinkVisual(materialId) {
    return ComplexMeshVisual({
        defaultProps: PD.getDefaultValues(CarbohydrateLinkParams),
        createGeometry: createCarbohydrateLinkCylinderMesh,
        createLocationIterator: CarbohydrateLinkIterator,
        getLoci: getLinkLoci,
        eachLocation: eachCarbohydrateLink,
        setUpdateState: (state, newProps, currentProps) => {
            state.createGeometry = (newProps.linkSizeFactor !== currentProps.linkSizeFactor ||
                newProps.radialSegments !== currentProps.radialSegments ||
                newProps.linkCap !== currentProps.linkCap);
        }
    }, materialId);
}
function CarbohydrateLinkIterator(structure) {
    const { elements, links } = structure.carbohydrates;
    const groupCount = links.length;
    const instanceCount = 1;
    const location = StructureElement.Location.create(structure);
    const getLocation = (groupIndex) => {
        const link = links[groupIndex];
        const carbA = elements[link.carbohydrateIndexA];
        const ringA = carbA.unit.rings.all[carbA.ringIndex];
        location.unit = carbA.unit;
        location.element = carbA.unit.elements[ringA[0]];
        return location;
    };
    return LocationIterator(groupCount, instanceCount, 1, getLocation, true);
}
function getLinkLoci(pickingId, structure, id) {
    const { objectId, groupId } = pickingId;
    if (id === objectId) {
        const { links, elements } = structure.carbohydrates;
        const l = links[groupId];
        const carbA = elements[l.carbohydrateIndexA];
        const carbB = elements[l.carbohydrateIndexB];
        return StructureElement.Loci.union(getAltResidueLociFromId(structure, carbA.unit, carbA.residueIndex, carbA.altId), getAltResidueLociFromId(structure, carbB.unit, carbB.residueIndex, carbB.altId));
    }
    return EmptyLoci;
}
const __linkIndicesSet = new Set();
function eachCarbohydrateLink(loci, structure, apply) {
    let changed = false;
    if (!StructureElement.Loci.is(loci))
        return false;
    if (!Structure.areEquivalent(loci.structure, structure))
        return false;
    const { getLinkIndices } = structure.carbohydrates;
    for (const { unit, indices } of loci.elements) {
        if (!Unit.isAtomic(unit))
            continue;
        __linkIndicesSet.clear();
        OrderedSet.forEach(indices, v => {
            const linkIndices = getLinkIndices(unit, unit.elements[v]);
            for (let i = 0, il = linkIndices.length; i < il; ++i) {
                if (!__linkIndicesSet.has(linkIndices[i])) {
                    __linkIndicesSet.add(linkIndices[i]);
                    if (apply(Interval.ofSingleton(linkIndices[i])))
                        changed = true;
                }
            }
        });
    }
    return changed;
}