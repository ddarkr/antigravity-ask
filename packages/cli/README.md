# antigravity-ask

`antigravity-ask` is a CLI for controlling the Antigravity Ask Bridge HTTP server from the terminal.

With this CLI, you can send prompts to Antigravity chat, wait for a final response, and inspect conversations or artifacts.

## Install

```bash
npm install -g antigravity-ask
```

After installation, you can verify it immediately in an environment where the bridge is running.

```bash
antigravity-ask ping
```

The default bridge URL is `http://localhost:5820`.

## Golden path

```bash
# Check bridge status
antigravity-ask ping

# Send one request and wait for the final response
antigravity-ask ask "Summarize the current bridge architecture."

# Send asynchronously and inspect later
antigravity-ask send "Open a new chat and say hello"
antigravity-ask conversation <conversation_id>
```

## URL overrides

The CLI resolves the base URL in the following order.

1. `--url <baseUrl>`
2. `--http-port <port>`
3. `AG_BRIDGE_URL`
4. `http://localhost:5820`

Examples:

```bash
antigravity-ask --url http://127.0.0.1:5820 ping
antigravity-ask --http-port 5820 ping
AG_BRIDGE_URL=http://127.0.0.1:5820 antigravity-ask ping
```

## Commands

```bash
antigravity-ask ask <text>
antigravity-ask send <text>
antigravity-ask ping
antigravity-ask action <type>
antigravity-ask artifacts
antigravity-ask conversation <id>
antigravity-ask artifact <id> <path>
```

Legacy aliases:

```bash
antigravity-ask status
antigravity-ask new-chat
antigravity-ask conversations
```

## Common actions

```bash
antigravity-ask action start_new_chat
antigravity-ask action focus_chat
antigravity-ask action allow
antigravity-ask action reject_step
antigravity-ask action terminal_run
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
