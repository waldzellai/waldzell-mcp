---
title: "refactor: Retire agentic scripts and establish the Reynard Reliability Lab"
type: refactor
date: 2026-07-09
status: implemented-local
---

# Reynard Reliability Lab Retirement and Revival Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task by task. Steps use
> checkbox syntax for tracking.

**Status:** Implemented and review-verified locally on 2026-07-10. The local
implementation, final review fixes, and full `pnpm verify` gate are complete.
Hosted GitHub Actions evidence remains pending until this branch is pushed; the
hosted-CI evidence criterion below remains unchecked.

**Goal:** Retire the unsafe Bash prototype and replace the broad, simulated
Reynard Forge implementation with one honest vertical slice that executes an
existing candidate in Docker, evaluates real golden cases, records validated
artifacts, and compares the result with a baseline.

**Architecture:** Keep `agentic-scripts/` as a one-file historical tombstone.
Keep Reynard isolated from the repository's `servers/*` workspace, but reduce
its ten-package surface to one pnpm workspace package named
`@waldzellai/agent-reliability-lab`. The package has deterministic contracts,
a fail-closed Docker runner, a golden evaluator, a baseline comparator, an
artifact writer, and one CLI command.

**Tech stack:** Node.js 20 or newer, strict ESM TypeScript, pnpm 9, Vitest
1.2.x, Zod 3.25.x, Node's `crypto` and
`child_process` APIs, and the Docker CLI. Do not introduce Effect in this first
slice because the existing Reynard code does not use it and the boundary is
small; represent failures with an explicit discriminated union.

## Global constraints

- No LLM, model API, telemetry API, or application API call is part of the
  first supported path. Package installation and an explicit pinned-image pull
  are setup operations, not candidate execution.
- No host-execution fallback exists when Docker is unavailable.
- Network policy is `none`; fine-grained egress allowlists are deferred.
- Container images are referenced by immutable digest and an explicit platform,
  never by a mutable tag. The locally resolved image ID and platform are part
  of run identity so a multi-architecture index cannot hide different bytes.
- Candidate source is mounted read-only. Golden expected values and manifests
  remain in the host-side evaluator and are never mounted or serialized into
  the candidate container.
- Runtime artifacts are schema-validated before they are reported as complete.
- Timestamps and measured durations are metadata and never affect identity
  hashes or deterministic-result comparisons.
- A missing dependency, empty dataset, invalid artifact, sandbox failure,
  candidate failure, or regression exits nonzero.
- No percentage-complete score, mocked acceptance path, optimistic skip, or
  successful no-op test counts as verification.
- Do not modify the root package manager or add Reynard to the root
  `servers/*` workspace.
- Do not carry unrelated root lockfile or server changes into this work.

---

## 1. Decision record

### Current repository state

`origin/main` includes the 2025 Bash prototype and the January 2026 Reynard
Forge expansion. Both contain useful design fragments, but neither has a
trustworthy acceptance path:

- `agentic-scripts/` contains five executable Bash programs with unsafe or
  misleading behavior and no tests.
- The removed `.github/workflows/waldzell-agentic-enhancement.yml` exposed a
  daily and manual execution surface, downloaded a CLI at runtime, accepted an
  API secret, and referenced incorrect or nonexistent paths.
- `reynard/package.json` reports test success by printing a message and exiting
  zero.
- Reynard's two end-to-end test files substitute generated candidates,
  evaluation results, and red-team results with local fixtures.
- Provider, execution, reproduction, selection, and UI paths include simulated
  behavior while repository documentation calls the system production-ready.
- Docker bridge networking is used whenever an allowlist is nonempty, which is
  not allowlist enforcement.

The first safety commit changes only the support boundary: it turns the Bash
README into a do-not-run tombstone, removes the active workflow, and adds this
plan. It intentionally leaves the Bash files and Reynard implementation in
place until this plan is approved.

### Approaches considered

1. **One narrow reliability-lab package — selected.** This produces a small,
   inspectable acceptance path while preserving Reynard as the isolated
   experimental workspace.
2. **Repair all ten Forge packages.** Rejected because it preserves the broad
   surface, cross-package coupling, simulated components, and false confidence
   that caused the current failure.
3. **Build the harness as another MCP server.** Rejected because the evaluator
   must remain independent of the servers and candidates it measures.

### Product boundary

The first release is an **agent reliability harness**, not an autonomous agent
factory. It answers one question: "Did this already-built candidate behave at
least as well as the recorded baseline on this deterministic case set while
running inside the declared sandbox?"

## 2. Target repository state

After this plan is complete, the relevant tree is:

```text
waldzell-mcp/
├── .github/
│   └── workflows/
│       └── reynard-reliability-lab.yml
├── agentic-scripts/
│   └── README.md
└── reynard/
    ├── .gitignore
    ├── README.md
    ├── RELIABILITY_LAB_PLAN.md
    ├── package.json
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    ├── tsconfig.base.json
    ├── eslint.config.js
    ├── vitest.config.ts
    ├── docs/
    │   ├── architecture.md
    │   ├── deferred-capabilities.md
    │   └── provenance.md
    ├── fixtures/
    │   └── echo/
    │       ├── goldens.jsonl
    │       ├── baseline/
    │       │   ├── candidate.json
    │       │   └── src/
    │       │       └── index.mjs
    │       ├── candidate/
    │       │   ├── candidate.json
    │       │   └── src/
    │       │       └── index.mjs
    │       └── regressed/
    │           ├── candidate.json
    │           └── src/
    │               └── index.mjs
    ├── packages/
    │   └── agent-reliability-lab/
    │       ├── package.json
    │       ├── tsconfig.json
    │       ├── src/
    │       │   ├── artifacts.ts
    │       │   ├── candidate.ts
    │       │   ├── canonical-json.ts
    │       │   ├── cli.ts
    │       │   ├── compare.ts
    │       │   ├── contracts.ts
    │       │   ├── errors.ts
    │       │   ├── evaluator.ts
    │       │   ├── index.ts
    │       │   ├── manifest.ts
    │       │   ├── runner.ts
    │       │   └── sandbox/
    │       │       └── docker.ts
    │       └── tests/
    │           ├── unit/
    │           │   ├── artifacts.test.ts
    │           │   ├── candidate.test.ts
    │           │   ├── canonical-json.test.ts
    │           │   ├── compare.test.ts
    │           │   ├── contracts.test.ts
    │           │   ├── docker.test.ts
    │           │   ├── evaluator.test.ts
    │           │   ├── manifest.test.ts
    │           │   └── structure.test.ts
    │           └── integration/
    │               ├── acceptance.integration.test.ts
    │               └── docker.integration.test.ts
    └── runs/
        └── .gitkeep
```

