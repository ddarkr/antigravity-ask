---
name: Antigravity Ask
description: Use this skill when you need to drive Antigravity through the local bridge, send prompts from another agent, inspect conversations, read artifacts, or trigger bridge actions. Triggers include: "use Antigravity from this agent", "send this prompt to Antigravity", "inspect the bridge conversation", "read the artifact output", "check whether the bridge is alive", and "drive Antigravity through npx antigravity-ask".
allowed-tools: Bash, Read, Grep, Glob
---

# Antigravity Ask

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

4. **Escalate to the HTTP API only when necessary**
   - If you need explicit `model` control or lower-level integration, use the bridge HTTP API instead of the CLI shortcut.

## Golden path

```bash
npx antigravity-ask ping
npx antigravity-ask ask "Summarize the current bridge architecture."
```

## Async inspection flow

```bash
npx antigravity-ask send "Open a new chat and say hello"
npx antigravity-ask conversation <conversation_id>
npx antigravity-ask artifacts
npx antigravity-ask artifact <conversation_id> output.md
```

## URL overrides

If the bridge is not on the default port, the CLI resolves its base URL in this order:

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
