/** Browser-only development regression. Uses a supplied Playwright installation. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [playwrightPath, packagePath, outputPath] = process.argv.slice(2);
if (!playwrightPath || !packagePath) {
    throw new Error('Usage: node scripts/check-info-layout.mjs /path/to/playwright/index.mjs /path/to/installed/theme [result.json]');
}
const { chromium } = await import(pathToFileURL(path.resolve(playwrightPath)).href);
async function styles(filename) {
    const source = await readFile(filename, 'utf8');
    const imports = [...source.matchAll(/@import\s+['"]([^'"]+)['"];?/g)];
    let result = source;
    for (const match of imports) {
        result = result.replace(match[0], await styles(path.resolve(path.dirname(filename), match[1])));
    }
    return result;
}
const css = await styles(path.resolve(packagePath, 'styles.css'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = [];
try {
    for (const width of [320, 430, 1280]) for (const fontSize of [16, 32]) for (const disabled of [false, true]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.setContent(`<html><head><style>
            :root { font-size:${fontSize}px; --bs-body-font-family:Arial,sans-serif; --bs-body-bg:white; --bs-body-color:#222; --bs-tertiary-bg:#eee; --bs-border-color:#aaa; --bs-border-width:1px; --bs-border-radius:.25rem; }
            .graph-editor-root { font-family:system-ui,sans-serif; } .graph-editor-select, .graph-editor-input { font-family:inherit; } * { box-sizing:border-box; } body { margin:0; } main { padding:24px; }
        </style></head><body><main class="graph-editor-root"><div class="graph-editor-card"><div class="graph-editor-card__body graph-editor-card__body--flush"><div class="graph-editor-list graph-editor-scroll" style="max-height:320px"><div class="graph-editor-list__item graph-editor-list__item--choice-inspector">
        <div class="graph-editor-choice-inspector-header graph-editor-flex graph-editor-flex--between">
          <div class="graph-editor-flex graph-editor-flex--row graph-editor-flex-grow-1 graph-editor-min-w-0 graph-editor-flex--gap">
            ${['Type', 'Outcome'].map((label, index) => `<div class="graph-editor-field graph-editor-flex-fill graph-editor-min-w-0"><label class="graph-editor-field__label">${label}</label><select class="graph-editor-select" aria-label="${label}" ${disabled ? 'disabled' : ''}><option>${index ? 'compromised' : 'next'}</option></select></div>`).join('')}
          </div>
          <div class="graph-editor-choice-inspector-actions">${['↑','↓','×'].map((value, index) => `<span role="button" tabindex="0" aria-label="Action ${index}" class="graph-editor-action-icon" ${disabled ? 'aria-disabled="true"' : ''}>${value}</span>`).join('')}</div>
        </div><label class="graph-editor-field__label">Label</label><input class="graph-editor-input" value="Continue"><label class="graph-editor-field__label">Next</label><select class="graph-editor-select" aria-label="Next"><option>END</option></select>
        </div></div></div></div><section class="graph-editor-card"><div class="graph-editor-card__body"><div class="graph-editor-field"><label class="graph-editor-field__label">Appearance wrap</label><select class="graph-editor-select" aria-label="Appearance wrap" style="font-size:1rem;padding-inline:3% calc(3% + .625rem)"><option>Wrap (default)</option></select></div></div></section></main></body></html>`);
        await page.addStyleTag({ content: css });
        const result = await page.evaluate(() => {
            const failures = [];
            const controls = [];
            const selects = [...document.querySelectorAll('.graph-editor-field select')];
            const canvas = document.createElement('canvas'); const context = canvas.getContext('2d');
            for (const select of selects) {
                const style = getComputedStyle(select); context.font = `${style.fontSize} ${style.fontFamily}`;
                const textWidth = context.measureText(select.selectedOptions[0].text).width;
                // Reserve native dropdown indicator space in addition to both declared paddings.
                const available = select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - (select.getAttribute('aria-label') === 'Appearance wrap' ? 0 : 20);
                controls.push({ label:select.getAttribute('aria-label'), width:select.clientWidth, textWidth, available });
                if (available < textWidth) failures.push('unreadable ' + select.getAttribute('aria-label'));
            }
            const labels = [...document.querySelectorAll('.graph-editor-field__label')];
            for (const label of labels) {
                const bounds = label.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(label);
                if ([...range.getClientRects()].some(rect => rect.right > bounds.right + 1)) failures.push('label overlap ' + label.textContent);
            }
            const scroll = document.querySelector('.graph-editor-scroll');
            const reachable = [];
            for (const control of document.querySelectorAll('select, input, [role="button"]')) {
                control.scrollIntoView({ block:'nearest', inline:'nearest' });
                const bounds = control.getBoundingClientRect(); const box = (scroll.contains(control) ? scroll : control.closest('.graph-editor-card')).getBoundingClientRect();
                const visible = bounds.top >= box.top - 1 && bounds.bottom <= box.bottom + 1 && bounds.left >= box.left - 1 && bounds.right <= box.right + 1;
                reachable.push({ label:control.getAttribute('aria-label') || 'Label', visible });
                if (!visible) failures.push('unreachable ' + control.getAttribute('aria-label'));
            }
            return { documentWidth:document.documentElement.scrollWidth, controls, reachable, failures, flushPadding:getComputedStyle(document.querySelector('.graph-editor-card__body--flush')).paddingLeft, choicePadding:getComputedStyle(document.querySelector('.graph-editor-list__item--choice-inspector')).paddingLeft, bodyPadding:getComputedStyle(document.querySelector('section .graph-editor-card__body')).paddingLeft };
        });
        assert.ok(result.documentWidth <= width + 1, JSON.stringify(result));
        assert.deepEqual(result.failures, [], JSON.stringify(result));
        assert.equal(result.flushPadding, '0px');
        if (width === 1280) { assert.equal(result.choicePadding, `${.75 * fontSize}px`); assert.equal(result.bodyPadding, `${.75 * fontSize}px`); }
        results.push({ width, fontSize, disabled, ...result });
    }
    if (outputPath) await writeFile(outputPath, JSON.stringify(results, null, 2) + '\n');
    console.log(`Choice header value, label and scroll reachability checks pass: ${results.length} packed-theme cases.`);
} finally {
    await browser.close();
}
