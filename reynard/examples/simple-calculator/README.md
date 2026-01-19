# Simple Calculator Example

This example demonstrates a basic Reynard Forge workflow for building a simple calculator agent.

## Setup

```bash
# Initialize project
forge init --name simple-calculator --template blank

# Set API keys
export OPENAI_API_KEY=sk-...
# or
export ANTHROPIC_API_KEY=sk-ant-...
```

## Generate Specification

```bash
forge spec "Build a calculator that can add, subtract, multiply, and divide two numbers"
```

This creates `spec.json`:
```json
{
  "name": "simple-calculator",
  "description": "Build a calculator that can add, subtract, multiply, and divide two numbers",
  "ioSchemas": {
    "input": {
      "type": "object",
      "properties": {
        "operation": { "type": "string", "enum": ["add", "subtract", "multiply", "divide"] },
        "a": { "type": "number" },
        "b": { "type": "number" }
      }
    },
    "output": {
      "type": "object",
      "properties": {
        "result": { "type": "number" }
      }
    }
  },
  "tools": [
    { "id": "calculator", "sideEffect": "none" }
  ],
  "slas": { "latencyMs": 100 },
  "safety": { "allowEgress": false, "pii": false }
}
```

## Generate Candidates

```bash
forge propose --num 3
```

Creates:
- `proposals/candidate-001/`
- `proposals/candidate-002/`
- `proposals/candidate-003/`

Each with `manifest.json`, `src/`, and `tests/`.

## Evaluate

```bash
forge eval --project simple-calculator --smoke
```

Runs functional, chaos, and idempotency suites. Creates:
- `results/candidate-001-metrics.json`
- `results/candidate-002-metrics.json`
- `results/candidate-003-metrics.json`

## Security Test

```bash
forge redteam
```

Tests for prompt injection, tool misuse, etc. Creates:
- `results/candidate-001-redteam.json`
- ...

## Select Winner

```bash
forge select --max 1
```

Uses Pareto frontier to select the best candidate. Creates `winners.json`.

## View Results

```bash
forge ui
```

Opens web interface at `http://localhost:5173` to compare candidates visually.

## Expected Results

The system should:
1. Generate 3 unique candidate implementations
2. All pass functional tests (100% accuracy on basic operations)
3. Have low latency (< 100ms P95)
4. Pass security tests (no injection vulnerabilities)
5. Select the best balance of performance/novelty/complexity
