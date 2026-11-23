import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const required = [
    'styles.css',
    'src/tokens.css',
    'src/primitives/buttons.css',
    'src/primitives/forms.css',
    'src/primitives/lists.css',
    'src/primitives/badges.css',
    'src/primitives/typography.css',
    'src/primitives/surfaces.css',
    'src/primitives/spacing.css',
    'src/primitives/flex.css',
    'src/shell/toolbar.css',
    'src/shell/cards.css',
    'src/shell/modals.css',
    'src/shell/panels.css',
    'src/shell/dropdowns.css',
    'src/shell/selection.css',
    'src/shell/choice-inspector.css',
    'src/shell/icons.css',
    'src/canvas/react-flow.css',
    'src/canvas/nodes.css',
    'src/canvas/choices.css',
    'src/canvas/handles.css',
];

export function smokePackage(packageRoot = root) {
    for (const file of required) {
        const path = join(packageRoot, file);
        const content = readFileSync(path, 'utf8');
        if (content.trim().length === 0) {
            throw new Error(`Expected non-empty CSS file: ${file}`);
        }
    }

    const entry = readFileSync(join(packageRoot, 'styles.css'), 'utf8');
    for (const file of required.slice(1)) {
        if (!entry.includes(file.replace('src/', './src/'))) {
            throw new Error(`styles.css must import ${file}`);
        }
    }

    const tokens = readFileSync(join(packageRoot, 'src/tokens.css'), 'utf8');
    if (!tokens.includes('.graph-editor-canvas-root')) {
        throw new Error('tokens.css must support standalone graph-editor-canvas-root usage');
    }

    const handles = readFileSync(join(packageRoot, 'src/canvas/handles.css'), 'utf8');
    if (!handles.includes('.graph-editor-canvas .graph-editor-choice-handle')) {
        throw new Error('handles.css must scope choice handles to the standalone canvas');
    }

    console.log('tree-spec-editor-theme-bootstrap smoke:package OK');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    smokePackage();
}
