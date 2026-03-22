export interface BridgeConfig {
  enabled: boolean;
  httpPort: number;
  wsPort: number;
}

export interface BridgeStatusPresentation {
  text: string;
  tooltip: string;
  startMessage: string;
  toggleMessage: string;
}

const DEFAULT_HTTP_PORT = 5820;
const DEFAULT_WS_PORT = 5821;

export function createBridgeConfig(values: {
  enabled?: boolean;
  httpPort?: number;
  wsPort?: number;
}): BridgeConfig {
  return {
    enabled: values.enabled ?? true,
    httpPort: values.httpPort ?? DEFAULT_HTTP_PORT,
    wsPort: values.wsPort ?? DEFAULT_WS_PORT,
  };
}

export function getBridgeStatusPresentation(
  config: BridgeConfig,
): BridgeStatusPresentation {
  if (!config.enabled) {
    return {
      text: "$(circle-slash) Bridge: Disabled",
      tooltip: `Antigravity Bridge is disabled — configured HTTP :${config.httpPort} | WS :${config.wsPort}`,
      startMessage: `Antigravity Bridge is disabled — enable it to listen on HTTP :${config.httpPort} | WS :${config.wsPort}`,
      toggleMessage: "Antigravity Bridge enablement is controlled by settings. Update `antigravity-bridge.enabled` and reload the window.",
    };
  }

  return {
    text: "$(zap) Bridge: Ready",
    tooltip: `Antigravity Bridge — HTTP :${config.httpPort} | WS :${config.wsPort}`,
    startMessage: `Antigravity Bridge running — HTTP :${config.httpPort} | WS :${config.wsPort}`,
    toggleMessage: "Antigravity Bridge is enabled. Change `antigravity-bridge.enabled`, `httpPort`, or `wsPort` in settings and reload the window to apply updates.",
  };
}
