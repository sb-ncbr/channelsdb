import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

// Structures are loaded from RCSB and AlphaFill, annotations from the PDBe and UniProt APIs
const entries = [
    { path: '/detail/pdb/1ymg', group: 'Reviewed Channels MOLE (1)' },
    { path: '/detail/alphafill/P10635', group: 'AlphaFill Tunnels MOLE (6)' },
];

async function selectFirstChannel(page: Page, path: string) {
    await page.goto(path);
    const group = page.locator('.ui-subheader a.section-header').first();
    await group.click();
    const channel = page.locator('.ui-label a').first();
    await channel.click();
    return channel;
}

// Number of drawn pixels in the 2D channel profile
const drawnPixels = (page: Page) => page.locator('#layer-vizualizer-canvas0').evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let drawn = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i]) drawn++;
    return drawn;
});

for (const { path, group } of entries) {
    test(`${path} shows the selected channel`, async ({ page }) => {
        const channel = await selectFirstChannel(page, path);
        await expect(page.locator('.ui-subheader').first()).toContainText(group);
        await expect(page.locator('.ui-label input[type=checkbox]').first()).toBeChecked();
        await expect(page.locator('.ui-selection')).toContainText(/Tunnel|Pore|Path/);
        await expect.poll(() => drawnPixels(page)).toBeGreaterThan(1000);
        await expect(channel).toBeVisible();

        // The 3D view (software rendering) differs slightly between runs, protein annotations come live from UniProt
        const mask = [page.locator('#plugin'), page.locator('#right-panel-tabs-1')];
        await expect(page).toHaveScreenshot(`${path.split('/').slice(2).join('-')}.png`, { mask });
    });

    test(`${path} exports the 2D channel profile`, async ({ page }) => {
        await selectFirstChannel(page, path);
        await expect.poll(() => drawnPixels(page)).toBeGreaterThan(1000);

        for (const [type, signature] of [['PNG', '\x89PNG'], ['SVG', '<?xml']]) {
            await page.locator('#layer-vizualizer-ui').getByRole('button', { name: 'Export' }).click();
            const download = page.waitForEvent('download');
            await page.locator(`a[data-exporttype="${type}"]`).click();
            const file = await (await download).path();
            const content = (await import('node:fs')).readFileSync(file, 'latin1');
            expect(content.startsWith(signature), `${type} export`).toBe(true);
            expect(content.length).toBeGreaterThan(10_000);
        }
    });
}

test('tooltips, tabs and panel togglers work', async ({ page }) => {
    await selectFirstChannel(page, '/detail/pdb/1ymg');

    // Bootstrap tabs
    for (const name of ['Channels properties', 'Channels descriptions', 'Channel profile', 'Lining residues', 'Layer']) {
        const tab = page.locator('a[data-toggle="tab"]', { hasText: name });
        await tab.click();
        await expect(page.locator((await tab.getAttribute('href'))!)).toHaveClass(/active/);
    }

    // Bootstrap tooltips, initialised by the application
    await page.locator('a[data-toggle="tab"]', { hasText: 'Channels properties' }).click();
    await page.locator('.init-agp-tooltip').first().hover();
    await expect(page.locator('.tooltip')).toBeVisible();

    // Panel togglers (tabsConfig.js); some panels start toggled
    for (const [toggler, panel, toggledClass] of [
        ['#bottom-tabs-toggler', '.left-tabs', 'bottom-tabs-toggled'],
        ['#bottom-panel-toggler', '.bottom-panel', 'bottom-panel-toggled'],
        ['#right-panel-toggler', '.ui', 'toggled'],
    ] as const) {
        const isToggled = () => page.locator(panel).first().evaluate((element, name) => element.classList.contains(name), toggledClass);
        const initial = await isToggled();
        await page.locator(toggler).click();
        await expect.poll(isToggled).toBe(!initial);
        await page.locator(toggler).click();
        await expect.poll(isToggled).toBe(initial);
    }
});
