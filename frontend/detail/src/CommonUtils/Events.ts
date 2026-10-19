/**
 * Events between the components of the page, dispatched on the window.
 */

import { Layers } from '../DataInterface';

interface PageEvents {
    // The content of the panels changed its size (datagrids, 3D view)
    contentResize: undefined;
    // The canvas of the 2D vizualizer may have changed its size
    lvContentResize: undefined;
    // A layer of the channel was selected in the 2D vizualizer, with its index
    layerTriggered: number;
    // The label of what is selected changed
    selectionChanged: string | string[];
    // A channel was selected, with its layers
    channelSelected: Layers;
    // A channel was chosen in the channel descriptions, with its id
    channelChosen: string;
    // Rendering of the channels started (true) or all of it finished (false)
    channelsRendering: boolean;
}

type Detail<K extends keyof PageEvents> = PageEvents[K] extends undefined ? [] : [PageEvents[K]];

export function emit<K extends keyof PageEvents>(name: K, ...[detail]: Detail<K>) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
}

/** Calls the handler on each event, until the returned function is called */
export function listen<K extends keyof PageEvents>(name: K, handler: (...detail: Detail<K>) => void): () => void {
    const listener = (event: Event) => (handler as (detail: unknown) => void)((event as CustomEvent).detail);
    window.addEventListener(name, listener);
    return () => window.removeEventListener(name, listener);
}

/** Lets everything listening to the window size adjust, after the panels changed their size */
export function emitResize() {
    window.dispatchEvent(new Event('resize'));
}
