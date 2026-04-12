import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  BRIDGE_DISCOVERY_PROTOCOL_VERSION,
  type BridgeDiscoveryMetadata,
  type BridgeDiscoveryStatus,
  type BridgeRegistryRecord,
} from "./contracts/discovery";
import { openWorkspaceInAntigravity } from "./vscode-launch";

const DEFAULT_REGISTRY_DIR = path.join(
  os.homedir(),
  ".gemini",
  "antigravity",
  "bridge",
  "registry",
);

interface BridgePingResponse {
  status?: string;
  mode?: string;
  discovery?: BridgeDiscoveryMetadata;
}

interface ResolverDependencies {
  readRegistryRecords: (registryDir: string) => BridgeRegistryRecord[];
  pingBridge: (baseUrl: string) => Promise<BridgePingResponse | null>;
  getBridgeStatus: (baseUrl: string) => Promise<BridgeDiscoveryStatus | null>;
  launchWorkspace: (workspacePath: string) => Promise<void>;
  sleep: (milliseconds: number) => Promise<void>;
}

export interface ResolveBridgeBaseUrlOptions {
  cwd: string;
  explicitBaseUrl?: string;
  registryDir?: string;
  launchTimeoutMs?: number;
  readyTimeoutMs?: number;
  pollIntervalMs?: number;
  onStatus?: (message: string) => void;
  dependencies?: Partial<ResolverDependencies>;
}

export interface ResolvedBridgeTarget {
  baseUrl: string;
  launchedWorkspace: boolean;
  workspacePath: string;
}

export async function resolveBridgeBaseUrl(
  options: ResolveBridgeBaseUrlOptions,
): Promise<ResolvedBridgeTarget> {
  const workspacePath = canonicalizeWorkspacePath(options.cwd);
  async function pingBridge(baseUrl: string): Promise<BridgePingResponse | null> {
  try {
    const response = await fetch(`${baseUrl}/ping`);
    if (!response.ok) {
      return null;
    }
    return response.json() as Promise<BridgePingResponse>;
  } catch {
    return null;
  }
}

async function getBridgeStatus(baseUrl: string): Promise<BridgeDiscoveryStatus | null> {
  try {
    const response = await fetch(`${baseUrl}/lsstatus`);
    if (!response.ok) {
      return null;
    }
    return response.json() as Promise<BridgeDiscoveryStatus>;
  } catch {
    return null;
  }
}

if (options.explicitBaseUrl) {
    return {
      baseUrl: options.explicitBaseUrl,
      launchedWorkspace: false,
      workspacePath,
    };
  }

  const registryDir = options.registryDir ?? DEFAULT_REGISTRY_DIR;
  const pollIntervalMs = options.pollIntervalMs ?? 1000;
  const launchTimeoutMs = options.launchTimeoutMs ?? 30000;
  const readyTimeoutMs = options.readyTimeoutMs ?? 30000;
  const dependencies = createResolverDependencies(options.dependencies);

  const existingCandidate = await resolveHealthyCandidate(workspacePath, registryDir, dependencies);
  if (existingCandidate) {
    options.onStatus?.(`Using existing bridge for ${workspacePath}`);
    await waitForReadyStatus(existingCandidate.baseUrl, workspacePath, readyTimeoutMs, pollIntervalMs, dependencies, options.onStatus);
    return {
      baseUrl: existingCandidate.baseUrl,
      launchedWorkspace: false,
      workspacePath,
    };
  }

  options.onStatus?.(`Opening workspace for ${workspacePath}`);
  await dependencies.launchWorkspace(workspacePath);
  const launchedCandidate = await waitForHealthyCandidate(
    workspacePath,
    registryDir,
    launchTimeoutMs,
    pollIntervalMs,
    dependencies,
    options.onStatus,
  );
  await waitForReadyStatus(launchedCandidate.baseUrl, workspacePath, readyTimeoutMs, pollIntervalMs, dependencies, options.onStatus);

  return {
    baseUrl: launchedCandidate.baseUrl,
    launchedWorkspace: true,
    workspacePath,
  };
}

function createResolverDependencies(
  overrides: Partial<ResolverDependencies> | undefined,
): ResolverDependencies {
  return {
    readRegistryRecords: overrides?.readRegistryRecords ?? readRegistryRecords,
    pingBridge: overrides?.pingBridge ?? pingBridge,
    getBridgeStatus: overrides?.getBridgeStatus ?? getBridgeStatus,
    launchWorkspace: overrides?.launchWorkspace ?? openWorkspaceInAntigravity,
    sleep: overrides?.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))),
  };
}

function canonicalizeWorkspacePath(workspacePath: string): string {
  try {
    return fs.realpathSync.native(workspacePath);
  } catch {
    return path.resolve(workspacePath);
  }
}

