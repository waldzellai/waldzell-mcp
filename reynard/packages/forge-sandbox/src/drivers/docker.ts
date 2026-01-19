import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { SandboxDriver, SandboxRunOptions, RunLimits, SandboxRunResult } from '../sandbox.types.js';

/**
 * Docker-based sandbox driver for secure code execution.
 * Uses docker CLI via child_process for portability.
 */
export class DockerDriver implements SandboxDriver {
  private defaultImage = 'node:20-slim';
  private availabilityChecked = false;
  private isAvailable = false;

  /**
   * Check if Docker is available on the host
   */
  async checkAvailability(): Promise<{ available: boolean; error?: string }> {
    if (this.availabilityChecked) {
      return { available: this.isAvailable };
    }

    return new Promise((resolve) => {
      const proc = spawn('docker', ['version']);
      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        this.availabilityChecked = true;
        this.isAvailable = code === 0;

        if (code === 0) {
          resolve({ available: true });
        } else {
          resolve({
            available: false,
            error: `Docker is not available. Please install Docker and ensure it's running. Error: ${stderr || 'command failed'}`,
          });
        }
      });

      proc.on('error', (err) => {
        this.availabilityChecked = true;
        this.isAvailable = false;
        resolve({
          available: false,
          error: `Docker command not found. Please install Docker. Error: ${err.message}`,
        });
      });
    });
  }

  /**
   * Execute code in a Docker container with resource limits
   */
  async run(opts: SandboxRunOptions, limits: RunLimits): Promise<SandboxRunResult> {
    // Check Docker availability
    const availability = await this.checkAvailability();
    if (!availability.available) {
      return {
        exitCode: 1,
        stdout: '',
        stderr: availability.error || 'Docker not available',
        stats: { durationMs: 0, stdoutBytes: 0, stderrBytes: 0 },
      };
    }

    // Validate volume mounts exist
    if (opts.volumeMounts) {
      for (const mount of opts.volumeMounts) {
        if (!existsSync(mount.hostPath)) {
          return {
            exitCode: 1,
            stdout: '',
            stderr: `Host path does not exist: ${mount.hostPath}`,
            stats: { durationMs: 0, stdoutBytes: 0, stderrBytes: 0 },
          };
        }
      }
    }

    const args = this.buildDockerArgs(opts, limits);
    const startTime = Date.now();

    return new Promise((resolve) => {
      const stdout: string[] = [];
      const stderr: string[] = [];
      let stdoutBytes = 0;
      let stderrBytes = 0;

      const proc = spawn('docker', args, {
        timeout: limits.timeoutMs,
      });

      proc.stdout.on('data', (data) => {
        const str = data.toString();
        stdout.push(str);
        stdoutBytes += Buffer.byteLength(str, 'utf8');
        opts.onStdout?.(str);
      });

      proc.stderr.on('data', (data) => {
        const str = data.toString();
        stderr.push(str);
        stderrBytes += Buffer.byteLength(str, 'utf8');
        opts.onStderr?.(str);
      });

      proc.on('close', (code) => {
        const durationMs = Date.now() - startTime;
        resolve({
          exitCode: code ?? 1,
          stdout: stdout.join(''),
          stderr: stderr.join(''),
          stats: { durationMs, stdoutBytes, stderrBytes },
        });
      });

      proc.on('error', (err) => {
        const durationMs = Date.now() - startTime;
        resolve({
          exitCode: 1,
          stdout: '',
          stderr: `Docker execution error: ${err.message}`,
          stats: { durationMs, stdoutBytes, stderrBytes },
        });
      });
    });
  }

  /**
   * Test if egress to a specific host is allowed with current policy
   */
  async testEgress(host: string, policy: 'blocked' | 'allowed' = 'allowed'): Promise<boolean> {
    const result = await this.run(
      {
        imageDigest: 'curlimages/curl:latest',
        readOnlyRoot: true,
        writableMounts: [],
        env: {},
        egressAllowlist: policy === 'allowed' ? [host] : [],
        cmd: ['curl', '-s', '--max-time', '5', '-o', '/dev/null', '-w', '%{http_code}', `https://${host}`],
      },
      { cpuMs: 10000, memMB: 64, timeoutMs: 10000 }
    );

    // For blocked policy, we expect failure (exitCode != 0 or network error)
    if (policy === 'blocked') {
      return result.exitCode !== 0 || result.stderr.includes('Could not resolve host');
    }

    // For allowed policy, we expect success
    return result.exitCode === 0 && result.stdout.trim() !== '000';
  }

  /**
   * Build docker run arguments from options
   */
  private buildDockerArgs(opts: SandboxRunOptions, limits: RunLimits): string[] {
    const args: string[] = ['run', '--rm'];

    // Resource limits
    args.push(`--memory=${limits.memMB}m`);
    args.push(`--memory-swap=${limits.memMB}m`); // No swap
    args.push(`--cpu-period=100000`);
    args.push(`--cpu-quota=${Math.floor(limits.cpuMs * 1000)}`);
    args.push(`--pids-limit=50`); // Limit process spawning

    // Security: read-only root filesystem
    if (opts.readOnlyRoot) {
      args.push('--read-only');
    }

    // Volume mounts (candidate archive, datasets, ledger)
    if (opts.volumeMounts) {
      for (const mount of opts.volumeMounts) {
        const mode = mount.readOnly ? 'ro' : 'rw';
        args.push('-v', `${mount.hostPath}:${mount.containerPath}:${mode}`);
      }
    }

    // Writable tmpfs mounts (typically /tmp/working)
    for (const mount of opts.writableMounts) {
      args.push(`--tmpfs=${mount}:rw,noexec,nosuid,size=100m`);
    }

    // Network isolation
    if (opts.egressAllowlist.length === 0) {
      args.push('--network=none');
    } else {
      // Note: Fine-grained egress control requires iptables rules or custom network
      // For MVP, we allow bridge networking when allowlist is non-empty
      args.push('--network=bridge');
    }

    // Environment variables
    for (const [key, value] of Object.entries(opts.env)) {
      args.push('-e', `${key}=${value}`);
    }

    // Working directory
    if (opts.cwd) {
      args.push('-w', opts.cwd);
    }

    // Security options
    args.push('--security-opt=no-new-privileges');
    args.push('--cap-drop=ALL');

    // Image
    const image = opts.imageDigest || this.defaultImage;
    args.push(image);

    // Command
    args.push(...opts.cmd);

    return args;
  }
}

/**
 * Create a sandbox driver instance
 */
export function createDockerDriver(): SandboxDriver {
  return new DockerDriver();
}
