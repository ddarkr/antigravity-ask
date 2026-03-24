import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import {
  BRIDGE_DISCOVERY_UNSUPPORTED_REASONS,
  createSupportedDiscoveryMetadata,
  createUnsupportedDiscoveryMetadata,
  type BridgeDiscoveryMetadata,
  type BridgeRegistryRecord,
} from "antigravity-ask";

const BRIDGE_REGISTRY_DIR = path.join(
  os.homedir(),
  ".gemini",
  "antigravity",
  "bridge",
  "registry",
);

export interface BridgeDiscoveryState {
  discovery: BridgeDiscoveryMetadata;
  registryRecord: BridgeRegistryRecord | null;
  publish: () => void;
  dispose: () => void;
}

export interface CreateBridgeDiscoveryStateOptions {
  workspacePaths: readonly string[];
  httpPort: number;
  wsPort: number;
  pid?: number;
  registryDir?: string;
  instanceId?: string;
  startedAt?: string;
}

export function createBridgeDiscoveryState(
  options: CreateBridgeDiscoveryStateOptions,
): BridgeDiscoveryState {
  const registryDir = options.registryDir ?? BRIDGE_REGISTRY_DIR;
  const discoveredWorkspacePath = getSingleFolderWorkspacePath(options.workspacePaths);

  if (!discoveredWorkspacePath) {
    return {
      discovery: options.workspacePaths.length === 0
        ? createUnsupportedDiscoveryMetadata(BRIDGE_DISCOVERY_UNSUPPORTED_REASONS.noWorkspace)
        : createUnsupportedDiscoveryMetadata(BRIDGE_DISCOVERY_UNSUPPORTED_REASONS.multiRootWorkspace),
      registryRecord: null,
      publish: () => {},
      dispose: () => {},
    };
  }

  const instanceId = options.instanceId ?? randomUUID();
  const registryRecord: BridgeRegistryRecord = {
    protocolVersion: 1,
    instanceId,
    workspacePath: discoveredWorkspacePath,
    baseUrl: `http://127.0.0.1:${options.httpPort}`,
    httpPort: options.httpPort,
    wsPort: options.wsPort,
    pid: options.pid ?? process.pid,
    startedAt: options.startedAt ?? new Date().toISOString(),
  };
  const registryFilePath = path.join(registryDir, `${instanceId}.json`);

  return {
    discovery: createSupportedDiscoveryMetadata({
      instanceId,
      workspacePath: discoveredWorkspacePath,
    }),
    registryRecord,
    publish: () => publishBridgeRegistryRecord(registryFilePath, registryRecord),
    dispose: () => removeBridgeRegistryRecord(registryFilePath),
  };
}

export function getBridgeRegistryDir(): string {
  return BRIDGE_REGISTRY_DIR;
}

export function canonicalizeWorkspacePath(workspacePath: string): string {
  try {
    return fs.realpathSync.native(workspacePath);
  } catch {
    return path.resolve(workspacePath);
  }
}

function getSingleFolderWorkspacePath(workspacePaths: readonly string[]): string | null {
  if (workspacePaths.length !== 1) {
    return null;
  }

  return canonicalizeWorkspacePath(workspacePaths[0]);
}

function publishBridgeRegistryRecord(
  registryFilePath: string,
  record: BridgeRegistryRecord,
): void {
  fs.mkdirSync(path.dirname(registryFilePath), { recursive: true });
  const temporaryPath = `${registryFilePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(record, null, 2));
  fs.renameSync(temporaryPath, registryFilePath);
}

function removeBridgeRegistryRecord(registryFilePath: string): void {
  if (!fs.existsSync(registryFilePath)) {
    return;
  }

  try {
    fs.unlinkSync(registryFilePath);
  } catch {
  }
}
