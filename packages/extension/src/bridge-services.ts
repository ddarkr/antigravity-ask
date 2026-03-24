import {
  AntigravityCommands,
  AntigravitySDK,
  Models,
  type ModelId,
} from "antigravity-sdk";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import * as vscode from "vscode";
import {
  type BridgeDiscoveryMetadata,
  type BridgeDiscoveryStatus,
} from "antigravity-ask";
import {
  collectTrajectoryIds,
  createDiagnosticsSummary,
  delay,
  findNewConversationId,
  getBridgeDiagnostics,
  getLastTrajectoryId,
  getTrajectoryCount,
  type BridgeDiagnostics,
} from "./server-support";

type CommandExecutor = <T = unknown>(command: string, ...args: unknown[]) => Promise<T>;
const execFileAsync = promisify(execFile);

interface CascadeSummary {
  trajectoryId?: string;
}

type CascadeMap = Record<string, CascadeSummary>;

export interface LegacySendResult {
  conversationId: string | null;
  commandExists: boolean;
  trajectoriesCount: number;
  beforeIdsCount: number;
  lastTrajectoryId: string;
}

export interface ConversationService {
  createHeadlessConversation(text: string, model?: ModelId): Promise<string | null>;
  getConversation(conversationId: string): Promise<unknown>;
  listCascades(): Promise<CascadeMap>;
  focusConversation(conversationId: string): Promise<void>;
  openConversation(conversationId: string): Promise<void>;
}

export interface ActionService {
  startNewChat(): Promise<void>;
  focusChat(): Promise<void>;
  acceptStep(): Promise<void>;
  rejectStep(): Promise<void>;
  runTerminalCommand(): Promise<void>;
}

export interface MonitoringService {
  getLsStatus(): Promise<BridgeDiscoveryStatus & {
    selectedConnection: {
      workspacePath: string;
      workspaceIdHint: string;
      port: number;
      useTls: boolean;
    } | null;
  }>;
  getLsDebugSummary(): Promise<{
    lsBridge: {
      isReady: boolean;
      port: number | null;
      hasCsrfToken: boolean;
      csrfToken?: string | null;
      useTls?: boolean;
    };
    diagnostics: ReturnType<typeof createDiagnosticsSummary>;
  }>;
  getDiagnosticsRaw(): Promise<string>;
  getDiagnostics(): Promise<BridgeDiagnostics | null>;
}

export interface LegacySendService {
  sendPromptToNewConversation(text: string): Promise<LegacySendResult>;
}

export interface BridgeServices {
  conversation: ConversationService;
  actions: ActionService;
  monitoring: MonitoringService;
  legacySend: LegacySendService;
}

class SdkRuntime {
  private sdk: AntigravitySDK;
  private readonly context: vscode.ExtensionContext;
  private sdkReady: Promise<void> | null = null;
  private initialized = false;
  private initError: Error | null = null;
  private workspaceConnectionAligned = false;
  private candidateConnections: WorkspaceLsConnection[] = [];
  private selectedConnection: WorkspaceLsConnection | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.sdk = new AntigravitySDK(context);
  }

  private async initialize(): Promise<void> {
    try {
      await this.sdk.initialize();
      this.initialized = true;
    } catch (error) {
      this.initError = toError(error);
      console.error("[Bridge] antigravity-sdk initialization failed:", this.initError);
      throw this.initError;
    }
  }

  async ready(): Promise<AntigravitySDK> {
    if (!this.sdkReady) {
      this.sdkReady = this.initialize();
    }

    await this.sdkReady;
    await this.alignWorkspaceConnection();
    return this.sdk;
  }

  async reset(): Promise<AntigravitySDK> {
    this.sdk.dispose();
    this.sdk = new AntigravitySDK(this.context);
    this.sdkReady = null;
    this.initialized = false;
    this.initError = null;
    this.workspaceConnectionAligned = false;
    this.candidateConnections = [];
    this.selectedConnection = null;
    return this.ready();
  }

  private async alignWorkspaceConnection(): Promise<void> {
    if (this.workspaceConnectionAligned) {
      return;
    }

    this.candidateConnections = await discoverWorkspaceLsConnections(this.context);
    const [connection] = this.candidateConnections;
    if (connection) {
      this.sdk.ls.setConnection(connection.port, connection.csrfToken, connection.useTls);
      this.selectedConnection = connection;
    }

    this.workspaceConnectionAligned = true;
  }

  getCandidateConnections(): WorkspaceLsConnection[] {
    return [...this.candidateConnections];
  }

  getSelectedConnection(): WorkspaceLsConnection | null {
    return this.selectedConnection;
  }

  getState(): { initialized: boolean; error: Error | null } {
    return {
      initialized: this.initialized,
      error: this.initError,
    };
  }
}

