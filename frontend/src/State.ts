/*
 * Copyright (c) 2017 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

import { BehaviorSubject, Subject, merge, timer } from 'rxjs';
import { concatMap, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { RequestPool, ajaxGetJson } from './Utils';


export interface DBContent {
    pdb: { [id: string]: any };
    alphafill: { [id: string]: any };
}

export interface State {
    dbContent: DBContent;
    dbContentAvailable: BehaviorSubject<boolean>;
    statistics: any;
    statisticsAvailable: BehaviorSubject<any>;
    searchedTerm: string;
    searchTerm: Subject<string>;
    viewState: ViewState;
    stateUpdated: Subject<undefined>;
    fullSearch: Subject<undefined>;
    channelsUrl: string;
}

export interface EntryGroup {
    header: string;
    numPdbEntries: number;
    varName: string;
    value: string;
}

export type ViewState = ViewState.Info | ViewState.Seached | ViewState.Entries | ViewState.Loading | ViewState.Error;

export namespace ViewState {
    export type Info = { kind: 'Info' };
    export type Loading = { kind: 'Loading', message: string };
    export type Seached = { kind: 'Searched', data: any };
    export type Entries = { kind: 'Entries', term: string };
    export type Error = { kind: 'Error', message: string };
}

export function updateViewState(state: State, viewState: ViewState) {
    state.viewState = viewState;
    state.stateUpdated.next(void 0);
}

export function initState(): State {
    const state: State = {
        dbContent: void 0 as any,
        dbContentAvailable: new BehaviorSubject<boolean>(false),
        statistics: void 0 as any,
        statisticsAvailable: new BehaviorSubject<any>(void 0),
        searchedTerm: '',
        searchTerm: new Subject<string>(),
        viewState: { kind: 'Info' },
        stateUpdated: new Subject<undefined>(),
        fullSearch: new Subject<undefined>(),
        channelsUrl: "/api",
    };

    const interrupt = merge(state.searchTerm, state.fullSearch);

    state.searchTerm.pipe(
        tap(() => RequestPool.abort('data')),
        map((t) => t.trim()),
        distinctUntilChanged(),
        concatMap((t) => timer(250).pipe(takeUntil(interrupt), map(() => t))),
    ).subscribe((t) => {
        if (t.length > 2) {
            search(state, t).pipe(takeUntil(interrupt)).subscribe({
                next: (data) => { state.searchedTerm = t; updateViewState(state, { kind: 'Searched', data }); },
                error: (err) => { if (err !== 'Aborted') updateViewState(state, { kind: 'Error', message: '' + err }); },
            });
        } else {
            updateViewState(state, { kind: 'Info' });
        }
    });

    initSearch(state);
    getStatistics(state);

    return state;
}

async function initSearch(state: State) {
    try {
        const content = await ajaxGetJson(`${state.channelsUrl}/content`);
        state.dbContent = { pdb: content.PDB, alphafill: content.AlphaFill };
        state.dbContentAvailable.next(true);
    } catch (e) {
        setTimeout(() => initSearch(state), 2000);
    }
}

async function getStatistics(state: State) {
    try {
        if (state.statistics) {
            state.statisticsAvailable.next(state.statistics);
            return;
        }
        const content = await ajaxGetJson(`${state.channelsUrl}/statistics`); 
        state.statistics = content;
        state.statisticsAvailable.next(content);
    } catch (e) {
        setTimeout(() => getStatistics(state), 2000);
    }
}

function sortSearchData(state: State, data: any) {

}

function search(state: State, term: string) {
    RequestPool.abort('data');
    updateViewState(state, { kind: 'Loading', message: 'Searching...' });
    const s = new Subject<any>();
    ajaxGetJson(`https://www.ebi.ac.uk/pdbe/search/pdb-autocomplete/select?rows=1000000&json.nl=map&group=true&group.field=category&group.limit=28&fl=value,num_pdb_entries,var_name&sort=category+asc,num_pdb_entries+desc&q=value:${encodeURIComponent(`"${term}*"`)}~10&wt=json`, 'data')
        .then((data) => { s.next(data); s.complete(); })
        .catch((err) => { s.error(err); });
    return s;
}

export async function searchPdbCategory(term: string, var_name: string, start: number) {
    RequestPool.abort('data');
    const data = await ajaxGetJson(`https://www.ebi.ac.uk/pdbe/search/pdb-autocomplete/select?rows=28&start=${start}&json.nl=map&group.limit=-1&fl=value,num_pdb_entries,var_name&sort=category+asc,num_pdb_entries+desc&fq=var_name:${var_name}&q=value:${encodeURIComponent(`"${term}*"`)}~10&wt=json`, 'data');
    return data.response.docs;
}

const ROW_COUNT = 1000000;

const toLowerCache = {} as any;
export function toLower(str: string) {
    let ret = toLowerCache[str];
    if (ret) return ret;
    ret = str.toLowerCase();
    toLowerCache[str] = ret;
    return ret;
}

function sortGroups(state: State, groups: any) {
    const withChannels = [], withoutChannels = [];
    const content = state.dbContent.pdb; //TODO set also alphafill

    for (const group of groups) {
        if (content[toLower(group.doclist.docs[0].pdb_id)]) withChannels.push(group);
        else withoutChannels.push(group);
    }

    return { entries: withChannels.concat(withoutChannels), withCount: withChannels.length, withoutCount: withoutChannels.length };
}

export async function fetchPdbEntries(state: State, var_name: string, value: string) {
    const data = await ajaxGetJson(`https://www.ebi.ac.uk/pdbe/search/pdb/select?q=*:*&group=true&group.field=pdb_id&start=${0}&rows=${ROW_COUNT}&group.ngroups=true&fl=pdb_id,title,experimental_method,organism_scientific_name,resolution,entry_organism_scientific_name&json.nl=map&fq=${encodeURIComponent(var_name)}:"${encodeURIComponent(value)}"&sort=overall_quality+desc&wt=json`, 'data');
    return sortGroups(state, data.grouped.pdb_id.groups);
}

export async function fetchPdbText(state: State, value: string) {
    RequestPool.abort('data');
    const data = await ajaxGetJson(`https://www.ebi.ac.uk/pdbe/search/pdb/select?q=*:*&group=true&group.field=pdb_id&start=${0}&rows=${ROW_COUNT}&group.ngroups=true&fl=pdb_id,title,experimental_method,organism_scientific_name,resolution,entry_organism_scientific_name&json.nl=map&fq=text:"${encodeURIComponent(value)}"&sort=overall_quality+desc&wt=json`, 'data');
    return sortGroups(state, data.grouped.pdb_id.groups);
}
