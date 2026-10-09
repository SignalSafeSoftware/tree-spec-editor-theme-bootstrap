# Development rules

## Scope

`@signalsafe/tree-spec-editor-theme-bootstrap` is CSS only: tokens and styles for the semantic `graph-editor-*` class names emitted by `tree-spec-editor` and `tree-spec-editor-react`. It has no JavaScript runtime.

- Every class a package emits needs a rule here; every rule here needs a class that a package emits. Remove stale selectors when a class is removed.
- Do not depend on Bootstrap itself; use the token layer in `src/tokens.css`.
- Register new files in `styles.css` and in `scripts/smoke-package.mjs`.

## Quality gates

Run `node scripts/smoke-package.mjs` and `npm pack --dry-run` for every change. Check new states (expanded, collapsed, disabled, focused) in a host before releasing.

## Releases

Bump `package.json` with every stylesheet change and follow `.codex/skills/ecosystem-release/SKILL.md`. Never tag, publish or push without explicit user approval.
