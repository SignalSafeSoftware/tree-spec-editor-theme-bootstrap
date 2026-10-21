# Release preparation: editor theme 0.3.7

Release `0.3.7` retains the installed Step 5 responsive choice/header and information-table insets. It ships CSS only through `./styles.css`, with no React or Bootstrap JavaScript dependency. The host supplies Bootstrap-compatible tokens.

Run `npm run smoke:package`, `npm run publish:dry-run`, both layout checks, and the actual editor host at narrow widths and 200% text. Inspect the exact archive and approve its source revision and digest before publication. The existing CI publishes only on an approved `v*` tag after checks and smoke succeed; manual dispatch verifies without publishing. Publish in coordination with editor `0.4.1` and verify the downloaded registry artifact before host adoption.
