import {
    parseLatestLanguageServerPort,
    parseLsProcessLine,
} from "./ls-bridge.parsers";
import {
    createLsProcessLookupCommand,
    createPortLookupCommand,
} from "./ls-bridge.platform";

export const Models = {
    GEMINI_FLASH: 1018,
    GEMINI_PRO_LOW: 1164,
    GEMINI_PRO_HIGH: 1165,
    CLAUDE_SONNET: 1163,
    CLAUDE_OPUS: 1154,
    GPT_OSS: 342,
} as const;

export type ModelId = typeof Models[keyof typeof Models] | number;

export interface IHeadlessCascadeOptions {
    text: string;
    model?: ModelId;
    plannerType?: 'conversational' | 'normal';
}

const log = {
    info: (...args: any[]) => console.log('[LSBridge]', ...args),
    warn: (...args: any[]) => console.warn('[LSBridge]', ...args),
    error: (...args: any[]) => console.error('[LSBridge]', ...args),
    debug: (...args: any[]) => console.debug('[LSBridge]', ...args)
};

export class LSBridge {
    private _port: number | null = null;
    private _csrfToken: string | null = null;
    private _useTls: boolean = false;
    private _executeCommand: <T = any>(command: string, ...args: any[]) => Promise<T>;

    constructor(executeCommand: <T = any>(command: string, ...args: any[]) => Promise<T>) {
        this._executeCommand = executeCommand;
    }

    async initialize(): Promise<boolean> {
        // Step 1: Find process to extract CSRF token early
        let token = null;
        try {
            const processInfo = await this._findLSProcess(process.platform);
            if (processInfo) {
                token = processInfo.csrfToken;
            }
        } catch {}

        // Step 2: Always prefer the TRUE internal TLS/HTTP port from diagnostics logs 
        // because netstat is flaky on macOS.
        const fromDiag = await this._discoverFromDiagnosticsFull();
        if (fromDiag) {
            this._port = fromDiag.port;
            this._csrfToken = token || fromDiag.csrfToken || null;
            this._useTls = fromDiag.useTls;
            log.info(`LS discovered from getDiagnostics: port=${this._port}, tls=${this._useTls}, csrf=${this._csrfToken ? 'found' : 'missing'}`);
            return true;
        }

        // Step 3: Fallback to process/netstat discovery
        const fromProcess = await this._discoverFromProcess();
        if (fromProcess) {
            this._port = fromProcess.port;
            this._csrfToken = fromProcess.csrfToken;
            this._useTls = fromProcess.useTls;
            log.info(`LS discovered from process fallback: port=${this._port}, tls=${this._useTls}, csrf=${this._csrfToken ? 'found' : 'missing'}`);
            return true;
        }

        log.warn('Could not discover LS connection. Use setConnection(port, csrfToken) manually.');
        return false;
    }

    get isReady(): boolean { return this._port !== null; }
    get port(): number | null { return this._port; }
    get hasCsrfToken(): boolean { return this._csrfToken !== null; }

    setConnection(port: number, csrfToken: string, useTls: boolean = false): void {
        this._port = port;
        this._csrfToken = csrfToken;
        this._useTls = useTls;
    }

    async createCascade(options: IHeadlessCascadeOptions): Promise<string | null> {
        this._ensureReady();
        const startResp = await this._rpc('StartCascade', { source: 0 });
        const cascadeId = startResp?.cascadeId;
        if (!cascadeId) return null;
        if (options.text) {
            await this._sendMessage(cascadeId, options.text, options.model, options.plannerType);
        }
        return cascadeId;
    }

    async getConversation(cascadeId: string, trajectoryId?: string): Promise<any> {
        this._ensureReady();
        // The endpoint is actually GetCascadeTrajectory. 
        // We pass BOTH cascadeId and trajectoryId to safely satisfy the protobuf requirement.
        return this._rpc('GetCascadeTrajectory', { cascadeId, trajectoryId: trajectoryId || cascadeId });
    }

    async listCascades(): Promise<any> {
        this._ensureReady();
        const resp = await this._rpc('GetAllCascadeTrajectories', {});
        return resp?.trajectorySummaries ?? {};
    }

    async focusCascade(cascadeId: string): Promise<void> {
        this._ensureReady();
        await this._rpc('SmartFocusConversation', { cascadeId });
    }

    private _ensureReady(): void {
        if (!this._port) throw new Error('LSBridge not initialized.');
    }

    private async _sendMessage(cascadeId: string, text: string, model?: ModelId, plannerType?: string): Promise<void> {
        // gRPC-Gateway expects standard Protobuf JSON format (fields named by oneof types)
        // rather than the `{ case: 'string', value: ... }` format used by ConnectRPC JS clients.
        const payload: any = {
            cascadeId,
            items: [{ chunk: { text: text } }],
            cascadeConfig: {
                plannerConfig: {
                    plannerTypeConfig: { [plannerType || 'conversational']: {} },
                    requestedModel: { model: model || Models.GEMINI_FLASH },
                },
            },
        };
        await this._rpc('SendUserCascadeMessage', payload);
    }

