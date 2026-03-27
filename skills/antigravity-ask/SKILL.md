---
name: antigravity-ask
description: Use the Antigravity Ask Bridge to send prompts, inspect conversations, read artifacts, and run bridge actions.
allowed-tools: Bash, Read, Grep, Glob
---

# Antigravity Ask

## Install with `skills add`

Install from the published repository:

```bash
npx skills add ddarkr/antigravity-ask --skill antigravity-ask -a antigravity -y
```

For local development from this repo checkout:

```bash
npx skills add . --skill antigravity-ask -a antigravity -y
```

This skill helps an agent use the Antigravity Ask Bridge safely and predictably through `npx antigravity-ask`.

Use it when you want the fastest reliable path for:

- checking whether the bridge is available
- sending a one-shot prompt and waiting for the answer
- sending asynchronously and inspecting the conversation later
- reading artifact files created by a conversation
- running bridge actions like `start_new_chat` or `focus_chat`

## Core workflow

Follow this order unless you already know the bridge is reachable.

1. **Check connectivity first**
   - Run `npx antigravity-ask ping`
   - If it fails, stop and verify that the extension host is running and the bridge port is correct.

2. **Choose sync vs async flow**
   - Use `ask` when you want one final answer.
   - Use `send` when you want to inspect the conversation or artifacts yourself.

3. **Inspect outputs deliberately**
   - `ask` writes progress to stderr and the final answer to stdout.
   - `conversation`, `artifacts`, and `action` return JSON.
   - `artifact` returns raw file contents.

4. **Pick a model variant when you need one**
   - Use `--variant <name>` with `ask` or `send` for simple model selection.
   - Supported variants: `flash`, `pro`, `pro-low`, `sonnet`, `opus`, `gpt-oss`.

5. **Escalate to the HTTP API only when necessary**
   - If you need an arbitrary numeric `model` id or lower-level integration, use the bridge HTTP API instead of the CLI shortcut.

## Golden path

```bash
npx antigravity-ask ping
npx antigravity-ask ask "Summarize the current bridge architecture."
npx antigravity-ask --variant flash ask "Summarize the current bridge architecture."
```

## Async inspection flow

```bash
npx antigravity-ask send "Open a new chat and say hello"
# → returns { "success": true, "job_id": "xxx" }
# Poll status: GET /chat/:jobId (returns conversation_id when completed)
npx antigravity-ask conversation <conversation_id>
npx antigravity-ask artifacts
npx antigravity-ask artifact <conversation_id> output.md
```

## Model variants

Use these aliases with `ask` and `send`:

- `flash` → Gemini Flash
- `pro` → Gemini Pro high
- `pro-low` → Gemini Pro low
- `sonnet` → Claude Sonnet
- `opus` → Claude Opus
- `gpt-oss` → GPT-OSS

## URL overrides

If the bridge is not on the default port, the CLI resolves its base URL in this order:

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

## Practical rules

- Prefer `npx antigravity-ask` in user-facing and agent-facing examples so the flow works without global installation.
- Use `pnpm exec antigravity-ask` only when you are intentionally running from a local source checkout.
- Capture stdout and stderr separately when you automate `ask`.
- Use canonical action names from `packages/cli/src/contracts/bridge.ts`.
- Trust the CLI and server source over this skill if behavior ever differs.

## Deep dive

- Command reference: `references/commands.md`
- Common workflows: `references/workflows.md`
- Canonical source: `packages/cli/src/cli.ts`, `packages/cli/src/cli-config.ts`, `packages/cli/src/contracts/bridge.ts`, `packages/extension/src/server.ts`
