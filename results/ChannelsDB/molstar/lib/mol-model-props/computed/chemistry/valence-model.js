/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Fred Ludlow <Fred.Ludlow@astx.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
import { Unit, Bond } from '../../../mol-model/structure';
import { isMetal } from '../../../mol-model/structure/model/properties/atomic/types';
import { AtomGeometry, assignGeometry } from './geometry';
import { bondCount, typeSymbol, formalCharge, bondToElementCount } from './util';
import { ParamDefinition as PD } from '../../../mol-util/param-definition';
import { isDebugMode } from '../../../mol-util/debug';
import { SortedArray } from '../../../mol-data/int';
import { BondType } from '../../../mol-model/structure/model/types';
/**
 * TODO:
 *   Ensure proper treatment of disorder/models. e.g. V257 N in 5vim
 *   Formal charge of 255 for SO4 anion (e.g. 5ghl)
 *   Have removed a lot of explicit features (as I think they're more
 *   generally captured by better VM).
 *     Could we instead have a "delocalised negative/positive" charge
 *     feature and flag these up?
 *
 */
const tmpConjBondItA = new Bond.ElementBondIterator();
const tmpConjBondItB = new Bond.ElementBondIterator();
/**
 * Are we involved in some kind of pi system. Either explicitly forming
 * double bond or N, O next to a double bond, except:
 *
 *   N,O with degree 4 cannot be conjugated.
 *   N,O adjacent to P=O or S=O do not qualify (keeps sulfonamide N sp3 geom)
 */
function isConjugated(structure, unit, index) {
    const element = typeSymbol(unit, index);
    const hetero = element === "O" /* Elements.O */ || element === "N" /* Elements.N */;
    if (hetero && bondCount(structure, unit, index) === 4)
        return false;
    tmpConjBondItA.setElement(structure, unit, index);
    while (tmpConjBondItA.hasNext) {
        const bA = tmpConjBondItA.move();
        if (bA.order > 1)
            return true;
        if (hetero) {
            const elementB = typeSymbol(bA.otherUnit, bA.otherIndex);
            tmpConjBondItB.setElement(structure, bA.otherUnit, bA.otherIndex);
            while (tmpConjBondItB.hasNext) {
                const bB = tmpConjBondItB.move();
                if (bB.order > 1) {
                    if ((elementB === "P" /* Elements.P */ || elementB === "S" /* Elements.S */) &&
                        typeSymbol(bB.otherUnit, bB.otherIndex) === "O" /* Elements.O */) {
                        continue;
                    }
                    return true;
                }
            }
        }
    }
    return false;
}
export function explicitValence(structure, unit, index) {
    let v = 0;
    // intra-unit bonds
    const { offset, edgeProps: { flags, order } } = unit.bonds;
    for (let i = offset[index], il = offset[index + 1]; i < il; ++i) {
        if (BondType.isCovalent(flags[i]))
            v += order[i];
    }
    // inter-unit bonds
    structure.interUnitBonds.getEdgeIndices(index, unit.id).forEach(i => {
        const b = structure.interUnitBonds.edges[i];
        if (BondType.isCovalent(b.props.flag))
            v += b.props.order;
    });
    return v;
}
const tmpChargeBondItA = new Bond.ElementBondIterator();
const tmpChargeBondItB = new Bond.ElementBondIterator();
/**
 * Attempts to produce a consistent charge and implicit
 * H-count for an atom.
 *
 * If both props.assignCharge and props.assignH, this
 * approximately follows the rules described in
 * https://docs.eyesopen.com/toolkits/python/oechemtk/valence.html#openeye-hydrogen-count-model
 *
 * If only charge or hydrogens are to be assigned it takes
 * a much simpler view and deduces one from the other
 */
