/**
 * Copyright (c) 2017-2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */
import { Mat4, Tensor, Vec3 } from '../../../mol-math/linear-algebra';
import { SymmetryOperator } from '../../../mol-math/geometry/symmetry-operator';
import { Assembly } from '../../../mol-model/structure/model/properties/symmetry';
import { Queries as Q } from '../../../mol-model/structure';
import { StructureProperties } from '../../../mol-model/structure';
export function createAssemblies(pdbx_struct_assembly, pdbx_struct_assembly_gen, pdbx_struct_oper_list) {
    if (!pdbx_struct_assembly._rowCount)
        return [];
    const matrices = getMatrices(pdbx_struct_oper_list);
    const assemblies = [];
    for (let i = 0; i < pdbx_struct_assembly._rowCount; i++) {
        assemblies[assemblies.length] = createAssembly(pdbx_struct_assembly, pdbx_struct_assembly_gen, i, matrices);
    }
    return assemblies;
}
function createAssembly(pdbx_struct_assembly, pdbx_struct_assembly_gen, index, matrices) {
    const id = pdbx_struct_assembly.id.value(index);
    const details = pdbx_struct_assembly.details.value(index);
    const generators = [];
    const { assembly_id, oper_expression, asym_id_list } = pdbx_struct_assembly_gen;
    for (let i = 0, _i = pdbx_struct_assembly_gen._rowCount; i < _i; i++) {
        if (assembly_id.value(i) !== id)
            continue;
        generators[generators.length] = {
            assemblyId: id,
            expression: oper_expression.value(i),
            asymIds: asym_id_list.value(i)
        };
    }
    return Assembly.create(id, details, operatorGroupsProvider(generators, matrices));
}
export function operatorGroupsProvider(generators, matrices) {
    return () => {
        const groups = [];
        let operatorOffset = 0;
        for (let i = 0; i < generators.length; i++) {
            const gen = generators[i];
            const operatorList = parseOperatorList(gen.expression);
            const operatorNames = expandOperators(operatorList);
            const operators = getAssemblyOperators(matrices, operatorNames, operatorOffset, gen.assemblyId);
            const selector = Q.generators.atoms({ chainTest: Q.pred.and(Q.pred.eq(ctx => StructureProperties.unit.operator_name(ctx.element), SymmetryOperator.DefaultName), Q.pred.inSet(ctx => StructureProperties.chain.label_asym_id(ctx.element), gen.asymIds)) });
            groups[groups.length] = { selector, operators, asymIds: gen.asymIds };
            operatorOffset += operators.length;
        }
        return groups;
    };
}
export function getMatrices(pdbx_struct_oper_list) {
    const { id, matrix, vector, _schema } = pdbx_struct_oper_list;
    const matrices = new Map();
    const t = Vec3();
    for (let i = 0, _i = pdbx_struct_oper_list._rowCount; i < _i; i++) {
        const m = Tensor.toMat4(Mat4(), _schema.matrix.space, matrix.value(i));
        Tensor.toVec3(t, _schema.vector.space, vector.value(i));
        Mat4.setTranslation(m, t);
        Mat4.setValue(m, 3, 3, 1);
        matrices.set(id.value(i), m);
    }
    return matrices;
}
function expandOperators(operatorList) {
    const ops = [];
    const currentOp = [];
    for (let i = 0; i < operatorList.length; i++)
        currentOp[i] = '';
    expandOperators1(operatorList, ops, operatorList.length - 1, currentOp);
    return ops;
}
function expandOperators1(operatorNames, list, i, current) {
    if (i < 0) {
        list[list.length] = current.slice(0);
        return;
    }
    const ops = operatorNames[i], len = ops.length;
    for (let j = 0; j < len; j++) {
        current[i] = ops[j];
        expandOperators1(operatorNames, list, i - 1, current);
    }
}
function getAssemblyOperators(matrices, operatorNames, startIndex, assemblyId) {
    const operators = [];
    let index = startIndex;
    for (const op of operatorNames) {
        const m = Mat4.identity();
        for (let i = 0; i < op.length; i++) {
            Mat4.mul(m, m, matrices.get(op[i]));
        }
        index++;
        operators[operators.length] = SymmetryOperator.create(`ASM_${index}`, m, { assembly: { id: assemblyId, operId: index, operList: op } });
    }
    return operators;
}
function parseOperatorList(value) {
    // '(X0)(1-5)' becomes [['X0'], ['1', '2', '3', '4', '5']]
    // kudos to Glen van Ginkel.
    const oeRegex = /\(?([^\(\)]+)\)?]*/g, groups = [], ret = [];
    let g;
    while (g = oeRegex.exec(value))
        groups[groups.length] = g[1];
    groups.forEach(g => {
        const group = [];
        g.split(',').forEach(e => {
            const dashIndex = e.indexOf('-');
            if (dashIndex > 0) {
                const from = parseInt(e.substring(0, dashIndex)), to = parseInt(e.substr(dashIndex + 1));
                for (let i = from; i <= to; i++)
                    group[group.length] = i.toString();
            }
            else {
                group[group.length] = e.trim();
            }
        });
        ret[ret.length] = group;
    });
    return ret;
}