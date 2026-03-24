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
npx antigravity-ask ask "Summarize the current bridge architecture."
```

Use this when you only need the final answer and do not care about intermediate conversation state.

## Workflow 3: Drive a conversation asynchronously

```bash
npx antigravity-ask send "Open a new chat and say hello"
npx antigravity-ask conversation <conversation_id>
```

Use this when you want the raw conversation payload or need to inspect the trajectory yourself.

## Workflow 4: Read artifacts after a run

```bash
npx antigravity-ask artifacts
npx antigravity-ask artifact <conversation_id> output.md
```

Use this when the Antigravity run wrote useful output files and you need the raw contents.

## Workflow 5: Use the HTTP API for explicit model control

```bash
curl -X POST http://localhost:5820/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Summarize the current bridge architecture.",
    "model": <sdk model id>
  }'
```

Use the HTTP API instead of the CLI shortcut when you need lower-level control such as explicit `model` selection.

## Workflow 6: Trigger bridge actions

```bash
npx antigravity-ask action start_new_chat
npx antigravity-ask action focus_chat
npx antigravity-ask action allow
```

Use action commands when you need to manipulate the Antigravity UI or accept/reject bridge-controlled actions.