export function calculateHydrogensCharge(structure, unit, index, props) {
    const hydrogenCount = bondToElementCount(structure, unit, index, "H" /* Elements.H */);
    const element = typeSymbol(unit, index);
    let charge = formalCharge(unit, index);
    const assignCharge = (props.assignCharge === 'always' || (props.assignCharge === 'auto' && charge === 0));
    const assignH = (props.assignH === 'always' || (props.assignH === 'auto' && hydrogenCount === 0));
    const degree = bondCount(structure, unit, index);
    const valence = explicitValence(structure, unit, index);
    const conjugated = isConjugated(structure, unit, index);
    const multiBond = (valence - degree > 0);
    let implicitHCount = 0;
    let geom = AtomGeometry.Unknown;
    switch (element) {
        case "H" /* Elements.H */:
            if (assignCharge) {
                if (degree === 0) {
                    charge = 1;
                    geom = AtomGeometry.Spherical;
                }
                else if (degree === 1) {
                    charge = 0;
                    geom = AtomGeometry.Terminal;
                }
            }
            break;
        case "C" /* Elements.C */:
            // TODO: Isocyanide?
            if (assignCharge) {
                charge = 0; // Assume carbon always neutral
            }
            if (assignH) {
                // Carbocation/carbanion are 3-valent
                implicitHCount = Math.max(0, 4 - valence - Math.abs(charge));
            }
            // Carbocation is planar, carbanion is tetrahedral
            geom = assignGeometry(degree + implicitHCount + Math.max(0, -charge));
            break;
        case "N" /* Elements.N */:
            if (assignCharge) {
                if (!assignH) { // Trust input H explicitly:
                    charge = valence - 3;
                }
                else if (conjugated && valence < 4) {
                    // Neutral unless amidine/guanidine double-bonded N:
                    if (degree - hydrogenCount === 1 && valence - hydrogenCount === 2) {
                        charge = 1;
                    }
                    else {
                        charge = 0;
                    }
                }
                else {
                    // Sulfonamide nitrogen and classed as sp3 in conjugation model but
                    // they won't be charged
                    // Don't assign charge to nitrogens bound to metals
                    tmpChargeBondItA.setElement(structure, unit, index);
                    while (tmpChargeBondItA.hasNext) {
                        const b = tmpChargeBondItA.move();
                        const elementB = typeSymbol(b.otherUnit, b.otherIndex);
                        if (elementB === "S" /* Elements.S */ || isMetal(elementB)) {
                            charge = 0;
                            break;
                        }
                        else {
                            charge = 1;
                        }
                    }
                    // TODO: Planarity sanity check?
                }
            }
            if (assignH) {
                // NH4+ -> 4, 1' amide -> 2, nitro N/N+ depiction -> 0
                implicitHCount = Math.max(0, 3 - valence + charge);
            }
            if (conjugated && !multiBond) {
                // Amide, anilinic N etc. cannot consider lone-pair for geometry purposes
                // Anilinic N geometry is depenent on ring electronics, for our purposes we
                // assume it's trigonal!
                geom = assignGeometry(degree + implicitHCount - charge);
            }
            else {
                // Everything else, pyridine, amine, nitrile, lp plays normal role:
                geom = assignGeometry(degree + implicitHCount + 1 - charge);
            }
            break;
        case "O" /* Elements.O */:
            if (assignCharge) {
                if (!assignH) {
                    charge = valence - 2;
                }
                if (valence === 1) {
                    tmpChargeBondItA.setElement(structure, unit, index);
                    b1: while (tmpChargeBondItA.hasNext) {
                        const bA = tmpChargeBondItA.move();
                        tmpChargeBondItB.setElement(structure, bA.otherUnit, bA.otherIndex);
                        while (tmpChargeBondItB.hasNext) {
                            const bB = tmpChargeBondItB.move();
                            if (!(bB.otherUnit === unit && bB.otherIndex === index) &&
                                typeSymbol(bB.otherUnit, bB.otherIndex) === "O" /* Elements.O */ &&
                                bB.order === 2) {
                                charge = -1;
                                break b1;
                            }
                        }
                    }
                }
            }
            if (assignH) {
                // ethanol -> 1, carboxylate -> -1
                implicitHCount = Math.max(0, 2 - valence + charge);
            }
            if (conjugated && !multiBond) {
                // carboxylate OH, phenol OH, one lone-pair taken up with conjugation
                geom = assignGeometry(degree + implicitHCount - charge + 1);
            }
            else {
                // Carbonyl (trigonal)
                geom = assignGeometry(degree + implicitHCount - charge + 2);
            }
            break;
        // Only handles thiols/thiolates/thioether/sulfonium. Sulfoxides and higher
        // oxidiation states are assumed neutral S (charge carried on O if required)
        case "S" /* Elements.S */:
            if (assignCharge) {
                if (!assignH) {
                    if (valence <= 3 && bondToElementCount(structure, unit, index, "O" /* Elements.O */) === 0) {
                        charge = valence - 2; // e.g. explicitly deprotonated thiol
                    }
                    else {
                        charge = 0;
                    }
                }
            }
            if (assignH) {
                if (valence < 2) {
                    implicitHCount = Math.max(0, 2 - valence + charge);
                }
            }
            if (valence <= 3) {
                // Thiol, thiolate, tioether -> tetrahedral
                geom = assignGeometry(degree + implicitHCount - charge + 2);
            }
            break;
        case "F" /* Elements.F */:
        case "CL" /* Elements.CL */:
        case "BR" /* Elements.BR */:
        case "I" /* Elements.I */:
        case "AT" /* Elements.AT */:
            // Never implicitly protonate halides
            if (assignCharge) {
                charge = valence - 1;
            }
            break;
        case "LI" /* Elements.LI */:
        case "NA" /* Elements.NA */:
        case "K" /* Elements.K */:
        case "RB" /* Elements.RB */:
        case "CS" /* Elements.CS */:
        case "FR" /* Elements.FR */:
            if (assignCharge) {
                charge = 1 - valence;
            }
            break;
        case "BE" /* Elements.BE */:
        case "MG" /* Elements.MG */:
        case "CA" /* Elements.CA */:
        case "SR" /* Elements.SR */:
        case "BA" /* Elements.BA */:
        case "RA" /* Elements.RA */:
            if (assignCharge) {
                charge = 2 - valence;
            }
            break;
        default:
            if (isDebugMode) {
                console.warn('Requested charge, protonation for an unhandled element', element);
            }
    }
    return [charge, implicitHCount, implicitHCount + hydrogenCount, geom];
}
function calcUnitValenceModel(structure, unit, props) {
    const n = unit.elements.length;
    const charge = new Int8Array(n);
    const implicitH = new Int8Array(n);
    const totalH = new Int8Array(n);
    const idealGeometry = new Int8Array(n);
    // always use root UnitIndex to take the topology of the whole structure in account
    const hasParent = !!structure.parent;
    let mapping;
    if (hasParent) {
        const rootUnit = structure.root.unitMap.get(unit.id);
        mapping = SortedArray.indicesOf(rootUnit.elements, unit.elements);
        if (mapping.length !== unit.elements.length) {
            throw new Error('expected to find an index for every element');
        }
        unit = rootUnit;
        structure = structure.root;
    }
    for (let i = 0; i < n; ++i) {
        const j = (hasParent ? mapping[i] : i);
        const [chg, implH, totH, geom] = calculateHydrogensCharge(structure, unit, j, props);
        charge[i] = chg;
        implicitH[i] = implH;
        totalH[i] = totH;
        idealGeometry[i] = geom;
    }
    return { charge, implicitH, totalH, idealGeometry };
}
export const ValenceModelParams = {
    assignCharge: PD.Select('auto', [['always', 'always'], ['auto', 'auto'], ['never', 'never']]),
    assignH: PD.Select('auto', [['always', 'always'], ['auto', 'auto'], ['never', 'never']]),
};
export async function calcValenceModel(ctx, structure, props) {
    const p = { ...PD.getDefaultValues(ValenceModelParams), ...props };
    const map = new Map();
    for (let i = 0, il = structure.units.length; i < il; ++i) {
        const u = structure.units[i];
        if (Unit.isAtomic(u)) {
            const valenceModel = calcUnitValenceModel(structure, u, p);
            map.set(u.id, valenceModel);
        }
    }
    return map;
}