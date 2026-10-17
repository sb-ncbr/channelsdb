import { test as base, expect } from '@playwright/test';

/**
 * Tests fail on errors in the page (uncaught exceptions, rejected promises, console.error), which would otherwise
 * go unnoticed when the page still looks right.
 */
export const test = base.extend<{ pageErrors: string[] }>({
    pageErrors: [async ({ page }, use) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
        });
        await use(errors);
        expect(errors, 'errors in the page').toEqual([]);
    }, { auto: true }],
});

export { expect };
