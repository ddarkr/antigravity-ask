import {
  AntigravityCommands,
  AntigravitySDK,
  Models,
  type ModelId,
} from "antigravity-sdk";
import * as vscode from "vscode";
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
  getLsStatus(): Promise<{ initialized: boolean; ready: boolean; port: number | null; hasCsrfToken: boolean }>;
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
  private readonly sdk: AntigravitySDK;
  private sdkReady: Promise<void> | null = null;
  private initialized = false;
  private initError: Error | null = null;

  constructor(context: vscode.ExtensionContext) {
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
    return this.sdk;
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
    const sdk = await this.runtime.ready();
    const startResponse = await sdk.ls.rawRPC("StartCascade", { source: 0 }) as {
      cascadeId?: string;
    };
    const cascadeId = startResponse.cascadeId ?? null;

    if (!cascadeId) {
      return null;
    }

    const payload = {
      cascadeId,
      items: [{ chunk: { text } }],
      cascadeConfig: {
        plannerConfig: {
          plannerTypeConfig: { conversational: {} },
          requestedModel: { model: model ?? Models.GEMINI_FLASH },
        },
      },
    };

    await sdk.ls.rawRPC("SendUserCascadeMessage", payload);
    return cascadeId;
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
  ) {}

  async getLsStatus(): Promise<{ initialized: boolean; ready: boolean; port: number | null; hasCsrfToken: boolean }> {
    const state = this.runtime.getState();

    try {
      const sdk = await this.runtime.ready();
      const ready = sdk.ls.isReady && sdk.ls.hasCsrfToken;
      return {
        initialized: state.initialized,
        ready,
        port: sdk.ls.port,
        hasCsrfToken: sdk.ls.hasCsrfToken,
      };
    } catch {
      return {
        initialized: false,
        ready: false,
        port: null,
        hasCsrfToken: false,
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
): BridgeServices {
  const runtime = new SdkRuntime(context);
  const monitoring = new AntigravitySdkMonitoringService(runtime, executeCommand);

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
