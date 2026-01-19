import type { GraphSpec, NodeSpec, EdgeSpec, BehaviorTrace } from '../../forge-core/src/types.js';
import { hashObject } from '../../forge-core/src/hash.js';

// Type-only imports that will be resolved at runtime from built packages
type ToolNodeSpec = Extract<NodeSpec, { kind: 'tool' }>;
type RouterNodeSpec = Extract<NodeSpec, { kind: 'router' }>;
type CriticNodeSpec = Extract<NodeSpec, { kind: 'critic' }>;

/**
 * Sandbox types (will be provided at runtime)
 */
export interface SandboxDriver {
  run(opts: any, limits: any): Promise<{ exitCode: number; stdout: string; stderr: string; stats: any }>;
  testEgress(host: string): Promise<boolean>;
  checkAvailability(): Promise<{ available: boolean; error?: string }>;
}

export interface SandboxRunOptions {
  imageDigest: string;
  readOnlyRoot: boolean;
  writableMounts: string[];
  volumeMounts?: Array<{ hostPath: string; containerPath: string; readOnly: boolean }>;
  env: Record<string, string>;
  egressAllowlist: string[];
  cmd: string[];
  cwd?: string;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

export interface RunLimits {
  cpuMs: number;
  memMB: number;
  timeoutMs: number;
}

/**
 * Ledger types (will be provided at runtime)
 */
export interface Ledger {
  recordPrepare(toolId: string, inputHash: string, payload?: string): Promise<string>;
  recordCommit(intentId: string): Promise<void>;
  recordCompensate(intentId: string): Promise<void>;
  findByKey(toolId: string, inputHash: string): Promise<string | null>;
}

/**
 * Execution context for graph runs
 */
export interface RunContext {
  maxSteps: number;
  stepCount: number;
  cancelled: boolean;
  dryRun?: boolean;
  ledger?: Ledger;
  sandboxDriver?: SandboxDriver;
}

/**
 * Budget configuration for execution
 */
export interface BudgetConfig {
  maxNodes: number;
  maxTimeMs: number;
  maxMemMB: number;
}

/**
 * Result of a single node execution
 */
export interface NodeResult {
  nodeId: string;
  startTime: number;
  duration: number;
  exitCode: number;
  output: string;
  error?: string;
}

/**
 * Full trace of graph execution
 */
export interface ExecutionTrace {
  graphId: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  nodes: NodeResult[];
  success: boolean;
  error?: string;
}

/**
 * Error thrown when budget is exceeded
 */
export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}

/**
 * Error thrown when execution is cancelled
 */
export class ExecutionCancelledError extends Error {
  constructor(message: string = 'Execution cancelled') {
    super(message);
    this.name = 'ExecutionCancelledError';
  }
}

/**
 * Perform topological sort on graph nodes
 * Returns nodes in execution order (dependencies first)
 */
export function topologicalSort(nodes: NodeSpec[], edges: EdgeSpec[]): NodeSpec[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  // Build graph
  for (const edge of edges) {
    const current = inDegree.get(edge.to) ?? 0;
    inDegree.set(edge.to, current + 1);
    adjacency.get(edge.from)?.push(edge.to);
  }

  // Kahn's algorithm
  const queue: string[] = [];
  const result: NodeSpec[] = [];

  // Start with nodes that have no dependencies
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) {
      result.push(node);
    }

    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Check for cycles
  if (result.length !== nodes.length) {
    throw new Error('Circular dependency detected in graph');
  }

  return result;
}

/**
 * Execute a graph specification
 */
