# Antigravity Ask Command Reference

Use these commands when driving the local bridge through the published CLI.

## Connectivity

```bash
npx antigravity-ask ping
npx antigravity-ask status # alias
```

- `ping` (or `status`) checks whether the bridge server is reachable.
- Returns JSON like `{ "status": "ok", "mode": "native_api" }`.

## One-shot prompt

```bash
npx antigravity-ask ask --variant flash "List the supported bridge actions."
```

- Use `ask` when you want one final answer from a headless conversation.
- `ask` creates the conversation via `POST /conversations`, then waits by polling `GET /conversations/jobs/:jobId`.
- **Progress** appears on stderr (e.g., "." characters during polling).
- **Final answer** appears on stdout when the agent finishes generating.
- `--variant` selects the model for the created headless conversation. Supported: `flash`, `pro`, `pro-low`, `sonnet`, `opus`, `gpt-oss`.

## Asynchronous prompt

```bash
npx antigravity-ask send --variant flash "Create a new conversation about release notes"
```

- Use `send` when you want to initiate a headless conversation without waiting for the CLI to finish.
- Returns `{ "success": true, "job_id": "xxx" }`.
- Poll job status via `GET /conversations/jobs/:jobId` to get `conversation_id` when completed.

## Conversation inspection

```bash
npx antigravity-ask conversation <id>
npx antigravity-ask chat <id> # alias
```

- Returns the full conversation payload (trajectory/steps) as JSON.
- Corresponds to `GET /conversations/:id`.

## Artifact inspection

```bash
npx antigravity-ask artifacts
npx antigravity-ask conversations # alias
npx antigravity-ask artifact <convoId> <path>
```

- `artifacts` (or `conversations`) lists known conversation/artifact entries under `~/.gemini/antigravity/brain/`.
- `artifact` reads one artifact file inside a specific conversation and prints raw contents.

## Actions

```bash
npx antigravity-ask action <type>
npx antigravity-ask new-chat # alias for 'action start_new_chat'
```

Usable action names for `npx antigravity-ask action`:

- `start_new_chat`: Clear current chat and start fresh.
- `focus_chat`: Focus the agent panel UI.
- `accept_step`: Approve the current pending agent step.
- `allow`: Convenience alias for `accept_step`.
- `reject_step`: Deny the current pending agent step.
- `terminal_run`: Approve a pending terminal command.

## Source checkout usage

If you are working inside this repository instead of using the published package:

```bash
npx antigravity-ask --help
```

For local development where you haven't linked the package yet:
```bash
node packages/cli/dist/cli.js --help
```

