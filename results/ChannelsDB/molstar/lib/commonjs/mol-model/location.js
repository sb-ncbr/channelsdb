"use strict";
/**
 * Copyright (c) 2018-2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDataLocation = exports.DataLocation = exports.isNullLocation = exports.NullLocation = void 0;
/** A null value Location */
exports.NullLocation = { kind: 'null-location' };
function isNullLocation(x) {
    return !!x && x.kind === 'null-location';
}
exports.isNullLocation = isNullLocation;
function DataLocation(tag, data, element) {
    return { kind: 'data-location', tag, data, element };
}
exports.DataLocation = DataLocation;
function isDataLocation(x) {
    return !!x && x.kind === 'data-location';
}
exports.isDataLocation = isDataLocation;