`reynard/runs/*` is ignored except for `.gitkeep`. Every completed evaluation,
whether it exits 0 or 5, writes:

```text
runs/<run-id>/
├── manifest.json
├── baseline.trace.jsonl
├── candidate.trace.jsonl
└── result.json
```

Every artifact carries schema version 1 and the same run ID (each JSONL trace
record carries both). Each trace contains exactly one validated record per
case, in original case-file order, with no duplicate or extra case ID.
Reader-side validation re-evaluates both traces against the host-held case set,
reproduces the stored counts, failed IDs, and logical-result digests, and then
recomputes the comparison and `overallPassed`. The logical digest includes the
ordered case IDs, normalized protocol outcomes, and pass/fail decisions; it
excludes stderr, durations, timestamps, and host paths. The directory name,
manifest run ID, every trace run ID, and result run ID must agree.

A pre-existing run directory never short-circuits any Docker execution
otherwise required by a valid run; after the baseline completes, all candidate
cases execute. Artifacts are built and reader-validated in a unique sibling
staging directory. If the target does not exist, staging is atomically renamed
to `runs/<run-id>`. If a validated target already exists and its
identity-bearing logical content matches, the new staging directory is
discarded and the invocation succeeds without replacing the target. If it
differs, the target remains byte-for-byte unchanged, staging is cleaned, and
the invocation exits 6. Concurrent writers follow the same compare-after-race
rule. Validation, write, rename, handled SIGINT/SIGTERM, and mismatch paths
leave no temporary sibling behind. SIGKILL and host death are outside the
immediate-cleanup claim; on the next invocation, startup recovery identifies
and removes stale lab-owned containers, cidfiles, snapshots, and staging
siblings before preflight, without touching a validated final bundle.

The existing `forge-*` packages, generated completion reports, nested inert
workflows, multi-model configuration, UI, and broad ADAS specifications are not
present in the target tree. Git history and `docs/provenance.md` preserve their
lineage.

## 3. Supported behavior

### CLI surface

The only supported command is:

```bash
pnpm --dir reynard lab evaluate \
  --baseline fixtures/echo/baseline/candidate.json \
  --candidate fixtures/echo/candidate/candidate.json \
  --cases fixtures/echo/goldens.jsonl \
  --seed 0
```

It performs these stages in order:

1. Validate both candidate definitions and the nonempty JSONL case set.
2. Verify that each pinned container image and declared platform are present
   locally; inspect the platform-specific image ID, OS, architecture, and
   variant. Evaluation never pulls or substitutes an image implicitly.
3. Build a content-addressed run manifest.
4. Execute the baseline against every case in a fail-closed Docker sandbox.
5. Execute the candidate against the same cases and sandbox policy.
6. Compare normalized candidate outputs with deterministic expected outputs.
7. Compare candidate metrics with baseline metrics.
8. Validate and write the four run artifacts atomically.
9. Print the run directory and a concise pass/fail summary.

Exit codes are stable:

| Code | Meaning |
|---:|---|
| 0 | Candidate passed every required case without regression |
| 2 | CLI arguments, candidate definitions, source, or case-set input were invalid |
| 3 | Docker or the declared sandbox boundary was unavailable |
| 4 | Baseline or candidate execution failed |
| 5 | A required case failed or the candidate regressed |
| 6 | Generated artifacts failed schema or consistency validation, or could not be written atomically |

### Core interfaces

The package exposes these stable interfaces:

```ts
export interface CandidateDefinition {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly image: `${string}@sha256:${string}`;
  readonly platform: `${string}/${string}`;
  readonly entrypoint: readonly string[];
  readonly protocol: "jsonl-stdio";
  readonly source: {
    readonly relativePath: string;
    readonly digest: `sha256:${string}`;
  };
}

export interface ResolvedImage {
  readonly reference: CandidateDefinition["image"];
  readonly imageId: `sha256:${string}`;
  readonly os: string;
  readonly architecture: string;
  readonly variant?: string;
  readonly platform: CandidateDefinition["platform"];
}

export interface ResolvedCandidate {
  readonly definition: CandidateDefinition;
  readonly definitionPath: string;
  readonly sourcePath: string;
  readonly snapshotPath: string;
  readonly image: ResolvedImage;
}

export interface CandidateIdentity {
  readonly definition: CandidateDefinition;
  readonly image: ResolvedImage;
}

export interface SandboxPolicy {
  readonly schemaVersion: 1;
  readonly network: "none";
  readonly readOnlyRoot: true;
  readonly runAsNonRoot: true;
  readonly uid: number;
  readonly gid: number;
  readonly cpuCores: number;
  readonly memoryMiB: number;
  readonly pidsLimit: number;
  readonly timeoutMillis: number;
  readonly stdoutBytesLimit: number;
  readonly stderrBytesLimit: number;
  readonly tmpfsMiB: number;
}

export interface InputLimits {
  readonly schemaVersion: 1;
  readonly candidateDefinitionBytes: number;
  readonly sourceFileCount: number;
  readonly sourceFileBytes: number;
  readonly sourceTotalBytes: number;
  readonly caseFileBytes: number;
  readonly caseCount: number;
  readonly caseBytes: number;
}

export const V1_SANDBOX_POLICY = {
  schemaVersion: 1,
  network: "none",
  readOnlyRoot: true,
  runAsNonRoot: true,
  uid: 65_532,
  gid: 65_532,
  cpuCores: 1,
  memoryMiB: 256,
  pidsLimit: 64,
  timeoutMillis: 5_000,
  stdoutBytesLimit: 65_536,
  stderrBytesLimit: 65_536,
  tmpfsMiB: 16,
} as const satisfies SandboxPolicy;

export const V1_INPUT_LIMITS = {
  schemaVersion: 1,
  candidateDefinitionBytes: 16_384,
  sourceFileCount: 64,
  sourceFileBytes: 262_144,
  sourceTotalBytes: 1_048_576,
  caseFileBytes: 1_048_576,
  caseCount: 1_000,
  caseBytes: 65_536,
} as const satisfies InputLimits;

export interface EvaluationCase {
  readonly id: string;
  readonly input: unknown;
  readonly expected: unknown;
}

export interface LoadedEvaluationCases {
  readonly rawText: string;
  readonly cases: readonly EvaluationCase[];
  readonly digest: `sha256:${string}`;
}

export interface CandidateRequest {
  readonly schemaVersion: 1;
  readonly caseId: string;
  readonly seed: number;
  readonly input: unknown;
}

export interface ExecutionResult {
  readonly caseId: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly durationMillis: number;
}

export interface EvaluationResult {
  readonly caseCount: number;
  readonly passedCaseCount: number;
  readonly failedCaseIds: readonly string[];
  readonly logicalResultDigest: `sha256:${string}`;
}

export interface EvaluatorIdentity {
  readonly schemaVersion: 1;
  readonly implementationDigest: `sha256:${string}`;
  readonly dependencyLockDigest: `sha256:${string}`;
  readonly nodeVersion: string;
}

export interface RunManifestInput {
  readonly evaluator: EvaluatorIdentity;
  readonly seed: number;
  readonly baseline: CandidateIdentity;
  readonly candidate: CandidateIdentity;
  readonly casesDigest: `sha256:${string}`;
  readonly inputLimits: InputLimits;
  readonly sandbox: SandboxPolicy;
}

export interface RunManifest extends RunManifestInput {
  readonly schemaVersion: 1;
  readonly runId: `sha256:${string}`;
}

export interface DockerRunInput {
  readonly candidate: ResolvedCandidate;
  readonly request: CandidateRequest;
  readonly policy: SandboxPolicy;
}

export interface ArtifactWriteInput {
  readonly runsDirectory: string;
  readonly manifest: RunManifest;
  readonly loadedCases: LoadedEvaluationCases;
  readonly baselineExecutions: readonly ExecutionResult[];
  readonly candidateExecutions: readonly ExecutionResult[];
  readonly baselineEvaluation: EvaluationResult;
  readonly candidateEvaluation: EvaluationResult;
  readonly comparison: ComparisonResult;
}

export interface ComparisonResult {
  readonly noNewRegressions: boolean;
  readonly regressions: readonly {
    readonly caseId: string;
    readonly reason: string;
  }[];
}

export type ProtocolErrorCode =
  | "malformed JSONL output"
  | "invalid JSON output";

export interface TraceRecord {
  readonly schemaVersion: 1;
  readonly runId: RunManifest["runId"];
  readonly ordinal: number;
  readonly caseId: string;
  readonly requestDigest: `sha256:${string}`;
  readonly exitCode: 0;
  readonly timedOut: false;
  readonly protocolResult:
    | { readonly ok: true; readonly output: unknown }
    | { readonly ok: false; readonly error: ProtocolErrorCode };
  readonly stderr: string;
  readonly durationMillis: number;
}

export interface RunResultArtifact {
  readonly schemaVersion: 1;
  readonly runId: RunManifest["runId"];
  readonly baselineEvaluation: EvaluationResult;
  readonly candidateEvaluation: EvaluationResult;
  readonly comparison: ComparisonResult;
  readonly overallPassed: boolean;
}

export type LabError =
  | { readonly _tag: "InvalidInput"; readonly message: string }
  | { readonly _tag: "SandboxUnavailable"; readonly message: string }
  | { readonly _tag: "ExecutionFailed"; readonly message: string }
  | { readonly _tag: "EvaluationFailed"; readonly message: string }
  | { readonly _tag: "ArtifactWriteFailed"; readonly message: string };

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: LabError };

export interface CandidateRunner {
  run(
    candidate: ResolvedCandidate,
    requests: readonly CandidateRequest[],
    policy: SandboxPolicy,
  ): Promise<Result<readonly ExecutionResult[]>>;
}
```

Module entry points are:

```ts
canonicalJson(value: unknown): string
sha256(value: string | Uint8Array): `sha256:${string}`
loadCandidateDefinition(path: string): Promise<Result<ResolvedCandidate>>
resolveEvaluatorIdentity(packageRoot: string): Promise<Result<EvaluatorIdentity>>
createRunManifest(input: RunManifestInput): Result<RunManifest>
runInDocker(input: DockerRunInput): Promise<Result<ExecutionResult>>
evaluateExecutions(cases, executions): Result<EvaluationResult>
compareEvaluations(baseline, candidate): ComparisonResult
writeRunArtifacts(input: ArtifactWriteInput): Promise<Result<string>>
main(argv: readonly string[]): Promise<number>
```

