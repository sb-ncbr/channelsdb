#!/usr/bin/env node

/* Simple replacement for Gulp concat:
 * - builds ChannelsDB/js/scripts.js
 * - builds ChannelsDB/css/styles.css
 */

const fs = require('fs');
const path = require('path');

const jsFiles = [
  './ChannelsDB/js/jquery-1.12.4.js',
  './ChannelsDB/js/jquery-ui.js',
  './ChannelsDB/js/jspdf.min.js',
  './ChannelsDB/js/bootstrap.min.js',
  './ChannelsDB/js/canvas2svg.js',
  './ChannelsDB/js/datagrid.js',
  './ChannelsDB/js/Palette.js',
  './ChannelsDB/js/svg2pdf.js',
  './ChannelsDB/js/tabsConfig.js',
  './ChannelsDB/js/tooltipConfig.js',
  './ChannelsDB/js/utf8.js',
];

const cssFiles = [
  './ChannelsDB/css/AglomeredParameters.css',
  './ChannelsDB/css/bootstrap.min.css',
  './ChannelsDB/css/ChannelsDescriptions.css',
  './ChannelsDB/css/datagrid.css',
  './ChannelsDB/css/DownloadReport.css',
  './ChannelsDB/css/jquery-ui.css',
  './ChannelsDB/css/LayerVizualizerStyles.css',
  './ChannelsDB/css/lining-residues.css',
  './ChannelsDB/css/PDBID.css',
  './ChannelsDB/css/style.css',
  './ChannelsDB/css/tooltips.css',
];

function concatFiles(fileList, outPath) {
  const outAbs = path.resolve(__dirname, '..', outPath);
  const contents = fileList
    .map((relPath) => {
      const abs = path.resolve(__dirname, '..', relPath);
      try {
        return fs.readFileSync(abs, 'utf8');
      } catch (err) {
        console.error(`Failed to read ${abs}:`, err.message);
        process.exitCode = 1;
        return '';
      }
    }).join('\n');

  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, contents, 'utf8');
  console.log(`Wrote ${outPath}`);
}

concatFiles(jsFiles, 'ChannelsDB/js/scripts.js');
concatFiles(cssFiles, 'ChannelsDB/css/styles.css');