class AntigravitySdkConversationService implements ConversationService {
  constructor(
    private readonly runtime: SdkRuntime,
    private readonly executeCommand: CommandExecutor,
  ) {}

  async createHeadlessConversation(text: string, model?: ModelId): Promise<string | null> {
    try {
      return await this.createHeadlessConversationOnce(text, model, false);
    } catch (error) {
      if (!isInvalidCsrfError(error)) {
        throw error;
      }

      return this.createHeadlessConversationOnce(text, model, true);
    }
  }

  private async createHeadlessConversationOnce(
    text: string,
    model: ModelId | undefined,
    forceRefresh: boolean,
  ): Promise<string | null> {
    const sdk = forceRefresh
      ? await this.runtime.reset()
      : await this.runtime.ready();
    const candidates = this.runtime.getCandidateConnections();
    const errors: Error[] = [];

    for (const connection of candidates.length > 0 ? candidates : [null]) {
      if (connection) {
        sdk.ls.setConnection(connection.port, connection.csrfToken, connection.useTls);
      }

      try {
        const startResponse = await sdk.ls.rawRPC("StartCascade", { source: 0 }) as {
          cascadeId?: string;
        };
        const cascadeId = startResponse.cascadeId ?? null;

        if (!cascadeId) {
          throw new Error("StartCascade did not return cascadeId");
        }

        await sdk.ls.rawRPC("SendUserCascadeMessage", {
          cascadeId,
          items: [{ chunk: { text } }],
          cascadeConfig: {
            plannerConfig: {
              plannerTypeConfig: { conversational: {} },
              requestedModel: { model: model ?? Models.GEMINI_FLASH },
            },
          },
        });

        return cascadeId;
      } catch (error) {
        errors.push(toError(error));
      }
    }

    throw errors[0] ?? new Error("Failed to create headless conversation");
  }

  async getConversation(conversationId: string): Promise<unknown> {
    const sdk = await this.runtime.ready();
    const cascades = await sdk.ls.listCascades() as CascadeMap;
    const trajectoryId = cascades[conversationId]?.trajectoryId ?? conversationId;
    return sdk.ls.rawRPC("GetCascadeTrajectory", {
      cascadeId: conversationId,
      trajectoryId,
    });
  }

  async listCascades(): Promise<CascadeMap> {
    const sdk = await this.runtime.ready();
    return sdk.ls.listCascades() as Promise<CascadeMap>;
  }

  async focusConversation(conversationId: string): Promise<void> {
    const sdk = await this.runtime.ready();
    await sdk.ls.focusCascade(conversationId);
  }

  async openConversation(conversationId: string): Promise<void> {
    await this.executeCommand("antigravity.prioritized.chat.open", { cascadeId: conversationId });
  }
}

class CommandActionService implements ActionService {
  constructor(private readonly executeCommand: CommandExecutor) {}

  async startNewChat(): Promise<void> {
    await this.executeCommand(AntigravityCommands.START_NEW_CONVERSATION);
  }

  async focusChat(): Promise<void> {
    await this.executeCommand(AntigravityCommands.FOCUS_AGENT_PANEL);
  }

  async acceptStep(): Promise<void> {
    await this.executeCommand(AntigravityCommands.ACCEPT_AGENT_STEP);
  }

  async rejectStep(): Promise<void> {
    await this.executeCommand(AntigravityCommands.REJECT_AGENT_STEP);
  }

  async runTerminalCommand(): Promise<void> {
    await this.executeCommand(AntigravityCommands.TERMINAL_RUN);
  }
}

class AntigravitySdkMonitoringService implements MonitoringService {
  constructor(
    private readonly runtime: SdkRuntime,
    private readonly executeCommand: CommandExecutor,
    private readonly discovery: BridgeDiscoveryMetadata,
  ) {}

  async getLsStatus(): Promise<BridgeDiscoveryStatus & {
    selectedConnection: {
      workspacePath: string;
      workspaceIdHint: string;
      port: number;
      useTls: boolean;
    } | null;
  }> {
    try {
      const sdk = await this.runtime.ready();
      const state = this.runtime.getState();
      const ready = sdk.ls.isReady && sdk.ls.hasCsrfToken;
      const selectedConnection = this.runtime.getSelectedConnection();
      return {
        initialized: state.initialized,
        ready,
        port: sdk.ls.port,
        hasCsrfToken: sdk.ls.hasCsrfToken,
        discovery: this.discovery,
        selectedConnection: selectedConnection
          ? {
            workspacePath: selectedConnection.workspacePath,
            workspaceIdHint: selectedConnection.workspaceIdHint,
            port: selectedConnection.port,
            useTls: selectedConnection.useTls,
          }
          : null,
      };
    } catch {
      const state = this.runtime.getState();
      return {
        initialized: state.initialized,
        ready: false,
        port: null,
        hasCsrfToken: false,
        discovery: this.discovery,
        selectedConnection: null,
      };
    }
  }

