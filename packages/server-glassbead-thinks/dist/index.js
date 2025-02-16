#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode, } from "@modelcontextprotocol/sdk/types.js";
// Fixed chalk import for ESM
import chalk from 'chalk';
// Server Classes
class MentalModelServer {
    validateModelData(input) {
        const data = input;
        if (!data.modelName || typeof data.modelName !== 'string') {
            throw new Error('Invalid modelName: must be a string');
        }
        if (!data.problem || typeof data.problem !== 'string') {
            throw new Error('Invalid problem: must be a string');
        }
        return {
            modelName: data.modelName,
            problem: data.problem,
            steps: Array.isArray(data.steps) ? data.steps.map(String) : [],
            reasoning: typeof data.reasoning === 'string' ? data.reasoning : '',
            conclusion: typeof data.conclusion === 'string' ? data.conclusion : ''
        };
    }
    formatModelOutput(modelData) {
        const { modelName, problem, steps, reasoning, conclusion } = modelData;
        const border = '─'.repeat(Math.max(modelName.length + 20, problem.length + 4));
        return `
┌${border}┐
│ 🧠 Mental Model: ${modelName.padEnd(border.length - 16)} │
├${border}┤
│ Problem: ${problem.padEnd(border.length - 10)} │
├${border}┤
│ Steps:${' '.repeat(border.length - 7)} │
${steps.map(step => `│ • ${step.padEnd(border.length - 4)} │`).join('\n')}
├${border}┤
│ Reasoning: ${reasoning.padEnd(border.length - 11)} │
├${border}┤
│ Conclusion: ${conclusion.padEnd(border.length - 12)} │
└${border}┘`;
    }
    processModel(input) {
        try {
            const validatedInput = this.validateModelData(input);
            const formattedOutput = this.formatModelOutput(validatedInput);
            console.error(formattedOutput);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            modelName: validatedInput.modelName,
                            status: 'success',
                            hasSteps: validatedInput.steps.length > 0,
                            hasConclusion: !!validatedInput.conclusion
                        }, null, 2)
                    }]
            };
        }
        catch (error) {
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
class DebuggingApproachServer {
    validateApproachData(input) {
        const data = input;
        if (!data.approachName || typeof data.approachName !== 'string') {
            throw new Error('Invalid approachName: must be a string');
        }
        if (!data.issue || typeof data.issue !== 'string') {
            throw new Error('Invalid issue: must be a string');
        }
        return {
            approachName: data.approachName,
            issue: data.issue,
            steps: Array.isArray(data.steps) ? data.steps.map(String) : [],
            findings: typeof data.findings === 'string' ? data.findings : '',
            resolution: typeof data.resolution === 'string' ? data.resolution : ''
        };
    }
    formatApproachOutput(approachData) {
        const { approachName, issue, steps, findings, resolution } = approachData;
        const border = '─'.repeat(Math.max(approachName.length + 25, issue.length + 4));
        return `
┌${border}┐
│ 🔍 Debugging Approach: ${approachName.padEnd(border.length - 21)} │
├${border}┤
│ Issue: ${issue.padEnd(border.length - 8)} │
├${border}┤
│ Steps:${' '.repeat(border.length - 7)} │
${steps.map(step => `│ • ${step.padEnd(border.length - 4)} │`).join('\n')}
├${border}┤
│ Findings: ${findings.padEnd(border.length - 11)} │
├${border}┤
│ Resolution: ${resolution.padEnd(border.length - 12)} │
└${border}┘`;
    }
    processApproach(input) {
        try {
            const validatedInput = this.validateApproachData(input);
            const formattedOutput = this.formatApproachOutput(validatedInput);
            console.error(formattedOutput);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            approachName: validatedInput.approachName,
                            status: 'success',
                            hasSteps: validatedInput.steps.length > 0,
                            hasResolution: !!validatedInput.resolution
                        }, null, 2)
                    }]
            };
        }
        catch (error) {
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
class SequentialThinkingServer {
    constructor() {
        this.thoughtHistory = [];
        this.branches = {};
    }
    validateThoughtData(input) {
        const data = input;
        if (!data.thought || typeof data.thought !== 'string') {
            throw new Error('Invalid thought: must be a string');
        }
        if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
            throw new Error('Invalid thoughtNumber: must be a number');
        }
        if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
            throw new Error('Invalid totalThoughts: must be a number');
        }
        if (typeof data.nextThoughtNeeded !== 'boolean') {
            throw new Error('Invalid nextThoughtNeeded: must be a boolean');
        }
        return {
            thought: data.thought,
            thoughtNumber: data.thoughtNumber,
            totalThoughts: data.totalThoughts,
            nextThoughtNeeded: data.nextThoughtNeeded,
            isRevision: data.isRevision,
            revisesThought: data.revisesThought,
            branchFromThought: data.branchFromThought,
            branchId: data.branchId,
            needsMoreThoughts: data.needsMoreThoughts,
        };
    }
    formatThought(thoughtData) {
        const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;
        let prefix = '';
        let context = '';
        if (isRevision) {
            prefix = chalk.yellow('🔄 Revision');
            context = ` (revising thought ${revisesThought})`;
        }
        else if (branchFromThought) {
            prefix = chalk.green('🌿 Branch');
            context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
        }
        else {
            prefix = chalk.blue('💭 Thought');
            context = '';
        }
        const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
        const border = '─'.repeat(Math.max(header.length, thought.length) + 4);
        return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │
└${border}┘`;
    }
    processThought(input) {
        try {
            const validatedInput = this.validateThoughtData(input);
            if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
                validatedInput.totalThoughts = validatedInput.thoughtNumber;
            }
            this.thoughtHistory.push(validatedInput);
            if (validatedInput.branchFromThought && validatedInput.branchId) {
                if (!this.branches[validatedInput.branchId]) {
                    this.branches[validatedInput.branchId] = [];
                }
                this.branches[validatedInput.branchId].push(validatedInput);
            }
            const formattedThought = this.formatThought(validatedInput);
            console.error(formattedThought);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            thoughtNumber: validatedInput.thoughtNumber,
                            totalThoughts: validatedInput.totalThoughts,
                            nextThoughtNeeded: validatedInput.nextThoughtNeeded,
                            branches: Object.keys(this.branches),
                            thoughtHistoryLength: this.thoughtHistory.length
                        }, null, 2)
                    }]
            };
        }
        catch (error) {
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
// Tool Definitions
const MENTAL_MODEL_TOOL = {
    name: "mentalmodel",
    description: `A tool for applying structured mental models to problem-solving.
Supports various mental models including:
- First Principles Thinking
- Opportunity Cost Analysis
- Error Propagation Understanding
- Rubber Duck Debugging
- Pareto Principle
- Occam's Razor

Each model provides a systematic approach to breaking down and solving problems.`,
    inputSchema: {
        type: "object",
        properties: {
            modelName: {
                type: "string",
                enum: [
                    "first_principles",
                    "opportunity_cost",
                    "error_propagation",
                    "rubber_duck",
                    "pareto_principle",
                    "occams_razor"
                ]
            },
            problem: { type: "string" },
            steps: {
                type: "array",
                items: { type: "string" }
            },
            reasoning: { type: "string" },
            conclusion: { type: "string" }
        },
        required: ["modelName", "problem"]
    }
};
const DEBUGGING_APPROACH_TOOL = {
    name: "debuggingapproach",
    description: `A tool for applying systematic debugging approaches to solve technical issues.
Supports various debugging methods including:
- Binary Search
- Reverse Engineering
- Divide and Conquer
- Backtracking
- Cause Elimination
- Program Slicing

Each approach provides a structured method for identifying and resolving issues.`,
    inputSchema: {
        type: "object",
        properties: {
            approachName: {
                type: "string",
                enum: [
                    "binary_search",
                    "reverse_engineering",
                    "divide_conquer",
                    "backtracking",
                    "cause_elimination",
                    "program_slicing"
                ]
            },
            issue: { type: "string" },
            steps: {
                type: "array",
                items: { type: "string" }
            },
            findings: { type: "string" },
            resolution: { type: "string" }
        },
        required: ["approachName", "issue"]
    }
};
const SEQUENTIAL_THINKING_TOOL = {
    name: "sequentialthinking",
    description: `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

When to use this tool:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

Key features:
- You can adjust total_thoughts up or down as you progress
- You can question or revise previous thoughts
- You can add more thoughts even after reaching what seemed like the end
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer

Parameters explained:
- thought: Your current thinking step, which can include:
* Regular analytical steps
* Revisions of previous thoughts
* Questions about previous decisions
* Realizations about needing more analysis
* Changes in approach
* Hypothesis generation
* Hypothesis verification
- next_thought_needed: True if you need more thinking, even if at what seemed like the end
- thought_number: Current number in sequence (can go beyond initial total if needed)
- total_thoughts: Current estimate of thoughts needed (can be adjusted up/down)
- is_revision: A boolean indicating if this thought revises previous thinking
- revises_thought: If is_revision is true, which thought number is being reconsidered
- branch_from_thought: If branching, which thought number is the branching point
- branch_id: Identifier for the current branch (if any)
- needs_more_thoughts: If reaching end but realizing more thoughts needed

You should:
1. Start with an initial estimate of needed thoughts, but be ready to adjust
2. Feel free to question or revise previous thoughts
3. Don't hesitate to add more thoughts if needed, even at the "end"
4. Express uncertainty when present
5. Mark thoughts that revise previous thinking or branch into new paths
6. Ignore information that is irrelevant to the current step
7. Generate a solution hypothesis when appropriate
8. Verify the hypothesis based on the Chain of Thought steps
9. Repeat the process until satisfied with the solution
10. Provide a single, ideally correct answer as the final output
11. Only set next_thought_needed to false when truly done and a satisfactory answer is reached`,
    inputSchema: {
        type: "object",
        properties: {
            thought: {
                type: "string",
                description: "Your current thinking step"
            },
            nextThoughtNeeded: {
                type: "boolean",
                description: "Whether another thought step is needed"
            },
            thoughtNumber: {
                type: "integer",
                description: "Current thought number",
                minimum: 1
            },
            totalThoughts: {
                type: "integer",
                description: "Estimated total thoughts needed",
                minimum: 1
            },
            isRevision: {
                type: "boolean",
                description: "Whether this revises previous thinking"
            },
            revisesThought: {
                type: "integer",
                description: "Which thought is being reconsidered",
                minimum: 1
            },
            branchFromThought: {
                type: "integer",
                description: "Branching point thought number",
                minimum: 1
            },
            branchId: {
                type: "string",
                description: "Branch identifier"
            },
            needsMoreThoughts: {
                type: "boolean",
                description: "If more thoughts are needed"
            }
        },
        required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
    }
};
// Server Instances
const modelServer = new MentalModelServer();
const debuggingServer = new DebuggingApproachServer();
const thinkingServer = new SequentialThinkingServer();
const server = new Server({
    name: "sequential-thinking-server",
    version: "0.2.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Request Handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        SEQUENTIAL_THINKING_TOOL,
        MENTAL_MODEL_TOOL,
        DEBUGGING_APPROACH_TOOL
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
        case "sequentialthinking":
            return thinkingServer.processThought(request.params.arguments);
        case "mentalmodel":
            return modelServer.processModel(request.params.arguments);
        case "debuggingapproach":
            return debuggingServer.processApproach(request.params.arguments);
        default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }
});
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Sequential Thinking MCP Server running on stdio");
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
