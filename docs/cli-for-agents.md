# Antigravity Ask Bridge CLI for Coding Agents

This guide explains how to use `npx antigravity-ask` from terminal-based coding agents.

It is written for agents that need short, reliable instructions and copy-pasteable examples.

If your environment supports reusable repo skills, start with `skills/antigravity-ask/SKILL.md` and use this document as the deeper command reference.

To install the reusable skill into Antigravity:

```bash
npx skills add ddarkr/antigravity-ask --skill antigravity-ask -a antigravity -y
```

## What This CLI Does

`npx antigravity-ask` talks to the Antigravity Ask Bridge HTTP server running inside the Antigravity extension host.

Use it when you want to:

- create a headless conversation
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

Default behavior without explicit overrides:

```text
resolve bridge from the current working directory
open the folder as a workspace when needed
wait for the matching bridge and LS readiness
```

## URL Resolution Rules

The CLI resolves the target bridge in this order:

1. `--url <baseUrl>`
2. `--http-port <port>`
3. `AG_BRIDGE_URL`
4. current working directory workspace discovery

Examples:

```bash
npx antigravity-ask --url http://127.0.0.1:5820 ping
npx antigravity-ask --http-port 5820 ping
AG_BRIDGE_URL=http://127.0.0.1:5820 npx antigravity-ask ping
```

## Golden Path

Start with this flow:

```bash
npx antigravity-ask ping
npx antigravity-ask ask "Summarize the current bridge architecture."
```

Discovery rules:

- the CLI only supports single-folder workspace discovery
- if no bridge exists yet, it opens the current folder with `antigravity --new-window <cwd>`
- it rejects same-folder multi-window as unsupported ambiguity
- use `--url` when you need to target a specific bridge manually

If you need asynchronous control:

```bash
npx antigravity-ask send "Open a new chat and say hello"
# → returns { "success": true, "job_id": "xxx" }
# Poll status: GET /conversations/jobs/:jobId
```

## Commands

### `ping`

Checks whether the bridge server is reachable.

```bash
npx antigravity-ask ping
```

Expected output: JSON to stdout.

Alias:

```bash
npx antigravity-ask status
```

### `ask <text>`

Sends a prompt by creating a headless conversation and waits until the bridge decides the conversation is finished.

```bash
npx antigravity-ask ask "List the supported bridge actions."
```

Behavior:

- prints progress messages to stderr
- prints the final extracted text response to stdout when available
- falls back to printing the last step as JSON when a plain text reply cannot be extracted

Use `ask` when you want a single final answer from a headless conversation.


### `send <text>`

Creates a headless conversation without waiting for completion.

```bash
npx antigravity-ask send "Create a new conversation about release notes"
```

Expected output: JSON to stdout with `job_id` for polling.

Use `send` when you want to poll job status yourself via `GET /conversations/jobs/:jobId`.

### `conversation <id>`

Reads the full conversation payload.

```bash
npx antigravity-ask conversation <conversation_id>
```

Expected output: JSON to stdout.

### `artifacts`

Lists known conversation or artifact entries.

```bash
npx antigravity-ask artifacts
```

Expected output: JSON to stdout.

Alias:

```bash
npx antigravity-ask conversations
```

### `artifact <convoId> <path>`

Reads a specific artifact file.

```bash
npx antigravity-ask artifact <conversation_id> output.md
```

Expected output: raw file contents to stdout.

### `action <type>`

Runs a bridge action.

```bash
npx antigravity-ask action start_new_chat
npx antigravity-ask action focus_chat
npx antigravity-ask action allow
```

Supported action names from the shared contract:

- `start_new_chat`
- `focus_chat`
- `accept_step`
- `allow`
- `reject_step`
- `terminal_run`

`switch_chat` exists in the shared contract, but the current `/action` server route returns an error for it.

Expected output: JSON to stdout.

Legacy alias:

```bash
npx antigravity-ask new-chat
```

## Model Selection

The CLI intentionally lets Antigravity choose the current default/UI-selected model for `ask` and `send`.

Legacy variants are accepted for compatibility:

- `flash` → Gemini Flash
- `pro` → Gemini Pro high
- `pro-low` → Gemini Pro low
- `sonnet` → Claude Sonnet
- `opus` → Claude Opus
- `gpt-oss` → GPT-OSS

Whether `--variant` is omitted or provided, the bridge keeps its default model behavior and does not send old hard-coded model IDs.

Use `ask` when you want the final answer immediately, and `send` when you want to keep the returned `job_id` and inspect the conversation yourself.

Examples:

```bash
npx antigravity-ask ask "Summarize the current bridge architecture."
npx antigravity-ask send "Create a release summary"
```

## Advanced: Headless Chat Request Body

Use the bridge HTTP API directly only when you need lower-level integration. Omit `model` to let Antigravity choose its default model:

```bash
# Create headless conversation (returns job_id)
curl -X POST http://localhost:5820/conversations \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Summarize the current bridge architecture."
  }'

# Poll job status
curl http://localhost:5820/conversations/jobs/<job_id>
```

Notes:

- `POST /conversations` accepts `text` and an optional `model`
- when `model` is omitted, the server keeps its default model behavior
- model IDs use protobuf enum strings (e.g., `MODEL_GOOGLE_GEMINI_RIFTRUNNER`)
- `GET /conversations/jobs/:jobId` returns job status and `conversation_id` when completed

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

## README Pointer

The root README already points to this guide and to `skills/antigravity-ask/SKILL.md`.

## Non-Goals

This guide does not document future features or undocumented endpoints.

It only covers behavior that exists in the current repository.
