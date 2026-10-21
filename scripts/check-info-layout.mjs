/** Browser-only development regression. Uses a supplied Playwright installation. */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { browserLayout } from './browser-layout.mjs';

const { browser, page, css, outputPath } = await browserLayout('check-info-layout.mjs');
const results = [];
try {
    for (const width of [320, 430, 1280]) for (const fontSize of [16, 32]) for (const status of ['Draft', 'Published']) {
        await page.setViewportSize({ width, height: 1000 });
        await page.setContent(`<html><head><style>
            :root { font-size:${fontSize}px; --bs-body-font-family:Arial,sans-serif; --bs-body-bg:white; --bs-body-color:#222; --bs-tertiary-bg:#eee; --bs-border-color:#aaa; --bs-border-color-translucent:#ddd; --bs-border-width:1px; --bs-border-radius:.25rem; }
            * { box-sizing:border-box; } body { margin:0; } main { padding:48px; }
        </style></head><body><main class="graph-editor-root"><section class="graph-editor-card">
            <div class="graph-editor-card__header">Info</div><div class="graph-editor-card__body graph-editor-card__body--flush">
                <table class="graph-editor-table graph-editor-spacing--m-0"><tbody>
                    <tr><td>Name</td><td>New local draft</td></tr>
                    <tr><td>Status</td><td><span class="graph-editor-badge">${status}</span></td></tr>
                    <tr><td>Save state</td><td>Unsaved changes</td></tr>
                    <tr><td>Validated</td><td>Validated 10/18/2026, 8:49:31 PM</td></tr>
                    <tr><td>Scenario ID</td><td><span class="graph-editor-mono graph-editor-text--sm graph-editor-text--break">11111111-2222-3333-4444-555555555555</span></td></tr>
                    <tr><td>Version ID</td><td><span class="graph-editor-mono graph-editor-text--sm graph-editor-text--break">aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee</span></td></tr>
                    <tr><td>Created</td><td>2026-10-18T20:49:31.123456+00:00</td></tr>
                    <tr><td>Updated</td><td>2026-10-18T20:49:31.123456+00:00</td></tr>
                    <tr><td>Long identity</td><td>${'unbroken'.repeat(25)}</td></tr>
                </tbody></table>
            </div></section></main></body></html>`);
        await page.addStyleTag({ content: css });
        const result = await page.evaluate(() => {
            const table = document.querySelector('table');
            const body = table.parentElement;
            const bounds = table.getBoundingClientRect();
            const cellFailures = [];
            for (const td of table.querySelectorAll('td')) {
                const cell = td.getBoundingClientRect();
                const range = document.createRange(); range.selectNodeContents(td);
                const outsideText = [...range.getClientRects()].some(rect => rect.left < cell.left - 1 || rect.right > cell.right + 1);
                if (td.scrollWidth > td.clientWidth + 1 || outsideText) cellFailures.push(td.textContent);
            }
            return { viewport:innerWidth, documentWidth:document.documentElement.scrollWidth, tableWidth:bounds.width, containerWidth:body.clientWidth, right:bounds.right, cellFailures, padding:getComputedStyle(table.querySelector('td')).paddingLeft };
        });
        assert.ok(result.documentWidth <= width + 1, JSON.stringify(result));
        assert.ok(result.tableWidth <= result.containerWidth + 1, JSON.stringify(result));
        assert.deepEqual(result.cellFailures, [], JSON.stringify(result));
        if (width === 1280 && fontSize === 16) assert.equal(result.padding, '12px');
        results.push({ width, fontSize, status, ...result });
    }
    if (outputPath) await writeFile(outputPath, JSON.stringify(results, null, 2) + '\n');
    console.log(`Info table containment and full-text checks pass: ${results.length} packed-theme cases.`);
} finally {
    await browser.close();
}