### Identity and replay

The run identity hashes canonical values for:

- baseline and candidate definitions and resolved-image identities;
- baseline and candidate source digests;
- golden-case file digest;
- immutable image references, local image IDs, and platforms;
- evaluator schema, content-derived implementation and dependency-lock
  digests, and exact Node runtime version;
- deterministic seed; and
- input limits and sandbox policy.

Wall-clock timestamps, durations, absolute host paths, and log formatting are
excluded. "Replay" means re-materializing source that matches the recorded
digest, using the same preloaded resolved image, executing every case again,
and obtaining the same normalized logical outputs. V1 records identity but
does not archive source or container layers, so their availability remains an
explicit external prerequisite. Replay does not mean asking a model to
regenerate equivalent source code.

The evaluator identity is computed internally after build from the exact Node
`process.version`, the `pnpm-lock.yaml` digest, and a recursive hash of sorted
relative paths and bytes for every emitted JavaScript file under
`packages/agent-reliability-lab/dist/`. It is not accepted from a CLI flag or
candidate file. Changing shipped harness code, locked dependencies, or runtime
therefore changes the run ID. The build and tests reject an empty
implementation set.

V1 requires `--seed <safe-integer>` and documents `--seed 0` in every example;
there is no hidden random or time-derived default. The same seed is copied into
every baseline and candidate request. Changing it changes the run ID.

The case file is read once into one bounded immutable byte buffer. The harness
hashes and parses that same buffer, validates the per-record and count limits,
then constructs immutable requests from those parsed values. It never reopens
the case path during the run. A test mutates the on-disk file after the read
and proves neither the manifest nor executed requests change.

### Sandbox boundary

The Docker adapter invokes `docker` with an argument array, never a shell
string. V1 uses one committed, schema-versioned policy with explicit numeric
values for UID, GID, CPU rate, memory, PIDs, timeout, output limits, and tmpfs
size; callers cannot weaken it through CLI flags. The adapter enforces:

- `--pull=never`, `--rm`, and the declared `--platform`;
- `--network=none`;
- `--read-only`;
- `--user` set to the policy's non-root numeric UID:GID;
- `--cpus` set to the policy's enforceable CPU rate;
- `--cap-drop=ALL`;
- `--security-opt=no-new-privileges`;
- PID, CPU, memory, wall-time, and output-size limits;
- candidate source mounted read-only;
- a size-bounded writable `tmpfs` owned by the declared UID:GID;
- a unique container name and `--cidfile`; and
- no Docker socket, host credentials, or inherited environment variables.

`source.relativePath` is resolved relative to the candidate-definition file.
The fixture manifests point to a child `src/` directory, so a manifest never
hashes itself. The loader rejects absolute paths, `..` traversal, every
symlink, and every non-regular file. It hashes canonical JSON containing
regular-file entries sorted by normalized POSIX relative path; each entry
contains the relative path, SHA-256 of its bytes, and its execution-relevant
mode bits (`mode & 0o111`). Absolute paths, timestamps, ownership, and other
mode bits are excluded. A declared mismatch fails and the verified snapshot
preserves those execution bits.
Candidate definitions, source enumeration/copying, and case parsing enforce
the exact V1 byte/count limits in the interfaces above before Docker starts.
Exceeding any single-file, aggregate, or count limit returns exit 2. Boundary
tests cover each maximum and one-over-maximum value so host preflight cannot
consume unbounded memory, files, or disk.
After validation, the loader copies the regular files into a private staging
snapshot and re-hashes it before and after execution; any mismatch invalidates
the run and cleans staging. Only that verified snapshot is mounted read-only
at `/candidate`, with `/candidate` as the working directory.

Before running, Docker inspection must resolve the declared reference and
platform to the recorded local image ID, OS, architecture, and optional
variant. A platform or resolved-image change changes the run ID. The first
entrypoint token is supplied with Docker's `--entrypoint`; remaining tokens are
placed after the image reference, so mutable image defaults do not select the
program.

The JSONL protocol is one container execution per case. Before execution, the
host runner derives a `CandidateRequest` from the case by copying only
`schemaVersion`, `caseId`, the run seed, and `input`; `expected` never crosses
the runner boundary. The runner writes exactly that one request as JSON
followed by a newline to stdin. A valid candidate writes exactly one JSON value
followed by a newline to stdout. Extra stdout content, missing output, invalid
JSON, or multiple values fail that case. Diagnostic text belongs on stderr and
is size-bounded.

On timeout, output overflow, handled SIGINT/SIGTERM, or any post-start failure,
the runner force-removes the container by its recorded ID and cleans its
cidfile and source snapshot. Tests assert no matching container or temporary
state remains. A startup-recovery test plants only lab-namespaced stale state
representing SIGKILL/host death and proves the next invocation cleans it while
preserving validated bundles and unrelated containers/files. The runner never
executes the candidate directly on the host.

Error phases map to exit codes without overlap: invalid CLI arguments,
definitions, source, or cases return 2; missing Docker binary/daemon, absent
local image, image/platform mismatch, or failed policy preflight return 3;
nonzero exit, timeout, output overflow, or handled SIGINT/SIGTERM after a
container starts return 4; protocol, golden, or regression failures return 5;
and bundle validation or atomic-write failures return 6. A baseline execution
error stops
before candidate execution. Completed evaluations, including exit 5, write a
four-file bundle. Exits 2, 3, and 4 write no final bundle and clean staging.

