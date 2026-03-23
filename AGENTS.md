# Antigravity Bridge - Agents Context

이 문서는 다른 AI 에이전트나 미래의 작업자가 Antigravity Bridge 프로젝트를 유지보수하거나 이어서 작업할 때, 프로젝트의 핵심 맥락(Context)을 파악할 수 있도록 작성된 가이드입니다.

## 🚀 프로젝트 개요

Antigravity IDE 내부에 Hono 서버(HTTP, WebSocket)를 띄워서, **외부 CLI나 별도의 AI 에이전트가 Antigravity IDE의 채팅창을 원격 조작하고 대화 내용을 읽어올 수 있도록 하는 브릿지(Bridge) 시스템**입니다. 현재는 VS Code 익스텐션 호스트(`packages/extension`)와 별도 CLI 패키지(`packages/cli`)로 분리되어 있습니다.

## Quick Entry Points for Agents

- First-run CLI usage: `README.md`
- Agent-friendly command guide: `docs/cli-for-agents.md`
- Canonical path and action names: `packages/cli/src/contracts/bridge.ts`

현재 아키텍처는 두 가지 레이어로 구성됩니다:

1. **Native API Layer** — `vscode.commands.executeCommand`를 통한 공식 VS Code 명령 실행
2. **SDK-backed LS Layer** — `antigravity-sdk`의 `sdk.ls`와 raw RPC를 통해 헤드리스 대화 생성/조회 수행

---

## 📂 핵심 구조 (Architecture)

모노레포 구조: `pnpm-workspace.yaml`로 관리되며 현재 활성 패키지는 `packages/extension`과 `packages/cli`입니다.

- `packages/extension` — VS Code 익스텐션 호스트. 브릿지 서버, SDK-backed bridge services, 아티팩트 접근을 담당합니다.
- `packages/cli` — publishable CLI 및 공유 contracts/client 패키지. `antigravity-chat` 패키지명과 `antigravity-bridge` 실행 파일을 제공합니다.

### 소스 파일 목록

| 파일/패키지                 | 역할                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `packages/extension/src/extension.ts` | VS Code 익스텐션 진입점. `activate` / `deactivate` 처리, 레거시 파일 복구, 서버 시작      |
| `packages/extension/src/server.ts`    | Hono 기반 HTTP 서버(포트 `5820`) + WebSocket 서버(포트 `5821`) 정의. 모든 REST API 라우팅 |
| `packages/extension/src/bridge-services.ts` | SDK-backed conversation/action/monitoring services와 legacy `/send` fallback 구현 |
| `packages/extension/src/artifacts.ts` | `~/.gemini/antigravity/brain/` 하위의 대화 아티팩트 파일을 읽는 유틸 함수                 |
| `packages/cli/src/cli.ts`             | 터미널에서 사용하는 CLI 엔트리. `antigravity-bridge <command>` 형태                         |
| `packages/cli/src/contracts/*`        | 브릿지 API 경로, 액션, 대화 응답 타입/헬퍼 등 공유 계약                                      |
| `packages/cli/src/client/*`           | 브릿지 HTTP 클라이언트와 `ask` polling 유틸리티                                              |

> ⚠️ DOM/JS 인젝션 아키텍처의 레거시 파일(`queue.ts`, `patcher.ts`, `selectors.ts`)은 이미 제거되었습니다.
> 과거 문서나 커밋에서는 등장할 수 있지만 현재 활성 런타임 경로에는 포함되지 않습니다.

---

## 🌐 HTTP API 엔드포인트 (포트 5820)

