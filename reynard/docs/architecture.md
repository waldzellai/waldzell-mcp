# Reliability Lab Architecture

## Supported slice

The V1 system is a deterministic evaluator, not an agent builder. Its public
surface is one `evaluate` command and one package. Inputs are two candidate
definitions, one immutable JSONL case file, and an explicit seed. Outputs are a
content-addressed four-file bundle or a phase-specific nonzero exit.

The execution path is deliberately linear:

1. Parse and bound the CLI inputs and case bytes.
2. Resolve candidate source beneath each definition, reject symlinks and
   traversal, verify the declared digest, and copy a private snapshot.
3. Check the fixed Docker executable and daemon, recover only lab-owned stale
   state, and inspect the already-local digest-pinned image and platform.
4. Run every baseline case and then every candidate case in a fresh locked-down
   container. Golden expected values never enter either container.
5. Normalize protocol output and evaluate both sides on the host.
6. Compare candidate failures with baseline failures without treating a shared
   baseline failure as a waiver.
7. Compute the run identity and atomically publish or revalidate the four
   artifacts under `runs/<sha256:...>/`.

Candidate execution stops before publication on infrastructure or runtime
failure. A baseline execution failure stops before the candidate begins.

## Identity and artifacts

The run ID covers the candidate definitions and source digests, resolved local
image IDs and platforms, case digest, evaluator build digest, dependency lock,
exact Node runtime, seed, input limits, and sandbox policy. Timestamps,
durations, absolute host paths, and log formatting do not affect identity.
Logical-result digests provide the deterministic replay comparison even though
diagnostic durations may differ.

The bundle contains `manifest.json`, `baseline.trace.jsonl`,
`candidate.trace.jsonl`, and `result.json`. Reader-side validation recomputes
the run ID, trace ordering, requests, evaluations, logical digests, comparison,
and overall status. Publishing is an atomic no-overwrite operation; validated
existing output is reused and invalid existing output is preserved for
inspection rather than replaced.

## Trust boundaries

The host owns input validation, expected answers, evaluation, comparison, and
artifact publication. Candidate code is copied to a verified private snapshot
and mounted read-only at `/candidate`. It receives one bounded request per
one-shot container and no expected answer, host environment, credential, Docker
socket, or host execution fallback.

Docker is invoked only through a fixed platform mapping: macOS uses
`/usr/local/bin/docker`, Linux uses `/usr/bin/docker`, and other platforms fail
closed. There is no `PATH` discovery or configurable executable. Production
source has one statically guarded child-process call in the Docker adapter. The
guard rejects host network imports, global `fetch`, dynamic import/evaluation,
other child-process imports, and any nonconforming child invocation. Unit tests
lock the Docker argument vector, including `--pull=never` and
`--network=none`.

CI's pull is platform-qualified, while image inspection omits the
Docker-28.1-only `--platform` flag for hosted-runner compatibility. The adapter
then verifies the returned OS and architecture and rejects image indexes or
multiple/ambiguous results. A reused image store that resolves the index digest
to another variant therefore fails closed instead of silently changing replay
identity.

The committed sandbox policy also enforces a read-only root, non-root numeric
user, CPU/memory/PID/time/output limits, dropped capabilities,
`no-new-privileges`, bounded tmpfs, verified read-only source mount, container
name, and cidfile cleanup. Recovery is namespace-scoped and preserves unrelated
containers, files, active snapshots, and validated bundles.

This is not a claim that Docker safely hosts hostile multi-tenant workloads.
The supported deployment is a dedicated operator-controlled runner. V1 records
source and image identity but does not archive their bytes, so replay requires
the digest-matching source and preloaded resolved image.

## Operational gates

`pnpm verify` is the single gate. It builds, typechecks, lints, runs the
production-source guard, unit tests, real-Docker integration/acceptance tests,
and retirement guard. CI preloads and inspects the exact pinned image before
running that script. The retirement guard asserts the exact README-only retired
tree, scans all tracked files with only three historical-document exceptions,
and separately permits inert search tokens in its named workflow step while
forbidding their invocation.