    private async _discoverFromProcess(): Promise<{ port: number; csrfToken: string; useTls: boolean } | null> {
        try {
            const platform = process.platform;

            // Phase 1: find LS process, extract PID, csrf_token, extension_server_port, useTls
            let processInfo = await this._findLSProcess(platform);
            if (!processInfo) {
                log.debug('No LS processes found');
                return null;
            }

            log.debug(`LS process found: PID=${processInfo.pid}, csrf=present, extPort=${processInfo.extPort}, useTls=${processInfo.useTls}`);

            // Phase 2: find actual ConnectRPC port via netstat (or bypass if already known)
            const connectPort = await this._findConnectPort(platform, processInfo.pid, processInfo.extPort, processInfo.useTls);
            if (!connectPort) {
                log.debug('Could not find ConnectRPC port via netstat, trying extension_server_port as fallback');
                // Fallback: try extension_server_port with HTTP
                if (processInfo.extPort) {
                    return { port: processInfo.extPort, csrfToken: processInfo.csrfToken, useTls: processInfo.useTls };
                }
                return null;
            }

            return {
                port: connectPort.port,
                csrfToken: processInfo.csrfToken,
                useTls: connectPort.tls,
            };

        } catch (err) {
            log.debug('Process discovery failed', err);
        }
        return null;
    }

    /**
     * Phase 1: Find the LS process for this workspace.
     */
    private async _findLSProcess(
        platform: string,
    ): Promise<{ pid: number; csrfToken: string; extPort: number; useTls: boolean } | null> {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        const processLookup = createLsProcessLookupCommand(platform);
        let output: string;

        try {
            const { stdout } = await execAsync(processLookup.command, processLookup.options);
            output = stdout;
        } catch (err) {
            log.debug('Process lookup failed', err);
            return null;
        }

        if (!output) return null;

            const lines = output.trim().split('\n');
            for (const line of lines) {
                const parsed = parseLsProcessLine(line, platform);
                if (parsed) {
                    return parsed;
                }
            }

        return null;
    }

    private async _findConnectPort(platform: string, pid: number, extPort: number, knownTls?: boolean): Promise<{ port: number; tls: boolean } | null> {
        // If we found --server_port directly in args, use it and skip netstat
        if (extPort && extPort > 0 && knownTls !== undefined) {
            return { port: extPort, tls: knownTls };
        }
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            const portLookup = createPortLookupCommand(platform, pid);
            const result = await execAsync(portLookup.command, portLookup.options);
            const output = result.stdout;

            const portMatches = output.matchAll(/127\.0\.0\.1:(\d+)/g);
            const ports: number[] = [];
            for (const m of portMatches) {
                const p = parseInt(m[1], 10);
                if (p !== extPort && !ports.includes(p)) ports.push(p);
            }

            if (ports.length === 0) return null;

            for (const port of ports) {
                if (await this._probePort(port, true)) return { port, tls: true };
            }
            for (const port of ports) {
                if (await this._probePort(port, false)) return { port, tls: false };
            }
        } catch (err) {
            log.debug('netstat port discovery failed', err);
        }
        return null;
    }

    private _probePort(port: number, useTls: boolean): Promise<boolean> {
        const mod = useTls ? require('https') : require('http');
        const proto = useTls ? 'https' : 'http';
        return new Promise((resolve) => {
            const req = mod.request(`${proto}://127.0.0.1:${port}/exa.language_server_pb.LanguageServerService/GetUserStatus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': 2 },
                rejectUnauthorized: false,
                timeout: 2000,
            }, (res: any) => resolve(res.statusCode === 401 || res.statusCode === 200));
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
            req.write('{}');
            req.end();
        });
    }

    private async _discoverFromDiagnosticsFull(): Promise<{ port: number; csrfToken?: string; useTls: boolean } | null> {
        try {
            const raw = await this._executeCommand<string>('antigravity.getDiagnostics');
            if (!raw || typeof raw !== 'string') return null;
            const diag = JSON.parse(raw);

            // Collect ALL log lines (not sliced)
            const logLines = [
                ...(diag.extensionLogs ?? []),
                ...(diag.languageServerLogs?.logs ?? []),
            ].join('\n');

            const discoveredPort = parseLatestLanguageServerPort(logLines);
            if (discoveredPort) {
                log.info(`Diagnostics ${discoveredPort.useTls ? 'HTTPS' : 'HTTP'} port (last): ${discoveredPort.port}`);
                return discoveredPort;
            }
        } catch (err) {
            log.debug('_discoverFromDiagnosticsFull failed', err);
        }
        return null;
    }

    private async _rpc(method: string, payload: any): Promise<any> {
        const httpModule = this._useTls ? require('https') : require('http');
        const protocol = this._useTls ? 'https' : 'http';
        const url = `${protocol}://127.0.0.1:${this._port}/exa.language_server_pb.LanguageServerService/${method}`;

        return new Promise((resolve, reject) => {
            const body = JSON.stringify(payload);
            const headers: Record<string, string | number> = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            };

            if (this._csrfToken) headers['x-codeium-csrf-token'] = this._csrfToken;

            const reqOptions: any = { method: 'POST', headers };
            if (this._useTls) reqOptions.rejectUnauthorized = false;

            const req = httpModule.request(url, reqOptions, (res: any) => {
                let data = '';
                res.on('data', (chunk: string) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try { resolve(JSON.parse(data)); } catch { resolve(data); }
                    } else {
                        reject(new Error(`LS ${method}: ${res.statusCode} -- ${data.substring(0, 200)}`));
                    }
                });
            });
            req.on('error', (err: Error) => reject(err));
            req.write(body);
            req.end();
        });
    }
}
