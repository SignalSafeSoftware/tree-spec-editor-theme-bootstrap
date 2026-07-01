import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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
    'src/shell/icons.css',
    'src/canvas/react-flow.css',
    'src/canvas/nodes.css',
    'src/canvas/choices.css',
    'src/canvas/handles.css',
];

for (const file of required) {
    const path = join(root, file);
    const content = readFileSync(path, 'utf8');
    if (content.trim().length === 0) {
        throw new Error(`Expected non-empty CSS file: ${file}`);
    }
}

const entry = readFileSync(join(root, 'styles.css'), 'utf8');
for (const file of required.slice(1)) {
    if (!entry.includes(file.replace('src/', './src/'))) {
        throw new Error(`styles.css must import ${file}`);
    }
}

console.log('tree-spec-editor-theme-bootstrap smoke:package OK');
