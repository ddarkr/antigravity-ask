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

The default bridge URL is `http://localhost:5820`.

## Golden path

```bash
# Check bridge status
npx antigravity-ask ping

# Send one request and wait for the final response
npx antigravity-ask ask "Summarize the current bridge architecture."

# Send asynchronously and inspect later
npx antigravity-ask send "Open a new chat and say hello"
npx antigravity-ask conversation <conversation_id>
```

## URL overrides

The CLI resolves the base URL in the following order.

1. `--url <baseUrl>`
2. `--http-port <port>`
3. `AG_BRIDGE_URL`
4. `http://localhost:5820`

Examples:

```bash
npx antigravity-ask --url http://127.0.0.1:5820 ping
npx antigravity-ask --http-port 5820 ping
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