| Method | Path                  | 설명                                                                               |
| ------ | --------------------- | ---------------------------------------------------------------------------------- |
| GET    | `/ping`               | 헬스체크. `{ status: "ok", mode: "native_api" }` 반환                              |
| GET    | `/lsstatus`           | SDK LS 연결 상태 확인 (port, csrf 유무 등)                                         |
| POST   | `/send`               | 레거시 Native API fallback으로 새 대화 열고 프롬프트 전송                          |
| POST   | `/chat`               | SDK-backed headless Cascade 생성 및 메시지 전송. `conversation_id` 반환            |
| POST   | `/action`             | 액션 실행 (`start_new_chat`, `focus_chat`, `allow`, `reject_step`, `terminal_run`) |
| GET    | `/conversation/:id`   | 특정 대화(googleAgentId)의 전체 trajectory 조회 (SDK raw RPC)                      |
| GET    | `/list-cascades`      | 모든 Cascade 목록 및 상태 조회 (SDK LS)                                            |
| POST   | `/focus/:id`          | 특정 Cascade를 UI에서 포커스 (SDK LS)                                              |
| POST   | `/openchat/:id`       | VS Code 명령으로 특정 cascadeId 채팅 열기                                          |
| GET    | `/artifacts`          | `~/.gemini/antigravity/brain/` 하위 대화 목록 반환                                 |
| GET    | `/artifacts/:convoId` | 특정 대화의 아티팩트 파일 내용 반환 (`?path=파일명`)                               |
| GET    | `/dump`               | `antigravity.*` 관련 VS Code 명령어 목록 (디버깅용)                                |
| GET    | `/dump-ls`            | SDK LS 상태 + 최근 Diagnostics 로그 (디버깅용)                                     |
| GET    | `/dump-diag-keys`     | getDiagnostics 응답의 키 구조 탐색 (디버깅용)                                      |
| GET    | `/probe-csrf`         | 특정 antigravity 명령어 실행 결과 probe (디버깅용)                                 |

---

## 🔌 SDK-backed LS Access

현재 브릿지는 커스텀 `LSBridge` 클래스 대신 `antigravity-sdk`를 내부 wrapper 뒤에서 사용합니다.

핵심 구현은 `packages/extension/src/bridge-services.ts`에 있으며, 여기서 `sdk.ls`와 raw RPC를 조합해 다음 기능을 제공합니다.

| 기능 | 내부 경로 | 설명 |
| ---- | --------- | ---- |
| headless conversation create | `StartCascade` + `SendUserCascadeMessage` | 새 대화 생성 및 첫 메시지 전송 |
| conversation readback | `GetCascadeTrajectory` | 대화 전체 내용(steps) 조회 |
| cascade list | `sdk.ls.listCascades()` | 모든 대화 요약 목록 조회 |
| focus | `sdk.ls.focusCascade()` | 특정 대화 포커스 |

지원 모델 ID는 `antigravity-sdk`의 `Models`를 사용합니다.

---

## 💻 CLI 사용법

CLI는 `packages/cli` 패키지에서 빌드/배포됩니다. 개발 중에는 `node packages/cli/dist/cli.js` 또는 `antigravity-bridge` 명령어로 사용할 수 있습니다.

환경변수 `AG_BRIDGE_URL`로 서버 주소 변경 가능 (기본값: `http://localhost:5820`).

```
antigravity-bridge ask <text>           # headless prompt 전송 후 에이전트 응답 완료까지 대기, 결과 출력
antigravity-bridge send <text>          # headless prompt 전송 (비동기, conversation_id 반환)
antigravity-bridge ping                 # 서버 상태 확인
antigravity-bridge action <type>        # 액션 실행 (start_new_chat, focus_chat, allow, reject_step, terminal_run)
antigravity-bridge artifacts            # 대화 아티팩트 목록 조회
antigravity-bridge conversation <id>    # 특정 대화 내용 조회
antigravity-bridge artifact <id> <path> # 특정 아티팩트 파일 읽기

# Aliases
antigravity-bridge status               # ping 별칭
antigravity-bridge new-chat             # action start_new_chat 별칭
antigravity-bridge conversations        # artifacts 별칭
```

### `ask` 커맨드 동작 원리

1. `/chat`로 headless 프롬프트 전송 → `conversation_id` 획득
2. `/list-cascades` 폴링 (3초 간격) → `CASCADE_RUN_STATUS_IDLE` 대기
3. 마지막 step이 `USER_INPUT` 타입이 아닌 경우 완료로 판단
4. `/conversation/:id`로 전체 데이터 조회 후 텍스트 응답 추출 (stdout으로 출력, 진행상황은 stderr)