async function resolveHealthyCandidate(
  workspacePath: string,
  registryDir: string,
  dependencies: ResolverDependencies,
): Promise<BridgeRegistryRecord | null> {
  const matchingRecords = dependencies.readRegistryRecords(registryDir)
    .filter((record) => record.protocolVersion === BRIDGE_DISCOVERY_PROTOCOL_VERSION)
    .filter((record) => canonicalizeWorkspacePath(record.workspacePath) === workspacePath);

  const healthyRecords: BridgeRegistryRecord[] = [];
  for (const record of matchingRecords) {
    const ping = await dependencies.pingBridge(record.baseUrl);
    if (!isMatchingDiscovery(ping?.discovery, record, workspacePath)) {
      continue;
    }
    healthyRecords.push(record);
  }

  if (healthyRecords.length > 1) {
    throw new Error(`Unsupported: multiple Antigravity bridge windows are open for ${workspacePath}. Close duplicate windows or use --url.`);
  }

  return healthyRecords[0] ?? null;
}

async function waitForHealthyCandidate(
  workspacePath: string,
  registryDir: string,
  launchTimeoutMs: number,
  pollIntervalMs: number,
  dependencies: ResolverDependencies,
  onStatus: ResolveBridgeBaseUrlOptions["onStatus"],
): Promise<BridgeRegistryRecord> {
  const deadline = Date.now() + launchTimeoutMs;
  while (Date.now() < deadline) {
    const candidate = await resolveHealthyCandidate(workspacePath, registryDir, dependencies);
    if (candidate) {
      return candidate;
    }
    onStatus?.(`Waiting for workspace bridge for ${workspacePath}`);
    await dependencies.sleep(pollIntervalMs);
  }

  throw new Error(`Timed out waiting for a bridge for ${workspacePath}. Ensure Antigravity opened this folder and the bridge extension is enabled.`);
}

async function waitForReadyStatus(
  baseUrl: string,
  workspacePath: string,
  readyTimeoutMs: number,
  pollIntervalMs: number,
  dependencies: ResolverDependencies,
  onStatus: ResolveBridgeBaseUrlOptions["onStatus"],
): Promise<void> {
  const deadline = Date.now() + readyTimeoutMs;
  while (Date.now() < deadline) {
    const status = await dependencies.getBridgeStatus(baseUrl);
    if (status && status.discovery.supported && status.discovery.workspacePath === workspacePath && status.ready) {
      return;
    }
    onStatus?.(`Waiting for chat readiness for ${workspacePath}`);
    await dependencies.sleep(pollIntervalMs);
  }

  throw new Error(`Timed out waiting for bridge readiness for ${workspacePath}. The workspace opened, but Antigravity LS is not ready yet.`);
}

function isMatchingDiscovery(
  discovery: BridgeDiscoveryMetadata | undefined,
  record: BridgeRegistryRecord,
  workspacePath: string,
): boolean {
  return discovery?.protocolVersion === BRIDGE_DISCOVERY_PROTOCOL_VERSION
    && discovery.supported
    && discovery.instanceId === record.instanceId
    && discovery.workspacePath === workspacePath;
}

function readRegistryRecords(registryDir: string): BridgeRegistryRecord[] {
  if (!fs.existsSync(registryDir)) {
    return [];
  }

  return fs.readdirSync(registryDir)
    .filter((entry) => entry.endsWith(".json"))
    .flatMap((entry) => {
      try {
        const content = fs.readFileSync(path.join(registryDir, entry), "utf8");
        const parsed = JSON.parse(content) as Partial<BridgeRegistryRecord>;
        if (
          typeof parsed.protocolVersion !== "number"
          || typeof parsed.instanceId !== "string"
          || typeof parsed.workspacePath !== "string"
          || typeof parsed.baseUrl !== "string"
          || typeof parsed.httpPort !== "number"
          || typeof parsed.wsPort !== "number"
          || typeof parsed.pid !== "number"
          || typeof parsed.startedAt !== "string"
        ) {
          return [];
        }

        return [{
          protocolVersion: parsed.protocolVersion,
          instanceId: parsed.instanceId,
          workspacePath: parsed.workspacePath,
          baseUrl: parsed.baseUrl,
          httpPort: parsed.httpPort,
          wsPort: parsed.wsPort,
          pid: parsed.pid,
          startedAt: parsed.startedAt,
        }];
      } catch {
        return [];
      }
    });
}

async function pingBridge(baseUrl: string): Promise<BridgePingResponse | null> {
  try {
    const response = await fetch(`${baseUrl}/ping`);
    if (!response.ok) {
      return null;
    }
    return response.json() as Promise<BridgePingResponse>;
  } catch {
    return null;
  }
}

async function getBridgeStatus(baseUrl: string): Promise<BridgeDiscoveryStatus | null> {
  try {
    const response = await fetch(`${baseUrl}/lsstatus`);
    if (!response.ok) {
      return null;
    }
    return response.json() as Promise<BridgeDiscoveryStatus>;
  } catch {
    return null;
  }
}
