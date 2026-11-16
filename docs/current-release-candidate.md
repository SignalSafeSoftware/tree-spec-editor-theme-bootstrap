# Release candidate: @signalsafe/tree-spec-editor-theme-bootstrap 0.3.8

The published baseline is 0.3.7. This compatible CSS-only release reconciles existing choice-inspector, modal, information-panel and toolbar spacing changes while preserving current responsive wrapping and the shared browser layout regression helper. It supports semantic classes emitted by editor 0.5.0 and existing compatible editors; the public stylesheet entry is unchanged.

The normal packed stylesheet, smoke check and browser layout checks must pass at narrow and wide widths, including enlarged text. The actual host remains responsible for its surrounding page layout. No JavaScript runtime, host dependency, Bootstrap JavaScript or new theme is added.

Source reconciliation preserves original dirty work separately and retains stronger upstream checks. Existing CI verifies the exact `release-artifact.json` digest on an immutable matching `v*` tag before registry publication. See [release instructions](../RELEASING.md). Candidate metadata alone does not imply registry publication or host adoption.
