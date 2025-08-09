# Reynard Forge v0.2 (bootstrap)

Goal: robust ADAS that outputs MCP servers + LangGraph-style workflows and **survives chaos**.

## Quickstart
```bash
pnpm i
pnpm build
pnpm dev:cli

Commands (via forge-cli)
	•	forge init
	•	forge spec
	•	forge propose
	•	forge eval
	•	forge redteam
	•	forge select
	•	forge reproduce --manifest <path>
	•	forge ui

NOTE: This is a scaffold. Stubs include TODOs marking the hardening work.

---

## CI stubs

### `.github/workflows/build-and-test.yml`
```yaml
name: build-and-test
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm i
      - run: pnpm typecheck
      - run: pnpm build
      - run: pnpm lint
```

### `.github/workflows/eval-basic.yml`
```yaml
name: eval-basic
on:
  push:
    branches: [main]
jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm i
      - run: pnpm --filter forge-cli run eval:smoke
```