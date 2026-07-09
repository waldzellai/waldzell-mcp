# Agentic Scripts — Retired Prototype

> **ARCHIVED — DO NOT RUN**
>
> The Bash programs in this directory are an unsupported 2025 experiment. They
> can emit fabricated success reports, transmit broad repository or host data,
> mutate files, and execute model-generated shell commands. They are retained
> temporarily only while the retirement plan is reviewed.

The scheduled and manually dispatched GitHub Actions workflow that referenced
these programs was removed on 2026-07-09. No script in this directory is a
supported development, debugging, security, memory, or optimization tool.

## Decision

- Do not execute these scripts locally or in CI.
- Do not provide them with API keys, production logs, credentials, or host
  access.
- Do not repair them incrementally.
- Use Git history, beginning with commit `d9d75bb`, as the source archive.
- Review [the Reynard Reliability Lab plan](../reynard/RELIABILITY_LAB_PLAN.md)
  before removing the files or beginning replacement work.

## Why this was retired

The useful idea was to generate or select candidate agent systems, run them
under constraints, evaluate them against real tasks, and retain inspectable
artifacts. The implementation never established that loop:

- the ADAS script generated Bash without benchmarking or selection;
- the security modes returned predetermined findings instead of scanning code;
- the debugger could execute model-generated remediation commands;
- the tuner measured help invocations and could edit scripts by default;
- the memory restore path extracted archives at filesystem root; and
- the automation referenced incorrect paths and scripts that did not exist.

The replacement, if approved, is deliberately narrower: one existing
executable candidate, a fail-closed Docker boundary, real golden cases,
content-addressed manifests and traces, deterministic replay, and comparison
with a baseline. Generation, self-modification, UI, and autonomous promotion
remain out of scope until that acceptance path is real.

## Historical provenance

- `d9d75bb` introduced the Bash bundle and orchestration workflow.
- `1937631` introduced the original Reynard Forge scaffold.
- `41fb5ab` expanded Reynard while retaining simulated verification paths.

Git preserves the original executable sources and their history; keeping them
active is not required for archaeology.
