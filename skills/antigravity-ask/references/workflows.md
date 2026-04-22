# Antigravity Ask Workflows

## Workflow 1: Verify the bridge before doing anything else

Always start with a connectivity check to avoid wasted time on broken links.

```bash
npx antigravity-ask ping
```

If this fails:
- Confirm the VS Code Extension Host is running.
- Confirm the Bridge server started correctly (check VS Code status bar for "⚡ Bridge: Ready").
- Retry with `--url` or `--http-port` if you've customized the startup.

## Workflow 2: Get a complete answer synchronously

Use this when you want to block until the task is done and just get the text result.

```bash
npx antigravity-ask ask --variant flash "Analyze the current error logs and suggest a fix."
```

- **Stderr**: Shows real-time polling status.
- **Stdout**: Contains only the agent's final text response.

## Workflow 3: Trigger a task and monitor progress

Use this for long-running tasks where you want to inspect the intermediate steps or multiple output artifacts.

```bash
# 1. Start the task
npx antigravity-ask send --variant pro "Refactor the authentication module"
# → returns { "success": true, "job_id": "JOB_123" }

# 2. Monitor job status (e.g., via curl or custom script)
# GET /conversations/jobs/JOB_123

# 3. Once completed, inspect the full trajectory
npx antigravity-ask conversation <convo_id>
```

## Workflow 4: Extract results from artifacts

If the agent's task involves creating files or reports (artifacts), use the artifact commands to read them back.

```bash
# List all conversations and their artifact counts
npx antigravity-ask artifacts

# Read a specific output file
npx antigravity-ask artifact <convo_id> plan.md
```

## Workflow 5: Control the IDE Chat UI

Use the `action` commands to manipulate the active chat session in VS Code.

```bash
# Fresh start
npx antigravity-ask new-chat

# Focus the panel for the user
npx antigravity-ask action focus_chat

# Automate multi-step confirmations
npx antigravity-ask action allow
```

## Workflow 6: Low-level HTTP Integration

If the CLI doesn't support a specific endpoint yet, use `curl` against the bridge port.

```bash
# List all active models
curl http://localhost:5820/models

# Fetch recent diagnostics
curl http://localhost:5820/dump-ls
```