---

## 🛠️ 빌드 및 구동 가이드

```bash
pnpm install

cd packages/cli
pnpm build   # CLI + shared client/contracts 빌드

cd ../extension
pnpm build   # VS Code extension host 빌드
pnpm watch   # 파일 변경 감지 + 자동 빌드
```

- VS Code에서 `F5` → Extension Host 시작 → 확장 활성화
- 활성화 시 상태바에 `⚡ Bridge: Ready` 표시
- 터미널에 `[Bridge] HTTP :5820 | WS :5821` 로그 출력

### 빌드 스크립트

- `packages/extension/src/extension.ts` → `packages/extension/dist/extension.js` (번들, Node CJS, vscode 외부 처리)
- `packages/cli/src/index.ts` → `packages/cli/dist/index.js` (TS 컴파일, 공유 exports)
- `packages/cli/src/cli.ts` → `packages/cli/dist/cli.js` (TS 컴파일, CLI 엔트리)

---

## 🔧 Native API Commands (antigravity.\*)

브릿지 서버가 사용하는 `antigravity.*` 네임스페이스 명령어들 (`BridgeCommands` 상수):

| 상수명                   | 명령어 ID                            | 설명                               |
| ------------------------ | ------------------------------------ | ---------------------------------- |
| `SEND_TEXT_TO_CHAT`      | `antigravity.sendTextToChat`         | 채팅창에 텍스트 입력               |
| `SEND_PROMPT_TO_AGENT`   | `antigravity.sendPromptToAgentPanel` | 에이전트 패널에 프롬프트 직접 전송 |
| `ACCEPT_AGENT_STEP`      | `antigravity.agent.acceptAgentStep`  | 에이전트 액션 승인                 |
| `REJECT_AGENT_STEP`      | `antigravity.agent.rejectAgentStep`  | 에이전트 액션 거부                 |
| `TERMINAL_RUN`           | `antigravity.terminalCommand.run`    | 터미널 명령 실행 승인              |
| `START_NEW_CONVERSATION` | `antigravity.startNewConversation`   | 새 대화 세션 시작                  |
| `FOCUS_AGENT_PANEL`      | `antigravity.agentPanel.focus`       | 에이전트 패널 포커스               |
| `OPEN_AGENT_PANEL`       | `antigravity.agentPanel.open`        | 에이전트 패널 열기                 |

---

## ⚠️ 레거시 코드 관련 주의사항

### Corrupt 에러 방지 (긴급 복구 로직)

`extension.ts`의 `activate` 초입부에 긴급 복구 로직이 있습니다:

- `workbench.desktop.main_orig.js`가 존재하면 원본으로 복원 후 삭제
- `workbench_orig.html`이 존재하면 원본으로 복원 후 삭제

이 로직은 과거 `patcher.ts`가 `workbench.html`에 JS를 주입하던 시절의 잔재입니다. **절대로 `workbench.html`이나 Core JS 파일을 `fs.writeFileSync`로 직접 수정하려고 시도하지 마세요.** Corrupt 에러 및 `[Unsupported]` 배지가 발생합니다.

### 레거시 파일 (현재 미사용)

- `patcher.ts` — `workbench.html` HTML 패치 및 JS 인젝션 함수. 현재 `extension.ts`에서 임포트 안 함.
- `queue.ts` — DOM 폴링 시절의 커맨드 큐 (`BridgeState` 클래스). 현재 미사용.
- `selectors.ts` — DOM 셀렉터 상수 (`SELECTORS`). 현재 미사용.
- `bridge-payload.js` / `bridge-payload.html` — 과거 웹뷰에 주입하던 페이로드 파일. 현재 미사용.
- `/send` — 현재는 레거시 Native API fallback 경로로만 유지되며, CLI `ask`/`send`의 기본 경로는 `/chat`입니다.
