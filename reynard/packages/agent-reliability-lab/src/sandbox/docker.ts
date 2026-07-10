import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { canonicalJson } from "../canonical-json.js";
import {
  CandidateDefinitionSchema,
  CandidateRequestSchema,
  V1_SANDBOX_POLICY,
  type CandidateDefinition,
  type CandidateRequest,
  type CandidateRunner,
  type ExecutionResult,
  type ResolvedCandidate,
  type ResolvedImage,
  type SandboxPolicy,
} from "../contracts.js";
import {
  LAB_NAMESPACE,
  cleanupCandidateSnapshot,
  defaultLabStateRoot,
  verifyCandidateSnapshot,
  verifyCandidateSnapshotOwnership,
} from "../candidate.js";
import type { Result } from "../errors.js";

export interface ProcessInvocation {
  readonly executable: FixedDockerExecutable;
  readonly args: readonly string[];
  readonly stdin?: string;
  readonly env: Readonly<Record<string, string>>;
  readonly shell: false;
  readonly timeoutMillis: number;
  readonly stdoutBytesLimit: number;
  readonly stderrBytesLimit: number;
  readonly handleSignals: boolean;
}

export interface ProcessOutcome {
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly stdoutOverflow: boolean;
  readonly stderrOverflow: boolean;
  readonly durationMillis: number;
  readonly spawnError?: string;
}

export interface ProcessExecutor {
  execute(invocation: ProcessInvocation): Promise<ProcessOutcome>;
}

class NodeProcessExecutor implements ProcessExecutor {
  execute(invocation: ProcessInvocation): Promise<ProcessOutcome> {
    return new Promise((resolveOutcome) => {
      const startedAt = process.hrtime.bigint();
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let stdoutOverflow = false;
      let stderrOverflow = false;
      let timedOut = false;
      let handledSignal: NodeJS.Signals | null = null;
      let spawnError: string | undefined;
      let settled = false;
      const child = spawn(invocation.executable, [...invocation.args], {
        env: { ...invocation.env },
        shell: invocation.shell,
        stdio: ["pipe", "pipe", "pipe"],
      });

      const terminate = () => {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL");
        }
      };
      const onSigint = () => {
        handledSignal = "SIGINT";
        terminate();
      };
      const onSigterm = () => {
        handledSignal = "SIGTERM";
        terminate();
      };
      if (invocation.handleSignals) {
        process.once("SIGINT", onSigint);
        process.once("SIGTERM", onSigterm);
      }
      const timeout = setTimeout(() => {
        timedOut = true;
        terminate();
      }, invocation.timeoutMillis);

      const capture = (
        chunk: Buffer,
        limit: number,
        chunks: Buffer[],
        currentBytes: number,
        markOverflow: () => void,
      ): number => {
        const remaining = Math.max(0, limit - currentBytes);
        if (chunk.byteLength > remaining) {
          if (remaining > 0) chunks.push(chunk.subarray(0, remaining));
          markOverflow();
          terminate();
          return limit;
        }
        chunks.push(chunk);
        return currentBytes + chunk.byteLength;
      };

      child.stdout.on("data", (chunk: Buffer) => {
        stdoutBytes = capture(
          chunk,
          invocation.stdoutBytesLimit,
          stdoutChunks,
          stdoutBytes,
          () => {
            stdoutOverflow = true;
          },
        );
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderrBytes = capture(
          chunk,
          invocation.stderrBytesLimit,
          stderrChunks,
          stderrBytes,
          () => {
            stderrOverflow = true;
          },
        );
      });
      child.once("error", (error) => {
        spawnError = errorMessage(error);
      });
      child.stdin.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code !== "EPIPE") spawnError = errorMessage(error);
      });
      child.once("close", (exitCode, signal) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (invocation.handleSignals) {
          process.removeListener("SIGINT", onSigint);
          process.removeListener("SIGTERM", onSigterm);
        }
        const durationMillis = Number(
          (process.hrtime.bigint() - startedAt) / 1_000_000n,
        );
        resolveOutcome({
          exitCode,
          signal: handledSignal ?? signal,
          stdout: Buffer.concat(stdoutChunks, stdoutBytes).toString("utf8"),
          stderr: Buffer.concat(stderrChunks, stderrBytes).toString("utf8"),
          timedOut,
          stdoutOverflow,
          stderrOverflow,
          durationMillis,
          ...(spawnError === undefined ? {} : { spawnError }),
        });
      });

      child.stdin.end(invocation.stdin ?? "");
    });
  }
}

