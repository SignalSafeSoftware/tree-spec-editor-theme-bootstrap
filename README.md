# @signalsafe/tree-spec-editor-theme-bootstrap

CSS-only Bootstrap-token theme for semantic classes emitted by `@signalsafe/tree-spec-editor` and `@signalsafe/tree-spec-editor-react`.

## Usage

Import the theme **after** Bootstrap or Bootswatch so `--bs-*` variables resolve:

```ts
import '@signalsafe/tree-spec-editor-theme-bootstrap/styles.css';
```

Host apps may keep a thin bridge stylesheet for DeliveryPlus-specific layout, read-only mode, and temporary icon bridges.

## What this package includes

- **Slice 1:** design tokens on `.graph-editor-root`, primitives (buttons, forms, lists, badges, spacing, typography, surfaces, flex), and shell chrome (toolbar, cards, modals, panels, dropdowns, selection).
- **Slice 2:** canvas and React Flow styling (`graph-editor-canvas*`, node cards, choice rows, handles).
- **Slice 3 (current):** Bootstrap Icons via semantic icon/action classes (`graph-editor-btn--toolbar-add`, panel add/collapse/delete, choice action icons).
- **Not included yet:** DeliveryPlus page/read-only/injected-form bridges.

## Requirements

- No React components, ThemeProvider, or runtime logic.
- No Bootstrap JavaScript dependency.
- No npm dependency on Bootstrap — the theme maps `--graph-editor-*` tokens from `--bs-*` when present.

## Package layout

```
styles.css              # public entry (@import chain)
src/tokens.css
src/primitives/*.css
src/shell/*.css
src/canvas/*.css
```
