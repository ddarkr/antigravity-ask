# Conversation API Migration Guide

This note documents the breaking HTTP API cutover from mixed conversation endpoints to a single canonical `/conversations` surface.

## Summary

The bridge no longer exposes conversation creation and inspection through the old endpoint mix:

- `POST /send`
- `POST /chat`
- `GET /chat/:jobId`
- `GET /conversation/:id`
- `GET /list-cascades`
- `POST /focus/:id`
- `POST /openchat/:id`

Use the new canonical routes instead:

- `POST /conversations`
- `GET /conversations/jobs/:jobId`
- `GET /conversations`
- `GET /conversations/:id`
- `POST /conversations/:id/focus`
- `POST /conversations/:id/open`

This is a full cutover. There are no compatibility aliases for the removed endpoints.

## Why this changed

The previous API surface mixed several representations for the same concept:

- `send` vs `chat`
- singular `conversation` reads vs `list-cascades`
- focus/open routes outside the conversation resource namespace

That made the API harder to reason about and left `ask` on a legacy code path that could not actually honor model selection.

The new design makes the HTTP contract match the domain:

- conversations are created under `/conversations`
- async creation state lives under `/conversations/jobs/:jobId`
- reads and actions on one conversation live under `/conversations/:id/...`

## Endpoint mapping

| Old | New |
| --- | --- |
| `POST /send` | `POST /conversations` |
| `POST /chat` | `POST /conversations` |
| `GET /chat/:jobId` | `GET /conversations/jobs/:jobId` |
| `GET /conversation/:id` | `GET /conversations/:id` |
| `GET /list-cascades` | `GET /conversations` |
| `POST /focus/:id` | `POST /conversations/:id/focus` |
| `POST /openchat/:id` | `POST /conversations/:id/open` |

## Request and response shapes

### Create a headless conversation

```http
POST /conversations
Content-Type: application/json

{
  "text": "Summarize the current bridge architecture.",
  "model": "MODEL_GOOGLE_GEMINI_RIFTRUNNER"
}
```

Response:

```json
{
  "success": true,
  "job_id": "..."
}
```

### Poll conversation creation status

```http
GET /conversations/jobs/:jobId
```

Response:

```json
{
  "id": "...",
  "status": "completed",
  "conversation_id": "...",
  "error": null,
  "created_at": "..."
}
```

### Read one conversation

```http
GET /conversations/:id
```

### List conversation status entries

```http
GET /conversations
```

### Focus or open a conversation in the UI

```http
POST /conversations/:id/focus
POST /conversations/:id/open
```

## CLI impact

The CLI command names stay the same:

- `antigravity-ask ask <text>`
- `antigravity-ask send <text>`
- `antigravity-ask conversation <id>`

What changed is the transport beneath them.

### `ask`

`ask` now creates a headless conversation through `POST /conversations`, polls `GET /conversations/jobs/:jobId`, then reads the final conversation from `GET /conversations/:id`.

This means `ask` now honors `--variant` for real.

### `send`

`send` also uses `POST /conversations`, but returns immediately with the `job_id` instead of waiting for completion.

## Before and after examples

### Old async flow

```bash
curl -X POST http://localhost:5820/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Summarize the current bridge architecture.",
    "model": "MODEL_GOOGLE_GEMINI_RIFTRUNNER"
  }'

curl http://localhost:5820/chat/<job_id>
```

### New async flow

```bash
curl -X POST http://localhost:5820/conversations \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Summarize the current bridge architecture.",
    "model": "MODEL_GOOGLE_GEMINI_RIFTRUNNER"
  }'

curl http://localhost:5820/conversations/jobs/<job_id>
```

## Required action for API clients

If you call the bridge HTTP API directly, update your client now:

1. Replace all removed conversation endpoints with the mapped `/conversations` routes.
2. If you were using `POST /send` for synchronous behavior, switch to:
   - `POST /conversations`
   - `GET /conversations/jobs/:jobId`
   - `GET /conversations/:id`
3. If you inspect cascade status, replace `GET /list-cascades` with `GET /conversations`.
4. If you control focus/open behavior from HTTP, move to `/conversations/:id/focus` and `/conversations/:id/open`.

## Required action for CLI users

No command rename is required.

Recommended updates:

- keep using `ask` when you want one final answer
- keep using `send` when you want `job_id`-driven async control
- use `--variant` with either command when model choice matters

## Compatibility note

This release is intentionally breaking at the HTTP layer. If you have scripts, bots, or external tools calling the removed endpoints, they must migrate before upgrading.
