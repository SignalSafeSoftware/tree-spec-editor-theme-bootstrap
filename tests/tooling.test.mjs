import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, test } from 'node:test';
import { browserLayout } from '../scripts/browser-layout.mjs';
import { checkChoiceHeaderLayout } from '../scripts/check-choice-header-layout.mjs';
import { checkInfoLayout } from '../scripts/check-info-layout.mjs';
import { smokePackage } from '../scripts/smoke-package.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fake = fileURLToPath(new URL('./support/fake-browser.mjs', import.meta.url));
const key = Symbol.for('tree-theme-browser-test-state');
const originalArgv = process.argv;
const directories = [];
function fixture() {
    const dir = mkdtempSync(path.join(tmpdir(), 'theme-test-'));
    directories.push(dir);
    cpSync(path.join(root, 'src'), path.join(dir, 'src'), { recursive: true });
    cpSync(path.join(root, 'styles.css'), path.join(dir, 'styles.css'));
    return dir;
}
function configure(fault = '', output) {
    const state = { width: 320, fontSize: 16, fault, events: [], closed: 0 };
    globalThis[key] = state;
    process.argv = [
        process.execPath,
        import.meta.filename,
        fake,
        root,
        ...(output ? [output] : []),
    ];
    return state;
}
afterEach(() => {
    process.argv = originalArgv;
    delete globalThis[key];
    delete globalThis.document;
    delete globalThis.innerWidth;
    delete globalThis.getComputedStyle;
    directories
        .splice(0)
        .forEach((directory) => rmSync(directory, { recursive: true, force: true }));
});

test('actual package smoke verifies every shipped stylesheet and import', () => {
    assert.doesNotThrow(() => smokePackage());
    assert.doesNotThrow(() => smokePackage(fixture()));
});

test('smoke rejects missing and empty stylesheet payloads', () => {
    const missing = fixture();
    unlinkSync(path.join(missing, 'src/tokens.css'));
    assert.throws(() => smokePackage(missing), { code: 'ENOENT' });
    const empty = fixture();
    writeFileSync(path.join(empty, 'src/tokens.css'), ' \n');
    assert.throws(() => smokePackage(empty), /Expected non-empty CSS file: src\/tokens.css/);
});

test('smoke rejects an unregistered stylesheet and missing standalone scopes', () => {
    const unregistered = fixture();
    const entry = path.join(unregistered, 'styles.css');
    writeFileSync(entry, readFileSync(entry, 'utf8').replace('./src/tokens.css', './other.css'));
    assert.throws(() => smokePackage(unregistered), /styles.css must import src\/tokens.css/);
    const tokens = fixture();
    const tokenFile = path.join(tokens, 'src/tokens.css');
    writeFileSync(
        tokenFile,
        readFileSync(tokenFile, 'utf8').replaceAll('.graph-editor-canvas-root', '.other'),
    );
    assert.throws(() => smokePackage(tokens), /tokens.css must support standalone/);
    const handles = fixture();
    const handleFile = path.join(handles, 'src/canvas/handles.css');
    writeFileSync(
        handleFile,
        readFileSync(handleFile, 'utf8').replaceAll(
            '.graph-editor-canvas .graph-editor-choice-handle',
            '.other',
        ),
    );
    assert.throws(() => smokePackage(handles), /handles.css must scope choice handles/);
});

test('browser setup reports both missing CLI arguments and rejects missing CSS before launching', async () => {
    configure();
    process.argv = [process.execPath, 'probe'];
    await assert.rejects(browserLayout('probe.mjs'), /Usage: node scripts\/probe.mjs/);
    process.argv.push(fake);
    await assert.rejects(browserLayout('probe.mjs'), /Usage: node scripts\/probe.mjs/);
    const s = configure();
    process.argv[3] = path.join(fixture(), 'missing');
    await assert.rejects(browserLayout('probe.mjs'), { code: 'ENOENT' });
    assert.deepEqual(s.events, []);
});

