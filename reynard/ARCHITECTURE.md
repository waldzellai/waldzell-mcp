# Reynard Forge Architecture

## Overview

Reynard Forge is an **Agentic Design Automation System (ADAS)** for evolving LLM-powered agents through quality-diversity search. It automates the discovery, evaluation, and selection of novel agent architectures.

## System Layers

### 1. Foundation Layer

Core primitives and infrastructure for the entire system.

**forge-core** - Type system, validation, hashing, novelty scoring
- `GraphSpec`, `NodeSpec`, `CandidateManifest` types
- Zod schemas for validation
- Deterministic hashing for reproducibility
- Behavioral novelty scoring

**forge-ledger** - Intent-based idempotency tracking
- Prepare-commit protocol for side effects
- Crash-safe persistence (fsync)
- Data integrity (checksums)
- Concurrency control (locks)

**forge-sandbox** - Isolated code execution
- Docker-based isolation
- Resource limits (CPU, memory)
- Network egress control
- Volume mounts for writable areas

**forge-contracts** - Semantic versioning gates
- Contract test discovery & execution
- Semver bump suggestions (major/minor/patch)
- Integration with candidate evaluation

### 2. Execution Layer

**forge-exec** - Graph execution engine
- Topological sorting for node order
- Cycle detection
- Node execution (tool, LLM, router, critic)
- Behavioral trace generation
- Ledger integration for idempotency

### 3. Evaluation Layer

**forge-eval** - Multi-suite evaluation system
- **Functional Suite**: Golden test cases, accuracy, error rates
- **Chaos Suite**: Latency P95, chaos divergence, retry hygiene
- **Idempotency Suite**: Violation detection, replay correctness
- Aggregated metrics and scoring

**forge-redteam** - Security testing
- 9 built-in attack scenarios
- Categories: prompt injection, tool misuse, egress escalation, PII extraction
- Severity-based filtering (critical/high/medium/low)
- Finding reports with evidence

### 4. Generation Layer

**forge-proposer** - LLM-powered candidate generation
- **SpecWizard**: TaskSpec completion & validation
- **Planner**: LLM call to generate GraphSpec
- **Coder**: Code scaffolding & manifest generation
- **Providers**: OpenAI & Anthropic integration
- Deterministic generation with seeds

### 5. Interface Layer

**forge-ui** - Operator web interface
- RunsList: View evaluation runs
- CandidateCompare: Side-by-side comparison
- TraceViewer: Execution flow inspection
- MetricsDisplay: Visual metric reporting
- RedteamFindings: Security vulnerability display

**forge-cli** - Command-line interface
- `init`: Project scaffolding
- `spec`: Specification generation
- `propose`: Candidate generation
- `eval`: Run evaluation suites
- `redteam`: Security testing
- `select`: Pareto frontier selection
- `reproduce`: Deterministic replay
- `ui`: Launch web interface

## Workflow

```
┌─────────────────────────────────────────────────┐
│ 1. SPECIFICATION                                │
│    forge spec "Build an MCP server"             │
│    → TaskSpec.json                              │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│ 2. GENERATION                                   │
│    forge propose --num 5                        │
│    → proposals/candidate-{id}/                  │
│       ├── manifest.json (deterministic hash)    │
│       ├── src/                                  │
│       └── tests/                                │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│ 3. EXECUTION & EVALUATION                       │
│    forge eval --smoke                           │
│    → results/{id}-metrics.json                  │
│       ├── Functional: accuracy, errors          │
│       ├── Chaos: latency, divergence            │
│       └── Idempotency: violations               │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│ 4. SECURITY TESTING                             │
│    forge redteam                                │
│    → results/{id}-redteam.json                  │
│       └── Findings: category, severity          │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│ 5. SELECTION                                    │
│    forge select --max 3                         │
│    → winners.json                               │
│       └── Pareto frontier                       │
│          (performance, novelty, complexity)     │
└─────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Determinism
- All generation uses seeds for reproducibility
- Deterministic hashing for manifests
- Same seed → same manifest hash

### 2. Idempotency
- Prepare-commit protocol for side effects
- Intent ledger for replay protection
- Crash-safe with fsync

### 3. Isolation
- Sandboxed execution in Docker
- Resource limits enforced
- Network egress controlled

### 4. Quality-Diversity
- Pareto frontier for multi-objective selection
- Behavioral novelty scoring
- Size penalty for complexity

### 5. Observability
- Complete behavioral traces
- Aggregated metrics
- Security findings with evidence

## Package Dependencies

```
forge-cli
  ├── forge-proposer
  │   └── forge-core
  ├── forge-exec
  │   ├── forge-core
  │   ├── forge-ledger
  │   └── forge-sandbox
  ├── forge-eval
  │   ├── forge-core
  │   └── forge-exec
  ├── forge-redteam
  │   ├── forge-core
  │   └── forge-exec
  ├── forge-contracts
  │   └── forge-core
  └── forge-ui
      ├── forge-core
      ├── forge-eval
      └── forge-redteam
```

## Configuration

`reynard.config.yaml`:
```yaml
project: my-project
models:
  planner: { provider: openai, name: gpt-4.1, temperature: 0.2 }
  coder: { provider: openai, name: gpt-4.1, temperature: 0.3 }
  grader: { provider: openai, name: gpt-4o-mini, temperature: 0.0 }
  attacker: { provider: anthropic, name: claude-3-haiku, temperature: 0.7 }
sandbox:
  driver: docker
  cpuMsLimit: 20000
  memMB: 2048
budgets:
  maxNodes: 18
  maxToolKinds: 6
  maxLOC: 2500
```

## Extension Points

1. **Custom Providers**: Add new LLM providers in `forge-proposer/src/providers/`
2. **Custom Suites**: Add evaluation suites in `forge-eval/src/suites/`
3. **Custom Attacks**: Add security scenarios in `forge-redteam/src/scenarios.ts`
4. **Custom Drivers**: Add sandbox drivers in `forge-sandbox/src/drivers/`

## Future Enhancements

- Parallel candidate generation (N-way concurrency)
- LLM call caching for cost reduction
- Real-time UI updates via WebSockets
- Distributed evaluation across workers
- Multi-generation evolution with crossover
