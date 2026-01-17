# Reynard Forge

**Agentic Design Automation System (ADAS)** for evolving LLM-powered agents through quality-diversity search.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is Reynard Forge?

Reynard Forge automates the discovery, evaluation, and selection of novel agent architectures. Instead of manually designing one agent, generate hundreds of candidates, evaluate them rigorously, and select the best using multi-objective optimization.

### Key Features

- 🎯 **Automated Generation**: LLM-powered planner + coder creates full agent implementations
- 🔬 **Comprehensive Evaluation**: Functional correctness, chaos resilience, idempotency
- 🔒 **Security Testing**: 9 built-in red team scenarios for vulnerability detection
- 📊 **Quality-Diversity**: Pareto frontier selection balancing performance, novelty, complexity
- 🔁 **Deterministic Replay**: Seeds + model pins = reproducible results
- 🎨 **Operator UI**: Visual comparison and analysis of candidates

## Architecture

Reynard Forge is organized into 6 layers across 10 packages:

```
┌─────────────────────────────────────────────────┐
│ Interface Layer                                 │
│  • forge-cli: Command-line interface            │
│  • forge-ui: Web-based operator interface       │
├─────────────────────────────────────────────────┤
│ Generation Layer                                │
│  • forge-proposer: LLM-powered generation       │
├─────────────────────────────────────────────────┤
│ Evaluation Layer                                │
│  • forge-eval: Multi-suite evaluation           │
│  • forge-redteam: Security testing              │
├─────────────────────────────────────────────────┤
│ Execution Layer                                 │
│  • forge-exec: Graph execution engine           │
├─────────────────────────────────────────────────┤
│ Foundation Layer                                │
│  • forge-core: Types, validation, hashing       │
│  • forge-ledger: Idempotency tracking           │
│  • forge-sandbox: Isolated execution            │
│  • forge-contracts: Semantic versioning         │
└─────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed design.

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/reynard-forge.git
cd reynard-forge/reynard

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Install CLI globally (optional)
pnpm link --global forge-cli
```

### Basic Workflow

```bash
# 1. Initialize project
forge init --name my-agent --template blank

# 2. Set API key
export OPENAI_API_KEY=sk-...

# 3. Generate specification
forge spec "Build an MCP server for weather data"

# 4. Generate candidates
forge propose --num 5

# 5. Evaluate
forge eval --smoke

# 6. Security test
forge redteam

# 7. Select winners
forge select --max 3

# 8. View results
forge ui
```

## Configuration

Create `reynard.config.yaml`:

```yaml
project: my-agent
models:
  planner:
    provider: openai
    name: gpt-4.1
    temperature: 0.2
  coder:
    provider: openai
    name: gpt-4.1
    temperature: 0.3
  grader:
    provider: openai
    name: gpt-4o-mini
    temperature: 0.0
  attacker:
    provider: anthropic
    name: claude-3-haiku
    temperature: 0.7
sandbox:
  driver: docker
  cpuMsLimit: 20000
  memMB: 2048
  networkEgress: allowlist
  egressAllowlist: []
budgets:
  maxNodes: 18
  maxToolKinds: 6
  maxLOC: 2500
```

## Examples

- [Simple Calculator](./examples/simple-calculator/) - Basic agent with arithmetic operations
- More examples coming soon!

## Development

### Package Scripts

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Type check
pnpm typecheck
```

### Package Structure

Each package follows a standard structure:
```
package-name/
├── src/           # TypeScript source
├── dist/          # Compiled output
├── tests/         # Unit tests
├── package.json
└── tsconfig.json
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `forge init` | Initialize new project |
| `forge spec` | Generate specification |
| `forge propose` | Generate N candidates |
| `forge eval` | Run evaluation suites |
| `forge redteam` | Run security tests |
| `forge select` | Select winners |
| `forge reproduce` | Reproduce from manifest |
| `forge ui` | Launch web interface |

## Evaluation Metrics

### Functional Suite
- Accuracy: % of test cases passed
- Error Rate: % of test cases failed
- Test Coverage: Passed/Failed counts

### Chaos Suite
- Latency P95: 95th percentile response time
- Chaos Divergence: Behavior change under chaos
- Retry Hygiene: Proper retry behavior

### Idempotency Suite
- Violations: Count of non-idempotent operations
- Replay Correctness: % of replays matching original

### Security Suite
- Findings: Categorized by severity (critical/high/medium/low)
- Categories: Prompt injection, tool misuse, egress escalation, PII extraction

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Citation

```bibtex
@software{reynard_forge_2026,
  title = {Reynard Forge: Agentic Design Automation System},
  author = {Your Name},
  year = {2026},
  url = {https://github.com/your-org/reynard-forge}
}
```

## Support

- 📖 [Documentation](./docs/)
- 💬 [Discussions](https://github.com/your-org/reynard-forge/discussions)
- 🐛 [Issues](https://github.com/your-org/reynard-forge/issues)
