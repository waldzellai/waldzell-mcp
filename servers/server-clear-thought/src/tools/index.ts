import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

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
import { registerDragPointAudit } from './drag-point-audit.js';
import { registerSafeStruggleDesigner } from './safe-struggle-designer.js';
import { registerSevenSeekersOrchestrator } from './seven-seekers-orchestrator.js';
import { registerValueOfInformation } from './value-of-information.js';
import { registerExistingToolExample } from './existing-tool-example.js';
import { registerSessionManagement } from './session-management.js';

/**
 * Registers all Clear Thought tools with the provided MCP server instance
 * @param server - The MCP server instance
 * @param sessionState - The session state manager
 */
export function registerTools(server: McpServer, sessionState: SessionState): void {
  // Register all thinking and reasoning tools
  registerSequentialThinking(server, sessionState);
  registerMentalModel(server, sessionState);
  registerDebuggingApproach(server, sessionState);
  registerCollaborativeReasoning(server, sessionState);
  registerDecisionFramework(server, sessionState);
  registerMetacognitiveMonitoring(server, sessionState);
  registerSocraticMethod(server, sessionState);
  registerCreativeThinking(server, sessionState);
  registerSystemsThinking(server, sessionState);
  registerScientificMethod(server, sessionState);
  registerStructuredArgumentation(server, sessionState);
  registerVisualReasoning(server, sessionState);
  registerAnalogicalMapper(server, sessionState);
  registerAssumptionXray(server, sessionState);
  registerComparativeAdvantage(server, sessionState);
  registerDragPointAudit(server, sessionState);
  registerSafeStruggleDesigner(server, sessionState);
  registerSevenSeekersOrchestrator(server, sessionState);
  registerValueOfInformation(server, sessionState);
  registerExistingToolExample(server, sessionState);

  // Register session management tools
  registerSessionManagement(server, sessionState);
}