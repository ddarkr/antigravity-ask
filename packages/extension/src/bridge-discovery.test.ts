import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  BRIDGE_DISCOVERY_UNSUPPORTED_REASONS,
  BRIDGE_DISCOVERY_PROTOCOL_VERSION,
} from "antigravity-ask";
import {
  canonicalizeWorkspacePath,
  createBridgeDiscoveryState,
} from "./bridge-discovery";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("bridge-discovery", () => {
  it("marks windows without workspace folders as unsupported", () => {
    const state = createBridgeDiscoveryState({
      workspacePaths: [],
      httpPort: 6000,
      wsPort: 6001,
    });

    expect(state.discovery).toEqual({
      protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
      supported: false,
      instanceId: null,
      workspacePath: null,
      unsupportedReason: BRIDGE_DISCOVERY_UNSUPPORTED_REASONS.noWorkspace,
    });
    expect(state.registryRecord).toBeNull();
  });

  it("marks multi-root windows as unsupported", () => {
    const state = createBridgeDiscoveryState({
      workspacePaths: ["/a", "/b"],
      httpPort: 6000,
      wsPort: 6001,
    });

    expect(state.discovery).toEqual({
      protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
      supported: false,
      instanceId: null,
      workspacePath: null,
      unsupportedReason: BRIDGE_DISCOVERY_UNSUPPORTED_REASONS.multiRootWorkspace,
    });
    expect(state.registryRecord).toBeNull();
  });

  it("publishes and cleans up a single-folder registry record", () => {
    const registryDir = createTemporaryDirectory();
    const workspacePath = createTemporaryDirectory();
    const state = createBridgeDiscoveryState({
      workspacePaths: [workspacePath],
      httpPort: 6000,
      wsPort: 6001,
      registryDir,
      instanceId: "instance-1",
      pid: 321,
      startedAt: "2026-03-24T05:00:00.000Z",
    });

    expect(state.discovery).toEqual({
      protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
      supported: true,
      instanceId: "instance-1",
      workspacePath: canonicalizeWorkspacePath(workspacePath),
    });
    expect(state.registryRecord).toEqual({
      protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
      instanceId: "instance-1",
      workspacePath: canonicalizeWorkspacePath(workspacePath),
      baseUrl: "http://127.0.0.1:6000",
      httpPort: 6000,
      wsPort: 6001,
      pid: 321,
      startedAt: "2026-03-24T05:00:00.000Z",
    });

    state.publish();

    const registryFilePath = path.join(registryDir, "instance-1.json");
    expect(JSON.parse(fs.readFileSync(registryFilePath, "utf8"))).toEqual(state.registryRecord);

    state.dispose();
    expect(fs.existsSync(registryFilePath)).toBe(false);
  });
});

function createTemporaryDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-discovery-"));
  temporaryDirectories.push(directory);
  return directory;
}
