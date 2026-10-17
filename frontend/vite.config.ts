import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// The main pages and the results page (detail/index.html, served at /detail/)
const pages = ['index', 'about', 'methods', 'documentation', 'contribute', 'gdpr', 'detail/index'];

// Running ChannelsDB, used by the dev server for the API. By default the docker compose setup on this machine,
// which uses CHANNELSDB_PORT (port 80 if not set)
const backend = process.env.CHANNELSDB_URL ?? `http://localhost:${process.env.CHANNELSDB_PORT ?? 80}`;

// Redirects the results URLs (/detail/pdb/1ymg) to the results page like nginx does (/detail/?pid=1ymg&subDB=pdb)
const detailUrls: Plugin = {
    name: 'detail-urls',
    configureServer(server) {
        server.middlewares.use((request, response, next) => {
            const match = request.url?.match(/^\/detail\/(pdb|alphafill)\/([^/?]+)/);
            if (!match) return next();
            response.statusCode = 302;
            response.setHeader('Location', `/detail/?pid=${match[2]}&subDB=${match[1]}`);
            response.end();
        });
    },
};

export default defineConfig({
    plugins: [detailUrls],
    build: {
        // Bootstrap is already minified; minifying it again rounds its line heights and shifts the layout by a pixel
        cssMinify: false,
        rollupOptions: {
            input: Object.fromEntries(pages.map((page) => [page.replace('/index', ''), resolve(import.meta.dirname, `${page}.html`)])),
            onwarn(warning, warn) {
                // mdast-util-to-hast (used by Mol* through react-markdown) contains harmless '' statements
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.id?.includes('/node_modules/')) return;
                warn(warning);
            },
            // Names contain a hash of the content (name.<hex hash>.ext), which nginx caches for long
            output: {
                hashCharacters: 'hex',
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash][extname]',
            },
        },
    },
    css: {
        preprocessorOptions: {
            // Mol*'s styles (the only Sass here) use features deprecated in newer Sass versions; that is for Mol* to update
            scss: { silenceDeprecations: ['import', 'global-builtin', 'color-functions'] },
        },
    },
    server: {
        // changeOrigin: send the backend's host name, which a server with several sites needs
        proxy: {
            '/api': { target: backend, changeOrigin: true },
        },
    },
});
