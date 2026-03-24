import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function openWorkspaceInAntigravity(workspacePath: string): Promise<void> {
  try {
    await execFileAsync("antigravity", ["--new-window", workspacePath], {
      timeout: 15000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to open workspace in Antigravity with 'antigravity --new-window'. ${message}`);
  }
}
