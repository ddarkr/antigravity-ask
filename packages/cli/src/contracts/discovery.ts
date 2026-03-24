export const BRIDGE_DISCOVERY_PROTOCOL_VERSION = 1;

export const BRIDGE_DISCOVERY_UNSUPPORTED_REASONS = {
  noWorkspace: "no_workspace",
  multiRootWorkspace: "multi_root_workspace",
} as const;

export type BridgeDiscoveryUnsupportedReason =
  (typeof BRIDGE_DISCOVERY_UNSUPPORTED_REASONS)[keyof typeof BRIDGE_DISCOVERY_UNSUPPORTED_REASONS];

export interface BridgeDiscoveryMetadata {
  protocolVersion: number;
  supported: boolean;
  instanceId: string | null;
  workspacePath: string | null;
  unsupportedReason?: BridgeDiscoveryUnsupportedReason;
}

export interface BridgeRegistryRecord {
  protocolVersion: number;
  instanceId: string;
  workspacePath: string;
  baseUrl: string;
  httpPort: number;
  wsPort: number;
  pid: number;
  startedAt: string;
}

export interface BridgeDiscoveryStatus {
  initialized: boolean;
  ready: boolean;
  port: number | null;
  hasCsrfToken: boolean;
  discovery: BridgeDiscoveryMetadata;
}

export function createSupportedDiscoveryMetadata(input: {
  instanceId: string;
  workspacePath: string;
}): BridgeDiscoveryMetadata {
  return {
    protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
    supported: true,
    instanceId: input.instanceId,
    workspacePath: input.workspacePath,
  };
}

export function createUnsupportedDiscoveryMetadata(
  unsupportedReason: BridgeDiscoveryUnsupportedReason,
): BridgeDiscoveryMetadata {
  return {
    protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
    supported: false,
    instanceId: null,
    workspacePath: null,
    unsupportedReason,
  };
}