export async function runGraph(
  graph: GraphSpec,
  input: Record<string, unknown>,
  ctx: RunContext,
  sandbox?: SandboxDriver,
  budget?: BudgetConfig
): Promise<ExecutionTrace> {
  const startTime = Date.now();
  const trace: ExecutionTrace = {
    graphId: graph.id,
    startTime,
    endTime: 0,
    totalDuration: 0,
    nodes: [],
    success: false,
  };

  try {
    // Check cancellation
    if (ctx.cancelled) {
      throw new ExecutionCancelledError();
    }

    // Sort nodes by dependency order
    const sortedNodes = topologicalSort(graph.nodes, graph.edges);

    // Check budget constraints
    if (budget && sortedNodes.length > budget.maxNodes) {
      throw new BudgetExceededError(
        `Node count ${sortedNodes.length} exceeds limit ${budget.maxNodes}`
      );
    }

    // Execute nodes in order
    const outputs = new Map<string, unknown>();
    outputs.set('input', input);

    for (const node of sortedNodes) {
      // Check cancellation before each node
      if (ctx.cancelled) {
        throw new ExecutionCancelledError();
      }

      // Check step budget
      ctx.stepCount++;
      if (ctx.stepCount > ctx.maxSteps) {
        throw new BudgetExceededError(
          `Step count ${ctx.stepCount} exceeds limit ${ctx.maxSteps}`
        );
      }

      const nodeStart = Date.now();
      const nodeResult: NodeResult = {
        nodeId: node.id,
        startTime: nodeStart,
        duration: 0,
        exitCode: 0,
        output: '',
      };

      try {
        // Gather inputs from upstream nodes
        const nodeInputs = gatherNodeInputs(node, graph.edges, outputs);

        // Execute based on node kind
        const result = await executeNode(
          node, 
          nodeInputs, 
          ctx.sandboxDriver ?? sandbox, 
          budget, 
          ctx.dryRun,
          ctx.ledger
        );

        nodeResult.exitCode = result.exitCode;
        nodeResult.output = result.output;
        outputs.set(node.id, result.output);

        if (result.exitCode !== 0) {
          nodeResult.error = result.error || 'Non-zero exit code';
          trace.nodes.push(nodeResult);
          trace.error = `Node ${node.id} failed: ${nodeResult.error}`;
          break;
        }
      } catch (err) {
        nodeResult.exitCode = 1;
        nodeResult.error = err instanceof Error ? err.message : String(err);
        trace.nodes.push(nodeResult);
        throw err;
      } finally {
        nodeResult.duration = Date.now() - nodeStart;
      }

      trace.nodes.push(nodeResult);
    }

    // All nodes completed successfully
    if (!trace.error) {
      trace.success = true;
    }
  } catch (err) {
    trace.error = err instanceof Error ? err.message : String(err);
    trace.success = false;
  } finally {
    trace.endTime = Date.now();
    trace.totalDuration = trace.endTime - trace.startTime;
  }

  return trace;
}

/**
 * Gather inputs for a node from upstream outputs
 */
function gatherNodeInputs(
  node: NodeSpec,
  edges: EdgeSpec[],
  outputs: Map<string, unknown>
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  // Find all edges pointing to this node
  const incomingEdges = edges.filter(e => e.to === node.id);

  for (const edge of incomingEdges) {
    const value = outputs.get(edge.from);
    if (value !== undefined) {
      inputs[edge.from] = value;
    }
  }

  // Always include original input if no specific edges
  if (Object.keys(inputs).length === 0) {
    const originalInput = outputs.get('input');
    if (originalInput !== undefined) {
      inputs['input'] = originalInput;
    }
  }

  return inputs;
}

/**
 * Execute a single node
 */
async function executeNode(
  node: NodeSpec,
  inputs: Record<string, unknown>,
  sandbox?: SandboxDriver,
  budget?: BudgetConfig,
  dryRun?: boolean,
  ledger?: Ledger
): Promise<{ exitCode: number; output: string; error?: string }> {
  // Dry run mode - simulate execution
  if (dryRun) {
    return {
      exitCode: 0,
      output: JSON.stringify({ nodeId: node.id, inputs, dryRun: true }),
    };
  }

  // Execute based on node kind
  switch (node.kind) {
    case 'tool':
      return executeToolNode(node as ToolNodeSpec, inputs, sandbox, budget, ledger);

    case 'llm':
      return executeLLMNode(node, inputs);

    case 'router':
      return executeRouterNode(node as RouterNodeSpec, inputs);

    case 'critic':
      return executeCriticNode(node as CriticNodeSpec, inputs);

    default:
      return {
        exitCode: 1,
        output: '',
        error: `Unknown node kind: ${(node as any).kind}`,
      };
  }
}

/**
 * Execute a tool node in sandbox with ledger integration
 */
