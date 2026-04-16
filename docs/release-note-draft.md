# GitHub Release Body Draft

## Highlights

- Canonicalized the bridge conversation API under `/conversations`
- Removed legacy conversation endpoints instead of keeping compatibility aliases
- `antigravity-ask ask` now uses the headless conversation API
- `--variant` now works for both `ask` and `send`
- Updated OpenAPI, README, agent docs, and reusable skill docs to match the new API

## Breaking changes

Removed endpoints:

- `POST /send`
- `POST /chat`
- `GET /chat/:jobId`
- `GET /conversation/:id`
- `GET /list-cascades`
- `POST /focus/:id`
- `POST /openchat/:id`

New canonical endpoints:

- `POST /conversations`
- `GET /conversations/jobs/:jobId`
- `GET /conversations`
- `GET /conversations/:id`
- `POST /conversations/:id/focus`
- `POST /conversations/:id/open`

There are no compatibility shims for the removed conversation endpoints.

## CLI changes

`antigravity-ask` command names are unchanged, but the transport beneath them is now unified:

- `ask` creates a headless conversation, polls the job endpoint, and reads the final conversation
- `send` creates the same headless conversation type and returns `job_id`
- `--variant` now works for both `ask` and `send`

## Migration

If you call the bridge HTTP API directly, migrate to the `/conversations` surface before upgrading.

If you use the CLI only, your command names stay the same. The main behavior change is that `ask` now honors explicit model selection.

See `docs/conversation-api-migration.md` for the full migration guide.