export interface DockerSandboxOptions {
  readonly executor?: ProcessExecutor;
  readonly stateRoot?: string;
  readonly ownerPid?: number;
  readonly uniqueId?: () => string;
  readonly isProcessAlive?: (pid: number) => boolean;
  readonly platform?: NodeJS.Platform;
}

export type FixedDockerExecutable =
  | "/usr/local/bin/docker"
  | "/usr/bin/docker";

export function dockerExecutableForPlatform(
  platform: NodeJS.Platform,
): FixedDockerExecutable {
  switch (platform) {
    case "darwin":
      return "/usr/local/bin/docker";
    case "linux":
      return "/usr/bin/docker";
    default:
      throw new Error(`Unsupported Docker host platform: ${platform}`);
  }
}

const DOCKER_ENVIRONMENT = {
  DOCKER_HOST: "unix:///var/run/docker.sock",
} as const;
const CONTROL_TIMEOUT_MILLIS = 10_000;
const CONTROL_OUTPUT_BYTES = 65_536;
const ACTIVE_CONTAINER_NAMES = new Set<string>();

function invalidInput<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "InvalidInput", message } };
}

function sandboxUnavailable<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "SandboxUnavailable", message } };
}

function executionFailed<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "ExecutionFailed", message } };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return !(
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ESRCH"
    );
  }
}

function labOwnerPid(name: string): number | undefined {
  const match = /^reynard-lab-v1-p([0-9]+)-[A-Za-z0-9._-]+(?:\.cid)?$/.exec(
    name,
  );
  if (match?.[1] === undefined) return undefined;
  const pid = Number(match[1]);
  return Number.isSafeInteger(pid) && pid > 0 ? pid : undefined;
}

function processSucceeded(outcome: ProcessOutcome): boolean {
  return (
    outcome.spawnError === undefined &&
    outcome.exitCode === 0 &&
    !outcome.timedOut &&
    !outcome.stdoutOverflow &&
    !outcome.stderrOverflow &&
    outcome.signal === null
  );
}

export class DockerSandbox implements CandidateRunner {
  readonly executable: FixedDockerExecutable;
  readonly stateRoot: string;
  private readonly executor: ProcessExecutor;
  private readonly ownerPid: number;
  private readonly uniqueId: () => string;
  private readonly isProcessAlive: (pid: number) => boolean;
  private recoveryComplete = false;

  constructor(options: DockerSandboxOptions = {}) {
    this.executable = dockerExecutableForPlatform(
      options.platform ?? process.platform,
    );
    this.executor = options.executor ?? new NodeProcessExecutor();
    this.stateRoot = options.stateRoot ?? defaultLabStateRoot();
    this.ownerPid = options.ownerPid ?? process.pid;
    this.uniqueId = options.uniqueId ?? randomUUID;
    this.isProcessAlive = options.isProcessAlive ?? processIsAlive;
  }

  private controlInvocation(args: readonly string[]): ProcessInvocation {
    return {
      executable: this.executable,
      args,
      env: DOCKER_ENVIRONMENT,
      shell: false,
      timeoutMillis: CONTROL_TIMEOUT_MILLIS,
      stdoutBytesLimit: CONTROL_OUTPUT_BYTES,
      stderrBytesLimit: CONTROL_OUTPUT_BYTES,
      handleSignals: false,
    };
  }

  async checkAvailability(): Promise<Result<void>> {
    try {
      const outcome = await this.executor.execute(
        this.controlInvocation(["version", "--format", "{{.Server.Version}}"]),
      );
      if (outcome.spawnError !== undefined || outcome.exitCode !== 0) {
        return sandboxUnavailable(
          `Docker binary or daemon is unavailable: ${outcome.spawnError ?? outcome.stderr}`,
        );
      }
      return { ok: true, value: undefined };
    } catch (error) {
      return sandboxUnavailable(
        `Docker binary or daemon is unavailable: ${errorMessage(error)}`,
      );
    }
  }

