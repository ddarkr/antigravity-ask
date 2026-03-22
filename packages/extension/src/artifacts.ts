import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface ConversationSummary {
  id: string;
  hasArtifacts: boolean;
  files: string[];
}

const BRAIN_DIR = path.join(
  os.homedir(),
  ".gemini",
  "antigravity",
  "brain",
);

/**
 * List all conversations (directories) under ~/.gemini/antigravity/brain/
 */
export function listConversations(): ConversationSummary[] {
  if (!fs.existsSync(BRAIN_DIR)) return [];

  return fs
    .readdirSync(BRAIN_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => {
      const dir = path.join(BRAIN_DIR, d.name);
      const files = safeListFiles(dir);
      return {
        id: d.name,
        hasArtifacts: files.length > 0,
        files,
      };
    });
}

/**
 * Read an artifact file from a specific conversation.
 * Returns the file content or null if not found.
 */
export function readArtifact(
  conversationId: string,
  filename: string,
): string | null {
  const filePath = path.join(BRAIN_DIR, conversationId, filename);

  // Prevent path traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(BRAIN_DIR))) {
    return null;
  }

  if (!fs.existsSync(resolved)) return null;

  try {
    return fs.readFileSync(resolved, "utf8");
  } catch {
    return null;
  }
}

/**
 * List artifact files in a conversation directory (non-recursive, top-level only).
 */
export function listArtifactFiles(conversationId: string): string[] {
  const dir = path.join(BRAIN_DIR, conversationId);

  const resolved = path.resolve(dir);
  if (!resolved.startsWith(path.resolve(BRAIN_DIR))) {
    return [];
  }

  return safeListFiles(resolved);
}

function safeListFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((f) => f.isFile() && !f.name.startsWith("."))
      .map((f) => f.name);
  } catch {
    return [];
  }
}
