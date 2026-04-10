# antigravity-ask

`antigravity-ask` is a CLI for controlling the Antigravity Ask Bridge HTTP server from the terminal.

With this CLI, you can send prompts to Antigravity chat, wait for a final response, and inspect conversations or artifacts.

## Quick start

You do not need to install the CLI globally to use it.

```bash
npx antigravity-ask ping
```

If you prefer a global install, you can still use:

```bash
npm install -g antigravity-ask
```

After installation, you can verify it immediately in an environment where the bridge is running.

```bash
npx antigravity-ask ping
```

Without an explicit override, the CLI resolves the bridge from the current working directory, opens that folder as a workspace if needed, and waits for the matching bridge to become ready.

Auto-discovery supports single-folder workspaces only. Opening the same folder in multiple windows is unsupported and returns an ambiguity error.

## Golden path

```bash
# Check bridge status
npx antigravity-ask ping

# Send one request and wait for the final response
npx antigravity-ask ask "Summarize the current bridge architecture."

# Send asynchronously and inspect later
npx antigravity-ask send "Open a new chat and say hello"
# → returns { "success": true, "job_id": "xxx" }
# Poll status: GET /chat/:jobId
```

## URL overrides

The CLI resolves the target bridge in the following order.

1. `--url <baseUrl>`
2. `--http-port <port>`
3. `AG_BRIDGE_URL`
4. current working directory workspace discovery

Examples:

```bash
npx antigravity-ask --url http://127.0.0.1:5820 ping
npx antigravity-ask --http-port 5820 ping
npx antigravity-ask --variant pro send "Review the failing tests"
AG_BRIDGE_URL=http://127.0.0.1:5820 npx antigravity-ask ping
```


## Commands

```bash
npx antigravity-ask ask <text>
npx antigravity-ask send <text>
npx antigravity-ask ping
npx antigravity-ask action <type>
npx antigravity-ask artifacts
npx antigravity-ask conversation <id>
npx antigravity-ask artifact <id> <path>
```

Legacy aliases:

```bash
npx antigravity-ask status
npx antigravity-ask new-chat
npx antigravity-ask conversations
```

## Common actions

```bash
npx antigravity-ask action start_new_chat
npx antigravity-ask action focus_chat
npx antigravity-ask action allow
npx antigravity-ask action reject_step
npx antigravity-ask action terminal_run
```

Canonical action/path contracts live in `src/contracts/bridge.ts`.

## Workspace discovery

- the CLI canonicalizes `process.cwd()` and looks for a matching live bridge instance
- if no bridge is found, it opens the current folder with `antigravity --new-window <cwd>`
- it waits for both `/ping` discovery metadata and `/lsstatus` readiness before sending chat requests
- same-folder multi-window is unsupported; close duplicates or use `--url`

## From source

```bash
pnpm install
pnpm --filter antigravity-ask build
pnpm exec antigravity-ask --help
```

## Related docs

- Root project overview: <https://github.com/ddarkr/antigravity-ask#readme>
- Agent-friendly CLI guide: <https://github.com/ddarkr/antigravity-ask/blob/main/docs/cli-for-agents.md>
- Bridge extension docs: <https://github.com/ddarkr/antigravity-ask/blob/main/packages/extension/README.md>
