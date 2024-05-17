"use strict";
/**
 * Copyright (c) 2018-2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @author David Sehnal <david.sehnal@gmail.com>
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegExp = exports.stripTags = exports.trimCharEnd = exports.trimCharStart = exports.trimChar = exports.interpolate = exports.substringStartsWith = exports.stringToWords = exports.kebabCaseToWords = exports.splitKebabCase = exports.snakeCaseToWords = exports.splitSnakeCase = exports.capitalize = exports.upperCaseAny = exports.upperCase = exports.lowerCase = exports.camelCaseToWords = exports.splitCamelCase = exports.indentString = void 0;
const reLine = /^/mg;
function indentString(str, count, indent) {
    return count === 0 ? str : str.replace(reLine, indent.repeat(count));
}
exports.indentString = indentString;
/** Add space between camelCase text. */
function splitCamelCase(str, separator = ' ') {
    return str.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, `$1${separator}$2`);
}
exports.splitCamelCase = splitCamelCase;
/** Split camelCase text and capitalize. */
function camelCaseToWords(str) {
    return capitalize(splitCamelCase(str));
}
exports.camelCaseToWords = camelCaseToWords;
const lowerCase = (str) => str.toLowerCase();
exports.lowerCase = lowerCase;
const upperCase = (str) => str.toUpperCase();
exports.upperCase = upperCase;
/** Return upper case if string, otherwise return empty string */
function upperCaseAny(value) {
    if (!value)
        return '';
    return typeof value === 'string' ? value.toUpperCase() : `${value}`.toUpperCase();
}
exports.upperCaseAny = upperCaseAny;
/** Uppercase the first character of each word. */
function capitalize(str) {
    return str.toLowerCase().replace(/^\w|\s\w/g, exports.upperCase);
}
exports.capitalize = capitalize;
function splitSnakeCase(str) {
    return str.replace(/_/g, ' ');
}
exports.splitSnakeCase = splitSnakeCase;
function snakeCaseToWords(str) {
    return capitalize(splitSnakeCase(str));
}
exports.snakeCaseToWords = snakeCaseToWords;
function splitKebabCase(str) {
    return str.replace(/-/g, ' ');
}
exports.splitKebabCase = splitKebabCase;
function kebabCaseToWords(str) {
    return capitalize(splitKebabCase(str));
}
exports.kebabCaseToWords = kebabCaseToWords;
function stringToWords(str) {
    return capitalize(splitCamelCase(splitSnakeCase(splitKebabCase(str))));
}
exports.stringToWords = stringToWords;
function substringStartsWith(str, start, end, target) {
    const len = target.length;
    if (len > end - start)
        return false;
    for (let i = 0; i < len; i++) {
        if (str.charCodeAt(start + i) !== target.charCodeAt(i))
            return false;
    }
    return true;
}
exports.substringStartsWith = substringStartsWith;
function interpolate(str, params) {
    const names = Object.keys(params);
    const values = Object.values(params);
    return new Function(...names, `return \`${str}\`;`)(...values);
}
exports.interpolate = interpolate;
function trimChar(str, char) {
    let start = 0;
    let end = str.length;
    while (start < end && str[start] === char)
        ++start;
    while (end > start && str[end - 1] === char)
        --end;
    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}
exports.trimChar = trimChar;
function trimCharStart(str, char) {
    let start = 0;
    const end = str.length;
    while (start < end && str[start] === char)
        ++start;
    return (start > 0) ? str.substring(start, end) : str;
}
exports.trimCharStart = trimCharStart;
function trimCharEnd(str, char) {
    let end = str.length;
    while (end > 0 && str[end - 1] === char)
        --end;
    return (end < str.length) ? str.substring(0, end) : str;
}
exports.trimCharEnd = trimCharEnd;
/** Simple function to strip tags from a string */
function stripTags(str) {
    return str.replace(/<\/?[^>]+>/g, '');
}
exports.stripTags = stripTags;
/**
 * Escape string for use in Javascript regex
 *
 * From https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex/6969486#6969486
 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
exports.escapeRegExp = escapeRegExp;