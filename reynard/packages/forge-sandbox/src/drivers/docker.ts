import { SandboxDriver, SandboxRunOptions, RunLimits } from '../sandbox.types.js';

/** TODO: implement via dockerode or child_process `docker run` with flags */
export class DockerDriver implements SandboxDriver {
  async run(opts: SandboxRunOptions, limits: RunLimits) {
    // TODO: enforce cpu/mem/time via docker flags; mount RO root; set network to none or custom
    return { exitCode: 0, stdout: '', stderr: '' };
  }
  async testEgress(host: string) {
    // TODO: run a small curl inside sandbox; confirm blocked/allowed
    return false;
  }
}