## 4. Deferred capabilities

The following are intentionally absent from the target implementation:

- LLM-driven candidate generation;
- planner, coder, grader, or attacker providers;
- graph execution and cycle analysis;
- novelty scoring and Pareto selection;
- autonomous promotion or self-modification;
- red-team orchestration;
- idempotency ledger;
- MCP server generation;
- UI;
- fine-grained network egress;
- semantic or model-based grading; and
- distributed execution.

Each may return only after the vertical slice has real users or multiple
meaningful candidate datasets and the new capability has its own measurable
acceptance contract.

## 5. Implementation tasks

### Task 1: Retire the Bash implementation

**Files:**

- Modify: `agentic-scripts/README.md`
- Delete: `agentic-scripts/config.json`
- Delete: `agentic-scripts/dev-tools/code-review-advanced.sh`
- Delete: `agentic-scripts/dev-tools/intelligent-debugger.sh`
- Delete: `agentic-scripts/evolution/adas-meta-agent.sh`
- Delete: `agentic-scripts/memory/memory-manager.sh`
- Delete: `agentic-scripts/optimization/performance-driven-auto-tuning.sh`
- Confirm absent: `.github/workflows/waldzell-agentic-enhancement.yml`

- [ ] Update the tombstone from its temporary present-tense warning to state
      that the executable sources were removed, remain available in Git
      history, and are unsupported. Keep the link to this plan and provenance
      commits `d9d75bb`, `1937631`, and `41fb5ab`.
- [ ] Delete the five scripts and unused configuration.
- [ ] Run retired-name and `agentic-scripts/` reference checks across all
      tracked files. References are permitted only in
      `agentic-scripts/README.md`, `reynard/RELIABILITY_LAB_PLAN.md`, and
      `reynard/docs/provenance.md`; after Task 7, retired names may also occur
      solely as inert search tokens inside the named retirement-guard step of
      `.github/workflows/reynard-reliability-lab.yml`. Any occurrence elsewhere
      in that workflow, including command position or an invoked path, fails.
      Do not exclude Markdown as a category, because a new quick-start is
      active.
- [ ] While the enforcement workflow is still absent in Task 1, implement the
      allowlist with two `git grep` invocations whose pathspecs exclude only
      those three historical documents: one scans for the five retired
      basenames and one scans for `agentic-scripts/`. Both must return no
      matches after exclusions. Task 7 adds and tests the narrow workflow
      search-token exception.
- [ ] Run `find agentic-scripts -mindepth 1 -print`.
      Expected: exactly `agentic-scripts/README.md`. Also run
      `test ! -L agentic-scripts/README.md` and require exit 0.
- [ ] Commit with `chore: retire unsafe agentic scripts`.

### Task 2: Reduce Reynard to one package

**Files:**

- Delete: `reynard/.spec-orchestrator/`
- Delete: `reynard/.github/`
- Delete: `reynard/.eslintrc.cjs`
- Delete: `reynard/ARCHITECTURE.md`
- Delete: `reynard/archives/`
- Delete: `reynard/datasets/`
- Delete: `reynard/examples/`
- Delete: `reynard/manifests/`
- Delete: `reynard/ops/`
- Delete: `reynard/reynard.config.yaml`
- Delete: `reynard/specs/`
- Delete: `reynard/tests/`
- Delete: `reynard/tsconfig.json`
- Delete: all existing `reynard/packages/forge-*` packages
- Create: the target package/configuration scaffolding and the structural test;
  behavioral source, fixtures, and documentation arrive in later tasks
- Modify: `reynard/package.json`, `reynard/pnpm-workspace.yaml`,
  `reynard/pnpm-lock.yaml`, `reynard/tsconfig.base.json`,
  `reynard/.gitignore`, and `reynard/README.md`
- Create: `reynard/eslint.config.js` and `reynard/vitest.config.ts`

- [ ] Add package scripts `build`, `test:unit`, `test`, `test:integration`,
      `typecheck`, `lint`, `verify`, and `lab`. `test:unit` runs only
      `tests/unit/`; `test:integration` runs only `tests/integration/`; `test`
      runs both; and `verify` runs build, typecheck, explicit-path lint, unit,
      integration, and the retirement guards. Vitest has
      `passWithNoTests: false`; every suite reports a positive count and zero
      skipped/todo tests.
- [ ] Pin Vitest to the existing repository-compatible 1.2.x line and Zod to
      the existing 3.25.x line; do not add a Docker SDK or agent framework.
- [ ] Write a structural test that asserts only the one supported workspace
      package remains.
- [ ] Run the structural test once and confirm it fails before deleting the
      broad scaffold.
- [ ] Delete the obsolete packages and generated completion material. Create
      only the new package manifest, TypeScript project reference, test/lint
      configuration, and structural test in this task; behavioral source files
      are introduced by Tasks 3 through 6.
- [ ] Run the structural test and confirm it passes.
- [ ] Commit with `refactor(reynard): reduce forge to reliability lab`.

### Task 3: Establish contracts and content identity

**Files:**

- Create: `contracts.ts`, `errors.ts`, `canonical-json.ts`, `manifest.ts`, and
  their named tests in the target tree.

- [ ] Write failing tests for valid and invalid candidate definitions, sandbox
      policies, case records, run manifests, traces, and result artifacts.
- [ ] Write a failing canonicalization test proving reordered object keys yield
      the same digest while changed array order yields a different digest.
- [ ] Write a failing identity test proving timestamp and duration changes do
      not alter the run ID.
