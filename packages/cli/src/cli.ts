#!/usr/bin/env node

import {
  BRIDGE_ACTIONS,
  BRIDGE_PATHS,
  createBridgeHttpClient,
  isBridgeAction,
  waitForAskResponse,
  type BridgeAction,
} from "./index";
import { resolveBridgeBaseUrl } from "./bridge-resolver";
import { resolveCliConfig } from "./cli-config";
import { MODEL_VARIANTS, parseModelVariant } from "./model-variant";

async function main(): Promise<void> {
  // Set up signal handlers for graceful shutdown
  const ac = new AbortController();
  const exitCleanly = (code: number) => {
    process.exit(code);
  };

  process.on("SIGINT", () => {
    process.stderr.write("\nInterrupted.\n");
    ac.abort();
    exitCleanly(130);
  });
  process.on("SIGTERM", () => {
    ac.abort();
    exitCleanly(143);
  });

  // Parse config inside try to catch synchronous throws
  let config: ReturnType<typeof resolveCliConfig>;
  try {
    config = resolveCliConfig(process.argv.slice(2), process.env);
  } catch (err) {
    process.stderr.write(
      `Error: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    exitCleanly(1);
    return;
  }

  const args = config.args;
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(`
Antigravity Ask Bridge CLI

Global Options:
  --url <baseUrl>                        Override the full bridge base URL
  --http-port <port>                    Override the bridge HTTP port on localhost
  --variant <name>                      Accepted for compatibility; uses Antigravity's default model (${Object.keys(MODEL_VARIANTS).join(", ")})

Commands:
  ask <text>                             Create a headless conversation and wait until the agent finishes to print the response
  send <text>                            Create a headless conversation asynchronously (returns job_id)
  ping                                   Check server status
  action <type>                          Execute an action (e.g., start_new_chat, focus_chat, allow, reject_step)
  artifacts                              List conversations/artifacts
  conversation <id>                      Read full conversation data
  artifact <convoId> <path>              Read an artifact file

Aliases (Legacy):
  status                                 Alias for ping
  new-chat                               Alias for action start_new_chat
  conversations                          Alias for artifacts
`);
    exitCleanly(0);
    return;
  }

  try {
    const selectedModel = parseModelVariant(config.variant);
    const resolvedBridge = await resolveBridgeBaseUrl({
      cwd: process.cwd(),
      explicitBaseUrl: config.explicitBaseUrl,
      onStatus: (message) => process.stderr.write(`${message}\n`),
    });
    const client = createBridgeHttpClient(resolvedBridge.baseUrl);

    switch (command) {
      case "send": {
        const text = args[1];
        if (!text) {
          process.stderr.write("Error: Please provide text to send\n");
          exitCleanly(1);
        }

        console.log("Creating conversation...");
        const result = await client.createConversation(text, selectedModel);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "ask": {
        const text = args[1];
        if (!text) {
          process.stderr.write("Error: Please provide text to ask\n");
          exitCleanly(1);
        }

        process.stderr.write("Waiting for agent response...\n");

        const askResult = await waitForAskResponse(client, text, {
          model: selectedModel,
          signal: ac.signal,
          onPoll: () => process.stderr.write("."),
          onPollError: (error) =>
            process.stderr.write(
              `\n[poll error] ${error instanceof Error ? error.message : String(error)}\n`,
            ),
          onRetry: (attempt, delayMs, reason) =>
            process.stderr.write(
              `\n[retry ${attempt}] ${reason} — retrying in ${delayMs}ms...\n`,
            ),
        });

        process.stderr.write("\nAgent finished generating response.\n");

        if (askResult.conversation.trajectory?.steps) {
          if (askResult.text) {
            console.log(askResult.text);
          } else {
            process.stderr.write(
              "Warning: Could not find a text response in the conversation steps.\n",
            );
            console.log(
              JSON.stringify(
                askResult.conversation.trajectory.steps.at(-1),
                null,
                2,
              ),
            );
          }
        }
        break;
      }

      case "ping":
      case "status": {
        const result = await client.ping();
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "action": {
        const type = args[1];
        if (!type) {
          process.stderr.write(
            "Error: Please provide an action type (e.g., start_new_chat, allow)\n",
          );
          exitCleanly(1);
        }

        if (!isBridgeAction(type)) {
          process.stderr.write(`Error: Unknown action type: ${type}\n`);
          process.stderr.write(
            `Supported actions: ${Object.values(BRIDGE_ACTIONS).join(", ")}\n`,
          );
          exitCleanly(1);
        }

        const result = await client.runAction(type as BridgeAction);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "new-chat": {
        const result = await client.runAction(BRIDGE_ACTIONS.startNewChat);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "artifacts":
      case "conversations": {
        const result = await client.request(BRIDGE_PATHS.artifacts);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "conversation":
      case "chat": {
        const convoId = args[1];
        if (!convoId) {
          process.stderr.write("Error: Please provide a conversation ID\n");
          exitCleanly(1);
        }
        const result = await client.getConversation(convoId);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "artifact": {
        const convoId = args[1];
        const path = args[2];
        if (!convoId || !path) {
          process.stderr.write("Error: Please provide convoId and path\n");
          exitCleanly(1);
        }
        const result = await client.request<string>(
          BRIDGE_PATHS.artifact(convoId, path),
        );
        console.log(result);
        break;
      }

      default: {
        process.stderr.write(`Unknown command: ${command}\n`);
        process.stderr.write("Run with --help for usage info\n");
        exitCleanly(1);
      }
    }
  } catch (err) {
    process.stderr.write(
      `Error: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    exitCleanly(1);
  }
}

main().catch((err) => {
  process.stderr.write(
    `Error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
