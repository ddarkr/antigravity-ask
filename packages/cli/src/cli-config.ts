const DEFAULT_BRIDGE_URL = "http://localhost:5820";

export interface CliConfigResult {
  args: string[];
  baseUrl: string;
}

export function resolveCliConfig(
  argv: string[],
  env: NodeJS.ProcessEnv,
): CliConfigResult {
  const args: string[] = [];
  let urlOverride: string | undefined;
  let portOverride: number | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--url") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error("Missing value for --url");
      }
      urlOverride = normalizeBaseUrl(nextValue);
      index += 1;
      continue;
    }

    if (value === "--http-port") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error("Missing value for --http-port");
      }
      portOverride = parsePort(nextValue);
      index += 1;
      continue;
    }

    args.push(value);
  }

  if (urlOverride) {
    return { args, baseUrl: urlOverride };
  }

  if (portOverride !== undefined) {
    return { args, baseUrl: `http://localhost:${portOverride}` };
  }

  const envUrl = env.AG_BRIDGE_URL;
  return {
    args,
    baseUrl: normalizeBaseUrl(envUrl || DEFAULT_BRIDGE_URL),
  };
}

function parsePort(rawValue: string): number {
  const port = Number(rawValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid --http-port value: ${rawValue}`);
  }

  return port;
}

function normalizeBaseUrl(rawValue: string): string {
  return rawValue.endsWith("/") ? rawValue.slice(0, -1) : rawValue;
}
