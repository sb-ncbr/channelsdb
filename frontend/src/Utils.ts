/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

'use strict';

function readData(data: XMLHttpRequest): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        data.onerror = (e) => {
            let error = (<FileReader>e.target).error;
            reject(error ? error : 'Failed.');
        };
        data.onabort = () => reject('Aborted');
        data.onload = (e) => resolve(e);
    });
}

export class RequestPool {
    private static pool: XMLHttpRequest[] = [];
    private static poolSize = 15;

    private static pending: { [key: string]: XMLHttpRequest[] } = {};

    static get(key?: string) {
        const ret = this.pool.length ? this.pool.pop()! : new XMLHttpRequest();
        const arr = (this.pending[key || '__empty__'] || []);
        arr.push(ret);
        this.pending[key || '__empty__'] = arr;
        return ret;
    }

    static abort(key: string) {
        const arr = this.pending[key];
        if (!arr) return;
        for (const a of arr) {
            try { a.abort(); }
            catch (e) { }
        }
    }

    static emptyFunc() { }

    private static removePending(req: XMLHttpRequest) {
        for (const p of Object.getOwnPropertyNames(this.pending)) {
            const arr = this.pending[p];
            if (!arr) continue;
            let idx = 0;
            for (const a of arr) {
                if (a === req) {
                    arr[idx] = arr[arr.length - 1];
                    arr.pop();
                    return;
                }
                idx++;
            }
        }
    }

    static deposit(req: XMLHttpRequest) {
        if (this.pool.length < this.poolSize) {
            req.onabort = RequestPool.emptyFunc;
            req.onerror = RequestPool.emptyFunc;
            req.onload = RequestPool.emptyFunc;
            req.onprogress = RequestPool.emptyFunc;
            this.removePending(req);
            this.pool.push(req);
        }
    }
}

function processAjax(e: any) {
    const req = (e.target as XMLHttpRequest);
    if (req.status >= 200 && req.status < 400) {
        const text = JSON.parse(e.target.responseText);
        RequestPool.deposit(e.target);
        return text;
    } else {
        const status = req.statusText;
        RequestPool.deposit(e.target);
        throw status;
    }
}

export async function ajaxGetJson<T = any>(url: string, key?: string): Promise<T>  {
    const xhttp = RequestPool.get(key);
    xhttp.open('get', url, true);
    xhttp.responseType = 'text';
    xhttp.send();
    const e = await readData(xhttp);
    return processAjax(e);
}
