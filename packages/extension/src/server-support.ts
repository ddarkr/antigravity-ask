export interface BridgeDiagnosticsTrajectory {
  googleAgentId?: string;
}

export interface BridgeDiagnostics {
  extensionLogs?: unknown[];
  languageServerLogs?: {
    logs?: unknown[];
  };
  recentTrajectories?: BridgeDiagnosticsTrajectory[];
}

type CommandExecutor = <T = unknown>(command: string, ...args: unknown[]) => Promise<T>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function getBridgeDiagnostics(
  executeCommand: CommandExecutor,
): Promise<BridgeDiagnostics | null> {
  try {
    const raw = await executeCommand<string>("antigravity.getDiagnostics");
    return parseBridgeDiagnostics(raw);
  } catch {
    return null;
  }
}

export function parseBridgeDiagnostics(raw: string | undefined): BridgeDiagnostics | null {
  if (!raw) {
    return null;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    return null;
  }

  return parsed as BridgeDiagnostics;
}

export function collectTrajectoryIds(diagnostics: BridgeDiagnostics | null): Set<string> {
  return new Set(
    (diagnostics?.recentTrajectories ?? [])
      .map((trajectory) => trajectory.googleAgentId)
      .filter((trajectoryId): trajectoryId is string => Boolean(trajectoryId)),
  );
}

export function findNewConversationId(
  diagnostics: BridgeDiagnostics | null,
  beforeIds: Set<string>,
): string | null {
  const newTrajectory = diagnostics?.recentTrajectories?.find((trajectory) => {
    return Boolean(trajectory.googleAgentId && !beforeIds.has(trajectory.googleAgentId));
  });

  return newTrajectory?.googleAgentId ?? null;
}

export function getLastTrajectoryId(
  diagnostics: BridgeDiagnostics | null,
): string {
  return diagnostics?.recentTrajectories?.[0]?.googleAgentId ?? "empty";
}

export function getTrajectoryCount(diagnostics: BridgeDiagnostics | null): number {
  return diagnostics?.recentTrajectories?.length ?? 0;
}

export function createDiagnosticsSummary(diagnostics: BridgeDiagnostics | null): {
  extensionLogs?: unknown[];
  languageServerLogs?: unknown[];
  recentTrajectories?: BridgeDiagnosticsTrajectory[];
} | { error: string } {
  if (!diagnostics) {
    return { error: "No diagnostics available" };
  }

  return {
    extensionLogs: diagnostics.extensionLogs?.slice(-10),
    languageServerLogs: diagnostics.languageServerLogs?.logs?.slice(-10),
    recentTrajectories: diagnostics.recentTrajectories,
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
