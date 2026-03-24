# Contributing

Thanks for contributing to Antigravity Ask Bridge.

## Repository layout

- `packages/cli` — publishable `antigravity-ask` CLI package
- `packages/extension` — VS Code extension host that starts the local bridge server
- `docs/` — agent docs and release automation notes

## Local setup

```bash
pnpm install
pnpm build
pnpm test
```

During development, you can build only the package you are working on.

```bash
pnpm --filter antigravity-ask build
pnpm --filter antigravity-bridge-extension build
```

## Development guidelines

- Follow existing patterns and avoid unnecessary refactoring.
- Treat `packages/cli/src/contracts/bridge.ts` as the canonical source for CLI contracts.
- If you change a public API or command/action name, update the relevant README files and docs in the same change.
- Keep new behavior verifiable through build/test paths whenever possible.

## Pull requests

Please include the following in your pull request:

- What changed
- Why the change is needed
- How you verified it
- Whether related documentation was updated for user-facing changes

## Release notes

- CLI release automation: `.github/workflows/release-cli.yml`
- Extension release automation: `.github/workflows/release-extension.yml`
- Release flow documentation: `docs/release-automation.md`
