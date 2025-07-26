import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import { ToolsetRegistry, collectOperations } from './registry.js';

import { registerMindMap } from '../tools/mind-map.js';
import { registerConceptMap } from '../tools/concept-map.js';
import { registerFishboneDiagram } from '../tools/fishbone-diagram.js';
import { registerSwotAnalysis } from '../tools/swot-analysis.js';
import { registerIssueTree } from '../tools/issue-tree.js';
import { registerVisualReasoning } from '../tools/visual-reasoning.js';

export function registerVisualizationToolset(server: McpServer, state: SessionState): void {
  const registry = new ToolsetRegistry('visualization', 'Visualization operations');
  [
    registerMindMap,
    registerConceptMap,
    registerFishboneDiagram,
    registerSwotAnalysis,
    registerIssueTree,
    registerVisualReasoning
  ].forEach(fn => {
    collectOperations(fn, state).forEach(op => registry.addOperation(op));
  });
  registry.register(server);
}