  async resolveImage(
    definition: CandidateDefinition,
  ): Promise<Result<ResolvedImage>> {
    const candidate = CandidateDefinitionSchema.safeParse(definition);
    if (!candidate.success) {
      return invalidInput(
        `Invalid candidate definition: ${candidate.error.issues.map((issue) => issue.message).join("; ")}`,
      );
    }
    try {
      const outcome = await this.executor.execute(
        this.controlInvocation([
          "image",
          "inspect",
          candidate.data.image,
        ]),
      );
      if (outcome.spawnError !== undefined || outcome.exitCode !== 0) {
        return sandboxUnavailable(
          `Pinned image is not available locally: ${outcome.spawnError ?? outcome.stderr}`,
        );
      }
      const decoded: unknown = JSON.parse(outcome.stdout);
      if (!Array.isArray(decoded) || decoded.length !== 1) {
        return sandboxUnavailable("Docker inspection did not resolve one local image");
      }
      const inspected = decoded[0] as Record<string, unknown>;
      if (
        Array.isArray(inspected.Manifests) &&
        inspected.Manifests.length > 0
      ) {
        return sandboxUnavailable(
          "Pinned image inspection resolved a multi-architecture index",
        );
      }
      if (
        !Array.isArray(inspected.RepoDigests) ||
        !inspected.RepoDigests.every((value) => typeof value === "string") ||
        !inspected.RepoDigests.includes(candidate.data.image)
      ) {
        return sandboxUnavailable(
          "Docker inspection did not retain the declared immutable repo digest",
        );
      }
      if (
        typeof inspected.Id !== "string" ||
        !/^sha256:[0-9a-f]{64}$/.test(inspected.Id) ||
        typeof inspected.Os !== "string" ||
        typeof inspected.Architecture !== "string"
      ) {
        return sandboxUnavailable("Docker returned an invalid local image identity");
      }
      const [declaredOs, declaredArchitecture] = candidate.data.platform.split("/");
      if (
        inspected.Os !== declaredOs ||
        inspected.Architecture !== declaredArchitecture
      ) {
        return sandboxUnavailable(
          `Pinned image platform ${String(inspected.Os)}/${String(inspected.Architecture)} does not match ${candidate.data.platform}`,
        );
      }
      return {
        ok: true,
        value: {
          reference: candidate.data.image,
          imageId: inspected.Id as `sha256:${string}`,
          os: inspected.Os,
          architecture: inspected.Architecture,
          ...(typeof inspected.Variant === "string" && inspected.Variant.length > 0
            ? { variant: inspected.Variant }
            : {}),
          platform: candidate.data.platform,
        },
      };
    } catch (error) {
      return sandboxUnavailable(
        `Could not inspect pinned image: ${errorMessage(error)}`,
      );
    }
  }

