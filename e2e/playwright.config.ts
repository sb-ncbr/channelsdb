import { defineConfig } from '@playwright/test';

// Running ChannelsDB to test. By default the docker compose setup on this machine, which uses CHANNELSDB_PORT
// (port 80 if not set)
const baseURL = process.env.CHANNELSDB_URL ?? `http://localhost:${process.env.CHANNELSDB_PORT ?? 80}`;

export default defineConfig({
    testDir: 'tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL,
        // Installed Google Chrome; without it, run `npx playwright install chromium` and remove this line
        channel: 'chrome',
        viewport: { width: 1600, height: 1000 },
        launchOptions: {
            // Software WebGL, so the Mol* 3D viewer works headless and without a GPU
            args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
        },
        trace: 'retain-on-failure',
    },
    expect: {
        toHaveScreenshot: {
            // Animations and the blinking text cursor would make screenshots differ between runs
            animations: 'disabled',
            caret: 'hide',
        },
    },
});