async function executeToolNode(
  node: ToolNodeSpec,
  inputs: Record<string, unknown>,
  sandbox?: SandboxDriver,
  budget?: BudgetConfig,
  ledger?: Ledger
): Promise<{ exitCode: number; output: string; error?: string }> {
  if (!sandbox) {
    // No sandbox - simulate execution
    return {
      exitCode: 0,
      output: JSON.stringify({ nodeId: node.id, toolId: node.toolId, simulated: true }),
    };
  }

  const inputHash = hashObject(inputs);
  let intentId: string | undefined;

  try {
    // Ledger: Prepare phase
    if (ledger) {
      intentId = await ledger.recordPrepare(node.toolId, inputHash, JSON.stringify(inputs));
      
      // Check if this tool call was already committed (idempotency)
      const existing = await ledger.findByKey(node.toolId, inputHash);
      if (existing && existing !== intentId) {
        // Already executed - return cached result
        return {
          exitCode: 0,
          output: JSON.stringify({ cached: true, intentId: existing }),
        };
      }
    }

    // Execute tool in sandbox
    const opts: SandboxRunOptions = {
      imageDigest: 'node:20-slim',
      readOnlyRoot: true,
      writableMounts: ['/tmp/working'],
      env: { 
        NODE_INPUT: JSON.stringify(inputs),
        TOOL_ID: node.toolId,
        TOOL_CONFIG: JSON.stringify(node.config || {}),
      },
      egressAllowlist: [],
      cmd: ['node', '-e', `console.log(JSON.stringify({ toolId: process.env.TOOL_ID, input: JSON.parse(process.env.NODE_INPUT) }))`],
    };

    const limits: RunLimits = {
      cpuMs: budget?.maxTimeMs ?? 20000,
      memMB: budget?.maxMemMB ?? 512,
      timeoutMs: node.timeout ?? (budget?.maxTimeMs ?? 20000) + 5000,
    };

    const result = await sandbox.run(opts, limits);

    // Ledger: Commit phase on success
    if (ledger && intentId && result.exitCode === 0) {
      await ledger.recordCommit(intentId);
    }

    return {
      exitCode: result.exitCode,
      output: result.stdout,
      error: result.stderr || undefined,
    };
  } catch (err) {
    // Ledger: Compensate phase on error
    if (ledger && intentId) {
      try {
        await ledger.recordCompensate(intentId);
      } catch (compensateErr) {
        // Log but don't fail the original error
        console.error('Failed to compensate intent:', compensateErr);
      }
    }

    throw err;
  }
}

/**
 * Execute an LLM node (stub - requires LLM provider integration)
 */
async function executeLLMNode(
  node: NodeSpec,
  inputs: Record<string, unknown>
): Promise<{ exitCode: number; output: string; error?: string }> {
  // Stub: In full implementation, this would call the LLM provider
  return {
    exitCode: 0,
    output: JSON.stringify({
      nodeId: node.id,
      kind: 'llm',
      inputs,
      response: 'LLM execution not yet implemented',
    }),
  };
}

/**
 * Execute a router node (conditional branching)
 */
async function executeRouterNode(
  node: RouterNodeSpec,
  inputs: Record<string, unknown>
): Promise<{ exitCode: number; output: string; error?: string }> {
  try {
    // Simple condition evaluation
    // In production, would use safe-eval or sandboxed evaluation
    const condition = node.condition;
    const context = { inputs, ...inputs };
    
    // Basic evaluation: check if condition is a simple property path
    let selectedRoute = 'default';
    for (const [routeCondition, targetNodeId] of Object.entries(node.routes) as [string, string][]) {
      if (routeCondition === condition || routeCondition === 'true') {
        selectedRoute = targetNodeId;
        break;
      }
    }

    return {
      exitCode: 0,
      output: JSON.stringify({
        nodeId: node.id,
        kind: 'router',
        selectedRoute,
        condition,
      }),
    };
  } catch (err) {
    return {
      exitCode: 1,
      output: '',
      error: `Router evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Execute a critic node (evaluation/validation)
 */
async function executeCriticNode(
  node: CriticNodeSpec,
  inputs: Record<string, unknown>
): Promise<{ exitCode: number; output: string; error?: string }> {
  try {
    // Basic validation logic
    // Check if inputs meet basic criteria
    const pass = Object.keys(inputs).length > 0;
    const score = pass ? 1.0 : 0.0;
    const verdict = {
      pass,
      score,
      feedback: pass ? 'Inputs valid' : 'No inputs provided',
      action: pass ? ('continue' as const) : ('retry' as const),
    };

    return {
      exitCode: pass ? 0 : 1,
      output: JSON.stringify({
        nodeId: node.id,
        kind: 'critic',
        verdict,
      }),
    };
  } catch (err) {
    return {
      exitCode: 1,
      output: '',
      error: `Critic evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Convert execution trace to BehaviorTrace format with real hashes
 */
export function toBehaviorTrace(
  trace: ExecutionTrace,
  candidateId: string,
  inputHash: string,
  nodeInputs?: Map<string, unknown>
): BehaviorTrace {
  return {
    candidateId,
    inputHash,
    steps: trace.nodes.map((node) => {
      // Hash the actual request/response data
      const requestData = nodeInputs?.get(node.nodeId) || { nodeId: node.nodeId };
      const responseData = { output: node.output, exitCode: node.exitCode };
      
      return {
        t: node.startTime,
        nodeId: node.nodeId,
        action: 'tool' as const, // Could be enhanced to map from actual node kind
        requestHash: hashObject(requestData),
        responseHash: hashObject(responseData),
        error: node.error,
      };
    }),
  };
}
