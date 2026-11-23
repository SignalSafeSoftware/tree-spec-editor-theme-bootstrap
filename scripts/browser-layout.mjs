/** Shared setup for the packed-theme browser layout regressions. */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function styles(filename) {
    const source = await readFile(filename, 'utf8');
    const imports = [...source.matchAll(/@import\s+['"]([^'"]+)['"];?/g)];
    return imports.reduce(
        (pending, match) =>
            pending.then(async (result) =>
                result.replace(
                    match[0],
                    await styles(path.resolve(path.dirname(filename), match[1])),
                ),
            ),
        Promise.resolve(source),
    );
}

export async function browserLayout(scriptName) {
    const [playwrightPath, packagePath, outputPath] = process.argv.slice(2);
    if (!playwrightPath || !packagePath) {
        throw new Error(
            `Usage: node scripts/${scriptName} /path/to/playwright/index.mjs /path/to/installed/theme [result.json]`,
        );
    }
    const { chromium } = await import(pathToFileURL(path.resolve(playwrightPath)).href);
    const css = await styles(path.resolve(packagePath, 'styles.css'));
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        return { browser, page, css, outputPath };
    } catch (error) {
        await browser.close();
        throw error;
    }
}

/** Cases share a mutable page, so execute them serially and always close its browser. */
export async function checkBrowserCases(scriptName, cases, inspectCase, description) {
    const { browser, page, css, outputPath } = await browserLayout(scriptName);
    try {
        const results = await cases.reduce(
            (pending, scenario) => pending.then(async (previous) => [
                ...previous, await inspectCase(page, css, scenario),
            ]),
            Promise.resolve([]),
        );
        if (outputPath) await writeFile(outputPath, JSON.stringify(results, null, 2) + '\n');
        console.log(`${description}: ${results.length} packed-theme cases.`);
    } finally {
        await browser.close();
    }
}
