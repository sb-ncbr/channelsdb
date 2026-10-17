/**
 * Panel togglers and sizes of the tables (datagrids) and panels, which fill the space available in their tabs.
 */

import $ from '../jquery';

function parseStyleNumeric(value: string) {
    const number = Number(value.split('px')[0]);
    return isNaN(number) ? 0 : number;
}

function datagridOnResize(elementId: string, lowLevelContainerId: string, highLevelContainerId: string) {
    const datagridJ = $(`#${elementId}`);
    const datagrid = datagridJ[0];
    const parent = $(`#${highLevelContainerId}`)[0];
    const header = $(`#${elementId} .header`)[0];

    const headHeight = header.clientHeight;

    // Make body and header width correspond
    const btWidth = $(`#${elementId} .body table`)[0].clientWidth;
    $(`#${elementId} .header table`).css('width', String(btWidth));

    const parentHeight = parent.clientHeight;
    let filledHeight = 0;
    for (const element of parent.children) {
        if (element.id === lowLevelContainerId) {
            continue;
        }
        filledHeight += element.clientHeight;
    }

    let paddingAndMargin = parseStyleNumeric(datagridJ.css('padding-top'));
    paddingAndMargin += parseStyleNumeric(datagridJ.css('padding-bottom'));
    paddingAndMargin += parseStyleNumeric(datagridJ.css('margin-top'));
    paddingAndMargin += parseStyleNumeric(datagridJ.css('margin-bottom'));

    datagrid.style.height = `${parentHeight - filledHeight}px`;

    const body = $(`#${elementId} .body`)[0];
    body.style.height = `${parentHeight - filledHeight - headHeight - paddingAndMargin}px`;
}

function fillSpaceOnResize(elementId: string, highLevelContainerId: string, height = 100) {
    const elementJ = $(`#${elementId}`);
    const element = elementJ[0];
    const parentJ = $(`#${highLevelContainerId}`);
    const parent = parentJ[0];

    const parentHeight = parent.clientHeight;
    const parentWidth = parentJ.width();

    const filledHeight = $(`#${highLevelContainerId} ul.nav.nav-tabs`)[0].clientHeight;

    let paddingAndMarginH = parseStyleNumeric(elementJ.css('padding-left'));
    paddingAndMarginH += parseStyleNumeric(elementJ.css('padding-right'));
    paddingAndMarginH += parseStyleNumeric(elementJ.css('margin-left'));
    paddingAndMarginH += parseStyleNumeric(elementJ.css('margin-right'));

    paddingAndMarginH += parseStyleNumeric(parentJ.css('padding-left'));
    paddingAndMarginH += parseStyleNumeric(parentJ.css('padding-right'));
    paddingAndMarginH += parseStyleNumeric(parentJ.css('margin-left'));
    paddingAndMarginH += parseStyleNumeric(parentJ.css('margin-right'));

    const availableHeight = parentHeight - filledHeight;

    element.style.height = `${(availableHeight / 100) * height}px`;
    element.style.width = `${parentWidth - paddingAndMarginH}px`;
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
function resizeTabAfterActivate(this: HTMLElement) {
    const link = this;
    const checker = () => {
        const href = $(link).attr('href');
        if ($(link).parent().attr('class').indexOf('active') >= 0 && $(href).css('display') !== 'none') {
            resizePanels();
            $(window).trigger('lvContentResize');
        } else {
            window.setTimeout(checker, 10);
        }
    };
    window.setTimeout(checker, 10);
}

function onPanelToggled() {
    // Aglomered parameters, datagrids and the canvas of the 2D vizualizer
    $(window).trigger('resize');
    $(window).trigger('contentResize');
    $(window).trigger('lvContentResize');
}

/** Sets up the panels, to be called once the application has rendered them */
export function initLayout() {
    $('#right-tabs a').on('click', resizeTabAfterActivate);
    $('#left-tabs a').on('click', resizeTabAfterActivate);

    $('#bottom-tabs-toggler').on('click', () => {
        $('.left-tabs').toggleClass('bottom-tabs-toggled');
        $('.right-tabs').toggleClass('bottom-tabs-toggled');
        onPanelToggled();
    });
    $('#bottom-panel-toggler').on('click', () => {
        $('.plugin').toggleClass('bottom-panel-toggled');
        $('.bottom-panel').toggleClass('bottom-panel-toggled');
        onPanelToggled();
    });
    $('#right-panel-toggler').on('click', () => {
        $('.ui').toggleClass('toggled');
        $('.bottom').toggleClass('toggled');
        // Aglomered parameters and datagrids
        $(window).trigger('resize');
        $(window).trigger('contentResize');
    });

    $(window).on('resize', resizePanels);
    $(window).on('contentResize', resizePanels);

    fillSpaceOnResize('layer-residues', 'right-tabs', 39);
    fillSpaceOnResize('layer-properties', 'right-tabs', 59);
    datagridOnResize('dg-lining-residues', 'right-tabs-2', 'right-tabs');
    datagridOnResize('dg-layer-properties', 'layer-properties', 'layer-properties');
    datagridOnResize('dg-layer-residues', 'layer-residues', 'layer-residues');
    datagridOnResize('dg-residue-annotations', 'right-tabs-3', 'right-tabs');
    datagridOnResize('dg-protein-annotations', 'right-panel-tabs-1', 'right-panel-tabs');
}