- [ ] Write failing identity tests proving a seed, source digest, resolved
      image ID/platform, evaluator implementation, dependency lockfile, exact
      Node runtime, input-limit, or sandbox-policy change does alter the run
      ID.
- [ ] Implement the exact interfaces in section 3 with Zod at every file and
      process boundary.
- [ ] Implement recursive canonical JSON with lexicographically sorted object
      keys and native JSON array ordering.
- [ ] Implement SHA-256 digests with Node `crypto`; reject unsupported values
      such as `undefined`, functions, symbols, non-finite numbers, and cycles.
- [ ] Run
      `pnpm --dir reynard test:unit -- contracts canonical-json manifest`.
      Expected: all named tests pass.
- [ ] Commit with `feat(reynard): add validated run contracts`.

### Task 4: Implement the fail-closed Docker runner

**Files:**

- Create: `candidate.ts`, `runner.ts`, `sandbox/docker.ts`,
  `tests/unit/candidate.test.ts`, `tests/unit/docker.test.ts`, and
  `tests/integration/docker.integration.test.ts`.

- [ ] Write a failing unit test for the complete Docker argument vector,
      including every boundary listed in section 3.
- [ ] Write a failing test proving candidate strings are passed as arguments
      and never interpreted by a shell.
- [ ] Write a failing boundary test with a unique sentinel in `expected` and
      prove the sentinel appears in no Docker argument, mount, environment
      variable, stdin payload, stdout, or stderr value.
- [ ] Write failing loader tests for absolute source paths, `..` traversal,
      every symlink, non-regular files, changed bytes, changed relative paths,
      changed execution bits, declared digest mismatch, and mutation between
      validation and execution. Assert that only a verified snapshot is
      mounted and all staging is cleaned.
- [ ] Test every candidate/source/case size and count limit at its boundary and
      one unit over. Read the case file once; a mutation after that read must
      not change its digest, parsed cases, or executed requests.
- [ ] Write failing image tests for mutable tags, absent local images,
      platform mismatch, multi-architecture indexes, and changed resolved
      image IDs. Assert `--pull=never`, the exact platform, and image identity
      in the run manifest.
- [ ] Write failing integration tests for missing Docker, timeout, nonzero
      candidate exit, output overflow, read-only filesystem, and blocked
      network access.
- [ ] Give the network-negative test a positive control: the fixture first
      reaches a test-owned listener on a temporary Docker network, then fails
      to reach it through the production `--network=none` runner. Never skip
      either half.
- [ ] Implement Docker availability and immutable-image validation.
- [ ] Require the pinned fixture image to be present locally. Document and run
      one explicit
      `docker pull --platform=<candidate.platform> <name>@sha256:<digest>`
      setup command, then inspect and record the platform-specific local image
      ID; the evaluator itself must not pull images.
- [ ] Implement one-container-per-case execution with bounded output capture
      and explicit child-process termination on timeout.
- [ ] Assert the exact `--entrypoint`/post-image argument split and that
      timeout, overflow, SIGINT, SIGTERM, and every failure force-remove the
      named container and leave no cidfile or staging snapshot.
- [ ] Test next-run recovery of lab-namespaced stale state left by simulated
      SIGKILL/host death; validated bundles and unrelated state are untouched.
- [ ] Map every preflight and post-start boundary failure to the typed error
      and exit phase defined in section 3; do not skip or downgrade it.
- [ ] Run `pnpm --dir reynard test:unit -- candidate docker`, then
      `pnpm --dir reynard test:integration -- docker`.
      Expected: the real Docker tests pass, including the negative egress case.
- [ ] Commit with `feat(reynard): run candidates in locked-down Docker`.

### Task 5: Implement evaluation, comparison, and artifacts

**Files:**

- Create: `evaluator.ts`, `compare.ts`, `artifacts.ts`, and their named tests.

- [ ] Write failing tests for empty case sets, duplicate case IDs, malformed
      JSONL, missing execution results, extra results, invalid JSON output,
      expected-output mismatch, and candidate regression.
- [ ] Define V1 equality as structural JSON equality after parsing one JSON
      value per output line; textual formatting differences do not fail.
- [ ] Implement deterministic per-case results and a logical-result digest.
- [ ] Implement baseline comparison that reports any newly failing required
      case. Overall CLI success still requires the candidate to pass every
      required golden case; a failure already present in the baseline never
      permits the candidate to fail. Measured latency is recorded but is not a
      V1 pass/fail criterion.
- [ ] Reader-validate every artifact and recompute the case ordering,
      evaluations, digests, comparison, and overall status before publication
      and again when reading an existing bundle.
- [ ] Write artifacts into a unique temporary sibling, validate all four, and
      implement the absent/matching/mismatching/concurrent-target behavior in
      section 2. Existing targets are never replaced.
- [ ] Inject validation, write, and rename failures and prove exit 6 preserves
      a mismatched target byte-for-byte while leaving no final directory for a
      new run and no temporary sibling in either case.
- [ ] Unit-test matching repeat and concurrent-writer races. Both invocations
      perform execution; one publishes and the other validates/accepts the
      same logical bundle. A mismatch exits 6 without altering the winner.
- [ ] Test that `overallPassed` is false when baseline and candidate share a
      failure even though `comparison.noNewRegressions` is true.
- [ ] Run `pnpm --dir reynard test:unit -- evaluator compare artifacts`.
      Expected: all named tests pass.
- [ ] Commit with `feat(reynard): evaluate and compare candidate runs`.

### Task 6: Prove the vertical slice through the CLI

**Files:**

- Create: `cli.ts`, `index.ts`,
  `tests/integration/acceptance.integration.test.ts`, and every file under
  `reynard/fixtures/echo/`.
