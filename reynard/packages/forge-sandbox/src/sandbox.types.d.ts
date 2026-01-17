export interface RunLimits {
    cpuMs: number;
    memMB: number;
    timeoutMs: number;
}
export interface VolumeMount {
    hostPath: string;
    containerPath: string;
    readOnly: boolean;
}
export interface SandboxRunOptions {
    imageDigest: string;
    readOnlyRoot: boolean;
    writableMounts: string[];
    volumeMounts?: VolumeMount[];
    env: Record<string, string>;
    egressAllowlist: string[];
    cmd: string[];
    cwd?: string;
    onStdout?: (data: string) => void;
    onStderr?: (data: string) => void;
}
export interface SandboxRunResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    stats: {
        durationMs: number;
        stdoutBytes: number;
        stderrBytes: number;
    };
}
export interface SandboxDriver {
    run(opts: SandboxRunOptions, limits: RunLimits): Promise<SandboxRunResult>;
    testEgress(host: string): Promise<boolean>;
    checkAvailability(): Promise<{
        available: boolean;
        error?: string;
    }>;
}
