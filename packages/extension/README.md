# Antigravity Ask Bridge

Antigravity Ask Bridge starts a local HTTP and WebSocket bridge inside the Antigravity extension host so external CLIs and coding agents can drive the Antigravity chat UI, inspect conversations, and read saved artifacts.

## What it does

- Starts a local HTTP server on a configured bridge port.
- Starts a local WebSocket server on a configured bridge port.
- Exposes REST endpoints for sending prompts, running chat actions, reading conversations, and reading artifacts.
- Uses Antigravity native commands when possible and uses `antigravity-sdk` LS access for headless conversation flows.

## Requirements

- Antigravity-enabled VS Code or Antigravity IDE.
- VS Code `1.85.0` or newer.
- Access to the built-in Antigravity command set and language-server bridge used by the host environment.

## Installation

Install the extension from Visual Studio Marketplace or Open VSX, then reload the window if the host does not activate the extension automatically.

## Recommended usage

For most users, the recommended way to interact with the bridge is through the published `antigravity-ask` CLI rather than calling the HTTP API directly.

```bash
antigravity-ask ping
antigravity-ask ask "Summarize the current bridge architecture."
```

Use the raw HTTP endpoints when you need direct integration or custom automation beyond what the CLI already provides.

## Default behavior

The bridge activates on startup and, when enabled, starts listening on the configured HTTP and WebSocket ports.

In the preferred workspace, the default ports are typically:

- HTTP: `127.0.0.1:5820`
- WebSocket: `127.0.0.1:5821`

In other workspaces, the extension may derive different default ports unless you explicitly override them in settings.

You can verify the bridge with:

```bash
curl http://127.0.0.1:5820/ping
```

If you changed the configured bridge port, replace `5820` with your active HTTP port.

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

For a structured API reference, see <https://github.com/ddarkr/antigravity-ask/blob/main/docs/extension-api.openapi.yaml>.

The OpenAPI document covers the HTTP bridge surface and distinguishes the diagnostics/debug endpoints from the main automation endpoints.

## Security and scope

This extension is intended for local development and agent automation inside an Antigravity-enabled environment. The bridge exposes local control endpoints, so you should only run it on machines and profiles you trust.

## Packaging notes

This package contains the VS Code extension only. The companion CLI package is published separately as `antigravity-ask` and installs the `antigravity-ask` executable.
