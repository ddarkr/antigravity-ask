import { serve } from "@hono/node-server";
import { BRIDGE_ACTIONS } from "antigravity-ask";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { WebSocketServer } from "ws";
import * as vscode from "vscode";
import { Models } from "antigravity-sdk";
import { listConversations, readArtifact } from "./artifacts";
import { createBridgeServices } from "./bridge-services";
import {
  parseBridgeDiagnostics,
} from "./server-support";

export interface BridgeServers {
  httpServer: ReturnType<typeof serve>;
  wsServer: WebSocketServer;
  close: () => void;
}

export const BridgeCommands = {
  // Antigravity Native Commands
  SEND_TEXT_TO_CHAT: "antigravity.sendTextToChat",
  SEND_PROMPT_TO_AGENT: "antigravity.sendPromptToAgentPanel",
  ACCEPT_AGENT_STEP: "antigravity.agent.acceptAgentStep",
  REJECT_AGENT_STEP: "antigravity.agent.rejectAgentStep",
  TERMINAL_RUN: "antigravity.terminalCommand.run",
  START_NEW_CONVERSATION: "antigravity.startNewConversation",
  FOCUS_AGENT_PANEL: "antigravity.agentPanel.focus",
  OPEN_AGENT_PANEL: "antigravity.agentPanel.open",
};