  async getLsDebugSummary(): Promise<{
    lsBridge: {
      isReady: boolean;
      port: number | null;
      hasCsrfToken: boolean;
      csrfToken?: string | null;
      useTls?: boolean;
    };
    diagnostics: ReturnType<typeof createDiagnosticsSummary>;
  }> {
    const diagnostics = await this.getDiagnostics();

    try {
      const sdk = await this.runtime.ready();
      return {
        lsBridge: {
          isReady: sdk.ls.isReady && sdk.ls.hasCsrfToken,
          port: sdk.ls.port,
          hasCsrfToken: sdk.ls.hasCsrfToken,
        },
        diagnostics: createDiagnosticsSummary(diagnostics),
      };
    } catch {
      return {
        lsBridge: {
          isReady: false,
          port: null,
          hasCsrfToken: false,
        },
        diagnostics: createDiagnosticsSummary(diagnostics),
      };
    }
  }

  async getDiagnosticsRaw(): Promise<string> {
    return this.executeCommand<string>(AntigravityCommands.GET_DIAGNOSTICS);
  }

  async getDiagnostics(): Promise<BridgeDiagnostics | null> {
    return getBridgeDiagnostics(this.executeCommand);
  }
}

class AntigravitySdkLegacySendService implements LegacySendService {
  constructor(
    private readonly executeCommand: CommandExecutor,
    private readonly monitoring: MonitoringService,
  ) {}

  async sendPromptToNewConversation(text: string): Promise<LegacySendResult> {
    const beforeDiagnostics = await this.monitoring.getDiagnostics();
    const beforeIds = collectTrajectoryIds(beforeDiagnostics);

    await this.executeCommand(AntigravityCommands.START_NEW_CONVERSATION);
    await delay(1500);

    const commandId = AntigravityCommands.SEND_PROMPT_TO_AGENT;
    await this.executeCommand(commandId, text);

    let conversationId: string | null = null;
    let latestDiagnostics = beforeDiagnostics;
    for (let index = 0; index < 16; index += 1) {
      await delay(500);
      latestDiagnostics = await this.monitoring.getDiagnostics();
      conversationId = findNewConversationId(latestDiagnostics, beforeIds);
      if (conversationId) {
        break;
      }
    }

    const commandExists = await isCommandAvailable(commandId);

    return {
      conversationId,
      commandExists,
      trajectoriesCount: getTrajectoryCount(latestDiagnostics),
      beforeIdsCount: beforeIds.size,
      lastTrajectoryId: getLastTrajectoryId(latestDiagnostics),
    };
  }
}

export function createBridgeServices(
  context: vscode.ExtensionContext,
  executeCommand: CommandExecutor,
  discovery: BridgeDiscoveryMetadata,
): BridgeServices {
  const runtime = new SdkRuntime(context);
  const monitoring = new AntigravitySdkMonitoringService(runtime, executeCommand, discovery);

  return {
    conversation: new AntigravitySdkConversationService(runtime, executeCommand),
    actions: new CommandActionService(executeCommand),
    monitoring,
    legacySend: new AntigravitySdkLegacySendService(executeCommand, monitoring),
  };
}

async function isCommandAvailable(
  command: string,
): Promise<boolean> {
  const commands = await vscode.commands.getCommands(true);
  return commands.includes(command);
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

function isInvalidCsrfError(error: unknown): boolean {
  return toError(error).message.includes("Invalid CSRF token");
}

interface WorkspaceLsConnection {
  port: number;
  csrfToken: string;
  useTls: boolean;
  workspacePath: string;
  workspaceIdHint: string;
}

async function discoverWorkspaceLsConnections(
  context: vscode.ExtensionContext,
): Promise<WorkspaceLsConnection[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
  if (workspaceFolders.length === 0 || process.platform === "win32") {
    return [];
  }

  const preferredFolders = await orderWorkspaceFoldersForExtension(workspaceFolders, context);
  const connections: WorkspaceLsConnection[] = [];

  for (const workspaceFolder of preferredFolders) {
    const normalizedPath = workspaceFolder.uri.fsPath.replace(/^[/\\]+/, "");
    const workspaceIdHint = `file_${normalizedPath.replace(/[\\/.:\-\s]/g, "_")}`;
    const workspacePath = workspaceFolder.uri.fsPath;
    const processInfo = await findWorkspaceLsProcess(workspaceIdHint);
    if (!processInfo) {
      continue;
    }

    const connectPort = await findWorkspaceConnectPort(processInfo.pid, processInfo.extPort, processInfo.csrfToken);
    if (connectPort) {
      connections.push({
        ...connectPort,
        workspacePath,
        workspaceIdHint,
      });
      continue;
    }

    if (processInfo.extPort > 0) {
      connections.push({
        port: processInfo.extPort,
        csrfToken: processInfo.csrfToken,
        useTls: false,
        workspacePath,
        workspaceIdHint,
      });
    }
  }

  return connections;
}

async function orderWorkspaceFoldersForExtension(
  workspaceFolders: readonly vscode.WorkspaceFolder[],
  context: vscode.ExtensionContext,
): Promise<vscode.WorkspaceFolder[]> {
  const extensionPath = context.extension.extensionPath;
  const extensionPackageName = getExtensionPackageName(context);
  const rankedFolders = await Promise.all(workspaceFolders.map(async (folder) => ({
    folder,
    score: await scoreWorkspaceFolderForExtension(folder, extensionPath, extensionPackageName),
  })));

  rankedFolders.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.folder.index - right.folder.index;
  });

  return rankedFolders.map(({ folder }) => folder);
}

