# Antigravity Ask Bridge - Agents Context

This document is a guide for other AI agents or future maintainers who need to continue working on the Antigravity Ask Bridge project and quickly understand its core context.

## 🚀 Project Overview

This project runs a Hono server (HTTP and WebSocket) inside Antigravity IDE so that **external CLIs or separate AI agents can remotely control the Antigravity IDE chat UI and read conversation contents**. The current implementation is split into a VS Code extension host (`packages/extension`) and a separate CLI package (`packages/cli`).

## Quick Entry Points for Agents

- First-run CLI usage: `README.md`
- Agent-friendly command guide: `docs/cli-for-agents.md`
- Canonical path and action names: `packages/cli/src/contracts/bridge.ts`

The current architecture has two layers:

1. **Native API Layer** — executes official VS Code commands through `vscode.commands.executeCommand`
2. **SDK-backed LS Layer** — creates and inspects headless conversations through `antigravity-sdk`'s `sdk.ls` and raw RPC

---

## 📂 Core Structure (Architecture)

This is a monorepo managed with `pnpm-workspace.yaml`, and the currently active packages are `packages/extension` and `packages/cli`.

- `packages/extension` — VS Code extension host. It owns the bridge server, SDK-backed bridge services, and artifact access.
- `packages/cli` — publishable CLI plus shared contracts/client package. It provides the `antigravity-ask` package and `antigravity-ask` executable.

### Source File Map