export function createBridgeServer(options: {
  context: vscode.ExtensionContext;
  httpPort: number;
  wsPort: number;
}): BridgeServers {
  const app = new Hono();
  const executeCommand = <T = unknown>(command: string, ...args: unknown[]): Promise<T> => {
    return Promise.resolve(vscode.commands.executeCommand<T>(command, ...args));
  };
  const services = createBridgeServices(options.context, executeCommand);

  app.use("*", cors());

  // 1. Health check
  app.get("/ping", (c) => c.json({ status: "ok", mode: "native_api" }));

  // LS Bridge status
  app.get("/lsstatus", async (c) => {
    return c.json(await services.monitoring.getLsStatus());
  });

  // 2. Send Message to Chat (Direct Command)
  app.post("/send", async (c) => {
    try {
      const { text } = await c.req.json();
      if (!text) {
        return c.json({ error: "Text is required" }, 400);
      }
      
      console.log(`[Bridge] Received HTTP /send request. Text: "${text}"`);

      const legacySendResult = await services.legacySend.sendPromptToNewConversation(text);

      console.log(`[Bridge] Command executed successfully without throwing.`);
      
      return c.json({ 
        success: true, 
        conversation_id: legacySendResult.conversationId,
        method: "native_api",
        debug_info: {
          attempted_command: BridgeCommands.SEND_PROMPT_TO_AGENT,
          command_exists: legacySendResult.commandExists,
          polled_trajectories_count: legacySendResult.trajectoriesCount,
          before_ids_count: legacySendResult.beforeIdsCount,
          last_trajectories: legacySendResult.lastTrajectoryId,
        }
      });
    } catch (e: any) {
      console.error("[Bridge] Failed vscode.commands.executeCommand:", e);
      return c.json({ error: e.message || "Failed to execute command", attempted_command: BridgeCommands.SEND_PROMPT_TO_AGENT, error_dump: String(e) }, 500);
    }
  });

  // 3. Actions (New Chat, Run, Allow, etc.)
  app.post("/action", async (c) => {
    try {
      const { type } = await c.req.json();
      
      switch (type) {
        case BRIDGE_ACTIONS.startNewChat:
          await services.actions.startNewChat();
          break;
        case BRIDGE_ACTIONS.focusChat:
          await services.actions.focusChat();
          break;
        case BRIDGE_ACTIONS.acceptStep:
        case BRIDGE_ACTIONS.allow:
          await services.actions.acceptStep();
          break;
        case BRIDGE_ACTIONS.rejectStep:
          await services.actions.rejectStep();
          break;
        case BRIDGE_ACTIONS.terminalRun:
          await services.actions.runTerminalCommand();
          break;
        case BRIDGE_ACTIONS.switchChat:
          return c.json({ error: "switch_chat natively requires an ID, use start_new_chat instead" }, 400);
        default:
          return c.json({ error: "Unknown action type" }, 400);
      }

      return c.json({ success: true, action: type });
    } catch (e: any) {
      return c.json({ error: e.message || "Failed to execute action" }, 500);
    }
  });

  // 4. Read Artifacts API
  app.get("/artifacts", async (c) => {
    try {
      const conversations = listConversations();
      return c.json({ conversations });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  app.get("/dump", async (c) => {
    const allCommands = await vscode.commands.getCommands(true);
    const agCommands = allCommands.filter(cmd => cmd.toLowerCase().includes("antigravity") || cmd.toLowerCase().includes("chat") || cmd.toLowerCase().includes("agent"));
    return c.json({ commands: agCommands });
  });

  app.get("/dump-ls", async (c) => {
    return c.json(await services.monitoring.getLsDebugSummary());
  });

  // Temporary: return the full diagnostics JSON for CSRF key discovery
  app.get("/dump-diag-keys", async (c) => {
    try {
      const raw = await services.monitoring.getDiagnosticsRaw();
      if (!raw) return c.json({ error: "No diagnostics" }, 500);
      const parsed = parseBridgeDiagnostics(raw);
      if (!parsed) return c.json({ error: "No diagnostics" }, 500);
      // Return top-level keys and sub-keys of non-log fields
      const walk = (obj: unknown, prefix = ""): string[] => {
        if (!obj || typeof obj !== "object") return [];
        const record = obj as Record<string, unknown>;
        return Object.keys(record).flatMap((k) => {
          const v = record[k];
          const path = prefix ? `${prefix}.${k}` : k;
          if (Array.isArray(v) || typeof v !== "object" || v === null) return [path];
          return [path, ...walk(v, path)];
        });
      };
      const { extensionLogs: _1, languageServerLogs: _2, ...rest } = parsed;
      return c.json({ keys: walk(rest), topLevel: Object.keys(parsed) });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  app.get("/probe-csrf", async (c) => {
    const results: Record<string, any> = {};
    const cmds = [
      "antigravity.initializeAgent",
      "antigravity.getChromeDevtoolsMcpUrl",
    ];
    for (const cmd of cmds) {
      try {
        const r = await vscode.commands.executeCommand(cmd);
        results[cmd] = r ?? null;
      } catch (e: any) {
        results[cmd] = { error: e.message };
      }
    }
    return c.json(results);
  });
  app.post("/chat", async (c) => {
    try {
      const body = await c.req.json();
      if (!body.text) {
        return c.json({ error: "Text is required" }, 400);
      }
      
      const cascadeId = await services.conversation.createHeadlessConversation(
        body.text,
        body.model || Models.GEMINI_FLASH,
      );
      
      if (!cascadeId) {
        return c.json({ error: "Failed to create headless cascade (is SDK LS connection ready?)" }, 500);
      }
      
      return c.json({ success: true, conversation_id: cascadeId });
    } catch (e: any) {
      console.error("[Bridge] POST /chat failed:", e);
      return c.json({ error: e.message || String(e) }, 500);
    }
  });

  app.get("/conversation/:id", async (c) => {
    try {
      const id = c.req.param("id");
      return c.json(await services.conversation.getConversation(id));
    } catch (e: any) {
      return c.json({ error: `LS GetCascadeTrajectory: ${e.message}` }, 500);
    }
  });

  app.get("/list-cascades", async (c) => {
    try {
      return c.json(await services.conversation.listCascades());
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  app.post("/focus/:id", async (c) => {
    try {
      const id = c.req.param("id");
      await services.conversation.focusConversation(id);
      return c.json({ success: true });
    } catch (e: any) {
      return c.json({ error: `LS FocusCascade: ${e.message}` }, 500);
    }
  });

  app.post("/openchat/:id", async (c) => {
    try {
      const id = c.req.param("id");
      await services.conversation.openConversation(id);
      return c.json({ success: true, focusedId: id });
    } catch (e: any) {
      return c.json({ error: `VSCode OpenChat: ${e.message}` }, 500);
    }
  });

  app.get("/artifacts/:convoId", async (c) => {
    try {
      const { convoId } = c.req.param();
      const path = c.req.query("path");
      
      if (!path) {
        return c.json({ error: "Path parameter is required" }, 400);
      }
      
      const content = readArtifact(convoId, path);
      if (content === null) {
        return c.json({ error: "Artifact not found" }, 404);
      }
      return c.text(content);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  // ----- Servers Initialization -----
  const httpServer = serve({
    fetch: app.fetch,
    port: options.httpPort,
  });

  const wsServer = new WebSocketServer({ port: options.wsPort });

  wsServer.on("connection", (ws) => {
    console.log("[Bridge] WS Client connected");
    ws.on("message", (_msg) => {
      // Future: Real-time event streaming fallback 
    });
    ws.send(JSON.stringify({ type: "bridge_ready", version: "1.0.0" }));
  });

  console.log(`[Bridge] HTTP :${options.httpPort} | WS :${options.wsPort}`);

  return {
    httpServer,
    wsServer,
    close: () => {
      httpServer.close();
      wsServer.close();
    },
  };
}
