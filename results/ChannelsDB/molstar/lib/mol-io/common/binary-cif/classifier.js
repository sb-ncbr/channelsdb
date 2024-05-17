/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */
import { ArrayEncoding as E } from './array-encoder';
import { getArrayDigitCount } from '../../../mol-util/number';
import { assertUnreachable } from '../../../mol-util/type-helpers';
export function classifyIntArray(xs) {
    return IntClassifier.classify(xs);
}
export function classifyFloatArray(xs) {
    return FloatClassifier.classify(xs);
}
var IntClassifier;
(function (IntClassifier) {
    function packSize(value, upperLimit) {
        return value >= 0
            ? Math.ceil((value + 1) / upperLimit)
            : Math.ceil((value + 1) / (-upperLimit - 1));
    }
    function getInfo(data) {
        let signed = false;
        for (let i = 0, n = data.length; i < n; i++) {
            if (data[i] < 0) {
                signed = true;
                break;
            }
        }
        return signed ? { signed, limit8: 0x7F, limit16: 0x7FFF } : { signed, limit8: 0xFF, limit16: 0xFFFF };
    }
    function SizeInfo() { return { pack8: 0, pack16: 0, count: 0 }; }
    ;
    function incSize({ limit8, limit16 }, info, value) {
        info.pack8 += packSize(value, limit8);
        info.pack16 += packSize(value, limit16);
        info.count += 1;
    }
    function incSizeSigned(info, value) {
        info.pack8 += packSize(value, 0x7F);
        info.pack16 += packSize(value, 0x7FFF);
        info.count += 1;
    }
    function byteSize(info) {
        if (info.count * 4 < info.pack16 * 2)
            return { length: info.count * 4, elem: 4 };
        if (info.pack16 * 2 < info.pack8)
            return { length: info.pack16 * 2, elem: 2 };
        return { length: info.pack8, elem: 1 };
    }
    function packingSize(data, info) {
        const size = SizeInfo();
        for (let i = 0, n = data.length; i < n; i++) {
            incSize(info, size, data[i]);
        }
        return { ...byteSize(size), kind: 'pack' };
    }
    function deltaSize(data, info) {
        const size = SizeInfo();
        let prev = data[0];
        for (let i = 1, n = data.length; i < n; i++) {
            incSizeSigned(size, data[i] - prev);
            prev = data[i];
        }
        return { ...byteSize(size), kind: 'delta' };
    }
    function rleSize(data, info) {
        const size = SizeInfo();
        let run = 1;
        for (let i = 1, n = data.length; i < n; i++) {
            if (data[i - 1] !== data[i]) {
                incSize(info, size, data[i - 1]);
                incSize(info, size, run);
                run = 1;
            }
            else {
                run++;
            }
        }
        incSize(info, size, data[data.length - 1]);
        incSize(info, size, run);
        return { ...byteSize(size), kind: 'rle' };
    }
    function deltaRleSize(data, info) {
        const size = SizeInfo();
        let run = 1, prev = 0, prevValue = 0;
        for (let i = 1, n = data.length; i < n; i++) {
            const v = data[i] - prev;
            if (prevValue !== v) {
                incSizeSigned(size, prevValue);
                incSizeSigned(size, run);
                run = 1;
            }
            else {
                run++;
            }
            prevValue = v;
            prev = data[i];
        }
        incSizeSigned(size, prevValue);
        incSizeSigned(size, run);
        return { ...byteSize(size), kind: 'delta-rle' };
    }
    function getSize(data) {
        const info = getInfo(data);
        const sizes = [packingSize(data, info), rleSize(data, info), deltaSize(data, info), deltaRleSize(data, info)];
        sizes.sort((a, b) => a.length - b.length);
        return sizes;
    }
    IntClassifier.getSize = getSize;
    function classify(data) {
        if (data.length < 2)
            return E.by(E.byteArray);
        const sizes = getSize(data);
        const size = sizes[0];
        switch (size.kind) {
            case 'pack': return E.by(E.integerPacking);
            case 'rle': return E.by(E.runLength).and(E.integerPacking);
            case 'delta': return E.by(E.delta).and(E.integerPacking);
            case 'delta-rle': return E.by(E.delta).and(E.runLength).and(E.integerPacking);
            default: assertUnreachable(size);
        }
    }
    IntClassifier.classify = classify;
})(IntClassifier || (IntClassifier = {}));
var FloatClassifier;
(function (FloatClassifier) {
    const delta = 1e-6;
    function classify(data) {
        const maxDigits = 4;
        const { mantissaDigits, integerDigits } = getArrayDigitCount(data, maxDigits, delta);
        // TODO: better check for overflows here?
        if (mantissaDigits < 0 || mantissaDigits + integerDigits > 10)
            return E.by(E.byteArray);
        // TODO: this needs a conversion to Int?Array?
        if (mantissaDigits === 0)
            return IntClassifier.classify(data);
        const multiplier = getMultiplier(mantissaDigits);
        const intArray = new Int32Array(data.length);
        for (let i = 0, n = data.length; i < n; i++) {
            intArray[i] = Math.round(multiplier * data[i]);
            // TODO: enable this again?
            // const v = Math.round(multiplier * data[i]);
            // if (Math.abs(Math.round(v) / multiplier - intArray[i] / multiplier) > delta) {
            //     return E.by(E.byteArray);
            // }
        }
        const sizes = IntClassifier.getSize(intArray);
        const size = sizes[0];
        const fp = E.by(E.fixedPoint(multiplier));
        switch (size.kind) {
            case 'pack': return fp.and(E.integerPacking);
            case 'rle': return fp.and(E.runLength).and(E.integerPacking);
            case 'delta': return fp.and(E.delta).and(E.integerPacking);
            case 'delta-rle': return fp.and(E.delta).and(E.runLength).and(E.integerPacking);
            default: assertUnreachable(size);
        }
    }
    FloatClassifier.classify = classify;
    function getMultiplier(mantissaDigits) {
        let m = 1;
        for (let i = 0; i < mantissaDigits; i++)
            m *= 10;
        return m;
    }
})(FloatClassifier || (FloatClassifier = {}));