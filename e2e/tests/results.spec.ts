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
        // Named as in the channel list
        const [, name, id] = (await channel.textContent())!.match(/^(.*) \(Id: (.*)\)$/)!;
        await expect(page.locator('.ui-selection')).toHaveText(`${name} ${id}`);
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
            await page.locator(`[data-exporttype="${type}"]`).click();
            const file = await (await download).path();
            const content = (await import('node:fs')).readFileSync(file, 'latin1');
            expect(content.startsWith(signature), `${type} export`).toBe(true);
            expect(content.length).toBeGreaterThan(10_000);
        }
    });
}

test('a channel chosen in the descriptions is selected under its name', async ({ page }) => {
    await page.goto('/detail/pdb/3tbg');
    await page.locator('.ui-subheader a.section-header').first().click();
    await page.locator('[data-bs-toggle="tab"]', { hasText: 'Channels descriptions' }).click();
    // Its type in the data is 'Channel 2a', but it is annotated (and listed) as 'Channel 2f'
    await page.locator('#left-tabs-3 a.hand', { hasText: 'Channel 2f' }).click();
    await expect(page.locator('.ui-selection')).toHaveText('Channel 2f 41.75');
});

test('layers of the 2D profile show their properties and residues', async ({ page }) => {
    await selectFirstChannel(page, '/detail/pdb/1ymg');
    const layers = page.locator('area[data-layeridx]');
    await expect.poll(() => layers.count()).toBeGreaterThan(5);

    // The layers are areas of an image map over the canvas, so they are reached with the mouse
    const map = (await page.locator('[usemap]').first().boundingBox())!;
    const pointAt = async (index: number) => {
        const [x1, y1, x2, y2] = (await layers.nth(index).getAttribute('coords'))!.split(',').map(Number);
        return { x: map.x + (x1 + x2) / 2, y: map.y + (y1 + y2) / 2 };
    };
    const properties = page.locator('#layer-properties');
    const residues = page.locator('#layer-residues');

    // Hovering shows the layer
    let point = await pointAt(3);
    await page.mouse.move(point.x, point.y);
    await expect(properties).toContainText(/Hydropathy\s*-?\d/);
    await expect(residues).toContainText(/[A-Z]{3} \d+ [A-Z]/);
    const hovered = await properties.innerText();

    // Clicking another one selects it in 3D, then marks it in the profile
    point = await pointAt(5);
    await page.mouse.move(point.x, point.y);
    await expect(properties).not.toHaveText(hovered);
    await expect(properties).toContainText(/Hydropathy\s*-?\d/);
    const profile = () => page.locator('#layer-vizualizer-canvas0').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
    const beforeClick = await profile();
    await page.mouse.down();
    await page.mouse.up();
    await expect.poll(profile).not.toBe(beforeClick);
});

test('dropdowns and their tooltips work with the keyboard', async ({ page }) => {
    await selectFirstChannel(page, '/detail/pdb/1ymg');
    const focused = () => page.evaluate(() => document.activeElement?.textContent?.trim());

    // Opening, moving between the items and closing returns the focus
    const exportMenu = page.locator('#layer-vizualizer-ui').getByRole('button', { name: 'Export' }).first();
    await exportMenu.focus();
    await page.keyboard.press('ArrowDown');
    await expect(exportMenu).toHaveAttribute('aria-expanded', 'true');
    expect(await focused()).toBe('PNG');
    await page.keyboard.press('ArrowDown');
    expect(await focused()).toBe('SVG');
    await page.keyboard.press('ArrowUp');
    expect(await focused()).toBe('PNG');
    await page.keyboard.press('Escape');
    await expect(exportMenu).toHaveAttribute('aria-expanded', 'false');
    await expect(exportMenu).toBeFocused();

    // A focused item shows its tooltip, also after the mouse leaves it, and Enter selects it
    const property = page.locator('.lvz-properties').first();
    const colorMenu = property.locator('xpath=ancestor::div[contains(@class, "dropup")][1]/*[@data-bs-toggle="dropdown"]');
    await colorMenu.focus();
    await page.keyboard.press('ArrowDown');
    // Not all items have a tooltip
    for (let i = 0; i < 10 && !(await property.evaluate((item) => item === document.activeElement)); i++) {
        await page.keyboard.press('ArrowDown');
    }
    await expect(property).toBeFocused();
    await expect(page.locator('.tooltip.show')).toHaveCount(1);
    await property.hover();
    await page.mouse.move(5, 5);
    await expect(page.locator('.tooltip.show')).toHaveCount(1);
    const name = (await property.textContent())!;
    await page.keyboard.press('Enter');
    await expect(colorMenu).toHaveAttribute('aria-expanded', 'false');
    await expect(colorMenu).toContainText(name);
});

test('tooltips, tabs and panel togglers work', async ({ page }) => {
    await selectFirstChannel(page, '/detail/pdb/1ymg');

    // Bootstrap tabs
    for (const name of ['Channels properties', 'Channels descriptions', 'Channel profile', 'Lining residues', 'Layer']) {
        const tab = page.locator('[data-bs-toggle="tab"]', { hasText: name });
        await tab.click();
        await expect(page.locator((await tab.getAttribute('href'))!)).toHaveClass(/active/);
    }

    // Bootstrap tooltips, initialised by the application
    await page.locator('[data-bs-toggle="tab"]', { hasText: 'Channels properties' }).click();
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
