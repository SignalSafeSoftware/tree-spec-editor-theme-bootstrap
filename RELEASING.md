# Release preparation: editor theme 0.3.7

## Current npm publishing: GitHub Actions OIDC

The npm package `@signalsafe/tree-spec-editor-theme-bootstrap` uses trusted publishing from
`SignalSafeSoftware/tree-spec-editor-theme-bootstrap`, workflow `ci.yml`. The connection permits
`npm publish` and staged publishing; separate dist-tag management is not granted.
Publishing jobs use GitHub-hosted runners, Node 24, npm 11.21.2 and scoped
`id-token: write` permission. Reusable workflow callers also grant this permission.
No `NPM_TOKEN` publishing secret or `npm whoami` precheck is required.

For this migration, release `0.3.9` with immutable tag `v0.3.9`
after the migration PR and all required checks pass. Publish only through the
workflow after merging the reviewed commit; do not move an existing release tag.
Existing quality gates, package smoke checks and approved-archive checks remain
required wherever configured. Python releases and dependency-install credentials
are independent of this npm authentication change.

Verify the GitHub publish job succeeds, npm serves the expected version/archive,
and the package's trusted publisher status becomes validated. A newly saved
connection must publish within npm's two-day validation window. Retain existing
token access until OIDC publishing is verified; disabling token publishing and
removing unused secrets is a separate follow-up. Never log credentials or OIDC tokens.


Release `0.3.7` retains the installed Step 5 responsive choice/header and information-table insets. It ships CSS only through `./styles.css`, with no React or Bootstrap JavaScript dependency. The host supplies Bootstrap-compatible tokens.

Run `npm run smoke:package`, `npm run publish:dry-run`, both layout checks, and the actual editor host at narrow widths and 200% text. Inspect the exact archive and approve its source revision and digest before publication. The existing CI publishes only on an approved `v*` tag after checks and smoke succeed; manual dispatch verifies without publishing. Publish in coordination with editor `0.5.0` and verify the downloaded registry artifact before host adoption.
