# Current npm release: @signalsafe/tree-spec-editor-theme-bootstrap 0.3.9

The trusted-publishing migration prepares patch `0.3.9` under immutable
GitHub tag `v0.3.9`. Current release and authentication instructions are in
[RELEASING.md](../RELEASING.md); the migration uses GitHub Actions OIDC rather than
a permanent npm publishing token. Runtime exports and dependency ranges are
unchanged by this patch. Host adoption and Python releases remain independent.

The release workflow is the source of publication evidence. This documentation
follow-up does not reseal or republish an immutable package archive or move a tag.

## Historical release and state record

The previous snapshot below is retained for context; its version and publication
status statements apply to that earlier snapshot.

### Release candidate: @signalsafe/tree-spec-editor-theme-bootstrap 0.3.8

The published baseline is 0.3.7. This compatible CSS-only release reconciles existing choice-inspector, modal, information-panel and toolbar spacing changes while preserving current responsive wrapping and the shared browser layout regression helper. It supports semantic classes emitted by editor 0.5.0 and existing compatible editors; the public stylesheet entry is unchanged.

The normal packed stylesheet, smoke check and browser layout checks must pass at narrow and wide widths, including enlarged text. The actual host remains responsible for its surrounding page layout. No JavaScript runtime, host dependency, Bootstrap JavaScript or new theme is added.

Source reconciliation preserves original dirty work separately and retains stronger upstream checks. Existing CI verifies the exact `release-artifact.json` digest on an immutable matching `v*` tag before registry publication. See [release instructions](../RELEASING.md). Candidate metadata alone does not imply registry publication or host adoption.
