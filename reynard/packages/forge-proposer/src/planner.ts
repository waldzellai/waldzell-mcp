import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TaskSpec } from './specWizard.js';
import type { GraphSpec, NodeSpec, EdgeSpec } from '../../forge-core/src/types.js';
import { generateUUID } from '../../forge-core/src/utils.js';
import type { LLMProvider } from './providers/types.js';
import { getDefaultProvider } from './providers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Plan a graph from a task specification using LLM
 */
export async function planGraph(
  spec: TaskSpec,
  provider?: LLMProvider,
  options?: {
    model?: string;
    temperature?: number;
    seed?: number;
  }
): Promise<GraphSpec> {
  const llm = provider || getDefaultProvider();
  
  console.log(`Planning graph for: ${spec.name}`);
  console.log(`  Provider: ${llm.name}`);
  console.log(`  Model: ${options?.model || 'default'}`);

  // Load prompt template
  const promptPath = join(__dirname, 'prompts', 'planner.txt');
  const template = await readFile(promptPath, 'utf-8');
  
  // Fill template with spec details
  const prompt = template.replace('{{description}}', JSON.stringify({
    name: spec.name,
    description: spec.description,
    inputs: spec.ioSchemas.input,
    outputs: spec.ioSchemas.output,
    tools: spec.tools,
    slas: spec.slas,
    safety: spec.safety,
    budgets: spec.budgets,
  }, null, 2));

  // Call LLM
  try {
    const modelOptions = {
      model: options?.model || 'gpt-4',
      temperature: options?.temperature ?? 0.7,
      maxTokens: 4096,
    };

    console.log('  Calling LLM...');
    const response = await llm.complete(prompt, modelOptions);
    console.log('  Response received');

    // Parse response into GraphSpec
    const graph = parseGraphResponse(response, spec);
    
    console.log(`✓ Graph planned: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
    
    return graph;
  } catch (error) {
    console.error('Error planning graph:', error);
    
    // Fallback: create simple graph
    console.warn('Falling back to simple graph generation');
    return createFallbackGraph(spec);
  }
}

/**
 * Parse LLM response into GraphSpec
 */
function parseGraphResponse(response: string, spec: TaskSpec): GraphSpec {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      
      // Convert to GraphSpec format
      return {
        id: generateUUID(),
        version: data.version || '0.1.0',
        nodes: (data.nodes || []).map((n: any, idx: number) => ({
          id: n.id || `node-${idx}`,
          kind: mapNodeType(n.type || 'tool'),
          // Additional fields filled based on kind
        })) as NodeSpec[],
        edges: (data.nodes || []).flatMap((n: any, idx: number) => 
          (n.dependencies || []).map((depId: string) => ({
            from: depId,
            to: n.id || `node-${idx}`,
          }))
        ),
        contracts: [],
      };
    }
  } catch (err) {
    console.warn('Failed to parse LLM response as JSON:', err);
  }

  // Fallback to simple graph
  return createFallbackGraph(spec);
}

/**
 * Map node type string to NodeSpec kind
 */
function mapNodeType(type: string): 'tool' | 'llm' | 'router' | 'critic' {
  switch (type.toLowerCase()) {
    case 'llm':
    case 'language-model':
      return 'llm';
    case 'router':
    case 'decision':
    case 'branch':
      return 'router';
    case 'critic':
    case 'validator':
    case 'checker':
      return 'critic';
    default:
      return 'tool';
  }
}

/**
 * Create a simple fallback graph when LLM fails or is unavailable
 */
function createFallbackGraph(spec: TaskSpec): GraphSpec {
  const nodes: NodeSpec[] = [
    {
      id: 'input',
      kind: 'tool',
      toolId: 'input-validator',
      config: { schema: spec.ioSchemas.input },
    } as any,
    {
      id: 'process',
      kind: 'llm',
      modelPin: { provider: 'openai', name: 'gpt-4', temperature: 0.7 },
      promptTemplate: `Process this input: {{input}}`,
    } as any,
    {
      id: 'output',
      kind: 'tool',
      toolId: 'output-formatter',
      config: { schema: spec.ioSchemas.output },
    } as any,
  ];

  const edges: EdgeSpec[] = [
    { from: 'input', to: 'process' },
    { from: 'process', to: 'output' },
  ];

  return {
    id: generateUUID(),
    version: '0.1.0',
    nodes,
    edges,
    contracts: [],
  };
}