- Modify: package scripts in `reynard/package.json` and the package manifest.

- [ ] Commit baseline, candidate, and regressed definitions that all use the
      same explicitly pinned Node image, declare `linux/amd64`, and mount their
      source read-only. The baseline and candidate echo normalized JSON; the
      regressed variant deliberately mishandles one documented case.
- [ ] Add at least five meaningful cases covering objects, arrays, Unicode,
      booleans, and nested values.
- [ ] Add a deliberately regressed candidate variant used only by the negative
      acceptance test.
- [ ] Write the acceptance test to invoke the public CLI in Docker, inspect
      all four written artifacts, and assert their schemas and relationships.
- [ ] Write the regression acceptance test and assert exit code 5.
- [ ] Implement CLI parsing with Node `util.parseArgs`; do not add a CLI
      framework.
- [ ] From two separate empty temporary working directories, run the public
      CLI with the same pinned baseline, candidate, cases, seed, policy,
      evaluator build, dependency lock, Node runtime, and resolved platform.
      Assert both runs execute every case, exit 0, and produce the same run ID
      and logical-result digest.
- [ ] Run the regressed candidate. Expected: exit 5 with the failing case IDs.
- [ ] Run the regressed fixture as both baseline and candidate. Expected: exit
      5, the same named failed cases, `noNewRegressions: true`,
      `overallPassed: false`, and a complete validated failure bundle.
- [ ] Execute the invalid-input matrix through the public CLI: missing
      `--candidate`, mutable `candidate.image`, empty cases, malformed JSONL,
      duplicate case ID, source traversal, and source-digest mismatch. Each
      exits 2 and stderr names the field or JSONL line.
- [ ] With Docker absent, assert exit 3, no run directory, and an untouched
      host sentinel. First execute the safe fixture directly in a temporary
      test directory and prove it creates the sentinel, then remove it; only
      then run the CLI without Docker and prove it remains absent. With the
      pinned image absent, assert exit 3, no `docker run` or `docker pull`, and
      no run directory.
- [ ] Commit with `feat(reynard): prove reliability lab vertical slice`.

### Task 7: Make verification operational

**Files:**

- Create: `.github/workflows/reynard-reliability-lab.yml`
- Modify: `reynard/README.md`
- Create: `reynard/docs/architecture.md`,
  `reynard/docs/deferred-capabilities.md`, and
  `reynard/docs/provenance.md`

- [ ] Trigger the retirement guard and Reynard verification on every pull
      request and push, without a paths filter, so reintroducing a retired file
      or callsite anywhere cannot bypass the guard.
- [ ] Use `working-directory: reynard`, Node 20, pnpm 9, dependency caching,
      and the runner's real Docker daemon.
- [ ] Run `pnpm install --frozen-lockfile`, explicitly run the same
      platform-qualified pinned-image pull and inspection documented for local
      setup, and then run `pnpm verify`; do not provide model or infrastructure
      secrets.
- [ ] Run the exact-tree and retired-reference checks from Task 1 in CI. The
      enforcement workflow may contain retired names only as search tokens in
      that guard step and is excluded from its own reference scan; direct Bash
      invocation forms in the workflow are checked separately and forbidden.
- [ ] Document the supported CLI, artifact meanings, exit codes, sandbox
      boundary, and local verification commands.
- [ ] Document that commits `d9d75bb`, `1937631`, and `41fb5ab` are historical
      sources, not verified releases.
- [ ] Run `actionlint .github/workflows/reynard-reliability-lab.yml`.
      Expected: exit 0 with no findings.
- [ ] Run `pnpm --dir reynard verify` twice from a clean checkout.
      Expected: build, typecheck, lint, unit tests, and real Docker acceptance
      tests pass both times.
- [ ] Prove `pnpm --dir reynard verify` in the README and `pnpm verify` under
      CI's `working-directory: reynard` resolve to the same package script.
      CI declares no secrets or service containers and its log names the real
      Docker integration tests with positive counts and zero skips/todos.
- [ ] Add a production-source guard that forbids static host network imports,
      global `fetch`, all dynamic imports/evaluation, and network-capable child
      commands such as `curl`, `wget`, or arbitrary executables. The only
      child executable permitted in production is the fixed Docker CLI path,
      whose argument tests require `--pull=never` and `--network=none`. The
      fixture-only positive-control probe is the documented exception.
- [ ] Run the repository's existing root workspace tests and record unrelated
      failures separately; do not weaken Reynard gates to accommodate them.
- [ ] Commit with `ci(reynard): verify the real reliability path`.

## 6. Acceptance criteria

The plan is complete only when all statements are true:

- [ ] `find agentic-scripts -mindepth 1 -print` outputs exactly
      `agentic-scripts/README.md`, which is not a symlink; the final-state
      retired-reference rule in Task 1 reports no unexpected occurrence, and
      no workflow, package script, quick-start, or source file invokes a
      retired program.
- [ ] pnpm workspace discovery reports exactly
      `@waldzellai/agent-reliability-lab` at
      `packages/agent-reliability-lab`. No `packages/forge-*`,
      `.spec-orchestrator`, nested `.github`, `archives`, `datasets`,
      `examples`, `manifests`, `ops`, `specs`, or legacy root test/config path
      listed in Task 2 remains under `reynard/`.
- [ ] Unit and integration suites each report a positive count and zero
      skipped/todo tests; a Vitest filter matching no files exits nonzero.
      `pnpm --dir reynard verify` includes both suites and the real Docker path.
- [ ] Each invalid-input case in Task 6 exits 2 and stderr names the implicated
      field or line: missing `--candidate`, mutable `candidate.image`, empty
      `cases`, malformed `line N`, duplicate `case id`, traversing
      `source.relativePath`, or mismatched `source.digest`.
