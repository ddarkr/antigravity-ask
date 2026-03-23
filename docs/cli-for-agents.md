# Antigravity Ask Bridge CLI for Coding Agents

This guide explains how to use `antigravity-ask` from terminal-based coding agents.

It is written for agents that need short, reliable instructions and copy-pasteable examples.

## What This CLI Does

`antigravity-ask` talks to the Antigravity Ask Bridge HTTP server running inside the VS Code extension host.

Use it when you want to:

- send a prompt into Antigravity chat
- wait for a reply from the agent
- inspect a conversation by id
- read stored artifact files
- trigger bridge actions such as `start_new_chat`

## Prerequisites

Before using the CLI, make sure:

1. the Antigravity Ask Bridge extension is running
2. the bridge HTTP server is reachable
3. the default port or override URL is correct
4. the CLI has been built at least once if you are running from a fresh source checkout

Build step for a fresh checkout:

```bash
pnpm --filter antigravity-ask build
```

Default bridge URL:

```text
http://localhost:5820
```

## URL Resolution Rules

The CLI resolves the base URL in this order:

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

## Golden Path

Start with this flow:

```bash
antigravity-ask ping
antigravity-ask ask "Summarize the current bridge architecture."
```

If you need asynchronous control:

```bash
antigravity-ask send "Open a new chat and say hello"
antigravity-ask conversation <conversation_id>
```

## Commands

### `ping`

Checks whether the bridge server is reachable.

```bash
antigravity-ask ping
```

Expected output: JSON to stdout.

Alias:

```bash
antigravity-ask status
```

### `ask <text>`

Sends a prompt and waits until the bridge decides the conversation is finished.

```bash
antigravity-ask ask "List the supported bridge actions."
```

Behavior:

- prints progress messages to stderr
- prints the final extracted text response to stdout when available
- falls back to printing the last step as JSON when a plain text reply cannot be extracted

Use `ask` when you want a single final answer.

Important:

- the current CLI does not expose a `--model` or `--fast` flag for `ask`
- if you need explicit model selection, use the HTTP bridge API instead of the CLI `ask` command

### `send <text>`

Starts a headless prompt without waiting for completion.

```bash
antigravity-ask send "Create a new conversation about release notes"
```

Expected output: stdout includes a status line followed by JSON, usually including `conversation_id`.

Use `send` when you want to poll or inspect the conversation yourself.

### `conversation <id>`

Reads the full conversation payload.

```bash
antigravity-ask conversation <conversation_id>
```

Expected output: JSON to stdout.

Alias:

```bash
antigravity-ask chat <conversation_id>
```

### `artifacts`

Lists known conversation or artifact entries.

```bash
antigravity-ask artifacts
```

Expected output: JSON to stdout.

Alias:

```bash
antigravity-ask conversations
```

### `artifact <convoId> <path>`

Reads a specific artifact file.

```bash
antigravity-ask artifact <conversation_id> output.md
```

Expected output: raw file contents to stdout.

### `action <type>`

Runs a bridge action.

```bash
antigravity-ask action start_new_chat
antigravity-ask action focus_chat
antigravity-ask action allow
```

Supported action names from the shared contract:

- `start_new_chat`
- `focus_chat`
- `accept_step`
- `allow`
- `reject_step`
- `terminal_run`
- `switch_chat`

Expected output: JSON to stdout.

Legacy alias:

```bash
antigravity-ask new-chat
```

## Advanced: Headless Chat With Explicit Model Selection

The CLI `ask` command does not currently let you pick a model such as Gemini fast mode directly.

If you need explicit model control, use the bridge HTTP API:

```bash
curl -X POST http://localhost:5820/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Summarize the current bridge architecture.",
    "model": 1018
  }'
```

Notes:

- `/chat` accepts `text` and an optional `model`
- when `model` is omitted, the server defaults to `Models.GEMINI_FLASH` (`1018`)
- the current repository uses model ids re-exported by `antigravity-sdk`
- this is the closest current equivalent to an explicit Gemini fast-style request in this project

## Output Rules

Treat command outputs like this:

- `ping`, `action`, `artifacts`, and `conversation` return JSON to stdout
- `send` writes a status line to stdout before printing JSON
- `artifact` returns raw file content to stdout
- `ask` writes progress information to stderr and writes the final answer to stdout when successful

If you are automating this CLI, capture stdout and stderr separately.

## Safe Usage Pattern for Agents

Prefer this sequence:

1. run `ping`
2. use `--help` when you need a fast local command reference
3. fail fast if the bridge is unreachable
4. use `ask` for one-shot requests
5. use `send` plus `conversation` when you need structured inspection
6. use `artifact` only after confirming the conversation id and artifact path

## Common Failures

### Bridge server is not running

Symptoms:

- `ping` fails
- all commands return connection errors

Recovery:

- start the VS Code extension host
- confirm the bridge server is enabled
- verify the base URL or port override

### Wrong base URL

Symptoms:

- requests fail even though the extension is running

Recovery:

- retry with `--url`
- retry with `--http-port` when the host is still `localhost`
- check `AG_BRIDGE_URL`

### Missing required command argument

Symptoms:

- the CLI exits with code `1`
- stderr prints an error such as `Please provide text to ask`

Recovery:

- provide the required argument exactly as shown in the examples above

### Unknown action name

Symptoms:

- the CLI exits with code `1`
- stderr prints `Unknown action type`

Recovery:

- use one of the canonical action names listed in this guide
- if behavior changes, verify against `packages/cli/src/contracts/bridge.ts`

## Canonical Source Files

If this document and the implementation ever disagree, trust these files:

- command behavior: `packages/cli/src/cli.ts`
- URL precedence: `packages/cli/src/cli-config.ts`
- path and action names: `packages/cli/src/contracts/bridge.ts`
- server routes: `packages/extension/src/server.ts`

## Recommended README Snippet

The root README should eventually include a short pointer like this:

```md
## For AI agents

If you want to drive Antigravity from a coding agent, start with `docs/cli-for-agents.md`.
Use `antigravity-ask ping` to verify connectivity before calling `ask` or `send`.
```

## Non-Goals

This guide does not document future features or undocumented endpoints.

It only covers behavior that exists in the current repository.
