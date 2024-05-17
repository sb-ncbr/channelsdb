"use strict";
/**
 * Copyright (c) 2017-2021 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashFnv32a = exports.invertCantorPairing = exports.sortedCantorPairing = exports.cantorPairing = exports.hashString = exports.hash4 = exports.hash3 = exports.hash2 = exports.hash1 = void 0;
// from http://burtleburtle.net/bob/hash/integer.html
function hash1(i) {
    let a = i ^ (i >> 4);
    a = (a ^ 0xdeadbeef) + (a << 5);
    a = a ^ (a >> 11);
    return a;
}
exports.hash1 = hash1;
function hash2(i, j) {
    let a = 23;
    a = (31 * a + i) | 0;
    a = (31 * a + j) | 0;
    a = a ^ (a >> 4);
    a = (a ^ 0xdeadbeef) + (a << 5);
    a = a ^ (a >> 11);
    return a;
}
exports.hash2 = hash2;
function hash3(i, j, k) {
    let a = 23;
    a = (31 * a + i) | 0;
    a = (31 * a + j) | 0;
    a = (31 * a + k) | 0;
    a = a ^ (a >> 4);
    a = (a ^ 0xdeadbeef) + (a << 5);
    a = a ^ (a >> 11);
    return a;
}
exports.hash3 = hash3;
function hash4(i, j, k, l) {
    let a = 23;
    a = (31 * a + i) | 0;
    a = (31 * a + j) | 0;
    a = (31 * a + k) | 0;
    a = (31 * a + l) | 0;
    a = a ^ (a >> 4);
    a = (a ^ 0xdeadbeef) + (a << 5);
    a = a ^ (a >> 11);
    return a;
}
exports.hash4 = hash4;
function hashString(s) {
    let h = 0;
    for (let i = 0, l = s.length; i < l; i++) {
        h = (h << 5) - h + s.charCodeAt(i) | 0;
    }
    return h;
}
exports.hashString = hashString;
/**
 * A unique number for each pair of integers
 * Biggest representable pair is (67108863, 67108863) (limit imposed by Number.MAX_SAFE_INTEGER)
 */
function cantorPairing(a, b) {
    return (a + b) * (a + b + 1) / 2 + b;
}
exports.cantorPairing = cantorPairing;
/**
 * A unique number for each sorted pair of integers
 * Biggest representable pair is (67108863, 67108863) (limit imposed by Number.MAX_SAFE_INTEGER)
 */
function sortedCantorPairing(a, b) {
    return a < b ? cantorPairing(a, b) : cantorPairing(b, a);
}
exports.sortedCantorPairing = sortedCantorPairing;
function invertCantorPairing(out, z) {
    const w = Math.floor((Math.sqrt(8 * z + 1) - 1) / 2);
    const t = (w * w + w) / 2;
    const y = z - t;
    out[0] = w - y;
    out[1] = y;
    return out;
}
exports.invertCantorPairing = invertCantorPairing;
/**
 * 32 bit FNV-1a hash, see http://isthe.com/chongo/tech/comp/fnv/
 */
function hashFnv32a(array) {
    let hval = 0x811c9dc5;
    for (let i = 0, il = array.length; i < il; ++i) {
        hval ^= array[i];
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    return hval >>> 0;
}
exports.hashFnv32a = hashFnv32a;