| File/Package | Role |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/extension/src/extension.ts` | VS Code extension entry point. Handles `activate` / `deactivate`, legacy file recovery, and server startup |
| `packages/extension/src/server.ts` | Defines the Hono-based HTTP server (port `5820`) and WebSocket server (port `5821`) and routes all REST APIs |
| `packages/extension/src/bridge-services.ts` | Implements SDK-backed conversation/action/monitoring services |
| `packages/extension/src/artifacts.ts` | Utility for reading conversation artifact files under `~/.gemini/antigravity/brain/` |
| `packages/cli/src/cli.ts` | Terminal CLI entry point in the form `antigravity-ask <command>` |
| `packages/cli/src/contracts/*` | Shared bridge API paths, actions, conversation response types, and helpers |
| `packages/cli/src/client/*` | Bridge HTTP client and `ask`/`send` polling utilities |

> ⚠️ Legacy files from the old DOM/JS injection architecture (`queue.ts`, `patcher.ts`, `selectors.ts`) have already been removed.
> They may still appear in old documentation or commits, but they are not part of the active runtime path.

---

## 🌐 HTTP API Endpoints (Port 5820)

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/ping` | Health check. Returns `{ status: "ok", mode: "native_api" }` |
| GET | `/lsstatus` | Check SDK LS connection status (port, csrf presence, etc.) |
| POST | `/conversations` | Create an SDK-backed headless conversation and send the initial prompt. Returns `job_id` for polling |
| GET | `/conversations/jobs/:jobId` | Poll job status and get `conversation_id` when completed |
| GET | `/conversations` | List all conversations and their states (SDK LS) |
| GET | `/conversations/:id` | Fetch the full trajectory for a specific conversation (SDK raw RPC) |
| POST | `/conversations/:id/focus` | Focus a specific conversation in the UI (SDK LS) |
| POST | `/conversations/:id/open` | Open a specific conversation in the UI |
| POST | `/action` | Run an action (`start_new_chat`, `focus_chat`, `allow`, `reject_step`, `terminal_run`) |
| GET | `/artifacts` | Return conversations under `~/.gemini/antigravity/brain/` |
| GET | `/artifacts/:convoId` | Return the contents of a specific artifact file (`?path=filename`) |
| GET | `/dump` | List `antigravity.*` VS Code commands (debugging) |
| GET | `/dump-ls` | Show SDK LS state + recent diagnostics logs (debugging) |
| GET | `/dump-diag-keys` | Explore the key structure of `getDiagnostics` responses (debugging) |
| GET | `/probe-csrf` | Probe results of specific `antigravity` command execution (debugging) |

---

## 🔌 SDK-backed LS Access

The bridge currently uses `antigravity-sdk` behind an internal wrapper instead of a custom `LSBridge` class.

The core implementation lives in `packages/extension/src/bridge-services.ts`, where `sdk.ls` and raw RPC are combined to provide the following features.

| Capability | Internal Path | Description |
| ---- | --------- | ---- |
| headless conversation create | `StartCascade` + `SendUserCascadeMessage` | Create a new conversation and send the first message |
| conversation readback | `GetCascadeTrajectory` | Fetch the full conversation trajectory (steps) |
| cascade list | `sdk.ls.listCascades()` | Fetch summaries of all conversations |
| focus | `sdk.ls.focusCascade()` | Focus a specific conversation |
| open | VS Code command bridge | Open a specific conversation in the UI |

Supported model IDs come from `antigravity-sdk`'s `Models`.

---

## 💻 CLI Usage

The CLI is built and distributed from `packages/cli`. During development, you can use `node packages/cli/dist/cli.js`, `pnpm exec antigravity-ask`, or `npx antigravity-ask`.

You can override the server address with the `AG_BRIDGE_URL` environment variable (default: `http://localhost:5820`).

```bash
npx antigravity-ask ask --variant <model> <text>   # create a headless conversation, wait for completion, print the result
npx antigravity-ask send --variant <model> <text>  # create a headless conversation asynchronously, return job_id
npx antigravity-ask ping                           # check server status
npx antigravity-ask action <type>                  # run an action (start_new_chat, focus_chat, allow, reject_step, terminal_run)
npx antigravity-ask artifacts                      # list conversation artifacts
npx antigravity-ask conversation <id>              # fetch a specific conversation
npx antigravity-ask artifact <id> <path>           # read a specific artifact file

# Aliases
npx antigravity-ask status                         # alias for ping
npx antigravity-ask new-chat                       # alias for action start_new_chat
npx antigravity-ask conversations                  # alias for artifacts
```

### How the `ask` and `send` commands work

1. Create a headless conversation through `POST /conversations` and receive a `job_id`
2. `ask` polls `GET /conversations/jobs/:jobId` until status is `completed`; `send` returns the `job_id` immediately
3. When completed, read `conversation_id` from the job status
4. Fetch the full conversation via `GET /conversations/:id` and extract the text response (stdout for the result, stderr for progress)

---

## 🛠️ Build and Run Guide

```bash
pnpm install

cd packages/cli
pnpm build   # build the CLI + shared client/contracts

cd ../extension
pnpm build   # build the VS Code extension host
pnpm watch   # rebuild automatically on file changes
```

- In VS Code, press `F5` to start the Extension Host and activate the extension
- On activation, the status bar shows `⚡ Bridge: Ready`
- The terminal prints `[Bridge] HTTP :5820 | WS :5821`

### Build scripts

- `packages/extension/src/extension.ts` → `packages/extension/dist/extension.js` (bundled, Node CJS, `vscode` externalized)
- `packages/cli/src/index.ts` → `packages/cli/dist/index.js` (TypeScript compile, shared exports)
- `packages/cli/src/cli.ts` → `packages/cli/dist/cli.js` (TypeScript compile, CLI entry)

---

## 🔧 Native API Commands (`antigravity.*`)

The bridge server uses the following `antigravity.*` namespace commands (the `BridgeCommands` constant):

| Constant | Command ID | Description |
| ------------------------ | ------------------------------------ | ---------------------------------- |
| `SEND_TEXT_TO_CHAT` | `antigravity.sendTextToChat` | Enter text into the chat input |
| `SEND_PROMPT_TO_AGENT` | `antigravity.sendPromptToAgentPanel` | Send a prompt directly to the agent panel |
| `ACCEPT_AGENT_STEP` | `antigravity.agent.acceptAgentStep` | Approve an agent action |
| `REJECT_AGENT_STEP` | `antigravity.agent.rejectAgentStep` | Reject an agent action |
| `TERMINAL_RUN` | `antigravity.terminalCommand.run` | Approve a terminal command run |
| `START_NEW_CONVERSATION` | `antigravity.startNewConversation` | Start a new conversation session |
| `FOCUS_AGENT_PANEL` | `antigravity.agentPanel.focus` | Focus the agent panel |
| `OPEN_AGENT_PANEL` | `antigravity.agentPanel.open` | Open the agent panel |

---

## 🚀 Release Process

> ⚠️ **CRITICAL**: GitHub Release 태그와 두 `package.json`의 version이 **반드시 일치**해야 CI가 통과합니다.

### Checklist

```
1. packages/extension/package.json → version 업데이트 (예: "0.2.5")
2. packages/cli/package.json → version 업데이트 (예: "0.2.5")
3. git commit -m "chore: bump release versions to X.Y.Z"
4. git push
5. git tag vX.Y.Z
6. git push origin vX.Y.Z
7. GitHub Release 생성 → CI 자동 실행 → npm / VS Marketplace / Open VSX 배포
```

### Why?

`release-extension.yml`는 릴리즈 태그(`v0.2.5`)와 `package.json` version(`0.2.5`)을 비교하여 불일치 시 **즉시 실패**합니다.
또한 CLI와 Extension이 lockstep으로 배포되므로 **둘 다** 버전을 올려야 합니다.

### Example

```bash
# 릴리즈 v0.2.5 예시
# 1. 버전 업데이트
sed -i '' 's/"version": "0.2.4"/"version": "0.2.5"/' packages/extension/package.json
sed -i '' 's/"version": "0.2.4"/"version": "0.2.5"/' packages/cli/package.json

# 2. 커밋
git add packages/extension/package.json packages/cli/package.json
git commit -m "chore: bump release versions to 0.2.5"

# 3. 푸시 + 태그
git push
git tag v0.2.5
git push origin v0.2.5

# 4. GitHub Release 생성 (또는 gh release create)
gh release create v0.2.5 --title "v0.2.5" --notes "..."
```

### Detailed docs

See `docs/release-automation.md` for full CI behavior, required secrets, and manual dry run commands.

---

## ⚠️ Legacy Code Warnings

### Corrupt error prevention (emergency recovery logic)

There is emergency recovery logic at the beginning of `activate` in `extension.ts`:

- If `workbench.desktop.main_orig.js` exists, restore the original file and delete it
- If `workbench_orig.html` exists, restore the original file and delete it

This logic is a leftover from the old era when `patcher.ts` injected JavaScript into `workbench.html`. **Never try to modify `workbench.html` or core JS files directly with `fs.writeFileSync`.** That causes Corrupt errors and the `[Unsupported]` badge.

### Legacy files (currently unused)

- `patcher.ts` — HTML patch / JS injection helper for `workbench.html`. No longer imported by `extension.ts`.
- `queue.ts` — Command queue from the DOM polling era (`BridgeState` class). Currently unused.
- `selectors.ts` — DOM selector constants (`SELECTORS`). Currently unused.
- `bridge-payload.js` / `bridge-payload.html` — Old payload files that were injected into the webview. Currently unused.
- Older pre-cutover conversation routes are removed and should not be treated as active APIs.
