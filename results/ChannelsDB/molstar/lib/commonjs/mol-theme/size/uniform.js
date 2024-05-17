"use strict";
/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniformSizeThemeProvider = exports.UniformSizeTheme = exports.getUniformSizeThemeParams = exports.UniformSizeThemeParams = void 0;
const param_definition_1 = require("../../mol-util/param-definition");
const Description = 'Gives everything the same, uniform size.';
exports.UniformSizeThemeParams = {
    value: param_definition_1.ParamDefinition.Numeric(1, { min: 0, max: 20, step: 0.1 }),
};
function getUniformSizeThemeParams(ctx) {
    return exports.UniformSizeThemeParams; // TODO return copy
}
exports.getUniformSizeThemeParams = getUniformSizeThemeParams;
function UniformSizeTheme(ctx, props) {
    const size = props.value;
    return {
        factory: UniformSizeTheme,
        granularity: 'uniform',
        size: () => size,
        props,
        description: Description
    };
}
exports.UniformSizeTheme = UniformSizeTheme;
exports.UniformSizeThemeProvider = {
    name: 'uniform',
    label: 'Uniform',
    category: '',
    factory: UniformSizeTheme,
    getParams: getUniformSizeThemeParams,
    defaultValues: param_definition_1.ParamDefinition.getDefaultValues(exports.UniformSizeThemeParams),
    isApplicable: (ctx) => true
};