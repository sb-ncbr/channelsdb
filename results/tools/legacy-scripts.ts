/* Provides the libraries and scripts that the code uses as globals (jQuery, Bootstrap, canvas2svg, ...) as a single
 * script. They are plain browser scripts, not modules, so they cannot be bundled with the rest of the code.
 * src/main.ts imports the script's URL from 'virtual:legacy-scripts' and loads it before starting the application.
 */

import fs from 'node:fs';
import path from 'node:path';
import { minify } from 'rolldown/utils';
import type { Plugin } from 'vite';

const files = [
    'js/jquery-3.7.1.js',
    'js/bootstrap.min.js',
    'js/canvas2svg.js',
    'js/datagrid.js',
    'js/Palette.js',
    'js/tabsConfig.js',
];

const moduleId = 'virtual:legacy-scripts';
const resolvedModuleId = `\0${moduleId}`;
const devPath = '@legacy-scripts.js';

// Scripts like tabsConfig.js run code when the page is ready, which expects the application to be started already.
// The application starts only after these scripts are loaded, so it releases jQuery's ready event (see main.ts).
const holdReady = 'jQuery.holdReady(true);';

async function build(root: string) {
    const sources = files.map((file) => fs.readFileSync(path.resolve(root, file), 'utf8'));
    const source = [sources[0], holdReady, ...sources.slice(1)].join('\n;\n');

    // Top-level names are kept, as the code uses them as globals
    const { code, errors } = await minify('scripts.js', source, { compress: true, mangle: { toplevel: false } });
    if (errors.length) {
        throw new Error(`Minifying the legacy scripts failed: ${errors.map((error) => error.message).join(', ')}`);
    }
    return code;
}

export default function legacyScripts(): Plugin {
    let root = '';
    let base = '/';
    let isBuild = false;

    return {
        name: 'legacy-scripts',
        configResolved(config) {
            root = config.root;
            base = config.base;
            isBuild = config.command === 'build';
        },
        resolveId(id) {
            return id === moduleId ? resolvedModuleId : undefined;
        },
        async load(id) {
            if (id !== resolvedModuleId) return;

            if (!isBuild) {
                return `export default ${JSON.stringify(base + devPath)};`;
            }
            for (const file of files) this.addWatchFile(path.resolve(root, file));
            const reference = this.emitFile({ type: 'asset', name: 'scripts.js', source: await build(root) });
            return `export default import.meta.ROLLUP_FILE_URL_${reference};`;
        },
        configureServer(server) {
            server.middlewares.use(`${base}${devPath}`, async (_request, response) => {
                response.setHeader('Content-Type', 'text/javascript');
                response.end(await build(root));
            });
        },
    };
}
