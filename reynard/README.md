# Reynard Reliability Lab

Reynard is one supported package, `@waldzellai/agent-reliability-lab`. It runs
already-built baseline and candidate programs in a fail-closed Docker sandbox,
evaluates deterministic JSONL golden cases, and writes a content-addressed
evidence bundle. It does not generate or promote candidates.

The implementation boundary is described in
[architecture.md](./docs/architecture.md). Historical sources and their limits
are recorded in [provenance.md](./docs/provenance.md); features intentionally
outside V1 are listed in
[deferred-capabilities.md](./docs/deferred-capabilities.md).

## Prerequisites and pinned image

Use Node 20 and the workspace-pinned `pnpm@9.0.0`. Docker must be available at
the fixed path for the host platform:

- macOS: `/usr/local/bin/docker`
- Linux: `/usr/bin/docker`

Other host platforms fail closed. Reynard never searches `PATH` for an
alternative executable and never pulls during an evaluation. The Docker daemon
must be reachable through `/var/run/docker.sock`.

From `reynard/`, install dependencies and preload the only acceptance image:

```bash
pnpm install --frozen-lockfile
docker pull --platform=linux/amd64 node@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
docker image inspect node@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 --format '{{.Id}} {{.Os}}/{{.Architecture}}'
```

The inspection used by the committed fixtures resolves to image ID
`sha256:11cedc39e663e7c5d5cb9cc77a461a0d2adc25537b94e6831a6108f09cb2001b`
and platform `linux/amd64`. A missing image, different platform, or different
resolved image ID is an infrastructure failure; the lab does not pull or run a
substitute.

The inspect command intentionally omits Docker's newer `--platform` option so
the gate works with the Docker 28.0 client on hosted Ubuntu runners. The
preceding pull is platform-qualified, and Reynard independently rejects an
inspected index, OS/architecture mismatch, or changed image ID. If a reused
multi-platform image store resolves this index digest to another variant, the
lab fails closed with exit 3; use a clean, dedicated runner image store rather
than weakening inspection.

No model, telemetry, application-service, registry, or infrastructure
credential is required.

## Supported CLI

Build and run the deterministic fixture from `reynard/`:

```bash
pnpm run build
pnpm lab -- evaluate \
  --baseline fixtures/echo/baseline/candidate.json \
  --candidate fixtures/echo/candidate/candidate.json \
  --cases fixtures/echo/goldens.jsonl \
  --seed 0
```

`evaluate` is the only command. All four flags are required. Candidate images
must be digest-pinned, candidate source must match its declared digest, case IDs
must be unique, and the seed must be a safe integer. Each candidate receives
only `schemaVersion`, `caseId`, `seed`, and `input`; golden `expected` values
remain on the host.

The command writes to `runs/<run-id>/` under the invocation's current working
directory. The committed `runs/.gitkeep` preserves the local output directory;
generated bundles are operator artifacts and should not be committed.

## Artifacts and exit codes

A completed exit-0 or exit-5 evaluation has exactly four files:

| Artifact | Meaning |
| --- | --- |
| `manifest.json` | Content identity for evaluator code, dependency lock, Node runtime, seed, cases, candidates, resolved images, limits, and sandbox policy. |
| `baseline.trace.jsonl` | Ordered, schema-validated per-case baseline requests and normalized outcomes. |
| `candidate.trace.jsonl` | Ordered, schema-validated per-case candidate requests and normalized outcomes. |
| `result.json` | Baseline and candidate evaluations, comparison, failed case IDs, logical digests, and overall status. |

An existing bundle is accepted only after its schemas, ordering, run ID,
digests, reevaluation, comparison, and overall status are recomputed. Publishing
uses a temporary sibling and atomic rename; a failed validation or publish does
not replace an existing bundle.

| Exit | Meaning | Final bundle |
| ---: | --- | --- |
| `0` | Candidate passed every golden case and the comparison. | Yes |
| `2` | CLI, candidate definition/source, seed, or case input is invalid. | No |
| `3` | Fixed Docker binary/daemon or pinned local image/platform is unavailable. | No |
| `4` | A started execution failed, timed out, overflowed output, or received handled `SIGINT`/`SIGTERM`. | No |
| `5` | Protocol, golden-case, baseline, or regression evaluation failed. This is a completed evaluation, not an infrastructure error. | Yes |
| `6` | Bundle validation or atomic publication failed. | No new bundle |

Exit code `1` is not part of the public result contract.

## Sandbox boundary

The runner uses Docker as the V1 isolation boundary. It starts one container per
case with an argument array and `shell: false`, the exact declared platform,
`--pull=never`, `--network=none`, a read-only root, a read-only verified source
snapshot, numeric UID/GID `65532:65532`, one CPU, 256 MiB memory, 64 PIDs,
dropped capabilities, `no-new-privileges`, bounded output, a five-second
timeout, and a 16 MiB writable tmpfs. It passes no host credentials or inherited
environment and never mounts the Docker socket into a candidate.

Docker is not claimed to be a hostile multi-tenant security boundary. V1 is
for deterministic evaluation of operator-selected programs on a dedicated
runner. Replay also requires the digest-matching source and pinned local image;
V1 records their identities but does not archive their bytes.

The fixture-only host and network probes are positive controls used by the real
integration suite. They are never selected by the production CLI implicitly,
and production candidate execution always retains `--network=none`.

## Verification

From the repository root, run:

```bash
pnpm --dir reynard verify
```

From `reynard/`, the equivalent command is:

```bash
pnpm verify
```

Both resolve to the same `verify` script in `reynard/package.json`. CI uses
`working-directory: reynard` and runs the second form after the same pinned
image pull and inspection. The gate builds, typechecks, lints, checks production
source for network/evaluation/child-process escape hatches, runs positive-count
unit and real-Docker integration suites, and enforces the retired-tree and
tracked-reference boundary. No suite is allowed to succeed with zero matches.

The workflow runs on every push and pull request without path filters and
declares no secrets or service containers.
