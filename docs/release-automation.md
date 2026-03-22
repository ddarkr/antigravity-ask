# Release Automation

GitHub Release publishing now drives extension deployment.

## Trigger

The workflow in `.github/workflows/release-extension.yml` runs when a GitHub Release is published.

- Event: `release`
- Type: `published`
- Runner: `ubuntu-latest`

The job packages the extension once and publishes the same `.vsix` file to both stores.

## Required secrets

Set these repository secrets before using the workflow:

- `VSCE_PAT`: Azure DevOps personal access token with `Marketplace (Manage)` scope and access to all accessible organizations.
- `OVSX_PAT`: Open VSX access token.

## Release requirements

- `packages/extension/package.json` version must match the GitHub Release tag without the leading `v`.
  - Example: release tag `v0.1.0`
  - Expected package version: `0.1.0`
- The Open VSX namespace for `antigravity-bridge` must already exist.
- The Marketplace publisher for `antigravity-bridge` must already exist.

## Workflow behavior

On release publish, the workflow will:

1. Check that `VSCE_PAT` and `OVSX_PAT` are present.
2. Install dependencies with `pnpm install --frozen-lockfile`.
3. Verify that the release tag matches `packages/extension/package.json`.
4. Run the extension test suite.
5. Create `packages/extension/antigravity-bridge-extension.vsix`.
6. Upload the VSIX back to the GitHub Release.
7. Publish the same VSIX to Visual Studio Marketplace.
8. Publish the same VSIX to Open VSX.

## Manual dry run

You can validate the packaging path locally with:

```bash
pnpm --filter antigravity-bridge-extension test
pnpm --filter antigravity-bridge-extension package:ci
```

## Notes

- The workflow publishes from a packaged VSIX rather than publishing from source twice.
- This keeps Marketplace and Open VSX aligned on the exact same artifact.
- If the release tag and extension version do not match, the workflow fails early.
