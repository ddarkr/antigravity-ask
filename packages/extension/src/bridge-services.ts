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
  createDiagnosticsSummary,
  delay,
  getBridgeDiagnostics,
  type BridgeDiagnostics,
} from "./server-support";

type CommandExecutor = <T = unknown>(command: string, ...args: unknown[]) => Promise<T>;
const execFileAsync = promisify(execFile);

/** Wraps a promise with a timeout. Rejects with a descriptive error on timeout. */
async function withTimeout<T>(promise: Promise<T>, ms: number, operationName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operationName} timed out after ${ms}ms`)), ms)
    ),
  ]);
}


interface CascadeSummary {
  trajectoryId?: string;
}

type CascadeMap = Record<string, CascadeSummary>;


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
  getModels(): Promise<unknown>;
}


export interface ChatJob {
  id: string;
  text: string;
  model?: string;
  status: "pending" | "processing" | "completed" | "failed";
  conversationId?: string;
  error?: string;
  createdAt: Date;
}

export interface ChatQueueService {
  enqueue(text: string, model?: string): Promise<string>;
  getJob(jobId: string): Promise<ChatJob | null>;
  getJobResult(jobId: string): Promise<unknown | null>;
  /** Release all resources. Call on deactivation. */
  dispose(): void;
}

export interface BridgeServices {
  conversation: ConversationService;
  actions: ActionService;
  monitoring: MonitoringService;
  chatQueue: ChatQueueService;
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

  private async withReadCsrfRetry<T>(operation: (sdk: AntigravitySDK) => Promise<T>): Promise<T> {
    try {
      const sdk = await this.runtime.ready();
      return await operation(sdk);
    } catch (error) {
      if (!isInvalidCsrfError(error)) {
        throw error;
      }

      const sdk = await this.runtime.reset();
      return operation(sdk);
    }
  }

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
        const startResponse = await withTimeout(sdk.ls.rawRPC("StartCascade", { source: 0 }) as Promise<{
          cascadeId?: string;
        }>, 10_000, "StartCascade");
        const cascadeId = startResponse.cascadeId ?? null;

        if (!cascadeId) {
          throw new Error("StartCascade did not return cascadeId");
        }

        await withTimeout(sdk.ls.rawRPC("SendUserCascadeMessage", {
          cascadeId,
          items: [{ chunk: { text } }],
          cascadeConfig: {
            plannerConfig: {
              plannerTypeConfig: { conversational: {} },
              requestedModel: { model: model ?? Models.GEMINI_FLASH },
            },
          },
        }), 30_000, "SendUserCascadeMessage");

        return cascadeId;
      } catch (error) {
        errors.push(toError(error));
      }
    }

    throw errors[0] ?? new Error("Failed to create headless conversation");
  }


  async getConversation(conversationId: string): Promise<unknown> {
    return this.withReadCsrfRetry(async (sdk) => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const cascades = await withTimeout(sdk.ls.listCascades() as Promise<CascadeMap>, 10_000, "listCascades");
          const trajectoryId = cascades[conversationId]?.trajectoryId ?? conversationId;
          return await withTimeout(sdk.ls.rawRPC("GetCascadeTrajectory", {
            cascadeId: conversationId,
            trajectoryId,
          }) as Promise<unknown>, 15_000, "GetCascadeTrajectory");
        } catch (error) {
          const message = String(error);
          const isNotFound = message.includes("not found");
          if (isNotFound && attempt < 2) {
            await delay(1000 * (attempt + 1));
            continue;
          }
          throw error;
        }
      }
      throw new Error("Failed to get conversation after retries");
    });
  }

  async listCascades(): Promise<CascadeMap> {
    return this.withReadCsrfRetry(async (sdk) => sdk.ls.listCascades() as Promise<CascadeMap>);
  }

  async focusConversation(conversationId: string): Promise<void> {
    const sdk = await this.runtime.ready();
    await withTimeout(sdk.ls.focusCascade(conversationId), 10_000, "focusCascade");
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

  async getModels(): Promise<unknown> {
    const sdk = await this.runtime.ready();
    const candidates = this.runtime.getCandidateConnections();

    const debugInfo = {
      port: sdk.ls.port,
      hasCsrfToken: sdk.ls.hasCsrfToken,
      isReady: sdk.ls.isReady,
      candidatesCount: candidates.length,
      candidates: candidates.map(c => ({ port: c.port, hasCsrfToken: !!c.csrfToken, useTls: c.useTls })),
    };

    try {
      let lastError: Error | null = null;
      if (candidates.length > 0) {
        for (const connection of candidates) {
          sdk.ls.setConnection(connection.port, connection.csrfToken, connection.useTls);
          try {
            const models = await withTimeout(sdk.ls.rawRPC("GetCascadeModelConfigs", { metadata: {}, filter: true }), 15_000, "GetCascadeModelConfigs");
            return { debug: debugInfo, models: models ?? null };
          } catch (error) {
            lastError = toError(error);
          }
        }
      }
      const models = await withTimeout(sdk.ls.rawRPC("GetCascadeModelConfigs", { metadata: {}, filter: true }), 15_000, "GetCascadeModelConfigs");
      return { debug: debugInfo, models: models ?? null };
    } catch (error) {
      return { debug: debugInfo, error: String(error) };
    }
  }
}


class AntigravityChatQueueService implements ChatQueueService {
  private jobs = new Map<string, ChatJob>();
  private processing = false;
  private conversation: ConversationService;
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(conversation: ConversationService) {
    this.conversation = conversation;
    this.timerId = setInterval(() => this.processQueue(), 1000);
  }

  dispose(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.jobs.clear();
  }

  async enqueue(text: string, model?: string): Promise<string> {
    const job: ChatJob = {
      id: crypto.randomUUID(),
      text,
      model,
      status: "pending",
      createdAt: new Date(),
    };
    this.jobs.set(job.id, job);
    this.processQueue().catch((err) => {
      console.error("[Bridge] processQueue error:", err);
    });
    return job.id;
  }

  async getJob(jobId: string): Promise<ChatJob | null> {
    return this.jobs.get(jobId) ?? null;
  }

  async getJobResult(jobId: string): Promise<unknown | null> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== "completed" || !job.conversationId) {
      return null;
    }
    return this.conversation.getConversation(job.conversationId);
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      this.pruneOldJobs();

      for (const [, job] of this.jobs) {
        if (job.status !== "pending") continue;

        job.status = "processing";
        try {
          const cascadeId = await this.conversation.createHeadlessConversation(job.text, job.model as ModelId | undefined);

          if (!cascadeId) {
            job.status = "failed";
            job.error = "Failed to create cascade";
            continue;
          }

          job.conversationId = cascadeId;
          job.status = "completed";
        } catch (error) {
          job.status = "failed";
          job.error = String(error);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private pruneOldJobs(): void {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    for (const [id, job] of this.jobs) {
      if (
        (job.status === "completed" || job.status === "failed")
        && (now - job.createdAt.getTime()) > maxAge
      ) {
        this.jobs.delete(id);
      }
    }
  }
}

export function createBridgeServices(
  context: vscode.ExtensionContext,
  executeCommand: CommandExecutor,
  discovery: BridgeDiscoveryMetadata,
): BridgeServices {
  const runtime = new SdkRuntime(context);
  const monitoring = new AntigravitySdkMonitoringService(runtime, executeCommand, discovery);
  const conversation = new AntigravitySdkConversationService(runtime, executeCommand);

  return {
    conversation,
    actions: new CommandActionService(executeCommand),
    monitoring,
    chatQueue: new AntigravityChatQueueService(conversation),
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
