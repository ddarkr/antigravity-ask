import * as vscode from "vscode";
import { createBridgeServer, type BridgeServers } from "./server";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  createBridgeConfig,
  getBridgeStatusPresentation,
  type BridgeConfig,
} from "./bridge-config";

let bridge: BridgeServers | null = null;

export function activate(context: vscode.ExtensionContext): void {
  restoreLegacyPatchedFiles();

  const config = loadBridgeConfig();
  if (config.enabled) {
    bridge = createBridgeServer({
      context,
      ...config,
    });
  }

  registerStatusBar(context, config);
  registerCommands(context, config);
  registerCleanup(context);

  console.log("[Bridge] Extension activated in Native API Mode");
}

export function deactivate(): void {
  bridge?.close();
  bridge = null;
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

  return createBridgeConfig({
    enabled: config.get<boolean>("enabled"),
    httpPort: config.get<number>("httpPort") ?? 5820,
    wsPort: config.get<number>("wsPort") ?? 5821,
  });
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
    dispose: () => bridge?.close(),
  });
}