test('browser setup expands ordered nested CSS imports and owns page-creation cleanup', async () => {
    const dir = fixture();
    writeFileSync(path.join(dir, 'styles.css'), '@import "first.css";@import "second.css";');
    writeFileSync(path.join(dir, 'first.css'), '@import "nested.css"; .first{}');
    writeFileSync(path.join(dir, 'nested.css'), '.nested{}');
    writeFileSync(path.join(dir, 'second.css'), '.second{}');
    const s = configure();
    process.argv[3] = dir;
    const setup = await browserLayout('probe.mjs');
    assert.equal(setup.css, '.nested{} .first{}.second{}');
    await setup.browser.close();
    assert.equal(s.closed, 1);
    const failed = configure('new-page');
    await assert.rejects(browserLayout('probe.mjs'), /new page failed/);
    assert.equal(failed.closed, 1);
    const launch = configure('launch');
    await assert.rejects(browserLayout('probe.mjs'), /launch failed/);
    assert.equal(launch.closed, 0);
});

for (const [name, run] of [
    ['choice', checkChoiceHeaderLayout],
    ['info', checkInfoLayout],
]) {
    test(`${name} checks all twelve cases sequentially and writes ordered receipts`, async () => {
        const output = path.join(fixture(), 'result.json');
        const s = configure('', output);
        await run();
        const results = JSON.parse(readFileSync(output, 'utf8'));
        assert.equal(results.length, 12);
        assert.equal(s.closed, 1);
        assert.deepEqual(
            results.map((result) => result.width),
            [320, 320, 320, 320, 430, 430, 430, 430, 1280, 1280, 1280, 1280],
        );
        assert.deepEqual(
            results.map((result) => result.fontSize),
            [16, 16, 32, 32, 16, 16, 32, 32, 16, 16, 32, 32],
        );
        assert.equal(s.events.filter((event) => event.startsWith('viewport:')).length, 12);
        assert.equal(s.events.at(-1), 'close');
    });
    test(`${name} supports receipt-free checks and propagates write failures after closing`, async () => {
        const s = configure();
        await run();
        assert.equal(s.closed, 1);
        const failed = configure('', path.join(fixture(), 'missing/result.json'));
        await assert.rejects(run(), { code: 'ENOENT' });
        assert.equal(failed.closed, 1);
    });
}

for (const fault of [
    'document-overflow',
    'unreadable',
    'label-overlap',
    'unreachable',
    'padding',
]) {
    test(`choice layout catches ${fault} and always closes the browser`, async () => {
        const s = configure(fault);
        await assert.rejects(checkChoiceHeaderLayout(), assert.AssertionError);
        assert.equal(s.closed, 1);
    });
}
for (const fault of [
    'document-overflow',
    'table-overflow',
    'cell-scroll',
    'cell-text',
    'cell-text-right',
    'padding',
]) {
    test(`info layout catches ${fault} and always closes the browser`, async () => {
        const s = configure(fault);
        await assert.rejects(checkInfoLayout(), assert.AssertionError);
        assert.equal(s.closed, 1);
    });
}

test('direct CLIs preserve entry behavior and imports work without an entry path', () => {
    const smoke = fileURLToPath(new URL('../scripts/smoke-package.mjs', import.meta.url));
    const choice = fileURLToPath(
        new URL('../scripts/check-choice-header-layout.mjs', import.meta.url),
    );
    const info = fileURLToPath(new URL('../scripts/check-info-layout.mjs', import.meta.url));
    assert.match(execFileSync(process.execPath, [smoke], { encoding: 'utf8' }), /smoke:package OK/);
    assert.match(
        execFileSync(process.execPath, [choice, fake, root], { encoding: 'utf8' }),
        /12 packed-theme cases/,
    );
    assert.match(
        execFileSync(process.execPath, [info, fake, root], { encoding: 'utf8' }),
        /12 packed-theme cases/,
    );
    execFileSync(process.execPath, [
        '--input-type=module',
        '-e',
        `await Promise.all(${JSON.stringify([smoke, choice, info])}.map(path => import(path)))`,
    ]);
});
