#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Data Interfaces
interface StochasticData {
  algorithm: string;
  problem: string;
  parameters: Record<string, unknown>;
  result?: string;
}

interface AlgorithmParameters {
  [key: string]: unknown;
}

// Stochastic Algorithm Implementations
class StochasticServer {
  private validateStochasticData(input: unknown): StochasticData {
    const data = input as Record<string, unknown>;

    if (!data.algorithm || typeof data.algorithm !== 'string') {
      throw new Error('Invalid algorithm: must be a string');
    }
    if (!data.problem || typeof data.problem !== 'string') {
      throw new Error('Invalid problem: must be a string');
    }
    if (!data.parameters || typeof data.parameters !== 'object') {
      throw new Error('Invalid parameters: must be an object');
    }

    return {
      algorithm: data.algorithm,
      problem: data.problem,
      parameters: data.parameters as Record<string, unknown>,
      result: typeof data.result === 'string' ? data.result : undefined
    };
  }

  private formatOutput(data: StochasticData): string {
    const { algorithm, problem, parameters, result } = data;
    const border = '─'.repeat(Math.max(algorithm.length + 20, problem.length + 4));

    let output = `
┌${border}┐
│ 🎲 Algorithm: ${algorithm.padEnd(border.length - 13)} │
├${border}┤
│ Problem: ${problem.padEnd(border.length - 10)} │
├${border}┤
│ Parameters:${' '.repeat(border.length - 12)} │`;

    for (const [key, value] of Object.entries(parameters)) {
      output += `\n│ • ${key}: ${String(value).padEnd(border.length - key.length - 4)} │`;
    }

    if (result) {
      output += `\n├${border}┤
│ Result: ${result.padEnd(border.length - 9)} │`;
    }

    output += `\n└${border}┘`;
    return output;
  }

  private mdpOneLineSummary(params: AlgorithmParameters): string {
    return `Optimized policy over ${params.states || 'N'} states with discount factor ${params.gamma || 0.9}`;
  }

  private mctsOneLineSummary(params: AlgorithmParameters): string {
    return `Explored ${params.simulations || 1000} paths with exploration constant ${params.explorationConstant || 1.4}`;
  }

  private banditOneLineSummary(params: AlgorithmParameters): string {
    return `Selected optimal arm with ${params.strategy || 'epsilon-greedy'} strategy (ε=${params.epsilon || 0.1})`;
  }

  private bayesianOneLineSummary(params: AlgorithmParameters): string {
    return `Optimized objective with ${params.acquisitionFunction || 'expected improvement'} acquisition`;
  }

  private hmmOneLineSummary(params: AlgorithmParameters): string {
    return `Inferred hidden states using ${params.algorithm || 'forward-backward'} algorithm`;
  }

  public processAlgorithm(input: unknown): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      const validatedInput = this.validateStochasticData(input);
      const formattedOutput = this.formatOutput(validatedInput);
      console.error(formattedOutput);

      let summary = '';
      switch (validatedInput.algorithm) {
        case 'mdp':
          summary = this.mdpOneLineSummary(validatedInput.parameters);
          break;
        case 'mcts':
          summary = this.mctsOneLineSummary(validatedInput.parameters);
          break;
        case 'bandit':
          summary = this.banditOneLineSummary(validatedInput.parameters);
          break;
        case 'bayesian':
          summary = this.bayesianOneLineSummary(validatedInput.parameters);
          break;
        case 'hmm':
          summary = this.hmmOneLineSummary(validatedInput.parameters);
          break;
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            algorithm: validatedInput.algorithm,
            status: 'success',
            summary,
            hasResult: !!validatedInput.result
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

// Tool Definition
const STOCHASTIC_TOOL: Tool = {
  name: "stochasticalgorithm",
  description: `A tool for applying stochastic algorithms to decision-making problems.
Supports various algorithms including:
- Markov Decision Processes (MDPs): Optimize policies over long sequences of decisions
- Monte Carlo Tree Search (MCTS): Simulate future action sequences for large decision spaces
- Multi-Armed Bandit: Balance exploration vs exploitation in action selection
- Bayesian Optimization: Optimize decisions with probabilistic inference
- Hidden Markov Models (HMMs): Infer latent states affecting decision outcomes

Each algorithm provides a systematic approach to handling uncertainty in decision-making.`,
  inputSchema: {
    type: "object",
    properties: {
      algorithm: {
        type: "string",
        enum: [
          "mdp",
          "mcts",
          "bandit",
          "bayesian",
          "hmm"
        ]
      },
      problem: { type: "string" },
      parameters: {
        type: "object",
        additionalProperties: true
      },
      result: { type: "string" }
    },
    required: ["algorithm", "problem", "parameters"]
  }
};

// Server Instance
const stochasticServer = new StochasticServer();
const server = new Server(
  {
    name: "stochastic-thinking-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {
        stochasticalgorithm: STOCHASTIC_TOOL
      },
    },
  }
);

// Request Handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [STOCHASTIC_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "stochasticalgorithm":
      return stochasticServer.processAlgorithm(request.params.arguments);
    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Stochastic Thinking MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
