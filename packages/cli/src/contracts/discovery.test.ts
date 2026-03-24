import { describe, expect, it } from "vitest";
import {
  BRIDGE_DISCOVERY_PROTOCOL_VERSION,
  BRIDGE_DISCOVERY_UNSUPPORTED_REASONS,
  createSupportedDiscoveryMetadata,
  createUnsupportedDiscoveryMetadata,
} from "./discovery";

describe("discovery contracts", () => {
  it("builds supported discovery metadata", () => {
    expect(createSupportedDiscoveryMetadata({
      instanceId: "instance-1",
      workspacePath: "/workspace/project",
    })).toEqual({
      protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
      supported: true,
      instanceId: "instance-1",
      workspacePath: "/workspace/project",
    });
  });

  it("builds unsupported discovery metadata for single-folder policy failures", () => {
    expect(createUnsupportedDiscoveryMetadata(BRIDGE_DISCOVERY_UNSUPPORTED_REASONS.noWorkspace)).toEqual({
      protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
      supported: false,
      instanceId: null,
      workspacePath: null,
      unsupportedReason: BRIDGE_DISCOVERY_UNSUPPORTED_REASONS.noWorkspace,
    });

    expect(createUnsupportedDiscoveryMetadata(BRIDGE_DISCOVERY_UNSUPPORTED_REASONS.multiRootWorkspace)).toEqual({
      protocolVersion: BRIDGE_DISCOVERY_PROTOCOL_VERSION,
      supported: false,
      instanceId: null,
      workspacePath: null,
      unsupportedReason: BRIDGE_DISCOVERY_UNSUPPORTED_REASONS.multiRootWorkspace,
    });
  });
});
