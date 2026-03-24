import * as vscode from "vscode";
import { createBridgeServer, type BridgeServers } from "./server";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  createBridgeConfig,
  getBridgeStatusPresentation,
  type BridgeConfig,
} from "./bridge-config";
import {
  createBridgeDiscoveryState,
  type BridgeDiscoveryState,
} from "./bridge-discovery";

let bridge: BridgeServers | null = null;
let bridgeDiscovery: BridgeDiscoveryState | null = null;

interface PortInspect {
  workspaceValue?: number;
  workspaceFolderValue?: number;
  globalValue?: number;
  defaultValue?: number;
}

export function activate(context: vscode.ExtensionContext): void {
  restoreLegacyPatchedFiles();

  const config = loadBridgeConfig();
  bridgeDiscovery = createBridgeDiscoveryState({
    workspacePaths: (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath),
    httpPort: config.httpPort,
    wsPort: config.wsPort,
  });

  if (config.enabled) {
    bridge = createBridgeServer({
      context,
      ...config,
      discovery: bridgeDiscovery.discovery,
    });
    bridgeDiscovery.publish();
  }

  registerStatusBar(context, config);
  registerCommands(context, config);
  registerCleanup(context);

  console.log("[Bridge] Extension activated in Native API Mode");
}

export function deactivate(): void {
  bridge?.close();
  bridge = null;
  bridgeDiscovery?.dispose();
  bridgeDiscovery = null;
  console.log("[Bridge] Extension deactivated");
}

function restoreLegacyPatchedFiles(): void {
  try {
    restoreBackupFile(
      path.join(vscode.env.appRoot, "out", "vs", "workbench", "workbench.desktop.main.js"),
      /\.js$/,
      "_orig.js",
      "[Bridge] Restored corrupt workbench JS file successfully.",
    );
    restoreBackupFile(
      path.join(vscode.env.appRoot, "out", "vs", "code", "electron-browser", "workbench", "workbench.html"),
      /\.html$/,
      "_orig.html",
      "[Bridge] Restored corrupt workbench HTML file successfully.",
    );
  } catch (error) {
    console.error("[Bridge] Failed to restore legacy patched files", error);
  }
}

function restoreBackupFile(
  targetPath: string,
  extensionPattern: RegExp,
  backupSuffix: string,
  successMessage: string,
): void {
  const backupPath = targetPath.replace(extensionPattern, backupSuffix);
  if (!fs.existsSync(backupPath)) {
    return;
  }

  fs.writeFileSync(targetPath, fs.readFileSync(backupPath));
  fs.unlinkSync(backupPath);
  console.log(successMessage);
}

function loadBridgeConfig(): BridgeConfig {
  const config = vscode.workspace.getConfiguration("antigravity-bridge");
  const inspectedHttpPort = config.inspect<number>("httpPort") as PortInspect | undefined;
  const inspectedWsPort = config.inspect<number>("wsPort") as PortInspect | undefined;

  const httpPort = inspectedHttpPort?.workspaceValue
    ?? inspectedHttpPort?.workspaceFolderValue
    ?? inspectedHttpPort?.globalValue
    ?? inspectedHttpPort?.defaultValue
    ?? 5820;
  const wsPort = inspectedWsPort?.workspaceValue
    ?? inspectedWsPort?.workspaceFolderValue
    ?? inspectedWsPort?.globalValue
    ?? inspectedWsPort?.defaultValue
    ?? 5821;
  const derivedPorts = deriveWorkspaceDefaultPorts();

  return createBridgeConfig({
    enabled: config.get<boolean>("enabled"),
    httpPort: hasExplicitPortOverride(inspectedHttpPort) ? httpPort : derivedPorts.httpPort,
    wsPort: hasExplicitPortOverride(inspectedWsPort) ? wsPort : derivedPorts.wsPort,
  });
}

function hasExplicitPortOverride(
  inspected: PortInspect | undefined,
): boolean {
  return inspected?.workspaceValue !== undefined
    || inspected?.workspaceFolderValue !== undefined
    || inspected?.globalValue !== undefined;
}

function deriveWorkspaceDefaultPorts(): { httpPort: number; wsPort: number } {
  const primaryFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "antigravity-bridge";
  const isPreferredWorkspace = primaryFolder.includes("antigravity-cli-access");
  if (isPreferredWorkspace) {
    return { httpPort: 5820, wsPort: 5821 };
  }

  let hash = 0;
  for (const char of primaryFolder) {
    hash = (hash * 31 + char.charCodeAt(0)) % 200;
  }

  const httpPort = 5900 + hash;
  return {
    httpPort,
    wsPort: httpPort + 1,
  };
}

function registerStatusBar(
  context: vscode.ExtensionContext,
  config: BridgeConfig,
): void {
  const presentation = getBridgeStatusPresentation(config);
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );

  statusBar.text = presentation.text;
  statusBar.tooltip = presentation.tooltip;
  statusBar.show();

  context.subscriptions.push(statusBar);
}

function registerCommands(
  context: vscode.ExtensionContext,
  config: BridgeConfig,
): void {
  const presentation = getBridgeStatusPresentation(config);
  context.subscriptions.push(
    vscode.commands.registerCommand("antigravity-bridge.start", () => {
      vscode.window.showInformationMessage(presentation.startMessage);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("antigravity-bridge.toggle", () => {
      vscode.window.showInformationMessage(presentation.toggleMessage);
    }),
  );
}

function registerCleanup(context: vscode.ExtensionContext): void {
  context.subscriptions.push({
    dispose: () => {
      bridge?.close();
      bridgeDiscovery?.dispose();
    },
  });
}
