# Antigravity Ask Bridge

The most convenient way to control Antigravity is to enable the bridge extension first and then use `npx antigravity-ask`.

```bash
# 1) Check that the bridge is running
npx antigravity-ask ping

# 2) Send one request and wait for the final response
npx antigravity-ask ask "Summarize the current bridge architecture."

# 3) Send asynchronously, get a job_id, and check status later
npx antigravity-ask send "Open a new chat and say hello"
# → returns { "success": true, "job_id": "xxx" }
# Poll status: GET /chat/:jobId
```

- Override options: `--url`, `--http-port`, `AG_BRIDGE_URL`
- Model selection for `ask`/`send`: `--variant flash|pro|pro-low|sonnet|opus|gpt-oss`
- Without an explicit override, the CLI resolves the bridge from the current working directory, opens that folder as a workspace when needed, and waits for the matching bridge to become ready.
- Auto-discovery currently supports single-folder workspaces only. Opening the same folder in multiple windows is unsupported.
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
pnpm exec antigravity-ask --variant flash ask "summarize the workspace"
```

The CLI prefers explicit overrides first. Without one, it resolves the bridge from the current working directory and launches that folder in VS Code when no matching bridge is already running.

```bash
npx antigravity-ask ask <text>
npx antigravity-ask send <text>
npx antigravity-ask --variant flash ask <text>
npx antigravity-ask --variant pro send <text>
npx antigravity-ask ping
npx antigravity-ask action <type>
npx antigravity-ask artifacts
npx antigravity-ask conversation <id>
npx antigravity-ask artifact <id> <path>
```

For simple model selection, `ask` and `send` accept `--variant <name>`.

- `flash` → Gemini Flash
- `pro` → Gemini Pro high
- `pro-low` → Gemini Pro low
- `sonnet` → Claude Sonnet
- `opus` → Claude Opus
- `gpt-oss` → GPT-OSS

## For AI Agents

If you want to drive Antigravity from a coding agent, start with `docs/cli-for-agents.md`.

If you want a reusable agent skill, see `skills/antigravity-ask/SKILL.md`.

To install that skill into Antigravity via the external skills CLI:

```bash
npx skills add ddarkr/antigravity-ask --skill antigravity-ask -a antigravity -y
```

Use `npx antigravity-ask ping` to verify connectivity before calling `ask` or `send`.

## Contributing

See `CONTRIBUTING.md` for contribution guidelines and development expectations.

## Verification

```bash
pnpm lint
pnpm test
pnpm build
```
