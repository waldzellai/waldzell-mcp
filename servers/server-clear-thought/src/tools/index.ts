import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

/**
 * Registers all Clear Thought toolsets with the provided MCP server instance
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
  registerMindMap(server, sessionState);
  registerConceptMap(server, sessionState);
  registerFishboneDiagram(server, sessionState);
  registerSwotAnalysis(server, sessionState);
  registerIssueTree(server, sessionState);
  registerExistingToolExample(server, sessionState);

  // Register session management tools
  registerSessionManagement(server, sessionState);
}
=======
  registerReasoningToolset(server, sessionState);
  registerVisualizationToolset(server, sessionState);
  registerUtilityToolset(server, sessionState);
  registerSessionToolset(server, sessionState);
}

