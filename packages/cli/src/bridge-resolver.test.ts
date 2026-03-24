import { describe, expect, it, vi } from "vitest";
import {
  BRIDGE_DISCOVERY_PROTOCOL_VERSION,
  type BridgeDiscoveryStatus,
  type BridgeRegistryRecord,
} from "./contracts/discovery";
import { resolveBridgeBaseUrl } from "./bridge-resolver";

describe("bridge-resolver", () => {
  it("uses an explicit base url without discovery", async () => {
    const launchWorkspace = vi.fn();

    const result = await resolveBridgeBaseUrl({
      cwd: "/workspace/project",
      explicitBaseUrl: "http://127.0.0.1:7000",
      dependencies: {
        launchWorkspace,
      },
    });

    expect(result).toEqual({
      baseUrl: "http://127.0.0.1:7000",
      launchedWorkspace: false,
      workspacePath: "/workspace/project",
    });
    expect(launchWorkspace).not.toHaveBeenCalled();
  });

  it("uses one healthy existing bridge without launching", async () => {
    const record = createRecord("instance-1", "/workspace/project", "http://127.0.0.1:6010");
    const launchWorkspace = vi.fn();

    const result = await resolveBridgeBaseUrl({
      cwd: "/workspace/project",
      dependencies: {
        readRegistryRecords: () => [record],
        pingBridge: async () => ({
          status: "ok",
          mode: "native_api",
          discovery: {
            protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
            supported: true,
            instanceId: record.instanceId,
            workspacePath: record.workspacePath,
          },
        }),
        getBridgeStatus: async () => createReadyStatus(record.workspacePath, record.instanceId),
        launchWorkspace,
        sleep: async () => {},
      },
    });

    expect(result.baseUrl).toBe(record.baseUrl);
    expect(result.launchedWorkspace).toBe(false);
    expect(launchWorkspace).not.toHaveBeenCalled();
  });

  it("launches the workspace when no healthy bridge exists yet", async () => {
    const record = createRecord("instance-2", "/workspace/project", "http://127.0.0.1:6011");
    let registryVisible = false;
    const launchWorkspace = vi.fn(async () => {
      registryVisible = true;
    });

    const result = await resolveBridgeBaseUrl({
      cwd: "/workspace/project",
      pollIntervalMs: 1,
      dependencies: {
        readRegistryRecords: () => (registryVisible ? [record] : []),
        pingBridge: async () => ({
          status: "ok",
          mode: "native_api",
          discovery: {
            protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
            supported: true,
            instanceId: record.instanceId,
            workspacePath: record.workspacePath,
          },
        }),
        getBridgeStatus: async () => createReadyStatus(record.workspacePath, record.instanceId),
        launchWorkspace,
        sleep: async () => {},
      },
    });

    expect(launchWorkspace).toHaveBeenCalledOnce();
    expect(result).toEqual({
      baseUrl: record.baseUrl,
      launchedWorkspace: true,
      workspacePath: "/workspace/project",
    });
  });

  it("rejects same-folder multi-window ambiguity", async () => {
    const first = createRecord("instance-1", "/workspace/project", "http://127.0.0.1:6010");
    const second = createRecord("instance-2", "/workspace/project", "http://127.0.0.1:6011");

    await expect(resolveBridgeBaseUrl({
      cwd: "/workspace/project",
      dependencies: {
        readRegistryRecords: () => [first, second],
        pingBridge: async (baseUrl) => ({
          status: "ok",
          mode: "native_api",
          discovery: {
            protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
            supported: true,
            instanceId: baseUrl.endsWith("6010") ? first.instanceId : second.instanceId,
            workspacePath: "/workspace/project",
          },
        }),
        getBridgeStatus: async () => createReadyStatus("/workspace/project", first.instanceId),
        launchWorkspace: async () => {},
        sleep: async () => {},
      },
    })).rejects.toThrow("multiple Antigravity bridge windows are open");
  });

  it("ignores stale registry entries whose ping handshake does not match", async () => {
    const stale = createRecord("instance-stale", "/workspace/project", "http://127.0.0.1:6010");
    const healthy = createRecord("instance-healthy", "/workspace/project", "http://127.0.0.1:6011");

    const result = await resolveBridgeBaseUrl({
      cwd: "/workspace/project",
      dependencies: {
        readRegistryRecords: () => [stale, healthy],
        pingBridge: async (baseUrl) => {
          if (baseUrl.endsWith("6010")) {
            return null;
          }

          return {
            status: "ok",
            mode: "native_api",
            discovery: {
              protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
              supported: true,
              instanceId: healthy.instanceId,
              workspacePath: healthy.workspacePath,
            },
          };
        },
        getBridgeStatus: async () => createReadyStatus(healthy.workspacePath, healthy.instanceId),
        launchWorkspace: async () => {},
        sleep: async () => {},
      },
    });

    expect(result.baseUrl).toBe(healthy.baseUrl);
    expect(result.launchedWorkspace).toBe(false);
  });
});

function createRecord(instanceId: string, workspacePath: string, baseUrl: string): BridgeRegistryRecord {
  return {
    protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
    instanceId,
    workspacePath,
    baseUrl,
    httpPort: Number(baseUrl.split(":").at(-1)),
    wsPort: Number(baseUrl.split(":").at(-1)) + 1,
    pid: 123,
    startedAt: "2026-03-24T05:00:00.000Z",
  };
}

function createReadyStatus(workspacePath: string, instanceId: string): BridgeDiscoveryStatus {
  return {
    initialized: true,
    ready: true,
    port: 6100,
    hasCsrfToken: true,
    discovery: {
      protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
      supported: true,
      instanceId,
      workspacePath,
    },
  };
}
