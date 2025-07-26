# Clear Thought Toolset Refactor Plan

## Background

The Clear Thought MCP server currently exposes every thinking capability as a separate MCP tool. The file [`src/tools/index.ts`](src/tools/index.ts) lists more than twenty `register...` functions that each register an individual tool with the server. This produces a very large tool list for the client model to reason about.

Example excerpt:
```ts
import { registerSequentialThinking } from './sequential-thinking.js';
import { registerMentalModel } from './mental-model.js';
import { registerDebuggingApproach } from './debugging-approach.js';
import { registerCollaborativeReasoning } from './collaborative-reasoning.js';
import { registerDecisionFramework } from './decision-framework.js';
import { registerMetacognitiveMonitoring } from './metacognitive.js';
import { registerSocraticMethod } from './socratic-method.js';
import { registerCreativeThinking } from './creative-thinking.js';
import { registerSystemsThinking } from './systems-thinking.js';
import { registerScientificMethod } from './scientific-method.js';
import { registerStructuredArgumentation } from './structured-argumentation.js';
import { registerVisualReasoning } from './visual-reasoning.js';
import { registerAnalogicalMapper } from './analogical-mapper.js';
import { registerAssumptionXray } from './assumption-xray.js';
import { registerComparativeAdvantage } from './comparative-advantage.js';
```

Each tool module follows the pattern below (from [`src/tools/mental-model.ts`](src/tools/mental-model.ts)):
```ts
export function registerMentalModel(server: McpServer, sessionState: SessionState) {
  server.tool(
    'mentalmodel',
    'Apply mental models to analyze problems systematically',
    {
      modelName: z.enum(['first_principles', 'opportunity_cost', 'error_propagation', 'rubber_duck', 'pareto_principle', 'occams_razor']).describe('Name of the mental model'),
      problem: z.string().describe('The problem being analyzed'),
      steps: z.array(z.string()).describe('Steps to apply the model'),
      reasoning: z.string().describe('Reasoning process'),
      conclusion: z.string().describe('Conclusions drawn')
    },
    async (args) => {
      const modelData: MentalModelData = {
        modelName: args.modelName,
        problem: args.problem,
        steps: args.steps,
        reasoning: args.reasoning,
        conclusion: args.conclusion
      };
      
```

## Goal

Adopt the MCP "toolset" pattern used in the official Go server and in Waldzell AI's Exa Websets server. Related operations are grouped under a single tool which declares an `operation` field. An internal registry dispatches calls to the appropriate handler. This reduces the number of top level tools and lowers cognitive overhead for the model.

## Proposed Toolsets

- **reasoning** – sequential thinking, mental models, debugging approaches, collaborative reasoning, decision frameworks, metacognitive monitoring, scientific method, creative thinking, systems thinking, structured argumentation, etc.
- **visualization** – mind map, concept map, fishbone diagram, SWOT analysis, issue tree, visual reasoning and other diagram oriented helpers.
- **utility** – analogical mapper, assumption x‑ray, comparative advantage, drag point audit, safe struggle designer, seven seekers orchestrator, value of information and other stand‑alone helpers.
- **session** – session info, export and import.

Each toolset will expose one MCP tool containing an `operation` parameter which selects among the above operations.

## Implementation Steps

1. **Create a `ToolsetRegistry` class** that allows registering operations with a name, zod schema and handler. The registry exposes a method to construct the combined MCP tool schema using a discriminated union over the registered operations.
2. **Refactor individual tools** into operation functions returning `{schema, handler}` pairs. Migrate the logic from each `register*` function.
3. **Define toolset modules** (`reasoning.ts`, `visualization.ts`, `utility.ts`, `session.ts`). Each module creates a registry, adds its operations and finally calls `server.tool` once with the aggregated schema and dispatcher.
4. **Update `registerTools`** to register the four new toolsets instead of the many individual tools.
5. **Adjust session state access** so each operation still interacts with `SessionState` as today. No functional behaviour should change besides the tool entry points.
6. **Update tests and examples** to call the new toolsets via the `operation` field rather than the old tool names.

## Benefits

- The MCP client sees only a few high level tools, reducing prompt length and reasoning complexity.
- Related operations share schemas and code paths, improving maintainability.
- New operations can be added easily by extending the appropriate registry.
