# Agentic Scripts — Retired Prototype

> **ARCHIVED — DO NOT RUN**
>
> The Bash programs formerly stored in this directory were an unsupported 2025
> experiment. They could emit fabricated success reports, transmit broad
> repository or host data, mutate files, and execute model-generated shell
> commands. Their executable sources have been removed from the supported tree
> and remain available only through Git history.

The scheduled and manually dispatched GitHub Actions workflow that referenced
these programs was removed on 2026-07-09. This directory intentionally contains
no executable development, debugging, security, memory, or optimization tool.

## Decision

- Do not execute these scripts locally or in CI.
- Do not provide them with API keys, production logs, credentials, or host
  access.
- Do not repair them incrementally.
- Use Git history, beginning with commit `d9d75bb`, as the source archive.
- Follow [the approved Reynard Reliability Lab plan](../reynard/RELIABILITY_LAB_PLAN.md)
  for replacement work.

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

Git preserves the removed executable sources and their history; restoring them
would require a new, explicit security decision.
