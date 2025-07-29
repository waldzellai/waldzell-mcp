import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import { ToolsetRegistry, collectOperations } from './registry.js';

import { registerAnalogicalMapper } from '../tools/analogical-mapper.js';
import { registerAssumptionXray } from '../tools/assumption-xray.js';
import { registerComparativeAdvantage } from '../tools/comparative-advantage.js';
import { registerDragPointAudit } from '../tools/drag-point-audit.js';
import { registerSafeStruggleDesigner } from '../tools/safe-struggle-designer.js';
import { registerSevenSeekersOrchestrator } from '../tools/seven-seekers-orchestrator.js';
import { registerValueOfInformation } from '../tools/value-of-information.js';
import { registerExistingToolExample } from '../tools/existing-tool-example.js';

export function registerUtilityToolset(server: McpServer, state: SessionState): void {
  const registry = new ToolsetRegistry('utility', 'Utility operations');
  [
    registerAnalogicalMapper,
    registerAssumptionXray,
    registerComparativeAdvantage,
    registerDragPointAudit,
    registerSafeStruggleDesigner,
    registerSevenSeekersOrchestrator,
    registerValueOfInformation,
    registerExistingToolExample
  ].forEach(fn => {
    collectOperations(fn, state).forEach(op => registry.addOperation(op));
  });
  registry.register(server);
}
