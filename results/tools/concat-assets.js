#!/usr/bin/env node

/* Builds ChannelsDB/js/scripts.js from the libraries and scripts that the code uses as globals (jQuery, Bootstrap,
 * canvas2svg, ...). They are plain browser scripts, not modules, so they cannot be bundled with the rest of the code.
 * ChannelsDB/src/main.ts loads the result before starting the application.
 */

import fs from 'node:fs';
import path from 'node:path';
import { minify } from 'rolldown/utils';

const jsFiles = [
  './ChannelsDB/js/jquery-3.7.1.js',
  './ChannelsDB/js/bootstrap.min.js',
  './ChannelsDB/js/canvas2svg.js',
  './ChannelsDB/js/datagrid.js',
  './ChannelsDB/js/Palette.js',
  './ChannelsDB/js/tabsConfig.js',
  './ChannelsDB/js/tooltipConfig.js',
  './ChannelsDB/js/utf8.js',
];

const outPath = 'ChannelsDB/js/scripts.js';

// Scripts like tabsConfig.js run code when the page is ready, which expects the application to be started already.
// The application starts only after these scripts are loaded, so it releases jQuery's ready event (see main.ts).
const holdReady = 'jQuery.holdReady(true);';

const root = path.resolve(import.meta.dirname, '..');
const sources = jsFiles.map((file) => fs.readFileSync(path.resolve(root, file), 'utf8'));
const source = [sources[0], holdReady, ...sources.slice(1)].join('\n;\n');

// Top-level names are kept, as the code uses them as globals
const { code, errors } = await minify(outPath, source, { compress: true, mangle: { toplevel: false } });
if (errors.length) {
  console.error(errors);
  process.exit(1);
}

fs.writeFileSync(path.resolve(root, outPath), code, 'utf8');
console.log(`Wrote ${outPath}`);
