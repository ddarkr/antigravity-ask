# Antigravity Ask Bridge

Antigravity Ask Bridge starts a local HTTP and WebSocket bridge inside the Antigravity extension host so external CLIs and coding agents can drive the Antigravity chat UI, inspect conversations, and read saved artifacts.

## What it does

- Starts a local HTTP server on port `5820` by default.
- Starts a local WebSocket server on port `5821` by default.
- Exposes REST endpoints for sending prompts, running chat actions, reading conversations, and reading artifacts.
- Uses Antigravity native commands when possible and uses `antigravity-sdk` LS access for headless conversation flows.

## Requirements

- Antigravity-enabled VS Code or Antigravity IDE.
- VS Code `1.85.0` or newer.
- Access to the built-in Antigravity command set and language-server bridge used by the host environment.

## Installation

Install the extension from Visual Studio Marketplace or Open VSX, then reload the window if the host does not activate the extension automatically.

## Default behavior

The bridge activates on startup and, when enabled, immediately starts listening on:

- HTTP: `127.0.0.1:5820`
- WebSocket: `127.0.0.1:5821`

You can verify the bridge with:

```bash
curl http://127.0.0.1:5820/ping
```

Expected response:

```json
{"status":"ok","mode":"native_api"}
```

## Commands

- `Antigravity Ask Bridge: Show Server Status`
- `Antigravity Ask Bridge: Show Bridge Settings Info`

## Settings

- `antigravity-bridge.enabled`: Enable or disable the bridge on activation.
- `antigravity-bridge.httpPort`: HTTP port for the local bridge server.
- `antigravity-bridge.wsPort`: WebSocket port for the local bridge server.

Changes to these settings apply after reloading the window.

## API highlights

The local bridge exposes endpoints including:

- `GET /ping`
- `GET /lsstatus`
- `POST /send`
- `POST /chat`
- `POST /action`
- `GET /conversation/:id`
- `GET /list-cascades`
- `GET /artifacts`

## Security and scope

This extension is intended for local development and agent automation inside an Antigravity-enabled environment. The bridge exposes local control endpoints, so you should only run it on machines and profiles you trust.

## Packaging notes

This package contains the VS Code extension only. The companion CLI package is published separately as `antigravity-ask` and installs the `antigravity-ask` executable.
