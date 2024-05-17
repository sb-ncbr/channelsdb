"use strict";
/**
 * Copyright (c) 2018-2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.polygon = void 0;
/**
 * Create 3d points for a polygon:
 * 3 for a triangle, 4 for a rectangle, 5 for a pentagon, 6 for a hexagon...
 */
function polygon(sideCount, shift, radius = -1) {
    const points = new Float32Array(sideCount * 3);
    const r = radius === -1
        ? (sideCount <= 4 ? Math.sqrt(2) / 2 : 0.6)
        : radius;
    const offset = shift ? 1 : 0;
    for (let i = 0, il = sideCount; i < il; ++i) {
        const c = (i * 2 + offset) / sideCount * Math.PI;
        points[i * 3] = Math.cos(c) * r;
        points[i * 3 + 1] = Math.sin(c) * r;
        points[i * 3 + 2] = 0;
    }
    return points;
}
exports.polygon = polygon;