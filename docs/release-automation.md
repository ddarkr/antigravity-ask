# Release Automation

GitHub Release publishing drives both CLI and extension deployment in this repository.

## Trigger

The release workflows run when a GitHub Release is published.

- Event: `release`
- Type: `published`
- Runner: `ubuntu-latest`

Workflows:

- `.github/workflows/release-cli.yml` — publishes `packages/cli` to npm
- `.github/workflows/release-extension.yml` — packages and publishes `packages/extension`

The extension job packages the extension once and publishes the same `.vsix` file to both stores.

## Version and tag policy

The current automation assumes a single GitHub Release tag matches both published package versions.

- Example release tag: `v0.1.4`
- Expected CLI version: `packages/cli/package.json` → `0.1.4`
- Expected extension version: `packages/extension/package.json` → `0.1.4`

If you do not want lockstep releases for CLI and extension, split the workflow triggers before using this automation for independent releases.

## CLI publishing

The workflow in `.github/workflows/release-cli.yml` publishes the `antigravity-ask` package to npm.

Current behavior:

1. Install dependencies with `pnpm install --frozen-lockfile`.
2. Verify that the GitHub Release tag matches `packages/cli/package.json`.
3. Run the CLI test suite.
4. Build the CLI package.
5. Publish to npm with `npm publish --access public`.

### npm prerequisites

- The npm package must already be configured for public publishing.
- The current workflow is set up for GitHub Actions trusted publishing (`id-token: write`) rather than an `NPM_TOKEN`-based publish step.
- Before the first public release, verify trusted publishing is configured correctly in npm for this repository.

## Required secrets

Set these repository secrets before using the workflow:

- `VSCE_PAT`: Azure DevOps personal access token with `Marketplace (Manage)` scope and access to all accessible organizations.
- `OVSX_PAT`: Open VSX access token.

## Release requirements

- `packages/extension/package.json` version must match the GitHub Release tag without the leading `v`.
  - Example: release tag `v0.1.0`
  - Expected package version: `0.1.0`
- The Open VSX namespace for `ddarkr` must already exist.
- The Marketplace publisher for `ddarkr` must already exist.

## Extension workflow behavior

On release publish, the extension workflow will:

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
pnpm --filter antigravity-ask test
pnpm --filter antigravity-ask build
cd packages/cli && npm pack --dry-run

pnpm --filter antigravity-bridge-extension test
pnpm --filter antigravity-bridge-extension package:ci
```

## Notes

- The extension workflow publishes from a packaged VSIX rather than publishing from source twice.
- This keeps Marketplace and Open VSX aligned on the exact same artifact.
- Both workflows fail early when the release tag and package version do not match.
