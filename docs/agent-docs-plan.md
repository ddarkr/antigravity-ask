# Agent-Friendly CLI Documentation Plan

## Goal

Make `antigravity-bridge` easy for coding agents to discover, trust, and use without reading the full codebase.

## Current State

- Human-readable usage exists in `README.md`.
- Deep project context exists in `AGENTS.md`.
- Runtime command behavior lives in `packages/cli/src/cli.ts`.
- Shared request paths and action names live in `packages/cli/src/contracts/bridge.ts`.
- Base URL precedence lives in `packages/cli/src/cli-config.ts`.

The information is accurate, but it is split across multiple files. A coding agent can piece it together, but there is no single short document that answers:

1. What do I run first?
2. Which commands are stable?
3. What goes to stdout vs stderr?
4. How do I override the bridge URL?
5. What failures should I expect?

## Recommended Documentation Structure

### 1. `README.md`

Add a short `For AI agents` section near the CLI section.

It should include:

- the shortest working flow
- the bridge prerequisite
- the base URL override rules
- a link to the dedicated agent guide

Recommended scope for README:

- one-screen quickstart
- one `ask` example
- one `ping` example
- one link to deeper docs

### 2. `docs/cli-for-agents.md`

Create a dedicated guide for coding agents.

It should be optimized for:

- Codex
- Claude Code
- Gemini CLI
- OpenCode and similar terminal agents

It should document:

- required runtime assumptions
- command syntax
- output behavior
- action names
- URL precedence
- common failure modes
- safe calling patterns

### 3. `AGENTS.md`

Keep `AGENTS.md` as the deep project context file, but add a short section near the top pointing agents to:

- `README.md` for first-run usage
- `docs/cli-for-agents.md` for command contracts
- `packages/cli/src/contracts/bridge.ts` for canonical action and path names

This keeps `AGENTS.md` useful without forcing it to serve as the primary quickstart.

### 4. Optional future additions

If agent usage grows, consider adding:

- `docs/cli-manifest.json` for machine-readable command metadata
- `antigravity-bridge --help --json`
- `skills/antigravity-bridge/SKILL.md` for tool-specific agent integration

These are not required for the first rollout.

## Proposed Rollout

### Phase 1: Drafts

- add `docs/cli-for-agents.md`
- add this planning document
- keep all content aligned with the current implementation only
- document stdout and stderr behavior for each command
- document all supported `action` names from shared contracts
- document the most common failure modes and recovery steps

### Phase 2: Entry-point updates

- add `For AI agents` to `README.md`
- add a short pointer section to `AGENTS.md`

### Phase 3: Contract hardening

- tighten wording around automation-facing output contracts
- reduce ambiguity between human-readable output and machine-parseable output
- add stronger cross-links to canonical source files when behavior is unstable

### Phase 4: Machine-readable affordances

- add a generated or maintained JSON manifest
- optionally add JSON help output

## Content Rules

When updating agent-facing docs:

- prefer English for maximum tool compatibility
- use copy-pasteable shell examples
- document only commands that exist today
- separate current behavior from future recommendations
- always point to the canonical source file for unstable details

## Acceptance Criteria

The first rollout is good enough if an unfamiliar coding agent can do the following after reading only `README.md` and `docs/cli-for-agents.md`:

1. confirm the bridge is reachable
2. send a prompt
3. wait for output correctly
4. inspect a conversation by id
5. override the bridge URL when needed
6. recover from the most common setup errors