function getExtensionPackageName(context: vscode.ExtensionContext): string | null {
  const packageJson = context.extension.packageJSON;
  return typeof packageJson?.name === "string" ? packageJson.name : null;
}

async function scoreWorkspaceFolderForExtension(
  workspaceFolder: vscode.WorkspaceFolder,
  extensionPath: string,
  extensionPackageName: string | null,
): Promise<number> {
  let score = 0;

  if (extensionPath.startsWith(workspaceFolder.uri.fsPath)) {
    score += 2;
  }

  if (await workspaceContainsExtensionPackage(workspaceFolder, extensionPackageName)) {
    score += 10;
  }

  return score;
}

async function workspaceContainsExtensionPackage(
  workspaceFolder: vscode.WorkspaceFolder,
  extensionPackageName: string | null,
): Promise<boolean> {
  if (!extensionPackageName) {
    return false;
  }

  try {
    const packageJsonPath = join(workspaceFolder.uri.fsPath, "packages", "extension", "package.json");
    const content = await readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(content) as { name?: unknown };
    return packageJson.name === extensionPackageName;
  } catch {
    return false;
  }
}

async function findWorkspaceLsProcess(
  workspaceIdHint: string,
): Promise<{ pid: number; csrfToken: string; extPort: number } | null> {
  try {
    const { stdout } = await execFileAsync("ps", ["-eo", "pid,args"], {
      timeout: 5000,
      encoding: "utf8",
    });

    const line = stdout
      .split("\n")
      .find((entry) => entry.includes("language_server") && entry.includes("csrf_token") && entry.includes(workspaceIdHint));

    if (!line) {
      return null;
    }

    const pidMatch = line.trim().match(/^(\d+)/);
    const csrfMatch = line.match(/--csrf_token\s+([^\s"]+)/);
    const extPortMatch = line.match(/--extension_server_port\s+([^\s"]+)/);
    const pid = pidMatch ? Number.parseInt(pidMatch[1], 10) : Number.NaN;
    const extPort = extPortMatch ? Number.parseInt(extPortMatch[1], 10) : 0;

    if (!csrfMatch || Number.isNaN(pid)) {
      return null;
    }

    return {
      pid,
      csrfToken: csrfMatch[1],
      extPort,
    };
  } catch {
    return null;
  }
}

async function findWorkspaceConnectPort(
  pid: number,
  extPort: number,
  csrfToken: string,
): Promise<Pick<WorkspaceLsConnection, "port" | "csrfToken" | "useTls"> | null> {
  try {
    const { stdout } = await execFileAsync("lsof", ["-nP", "-a", "-p", String(pid), "-iTCP", "-sTCP:LISTEN"], {
      timeout: 5000,
      encoding: "utf8",
    });

    const ports = stdout
      .split("\n")
      .flatMap((line) => {
        const match = line.match(/127\.0\.0\.1:(\d+) \(LISTEN\)/);
        return match ? [Number.parseInt(match[1], 10)] : [];
      })
      .filter((port, index, values) => port !== extPort && values.indexOf(port) === index);

    for (const port of ports) {
      if (await probeLsPort(port, csrfToken, true)) {
        return { port, csrfToken, useTls: true };
      }
    }

    for (const port of ports) {
      if (await probeLsPort(port, csrfToken, false)) {
        return { port, csrfToken, useTls: false };
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function probeLsPort(
  port: number,
  csrfToken: string,
  useTls: boolean,
): Promise<boolean> {
  const transport = useTls ? await import("node:https") : await import("node:http");

  return new Promise((resolve) => {
    const request = transport.request({
      host: "127.0.0.1",
      port,
      path: "/exa.language_server_pb.LanguageServerService/GetUserStatus",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": 2,
        "x-codeium-csrf-token": csrfToken,
      },
      rejectUnauthorized: false,
      timeout: 2000,
    }, (response) => {
      resolve(response.statusCode === 200);
    });

    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.write("{}");
    request.end();
  });
}
