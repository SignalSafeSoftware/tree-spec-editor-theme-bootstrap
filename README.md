# @signalsafe/tree-spec-editor-theme-bootstrap

Current source and planned customer-subdomain impact: [current-state summary](docs/current-release-candidate.md).

CSS-only Bootstrap-token theme for semantic classes emitted by `@signalsafe/tree-spec-editor` and `@signalsafe/tree-spec-editor-react`.

## Usage

Import the theme **after** Bootstrap or Bootswatch so `--bs-*` variables resolve:

```ts
import '@signalsafe/tree-spec-editor-theme-bootstrap/styles.css';
```

Host apps may keep a thin bridge stylesheet for DeliveryPlus-specific layout, read-only mode, and temporary icon bridges.

## What this package includes

- **Slice 1:** design tokens on `.graph-editor-root`, primitives (buttons, forms, lists, badges, spacing, typography, surfaces, flex), and shell chrome (toolbar, cards, modals, panels, dropdowns, selection).
- **Slice 2:** canvas and React Flow styling (`graph-editor-canvas*`, node cards, choice rows, handles), including standalone `TreeSpecGraphEditor` token inheritance and edge-label styling.
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


The Info property table uses fixed column layout and wraps long identities and
timestamps within its card, including narrow panels at enlarged text sizes.
Horizontal cell padding scales down with available table width while preserving
its existing maximum spacing. Values remain visible; the theme does not truncate
text or hide overflow to fit.

To run the browser layout regression with an independently installed Playwright
development tool (no JavaScript runtime is shipped), use
`node scripts/check-info-layout.mjs /absolute/path/to/playwright/index.mjs /absolute/path/to/installed/theme`.

Choice inspector headers wrap fields and action controls at narrow widths and enlarged text. The Choices panel retains its bounded scroll area. Development browser regression: `node scripts/check-choice-header-layout.mjs /path/to/playwright/index.mjs /path/to/installed/theme [result.json]`.

Card bodies and choice rows cap inline insets at three percent of their containing width on narrow cards; wide layouts keep the existing .75rem maximum. Flush bodies remain uninset.

See the [current release documentation](docs/current-release-candidate.md) for release-specific compatibility and verification boundaries.
