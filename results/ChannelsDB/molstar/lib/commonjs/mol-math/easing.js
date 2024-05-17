"use strict";
/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 *
 * adapted from https://github.com/d3/d3-ease
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sinInOut = exports.sinOut = exports.sinIn = exports.quadInOut = exports.quadOut = exports.quadIn = exports.expInOut = exports.expOut = exports.expIn = exports.cubicInOut = exports.cubicOut = exports.cubicIn = exports.circleInOut = exports.circleOut = exports.circleIn = exports.bounceInOut = exports.bounceOut = exports.bounceIn = void 0;
const b1 = 4 / 11, b2 = 6 / 11, b3 = 8 / 11, b4 = 3 / 4, b5 = 9 / 11, b6 = 10 / 11, b7 = 15 / 16, b8 = 21 / 22, b9 = 63 / 64, b0 = 1 / b1 / b1;
function bounceIn(t) {
    return 1 - bounceOut(1 - t);
}
exports.bounceIn = bounceIn;
function bounceOut(t) {
    return (t = +t) < b1 ? b0 * t * t : t < b3 ? b0 * (t -= b2) * t + b4 : t < b6 ? b0 * (t -= b5) * t + b7 : b0 * (t -= b8) * t + b9;
}
exports.bounceOut = bounceOut;
function bounceInOut(t) {
    return ((t *= 2) <= 1 ? 1 - bounceOut(1 - t) : bounceOut(t - 1) + 1) / 2;
}
exports.bounceInOut = bounceInOut;
//
function circleIn(t) {
    return 1 - Math.sqrt(1 - t * t);
}
exports.circleIn = circleIn;
function circleOut(t) {
    return Math.sqrt(1 - --t * t);
}
exports.circleOut = circleOut;
function circleInOut(t) {
    return ((t *= 2) <= 1 ? 1 - Math.sqrt(1 - t * t) : Math.sqrt(1 - (t -= 2) * t) + 1) / 2;
}
exports.circleInOut = circleInOut;
//
function cubicIn(t) {
    return t * t * t;
}
exports.cubicIn = cubicIn;
function cubicOut(t) {
    return --t * t * t + 1;
}
exports.cubicOut = cubicOut;
function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
exports.cubicInOut = cubicInOut;
//
function expIn(t) {
    return Math.pow(2, 10 * t - 10);
}
exports.expIn = expIn;
function expOut(t) {
    return 1 - Math.pow(2, -10 * t);
}
exports.expOut = expOut;
function expInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(2, 10 * t - 10) : 2 - Math.pow(2, 10 - 10 * t)) / 2;
}
exports.expInOut = expInOut;
//
function quadIn(t) {
    return t * t;
}
exports.quadIn = quadIn;
function quadOut(t) {
    return t * (2 - t);
}
exports.quadOut = quadOut;
function quadInOut(t) {
    return ((t *= 2) <= 1 ? t * t : --t * (2 - t) + 1) / 2;
}
exports.quadInOut = quadInOut;
//
const pi = Math.PI, halfPi = pi / 2;
function sinIn(t) {
    return 1 - Math.cos(t * halfPi);
}
exports.sinIn = sinIn;
function sinOut(t) {
    return Math.sin(t * halfPi);
}
exports.sinOut = sinOut;
function sinInOut(t) {
    return (1 - Math.cos(pi * t)) / 2;
}
exports.sinInOut = sinInOut;
//