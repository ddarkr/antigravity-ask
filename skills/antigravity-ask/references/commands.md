# Antigravity Ask Command Reference

Use these commands when driving the local bridge through the published CLI.

## Connectivity

```bash
npx antigravity-ask ping
npx antigravity-ask status
```

- `ping` checks whether the bridge server is reachable.
- `status` is the legacy alias for `ping`.

## One-shot prompt

```bash
npx antigravity-ask ask --variant gemini-riftrunner "List the supported bridge actions."
```

- Use `ask` when you want one final answer from a headless conversation.
- `ask` creates the conversation via `POST /conversations`, then waits by polling `GET /conversations/jobs/:jobId`.
- Progress appears on stderr.
- The extracted final answer appears on stdout when available.
- `--variant` selects the model for the created headless conversation.

## Asynchronous prompt

```bash
npx antigravity-ask send --variant gemini-riftrunner "Create a new conversation about release notes"
```

- Use `send` when you want the same headless conversation creation flow without waiting for completion.
- Returns `{ "success": true, "job_id": "xxx" }`
- Poll job status via `GET /conversations/jobs/:jobId` to get `conversation_id` when completed.
- `--variant` is supported here too.

## Conversation inspection

```bash
npx antigravity-ask conversation <conversation_id>
```

- Returns the full conversation payload as JSON.
- The corresponding HTTP reads are `GET /conversations` and `GET /conversations/:id`.

## Artifact inspection

```bash
npx antigravity-ask artifacts
npx antigravity-ask artifact <conversation_id> output.md
```

- `artifacts` lists known conversation/artifact entries.
- `artifact` reads one artifact file and prints raw contents.

## Actions

```bash
npx antigravity-ask action start_new_chat
npx antigravity-ask action focus_chat
npx antigravity-ask action allow
npx antigravity-ask action reject_step
npx antigravity-ask action terminal_run
```

Usable action names for `npx antigravity-ask action`:

- `start_new_chat`
- `focus_chat`
- `accept_step`
- `allow`
- `reject_step`
- `terminal_run`

`switch_chat` exists in the shared contract, but the current `/action` server route does not accept it.

Legacy alias:

```bash
npx antigravity-ask new-chat
```

## Source checkout usage

If you are working inside this repository instead of using the published package:

```bash
pnpm --filter antigravity-ask build
pnpm exec antigravity-ask --help
```

Use `pnpm exec` for local development. Use `npx antigravity-ask` for user-facing examples.
