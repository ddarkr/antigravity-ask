# Antigravity Bridge

Antigravity IDE 안에 브릿지 서버를 띄워서 외부 CLI나 다른 에이전트가 대화를 전송하고, 대화 상태를 조회하고, 아티팩트를 읽을 수 있게 해주는 프로젝트입니다.

## Packages

- `packages/extension` — VS Code extension host. Hono HTTP/WebSocket 서버, SDK-backed bridge services, artifact access를 담당합니다.
- `packages/cli` — publishable CLI package. 패키지명은 `antigravity-chat`, 실행 파일은 `antigravity-bridge`입니다.

## Development

```bash
pnpm install

pnpm --filter antigravity-chat build
pnpm --filter antigravity-bridge-extension build
```

VS Code에서 extension을 실행할 때는 `packages/extension`을 Extension Host로 띄우면 됩니다.

## CLI

CLI는 `packages/cli`에서 빌드됩니다. fresh clone 직후에는 `dist/`가 없으므로 아래 명령을 실행하기 전에 먼저 `pnpm --filter antigravity-chat build`를 실행해야 합니다.

```bash
pnpm --filter antigravity-chat build
pnpm exec antigravity-bridge --help
```

테스트용으로는 루트에서 바로 아래처럼 실행하면 됩니다.

```bash
pnpm exec antigravity-bridge ping
pnpm exec antigravity-bridge ask "hello"
```

기본 브릿지 주소는 `http://localhost:5820`이고, 필요하면 `AG_BRIDGE_URL`로 변경할 수 있습니다.

```bash
antigravity-bridge ask <text>
antigravity-bridge send <text>
antigravity-bridge ping
antigravity-bridge action <type>
antigravity-bridge artifacts
antigravity-bridge conversation <id>
antigravity-bridge artifact <id> <path>
```

## For AI Agents

If you want to drive Antigravity from a coding agent, start with `docs/cli-for-agents.md`.

Use `antigravity-bridge ping` to verify connectivity before calling `ask` or `send`.

## Verification

```bash
pnpm lint
pnpm test
pnpm build
```
