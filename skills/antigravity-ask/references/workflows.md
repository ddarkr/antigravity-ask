# Antigravity Ask Workflows

## Workflow 1: Verify the bridge before doing anything else

```bash
npx antigravity-ask ping
```

If this fails:

- confirm the extension host is running
- confirm the bridge is enabled
- retry with `--url`, `--http-port`, or `AG_BRIDGE_URL`

## Workflow 2: Get one final answer

```bash
npx antigravity-ask ping
npx antigravity-ask ask --variant gemini-riftrunner "Summarize the current bridge architecture."
```

Use this when you need the final answer from a headless conversation and want the CLI to wait for completion.

## Workflow 3: Drive a conversation asynchronously

```bash
npx antigravity-ask send --variant gemini-riftrunner "Open a new chat and say hello"
# → returns { "success": true, "job_id": "xxx" }
# Poll job status: GET /conversations/jobs/:jobId
# When completed, get conversation_id and inspect:
npx antigravity-ask conversation <conversation_id>
```

Use this when you want the raw conversation payload or need to inspect the trajectory yourself.

## Workflow 4: Read artifacts after a run

```bash
npx antigravity-ask artifacts
npx antigravity-ask artifact <conversation_id> output.md
```

Use this when the Antigravity run wrote useful output files and you need the raw contents.

## Workflow 5: Use the HTTP API directly

```bash
# Create a headless conversation (returns job_id)
curl -X POST http://localhost:5820/conversations \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Summarize the current bridge architecture.",
    "model": "MODEL_GOOGLE_GEMINI_RIFTRUNNER"
  }'

# Poll job status
curl http://localhost:5820/conversations/jobs/<job_id>

# Inspect conversations
curl http://localhost:5820/conversations
curl http://localhost:5820/conversations/<conversation_id>
```

Use the HTTP API when you need direct integration with the canonical conversation endpoints.

## Workflow 6: Trigger bridge actions

```bash
npx antigravity-ask action start_new_chat
npx antigravity-ask action focus_chat
npx antigravity-ask action allow
```

Use action commands when you need to manipulate the Antigravity UI or accept/reject bridge-controlled actions.
