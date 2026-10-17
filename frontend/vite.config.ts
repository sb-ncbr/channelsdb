import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const pages = ['index', 'about', 'methods', 'documentation', 'contribute', 'gdpr'];

// Running ChannelsDB, used by the dev server for the API and the results pages. By default the docker compose
// setup on this machine, which uses CHANNELSDB_PORT (port 80 if not set)
const backend = process.env.CHANNELSDB_URL ?? `http://localhost:${process.env.CHANNELSDB_PORT ?? 80}`;

export default defineConfig({
    build: {
        // Bootstrap is already minified; minifying it again rounds its line heights and shifts the layout by a pixel
        cssMinify: false,
        rollupOptions: {
            input: Object.fromEntries(pages.map((page) => [page, resolve(import.meta.dirname, `${page}.html`)])),
            // Same naming as the results page (name.<hex hash>.ext), which nginx caches for long
            output: {
                hashCharacters: 'hex',
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash][extname]',
            },
        },
    },
    server: {
        // changeOrigin: send the backend's host name, which a server with several sites needs
        proxy: {
            '/api': { target: backend, changeOrigin: true },
            '/detail': { target: backend, changeOrigin: true },
        },
    },
});
