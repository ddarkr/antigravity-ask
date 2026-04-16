import { serve } from "@hono/node-server";
import { BRIDGE_ACTIONS } from "antigravity-ask";
import { type BridgeDiscoveryMetadata } from "antigravity-ask";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { WebSocketServer } from "ws";
import * as vscode from "vscode";
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
  ACCEPT_AGENT_STEP: "antigravity.agent.acceptAgentStep",
  REJECT_AGENT_STEP: "antigravity.agent.rejectAgentStep",
  TERMINAL_RUN: "antigravity.terminalCommand.run",
  START_NEW_CONVERSATION: "antigravity.startNewConversation",
  FOCUS_AGENT_PANEL: "antigravity.agentPanel.focus",
};

export function createBridgeServer(options: {
  context: vscode.ExtensionContext;
  httpPort: number;
  wsPort: number;
  discovery: BridgeDiscoveryMetadata;
}): BridgeServers {
  const app = new Hono();
  const executeCommand = <T = unknown>(command: string, ...args: unknown[]): Promise<T> => {
    return Promise.resolve(vscode.commands.executeCommand<T>(command, ...args));
  };
  const services = createBridgeServices(options.context, executeCommand, options.discovery);

  app.use("*", cors());

  // 1. Health check
  app.get("/ping", (c) => c.json({ status: "ok", mode: "native_api", discovery: options.discovery }));

  // LS Bridge status
  app.get("/lsstatus", async (c) => {
    try {
      return c.json(await services.monitoring.getLsStatus());
    } catch (e: any) {
      return c.json({ error: `LS Status: ${e.message}` }, 500);
    }
  });

  // 2. Actions (New Chat, Run, Allow, etc.)
  app.post("/action", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return c.json({ error: "Body must be an object" }, 400);
    }
    const obj = body as Record<string, unknown>;
    const type = obj.type;
    if (typeof type !== "string" || type === "") {
      return c.json({ error: "type is required and must be a non-empty string" }, 400);
    }

    try {
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

  // 3. Read Artifacts API
  app.get("/artifacts", async (c) => {
    try {
      const conversations = listConversations();
      return c.json({ conversations });
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  app.get("/dump", async (c) => {
    try {
      const allCommands = await vscode.commands.getCommands(true);
      const agCommands = allCommands.filter(cmd => cmd.toLowerCase().includes("antigravity") || cmd.toLowerCase().includes("chat") || cmd.toLowerCase().includes("agent"));
      return c.json({ commands: agCommands });
    } catch (e: any) {
      return c.json({ error: `Dump: ${e.message}` }, 500);
    }
  });

  app.get("/dump-ls", async (c) => {
    try {
      return c.json(await services.monitoring.getLsDebugSummary());
    } catch (e: any) {
      return c.json({ error: `LS Debug: ${e.message}` }, 500);
    }
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
    const results: Record<string, unknown> = {};
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

  app.post("/conversations", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return c.json({ error: "Body must be an object" }, 400);
    }
    const obj = body as Record<string, unknown>;
    const text = obj.text;
    if (typeof text !== "string" || text === "") {
      return c.json({ error: "text is required and must be a non-empty string" }, 400);
    }

    try {
      const jobId = await services.chatQueue.enqueue(text, obj.model as string | undefined);
      return c.json({ success: true, job_id: jobId });
    } catch (e: any) {
      console.error("[Bridge] POST /conversations failed:", e);
      return c.json({ error: e.message || String(e) }, 500);
    }
  });

  app.get("/conversations/jobs/:jobId", async (c) => {
    try {
      const jobId = c.req.param("jobId");
      const job = await services.chatQueue.getJob(jobId);
      if (!job) {
        return c.json({ error: "Job not found" }, 404);
      }
      return c.json({
        id: job.id,
        status: job.status,
        conversation_id: job.conversationId,
        error: job.error,
        created_at: job.createdAt,
      });
    } catch (e: any) {
      return c.json({ error: e.message || String(e) }, 500);
    }
  });

  app.get("/conversations", async (c) => {
    try {
      return c.json(await services.conversation.listCascades());
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  });

  app.get("/conversations/:id", async (c) => {
    const id = c.req.param("id");
    if (!id || id.trim() === "") {
      return c.json({ error: "id parameter is required" }, 400);
    }
    try {
      return c.json(await services.conversation.getConversation(id));
    } catch (e: any) {
      const msg = e.message ?? String(e);
      if (msg.includes("not found")) {
        return c.json({ error: `Conversation not found: ${id}` }, 404);
      }
      return c.json({ error: `LS GetCascadeTrajectory: ${msg}` }, 500);
    }
  });

  app.post("/conversations/:id/focus", async (c) => {
    const id = c.req.param("id");
    if (!id || id.trim() === "") {
      return c.json({ error: "id parameter is required" }, 400);
    }
    try {
      await services.conversation.focusConversation(id);
      return c.json({ success: true });
    } catch (e: any) {
      return c.json({ error: `LS FocusCascade: ${e.message}` }, 500);
    }
  });

  app.post("/conversations/:id/open", async (c) => {
    const id = c.req.param("id");
    if (!id || id.trim() === "") {
      return c.json({ error: "id parameter is required" }, 400);
    }
    try {
      await services.conversation.openConversation(id);
      return c.json({ success: true, focusedId: id });
    } catch (e: any) {
      return c.json({ error: `VSCode OpenChat: ${e.message}` }, 500);
    }
  });

  app.get("/artifacts/:convoId", async (c) => {
    try {
      const convoId = c.req.param("convoId");
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

  app.get("/models", async (c) => {
    try {
      const models = await services.monitoring.getModels();
      return c.json(models);
    } catch (e: any) {
      return c.json({ error: `LS GetCascadeModelConfigs: ${e.message}` }, 500);
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
      services.chatQueue.dispose();
      httpServer.close();
      wsServer.close();
    },
  };
}
