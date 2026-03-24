# Antigravity Ask Bridge

The most convenient way to control Antigravity is to enable the bridge extension first and then use `antigravity-ask`.

```bash
# 1) Check that the bridge is running
npx antigravity-ask ping

# 2) Send one request and wait for the final response
npx antigravity-ask ask "Summarize the current bridge architecture."

# 3) Send asynchronously, get a conversation_id, and inspect it later
npx antigravity-ask send "Open a new chat and say hello"
npx antigravity-ask conversation <conversation_id>
```

- Default bridge URL: `http://localhost:5820`
- Override options: `--url`, `--http-port`, `AG_BRIDGE_URL`
- Detailed guide for coding agents: `docs/cli-for-agents.md`

This project runs a bridge server inside Antigravity IDE so external CLIs and other agents can send prompts, inspect conversation state, and read saved artifacts.

## Quick start

### Use the published CLI

```bash
npx antigravity-ask ping
```

### Build from source

```bash
pnpm install
pnpm --filter antigravity-ask build
pnpm exec antigravity-ask --help
```

## Packages

- `packages/extension` — VS Code extension host. It owns the Hono HTTP/WebSocket server, SDK-backed bridge services, and artifact access.
- `packages/cli` — publishable CLI package. The package name is `antigravity-ask` and the executable is also `antigravity-ask`.

For package-specific release and usage documentation, start here:

- CLI package docs: `packages/cli/README.md`
- Extension docs: `packages/extension/README.md`
- Release automation: `docs/release-automation.md`
- Agent-focused CLI guide: `docs/cli-for-agents.md`

## Development

```bash
pnpm install

pnpm --filter antigravity-ask build
pnpm --filter antigravity-bridge-extension build
```

To run the extension in VS Code, launch `packages/extension` in an Extension Host.

## CLI reference

The CLI is built from `packages/cli`. On a fresh clone, `dist/` does not exist yet, so run `pnpm --filter antigravity-ask build` before using the commands below.

```bash
pnpm --filter antigravity-ask build
pnpm exec antigravity-ask --help
```

For quick local testing from the repository root, run:

```bash
pnpm exec antigravity-ask ping
pnpm exec antigravity-ask ask "hello"
```

The default bridge URL is `http://localhost:5820`, and you can override it with `AG_BRIDGE_URL` when needed.

```bash
antigravity-ask ask <text>
antigravity-ask send <text>
antigravity-ask ping
antigravity-ask action <type>
antigravity-ask artifacts
antigravity-ask conversation <id>
antigravity-ask artifact <id> <path>
```

## For AI Agents

If you want to drive Antigravity from a coding agent, start with `docs/cli-for-agents.md`.

Use `antigravity-ask ping` to verify connectivity before calling `ask` or `send`.

## Contributing

See `CONTRIBUTING.md` for contribution guidelines and development expectations.

## Verification

```bash
pnpm lint
pnpm test
pnpm build
```
