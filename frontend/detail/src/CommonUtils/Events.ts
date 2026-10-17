/**
 * Events between the components of the page, dispatched on the window.
 */

interface PageEvents {
    // The content of the panels changed its size (datagrids, 3D view)
    contentResize: undefined;
    // The canvas of the 2D vizualizer may have changed its size
    lvContentResize: undefined;
    // A layer of the channel was selected in the 2D vizualizer, with its index
    layerTriggered: number;
}

type Detail<K extends keyof PageEvents> = PageEvents[K] extends undefined ? [] : [PageEvents[K]];

export function emit<K extends keyof PageEvents>(name: K, ...[detail]: Detail<K>) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function listen<K extends keyof PageEvents>(name: K, handler: (...detail: Detail<K>) => void) {
    window.addEventListener(name, (event) => (handler as (detail: unknown) => void)((event as CustomEvent).detail));
}

/** Lets everything listening to the window size adjust, after the panels changed their size */
export function emitResize() {
    window.dispatchEvent(new Event('resize'));
}
