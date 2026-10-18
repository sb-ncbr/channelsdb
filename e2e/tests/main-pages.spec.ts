import { test, expect } from './fixtures';

const pages = [
    { path: '/index.html', title: 'ChannelsDB 2.0', heading: 'Examples' },
    { path: '/methods.html', title: 'ChannelsDB 2.0 | Methods', heading: 'Methods' },
    { path: '/documentation.html', title: 'ChannelsDB 2.0 | Documentation', heading: 'Documentation' },
    { path: '/contribute.html', title: 'ChannelsDB 2.0 | Contribute', heading: 'Contribute' },
    { path: '/about.html', title: 'ChannelsDB 2.0 | About', heading: 'References' },
    { path: '/gdpr.html', title: 'ChannelsDB 2.0 | GDPR', heading: 'Terms of Use' },
];

for (const { path, title, heading } of pages) {
    test(`${path} renders`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveTitle(title);
        await expect(page.locator('#app')).toContainText(heading);
        if (path === '/index.html') {
            // Loaded from the API, 'n/a' until then
            await expect(page.locator('#app')).toContainText(/ChannelsDB last update on \d{2}\/\d{2}\/\d{4}\s+contains:\s*\d+ protein entries/);
        }

        // Images still loading count as broken until they are loaded
        const brokenImages = () => page.locator('#app img').evaluateAll((images) =>
            (images as HTMLImageElement[]).filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
        await expect.poll(brokenImages).toEqual([]);

        // The statistics depend on the data of the running application
        const mask = [page.getByText('ChannelsDB last update on')];
        await expect(page).toHaveScreenshot(`${path.slice(1, -5)}.png`, { fullPage: true, mask });
    });
}

test('scroll button returns to the top', async ({ page }) => {
    await page.goto('/methods.html');
    const button = page.locator('.btnScrollToTop');
    await expect(button).toBeHidden();
    await page.mouse.wheel(0, 2000);
    await expect(button).toBeVisible();
    await button.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('contribute form adds and removes table rows', async ({ page }) => {
    await page.goto('/contribute.html');
    // Channel and residue annotations
    await expect(page.locator('table')).toHaveCount(2);
    for (const table of await page.locator('table').all()) {
        const inputs = table.locator('tbody tr').first().locator('input');
        // Two entries, added through the input row at the top
        for (const entry of ['first', 'second']) {
            for (let i = 0; i < await inputs.count(); i++) {
                await inputs.nth(i).fill(`${entry} ${i}`);
            }
            await table.locator('tbody tr').first().locator('button').click();
        }
        const entries = table.locator('tbody tr:has(.btn-danger)');
        await expect(entries).toHaveCount(2);
        await expect(entries.nth(0)).toContainText('first 0');
        await expect(entries.nth(1)).toContainText('second 0');

        // Removing the first keeps the second
        await entries.nth(0).locator('.btn-danger').click();
        await expect(entries).toHaveCount(1);
        await expect(entries.nth(0)).toContainText('second 0');
    }
});

test('the menu opens with its button on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto('/index.html');
    const methods = page.locator('nav').getByRole('link', { name: 'Methods' });
    await expect(methods).toBeHidden();
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(methods).toBeVisible();
    await methods.click();
    await expect(page).toHaveTitle('ChannelsDB 2.0 | Methods');
});