  async recoverStaleState(): Promise<Result<void>> {
    if (this.recoveryComplete) return { ok: true, value: undefined };
    try {
      const listed = await this.executor.execute(
        this.controlInvocation([
          "ps",
          "--all",
          "--filter",
          `name=^/${LAB_NAMESPACE}-p`,
          "--format",
          "{{.ID}}\t{{.Names}}",
        ]),
      );
      if (
        listed.spawnError !== undefined ||
        listed.exitCode !== 0 ||
        listed.timedOut ||
        listed.stdoutOverflow ||
        listed.stderrOverflow
      ) {
        return sandboxUnavailable(
          `Could not list stale Docker state: ${listed.spawnError ?? listed.stderr}`,
        );
      }
      for (const line of listed.stdout.split("\n")) {
        if (line.length === 0) continue;
        const [containerId, name, ...extra] = line.split("\t");
        const ownerPid = name === undefined ? undefined : labOwnerPid(name);
        if (
          extra.length > 0 ||
          containerId === undefined ||
          !/^[0-9a-f]{12,64}$/.test(containerId) ||
          name === undefined ||
          ownerPid === undefined ||
          (this.isProcessAlive(ownerPid) &&
            !(
              ownerPid === this.ownerPid &&
              !ACTIVE_CONTAINER_NAMES.has(name)
            ))
        ) {
          continue;
        }
        const removed = await this.executor.execute(
          this.controlInvocation(["rm", "--force", containerId]),
        );
        if (removed.spawnError !== undefined || removed.exitCode !== 0) {
          return sandboxUnavailable(
            `Could not remove stale lab container ${containerId}: ${removed.spawnError ?? removed.stderr}`,
          );
        }
        await rm(join(this.stateRoot, "cidfiles", `${name}.cid`), {
          force: true,
        });
      }
      for (const namespace of ["staging", "cidfiles"] as const) {
        const directory = join(this.stateRoot, namespace);
        let names: string[];
        try {
          names = await readdir(directory);
        } catch (error) {
          if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ENOENT"
          ) {
            continue;
          }
          throw error;
        }
        for (const name of names) {
          const ownerPid = labOwnerPid(name);
          const sameProcessInactiveCidfile =
            namespace === "cidfiles" &&
            ownerPid === this.ownerPid &&
            !ACTIVE_CONTAINER_NAMES.has(name.replace(/\.cid$/, ""));
          if (
            ownerPid === undefined ||
            (this.isProcessAlive(ownerPid) && !sameProcessInactiveCidfile)
          ) {
            continue;
          }
          await rm(join(directory, name), { recursive: true, force: true });
        }
      }
      this.recoveryComplete = true;
      return { ok: true, value: undefined };
    } catch (error) {
      return sandboxUnavailable(`Could not recover Docker state: ${errorMessage(error)}`);
    }
  }

  private async forceRemoveContainer(
    containerName: string,
    cidfile: string,
  ): Promise<boolean> {
    const identifiers: string[] = [];
    try {
      const recordedId = (await readFile(cidfile, "utf8")).trim();
      if (/^[0-9a-f]{12,64}$/.test(recordedId)) identifiers.push(recordedId);
    } catch {
      // A container can fail before Docker writes its cidfile; its unique name
      // remains a safe cleanup handle.
    }
    identifiers.push(containerName);
    for (const identifier of new Set(identifiers)) {
      try {
        const removed = await this.executor.execute(
          this.controlInvocation(["rm", "--force", identifier]),
        );
        if (processSucceeded(removed)) {
          await rm(cidfile, { force: true });
          return true;
        }
      } catch {
        // Try the unique container name after a recorded-ID failure.
      }
    }
    try {
      const listed = await this.executor.execute(
        this.controlInvocation([
          "ps",
          "--all",
          "--quiet",
          "--filter",
          `name=^/${containerName}$`,
        ]),
      );
      if (processSucceeded(listed) && listed.stdout.trim().length === 0) {
        await rm(cidfile, { force: true });
        return true;
      }
    } catch {
      // A daemon/listing failure cannot prove that cleanup succeeded.
    }
    return false;
  }

  private async runWithVerifiedSnapshot(
    candidate: ResolvedCandidate,
    requests: readonly CandidateRequest[],
    policy: SandboxPolicy,
  ): Promise<Result<readonly ExecutionResult[]>> {
    let containerRunIssued = false;
    try {
      if (canonicalJson(policy) !== canonicalJson(V1_SANDBOX_POLICY)) {
        return sandboxUnavailable("Docker sandbox policy does not match V1");
      }
      const available = await this.checkAvailability();
      if (!available.ok) return available;
      const recovered = await this.recoverStaleState();
      if (!recovered.ok) return recovered;
      const image = await this.resolveImage(candidate.definition);
      if (!image.ok) return image;
      if (canonicalJson(image.value) !== canonicalJson(candidate.image)) {
        return sandboxUnavailable("Pinned image identity changed after resolution");
      }
      const verified = await verifyCandidateSnapshot(candidate);
      if (!verified.ok) return verified;
      const cidfilesDirectory = join(this.stateRoot, "cidfiles");
      await mkdir(cidfilesDirectory, { recursive: true, mode: 0o700 });
      const executions: ExecutionResult[] = [];

      for (const requestValue of requests) {
        const request = CandidateRequestSchema.safeParse(requestValue);
        if (!request.success) {
          return invalidInput(
            `Invalid candidate request: ${request.error.issues.map((issue) => issue.message).join("; ")}`,
          );
        }
        const containerName = `${LAB_NAMESPACE}-p${this.ownerPid}-${this.uniqueId()}`;
        const cidfile = join(cidfilesDirectory, `${containerName}.cid`);
        const [entrypoint, ...entrypointArguments] = candidate.definition.entrypoint;
        if (entrypoint === undefined) {
          return invalidInput("Candidate entrypoint cannot be empty");
        }
        const args = [
          "run",
          "--name",
          containerName,
          "--cidfile",
          cidfile,
          "--pull=never",
          "--rm",
          "--interactive",
          "--platform",
          candidate.definition.platform,
          "--network=none",
          "--read-only",
          "--user",
          `${policy.uid}:${policy.gid}`,
          "--cpus",
          String(policy.cpuCores),
          "--memory",
          `${policy.memoryMiB}m`,
          "--pids-limit",
          String(policy.pidsLimit),
          "--cap-drop=ALL",
          "--security-opt=no-new-privileges",
          "--workdir",
          "/candidate",
          "--mount",
          `type=bind,src=${candidate.snapshotPath},dst=/candidate,readonly`,
          "--tmpfs",
          `/tmp:rw,nosuid,nodev,noexec,size=${policy.tmpfsMiB}m,uid=${policy.uid},gid=${policy.gid}`,
          "--entrypoint",
          entrypoint,
          candidate.definition.image,
          ...entrypointArguments,
        ];
        ACTIVE_CONTAINER_NAMES.add(containerName);
        try {
          containerRunIssued = true;
          const outcome = await this.executor.execute({
            executable: this.executable,
            args,
            stdin: `${JSON.stringify(request.data)}\n`,
            env: DOCKER_ENVIRONMENT,
            shell: false,
            timeoutMillis: policy.timeoutMillis,
            stdoutBytesLimit: policy.stdoutBytesLimit,
            stderrBytesLimit: policy.stderrBytesLimit,
            handleSignals: true,
          });
          if (!processSucceeded(outcome)) {
            const removed = await this.forceRemoveContainer(containerName, cidfile);
            return executionFailed(
              `Candidate execution failed for ${request.data.caseId}${removed ? "" : "; container cleanup failed and its cidfile was preserved"}`,
            );
          }
          const afterCase = await verifyCandidateSnapshot(candidate);
          if (!afterCase.ok) {
            const removed = await this.forceRemoveContainer(containerName, cidfile);
            return removed
              ? afterCase
              : executionFailed(
                  `Candidate snapshot validation failed for ${request.data.caseId}; container cleanup failed and its cidfile was preserved`,
                );
          }
          await rm(cidfile, { force: true });
          executions.push({
            caseId: request.data.caseId,
            exitCode: 0,
            stdout: outcome.stdout,
            stderr: outcome.stderr,
            timedOut: false,
            durationMillis: outcome.durationMillis,
          });
        } catch (error) {
          const removed = await this.forceRemoveContainer(containerName, cidfile);
          return executionFailed(
            `Docker execution boundary failed for ${request.data.caseId}: ${errorMessage(error)}${removed ? "" : "; container cleanup failed and its cidfile was preserved"}`,
          );
        } finally {
          ACTIVE_CONTAINER_NAMES.delete(containerName);
        }
      }
      return { ok: true, value: executions };
    } catch (error) {
      return containerRunIssued
        ? executionFailed(`Docker runner failed: ${errorMessage(error)}`)
        : sandboxUnavailable(`Docker preflight failed: ${errorMessage(error)}`);
    }
  }

  async run(
    candidate: ResolvedCandidate,
    requests: readonly CandidateRequest[],
    policy: SandboxPolicy,
  ): Promise<Result<readonly ExecutionResult[]>> {
    const owned = await verifyCandidateSnapshotOwnership(
      candidate,
      join(this.stateRoot, "staging"),
    );
    if (!owned.ok) return owned;
    const result = await this.runWithVerifiedSnapshot(
      candidate,
      requests,
      policy,
    );
    try {
      await cleanupCandidateSnapshot(candidate);
      return result;
    } catch (error) {
      const message = `Candidate staging cleanup failed: ${errorMessage(error)}`;
      return result.ok ||
        result.error._tag === "ExecutionFailed" ||
        result.error._tag === "EvaluationFailed"
        ? executionFailed(message)
        : sandboxUnavailable(message);
    }
  }
}

export function createDockerSandbox(
  options: DockerSandboxOptions = {},
): Result<DockerSandbox> {
  try {
    return { ok: true, value: new DockerSandbox(options) };
  } catch (error) {
    return sandboxUnavailable(errorMessage(error));
  }
}
