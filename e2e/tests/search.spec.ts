import { test, expect } from './fixtures';

// The PDB search uses the PDBe search API, the AlphaFill search the database content of the running ChannelsDB

test.describe('AlphaFill search', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/index.html');
    });

    test('opens a stored structure, typed in any case and with spaces', async ({ page }) => {
        const box = page.getByPlaceholder(/AlphaFill structures/);
        await box.fill('  p10635 ');
        const popup = page.waitForEvent('popup');
        await box.press('Enter');
        await expect(await popup).toHaveURL(/\/detail\/alphafill\/P10635$|pid=P10635/);
    });

    test('reports invalid and unknown UniProt IDs', async ({ page }) => {
        const box = page.getByPlaceholder(/AlphaFill structures/);
        const message = page.locator('.form-text');
        page.on('popup', () => { throw new Error('No page should open'); });

        await box.fill('XXXX');
        await box.press('Enter');
        await expect(message).toHaveText("'XXXX' is not a valid UniProt ID");

        await box.fill('XXX');
        await expect(message).toBeHidden();

        await box.fill('A0A000ZZZ9');
        await box.press('Enter');
        await expect(message).toHaveText('ChannelsDB does not contain an AlphaFill structure for A0A000ZZZ9');
    });
});

test.describe('PDB search', () => {
    test('finds a structure and shows its channels', async ({ page }) => {
        await page.goto('/index.html');
        await page.getByPlaceholder(/experimental structures/).fill('1ymg');
        await page.locator('.group-header button').filter({ hasText: 'PDB EMDB id' }).click();
        await page.locator('a[data-value="1ymg"]').click();
        const entry = page.locator('.pdb-entry').filter({ hasText: '1ymg' });
        await expect(entry).toContainText(/\d+ channels?;/);
        await expect(entry.locator('a').first()).toHaveAttribute('href', '/detail/pdb/1ymg');
    });

    test('shows the entries of the last full search', async ({ page }) => {
        // Each search finds 1ymg, titled by the searched text
        await page.route('https://www.ebi.ac.uk/pdbe/search/pdb/select?*', (route) => {
            const text = new URL(route.request().url()).searchParams.get('fq')!.replace(/^text:"(.*)"$/, '$1');
            const docs = [{ pdb_id: '1ymg', title: `Found by ${text}` }];
            route.fulfill({ json: { grouped: { pdb_id: { ngroups: 1, groups: [{ groupValue: '1ymg', doclist: { numFound: 1, docs } }] } } } });
        });
        await page.goto('/index.html');
        const box = page.getByPlaceholder(/experimental structures/);
        // The second search before the first one's autocomplete replaces its entries
        await box.fill('first');
        await box.press('Enter');
        await box.fill('second');
        await box.press('Enter');
        await expect(page.locator('h4')).toContainText('Search: second');
        await expect(page.locator('.pdb-entry')).toHaveCount(1);
        await expect(page.locator('.pdb-entry')).toContainText('Found by second');
    });

    test('sends one request while typing', async ({ page }) => {
        await page.goto('/index.html');
        const searched: string[] = [];
        page.on('request', (request) => {
            const term = new URL(request.url()).searchParams.get('q');
            if (request.url().includes('pdb-autocomplete') && term) searched.push(term);
        });
        await page.getByPlaceholder(/experimental structures/).pressSequentially('cytochrome', { delay: 30 });
        await expect(page.locator('.group-header button').first()).toBeVisible();
        expect(searched).toEqual(['value:"cytochrome*"~10']);
    });
});
