/**
 * Panel togglers and sizes of the tables (datagrids) and panels, which fill the space available in their tabs.
 */

import { emit, emitResize, listen } from './Events';

function element(selector: string) {
    return document.querySelector(selector) as HTMLElement;
}

function toggleClass(selector: string, className: string) {
    document.querySelectorAll(selector).forEach((e) => e.classList.toggle(className));
}

function styleNumber(e: Element, property: string) {
    const number = parseFloat(getComputedStyle(e).getPropertyValue(property));
    return isNaN(number) ? 0 : number;
}

function sumStyleNumbers(e: Element, properties: string[]) {
    return properties.reduce((sum, property) => sum + styleNumber(e, property), 0);
}

// Width of the content, without padding and border
function contentWidth(e: Element) {
    let width = styleNumber(e, 'width');
    if (getComputedStyle(e).boxSizing === 'border-box') {
        width -= sumStyleNumbers(e, ['padding-left', 'padding-right', 'border-left-width', 'border-right-width']);
    }
    return width;
}

function datagridOnResize(elementId: string, lowLevelContainerId: string, highLevelContainerId: string) {
    const datagrid = element(`#${elementId}`);
    const parent = element(`#${highLevelContainerId}`);
    const header = element(`#${elementId} .header`);

    const headHeight = header.clientHeight;

    // Make body and header width correspond
    const btWidth = element(`#${elementId} .body table`).clientWidth;
    document.querySelectorAll<HTMLElement>(`#${elementId} .header table`).forEach((table) => table.style.width = `${btWidth}px`);

    const parentHeight = parent.clientHeight;
    let filledHeight = 0;
    for (const child of parent.children) {
        if (child.id === lowLevelContainerId) {
            continue;
        }
        filledHeight += child.clientHeight;
    }

    const paddingAndMargin = sumStyleNumbers(datagrid, ['padding-top', 'padding-bottom', 'margin-top', 'margin-bottom']);

    datagrid.style.height = `${parentHeight - filledHeight}px`;

    const body = element(`#${elementId} .body`);
    body.style.height = `${parentHeight - filledHeight - headHeight - paddingAndMargin}px`;
}

function fillSpaceOnResize(elementId: string, highLevelContainerId: string, height = 100) {
    const filled = element(`#${elementId}`);
    const parent = element(`#${highLevelContainerId}`);

    const parentHeight = parent.clientHeight;
    const parentWidth = contentWidth(parent);

    const filledHeight = element(`#${highLevelContainerId} ul.nav.nav-tabs`).clientHeight;

    const horizontalSpacing = ['padding-left', 'padding-right', 'margin-left', 'margin-right'];
    const paddingAndMarginH = sumStyleNumbers(filled, horizontalSpacing) + sumStyleNumbers(parent, horizontalSpacing);

    const availableHeight = parentHeight - filledHeight;

    filled.style.height = `${(availableHeight / 100) * height}px`;
    filled.style.width = `${parentWidth - paddingAndMarginH}px`;
}

function resizePanels() {
    fillSpaceOnResize('layer-residues', 'right-tabs', 39);
    fillSpaceOnResize('layer-properties', 'right-tabs', 59);
    datagridOnResize('dg-lining-residues', 'right-tabs-2', 'right-tabs');
    datagridOnResize('dg-layer-properties', 'layer-properties', 'layer-properties');
    datagridOnResize('dg-layer-residues', 'layer-residues', 'layer-residues');
    datagridOnResize('dg-residue-annotations', 'right-tabs-3', 'right-tabs');
    datagridOnResize('dg-aglomered-parameters', 'left-tabs-2', 'left-tabs');
    datagridOnResize('dg-channels-descriptions', 'left-tabs-3', 'left-tabs');
    datagridOnResize('dg-protein-annotations', 'right-panel-tabs-1', 'right-panel-tabs');
}

// Resizes the content of a tab once it is shown
function resizeTabAfterActivate(link: HTMLElement) {
    const checker = () => {
        const href = link.getAttribute('href')!;
        if (link.classList.contains('active') && getComputedStyle(element(href)).display !== 'none') {
            resizePanels();
            emit('lvContentResize');
        } else {
            window.setTimeout(checker, 10);
        }
    };
    window.setTimeout(checker, 10);
}

function onPanelToggled() {
    // Aglomered parameters, datagrids and the canvas of the 2D vizualizer
    emitResize();
    emit('contentResize');
    emit('lvContentResize');
}

/** Sets up the panels, to be called once the application has rendered them */
export function initLayout() {
    document.querySelectorAll<HTMLElement>('#right-tabs a, #left-tabs a').forEach((link) => {
        link.addEventListener('click', () => resizeTabAfterActivate(link));
    });

    element('#bottom-tabs-toggler').addEventListener('click', () => {
        toggleClass('.left-tabs', 'bottom-tabs-toggled');
        toggleClass('.right-tabs', 'bottom-tabs-toggled');
        onPanelToggled();
    });
    element('#bottom-panel-toggler').addEventListener('click', () => {
        toggleClass('.plugin', 'bottom-panel-toggled');
        toggleClass('.bottom-panel', 'bottom-panel-toggled');
        onPanelToggled();
    });
    element('#right-panel-toggler').addEventListener('click', () => {
        toggleClass('.ui', 'toggled');
        toggleClass('.bottom', 'toggled');
        // Aglomered parameters and datagrids
        emitResize();
        emit('contentResize');
    });

    window.addEventListener('resize', resizePanels);
    listen('contentResize', resizePanels);

    fillSpaceOnResize('layer-residues', 'right-tabs', 39);
    fillSpaceOnResize('layer-properties', 'right-tabs', 59);
    datagridOnResize('dg-lining-residues', 'right-tabs-2', 'right-tabs');
    datagridOnResize('dg-layer-properties', 'layer-properties', 'layer-properties');
    datagridOnResize('dg-layer-residues', 'layer-residues', 'layer-residues');
    datagridOnResize('dg-residue-annotations', 'right-tabs-3', 'right-tabs');
    datagridOnResize('dg-protein-annotations', 'right-panel-tabs-1', 'right-panel-tabs');
}