- [ ] With Docker absent, the public CLI exits 3, writes no run directory, and
      leaves the host-execution sentinel absent after the same safe fixture's
      direct positive control created it and the test removed it. With the
      pinned local image absent it exits 3, performs no run or pull, and writes
      no run.
- [ ] Nonzero candidate exit, timeout, output overflow, or handled
      SIGINT/SIGTERM after start exits 4 and leaves no final bundle, container,
      cidfile, snapshot, or artifact staging directory. Next-run recovery
      removes lab-owned stale state from simulated SIGKILL/host death without
      touching validated or unrelated state.
- [ ] The network test proves its fixture can reach a test-owned listener on a
      temporary Docker network, then proves the production runner blocks the
      same attempt with `--network=none`; neither half is skipped.
- [ ] Two executions from separate empty run directories, with the same pinned
      baseline, candidate, case file, evaluator identity, seed, sandbox policy,
      Node runtime, dependency lock, and resolved image platform, execute every
      case and produce the same run ID and logical-result digest.
- [ ] Changing any declared identity input—including resolved image ID or
      platform—changes the run ID.
- [ ] A deliberately regressed candidate exits 5, names failed cases, and
      writes a validated failure bundle. Using it as both baseline and
      candidate still exits 5 with `noNewRegressions: true` and
      `overallPassed: false`; baseline failure is never a waiver.
- [ ] Exit-0 and exit-5 runs each write four artifacts that pass every
      reader-side schema, ordering, run-ID, reevaluation, digest, comparison,
      and overall-status invariant in section 2.
- [ ] Injected artifact validation, write, rename, mismatch, and concurrent
      race paths follow section 2: exit 6 on failure, preserve any existing
      target byte-for-byte, and leave no temporary sibling.
- [ ] After dependency and pinned-image setup, evaluation succeeds with model,
      telemetry, API, and application-service credential variables absent.
      The production-source network/child-process guard from Task 7 passes; CI
      declares no secrets or service containers.
- [ ] README and CI resolve to the same `verify` package script. The CI log for
      the handed-off commit proves the named real-Docker tests ran with zero
      skips and records the acceptance command documented for local use.
- [ ] The final handoff lists exact commands, exit codes, and artifact paths;
      no self-assigned quality percentage is used.

## 7. Verification evidence required at handoff

The implementation handoff must include:

| Evidence | Required observation |
|---|---|
| `git status --short` after final commit | No output |
| Exact `find` and retired-reference allowlist | README only; no unexpected callsite |
| pnpm workspace discovery plus forbidden-path check | One named package; all legacy paths absent |
| Direct `tsc --noEmit` and ESLint over explicit source/test paths | Both exit 0 |
| Unit Vitest suite | Positive count, zero failures/skips/todos |
| Integration Vitest suite against real Docker | Positive named count, zero failures/skips/todos |
| Deliberate no-test-match Vitest invocation | Nonzero exit |
| Build plus built CLI invocation | Emitted CLI exists and executes its help/validation path |
| Invalid-input matrix | Every case exits 2 and names its field or line |
| Docker-absent sentinel and missing-local-image tests | Exit 3, no host run/pull/artifacts |
| Started-execution failure matrix | Exit 4 and no leaked runtime or artifact state |
| Network positive control plus production runner | Control connects; `network=none` attempt fails |
| Two empty-directory passing runs | Every case executes; same run ID and logical digest |
| Regressed and shared-failure runs | Exit 5, named cases, valid bundle, correct booleans |
| Artifact recomputation and injected-write matrix | All invariants hold; failures exit 6 without mutation/leaks |
| `actionlint .github/workflows/reynard-reliability-lab.yml` | Exit 0 |
| Root `npm test` | Command and exit code recorded; unrelated failures remain explicit |
| GitHub Actions URL for exact commit SHA | `pnpm verify` and named Docker tests ran with zero skips |

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Docker behavior differs across macOS and Linux | Pin `linux/amd64`, include resolved platform/image identity, and require the real acceptance path on a developer machine and Ubuntu CI |
| Timing makes byte-for-byte artifacts unstable | Exclude timestamps and durations from identity and compare normalized logical results |
| Container output exhausts host memory | Enforce byte limits while streaming and terminate the child on overflow |
| Mutable or multi-architecture image resolution undermines replay | Reject mutable references, require a platform-qualified pull, and hash the resolved image ID and platform |
| V1 records source/image identity but does not archive their bytes | State that replay requires digest-matching source and the resolved local image; add archival only as a separately approved capability |
| Sandbox flags imply stronger isolation than Docker provides | Document Docker as the V1 boundary and make no claim of hostile multi-tenant isolation |
| Broad ADAS features creep back into the first slice | Enforce the deferred-capabilities list during review |
| Existing repository failures obscure the new path | Keep a dedicated `pnpm verify` gate and report root failures without converting them into skips |

## 9. Rollback

The retirement and revival use atomic commits and introduce no database,
credential, or external-infrastructure migration. If implementation is
abandoned before merge, keep the Bash tombstone and workflow deletion and
discard only the unapproved revival commits. After merge, revival commits can
be reverted independently. Restoring the retired scripts or deleted workflow
is not a rollback path; it requires a new, explicit security decision outside
this plan. Historical sources remain available at the recorded commits, while
generated `reynard/runs/` artifacts can be removed without affecting source
state.

## 10. Review decision

Approval of this plan authorizes the seven tasks above in order. It does not
authorize any deferred capability, cloud resource, credential use, deployment,
or automatic promotion mechanism. Requested changes should be made in this
file and re-reviewed before implementation begins.
