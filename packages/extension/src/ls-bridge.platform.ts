export interface ExecCommandSpec {
  command: string;
  options?: {
    encoding?: BufferEncoding;
    timeout?: number;
    windowsHide?: boolean;
  };
}

export function createLsProcessLookupCommand(platform: string): ExecCommandSpec {
  if (platform === "win32") {
    const powerShellScript = "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'language_server' -and $_.CommandLine -match 'csrf_token' } | ForEach-Object { $_.ProcessId.ToString() + '|' + $_.CommandLine }";
    const encodedScript = Buffer.from(powerShellScript, "utf16le").toString("base64");

    return {
      command: `powershell -NoProfile -EncodedCommand ${encodedScript}`,
    };
  }

  return {
    command: "pgrep -lf language_server",
  };
}

export function createPortLookupCommand(platform: string, pid: number): ExecCommandSpec {
  if (platform === "win32") {
    return {
      command: `netstat -aon | findstr "LISTENING" | findstr "${pid}"`,
      options: {
        encoding: "utf8",
        timeout: 5000,
        windowsHide: true,
      },
    };
  }

  return {
    command: `ss -tlnp 2>/dev/null | grep "pid=${pid}" || netstat -tlnp 2>/dev/null | grep "${pid}"`,
    options: {
      encoding: "utf8",
      timeout: 5000,
    },
  };
}
