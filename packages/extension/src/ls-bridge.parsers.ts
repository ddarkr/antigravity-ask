export interface DiscoveredLanguageServerPort {
  port: number;
  useTls: boolean;
}

export interface ParsedLsProcessInfo {
  pid: number;
  csrfToken: string;
  extPort: number;
  useTls: boolean;
}

const HTTPS_PORT_PATTERN = /Language server listening on (?:random|fixed) port at (\d+) for HTTPS/g;
const HTTP_PORT_PATTERN = /Language server listening on (?:random|fixed) port at (\d+) for HTTP\b/g;

export function parseLatestLanguageServerPort(
  logLines: string,
): DiscoveredLanguageServerPort | null {
  const httpsMatches = [...logLines.matchAll(HTTPS_PORT_PATTERN)];
  if (httpsMatches.length > 0) {
    const latestMatch = httpsMatches.at(-1);

    if (latestMatch) {
      return {
        port: Number.parseInt(latestMatch[1], 10),
        useTls: true,
      };
    }
  }

  const httpMatches = [...logLines.matchAll(HTTP_PORT_PATTERN)];
  if (httpMatches.length > 0) {
    const latestMatch = httpMatches.at(-1);

    if (latestMatch) {
      return {
        port: Number.parseInt(latestMatch[1], 10),
        useTls: false,
      };
    }
  }

  return null;
}

export function parseLsProcessLine(
  line: string,
  platform: string,
): ParsedLsProcessInfo | null {
  if (!line.includes("--csrf_token")) {
    return null;
  }

  const matchCsrf = line.match(/--csrf_token\s+([\w-]+)/);
  if (!matchCsrf) {
    return null;
  }

  const matchServerPort = line.match(/--server_port\s+(\d+)/);
  const matchExtensionPort = line.match(/--extension_server_port\s+(\d+)/);

  const connectPort = matchServerPort?.[1];
  const pid = parsePid(line, platform);

  if (!pid) {
    return null;
  }

  return {
    pid,
    csrfToken: matchCsrf[1],
    extPort: connectPort
      ? Number.parseInt(connectPort, 10)
      : matchExtensionPort
        ? Number.parseInt(matchExtensionPort[1], 10)
        : 0,
    useTls: Boolean(connectPort),
  };
}

function parsePid(line: string, platform: string): number {
  if (platform === "win32") {
    const [pidPart] = line.split("|");
    return Number.parseInt(pidPart ?? "0", 10);
  }

  const [pidPart] = line.trim().split(" ");
  return Number.parseInt(pidPart ?? "0", 10);
}
