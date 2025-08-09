export interface RunLimits {
  cpuMs: number;
  memMB: number;
  timeoutMs: number;
}
export interface SandboxRunOptions {
  imageDigest: string;
  readOnlyRoot: boolean;
  writableMounts: string[];
  env: Record<string,string>;
  egressAllowlist: string[];
  cmd: string[];
  cwd?: string;
}
export interface SandboxDriver {
  run(opts: SandboxRunOptions, limits: RunLimits): Promise<{ exitCode: number; stdout: string; stderr: string }>;
  testEgress(host: string): Promise<boolean>;
}