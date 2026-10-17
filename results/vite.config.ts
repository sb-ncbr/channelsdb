import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Running ChannelsDB, used by the dev server for the API. By default the docker compose setup on this machine,
// which uses CHANNELSDB_PORT (port 80 if not set)
const backend = process.env.CHANNELSDB_URL ?? `http://localhost:${process.env.CHANNELSDB_PORT ?? 80}`;

export default defineConfig({
    root: 'ChannelsDB',
    // The page is served at /detail/
    base: '/detail/',
    build: {
        outDir: resolve(import.meta.dirname, 'dist/ChannelsDB'),
        emptyOutDir: true,
        // Bootstrap is already minified; minifying it again rounds its line heights and shifts the layout by a pixel
        cssMinify: false,
        rollupOptions: {
            onwarn(warning, warn) {
                // mdast-util-to-hast (used by Mol* through react-markdown) contains harmless '' statements
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.id?.includes('/node_modules/')) return;
                warn(warning);
            },
            // Same naming as the main page (name.<hex hash>.ext), which nginx caches for long
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
