/**
 * Entry point: loads the styles and the libraries the code uses as globals, then starts the application.
 */

import legacyScriptsUrl from '../js/scripts.js?url';

import '../css/AglomeredParameters.css';
import '../css/bootstrap.min.css';
import '../css/ChannelsDescriptions.css';
import '../css/datagrid.css';
import '../css/DownloadReport.css';
import '../css/LayerVizualizerStyles.css';
import '../css/lining-residues.css';
import '../css/PDBID.css';
import '../css/style.css';
import '../css/tooltips.css';

// jQuery, Bootstrap, jsPDF and others are plain scripts (see tools/concat-assets.js), so they are loaded as such,
// and the application starts only after they are available
await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = legacyScriptsUrl;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
});

await import('./App');

// Run the scripts' ready handlers (e.g. in tabsConfig.js) after the application has started, as they expect
(window as any).jQuery.holdReady(false);
