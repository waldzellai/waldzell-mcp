import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import { ToolsetRegistry, collectOperations } from './registry.js';

import { registerSessionManagement } from '../tools/session-management.js';

export function registerSessionToolset(server: McpServer, state: SessionState): void {
  const registry = new ToolsetRegistry('session', 'Session management operations');
  collectOperations(registerSessionManagement, state).forEach(op => registry.addOperation(op));
  registry.register(server);
}
