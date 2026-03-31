#!/usr/bin/env node

import {
  BRIDGE_ACTIONS,
  BRIDGE_PATHS,
  createBridgeHttpClient,
  isBridgeAction,
  waitForAskResponse,
} from "./index";
import { resolveBridgeBaseUrl } from "./bridge-resolver";
import { resolveCliConfig } from "./cli-config";
import { MODEL_VARIANTS, parseModelVariant } from "./model-variant";

async function main(): Promise<void> {
  const config = resolveCliConfig(process.argv.slice(2), process.env);
  const args = config.args;
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(`
Antigravity Ask Bridge CLI

Global Options:
  --url <baseUrl>                        Override the full bridge base URL
  --http-port <port>                    Override the bridge HTTP port on localhost
  --variant <name>                      Select model variant for ask/send (${Object.keys(MODEL_VARIANTS).join(", ")})

Commands:
  ask <text>                             Send a prompt and wait until the agent finishes to print the response
  send <text>                            Start a headless chat prompt (async, returns job_id)
  ping                                   Check server status
  action <type>                          Execute an action (e.g., start_new_chat, focus_chat, allow, reject_step)
  artifacts                              List conversations/artifacts
  conversation <id>                      Read full conversation chat data
  artifact <convoId> <path>              Read an artifact file

Aliases (Legacy):
  status                                 Alias for ping
  new-chat                               Alias for action start_new_chat
  conversations                          Alias for artifacts
`);
    process.exit(0);
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
          console.error("Error: Please provide text to send");
          process.exit(1);
        }

        console.log("Sending prompt...");
        const result = await client.send(text, selectedModel);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "ask": {
        const text = args[1];
        if (!text) {
          console.error("Error: Please provide text to ask");
          process.exit(1);
        }

        console.error("Waiting for agent response...");

        const askResult = await waitForAskResponse(client, text, {
          model: selectedModel,
          onPoll: () => process.stderr.write("."),
          onPollError: (error) => process.stderr.write(`\n[poll error] ${error instanceof Error ? error.message : String(error)}\n`),
        });

        console.error("\nAgent finished generating response.");

        if (askResult.conversation.trajectory?.steps) {
          if (askResult.text) {
            console.log(askResult.text);
          } else {
            console.error("Warning: Could not find a text response in the conversation steps.");
            console.log(JSON.stringify(askResult.conversation.trajectory.steps.at(-1), null, 2));
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
          console.error("Error: Please provide an action type (e.g., start_new_chat, allow)");
          process.exit(1);
        }

        if (!isBridgeAction(type)) {
          console.error(`Error: Unknown action type: ${type}`);
          console.error(`Supported actions: ${Object.values(BRIDGE_ACTIONS).join(", ")}`);
          process.exit(1);
        }

        const result = await client.runAction(type);
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
          console.error("Error: Please provide a conversation ID");
          process.exit(1);
        }
        const result = await client.getConversation(convoId);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "artifact": {
        const convoId = args[1];
        const path = args[2];
        if (!convoId || !path) {
          console.error("Error: Please provide convoId and path");
          process.exit(1);
        }
        const result = await client.request<string>(BRIDGE_PATHS.artifact(convoId, path));
        console.log(result);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error("Run with --help for usage info");
        process.exit(1);
    }
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

void main();
