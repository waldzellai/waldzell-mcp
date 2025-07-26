import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { defaultConfig } from '../src/config.js';
import { SessionState } from '../src/state/SessionState.js';
import { registerVisualizationToolset } from '../src/toolsets/visualization.js';

it('generates branches from a topic', async () => {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  const state = new SessionState('test', defaultConfig);
  registerVisualizationToolset(server, state);
  const tool: any = (server as any)._registeredTools['visualization'];
  const result = await tool.callback({ operation: 'mind_map', topic: 'cats', num_branches: 2 });
  expect(result.content[0].text).toContain('cats aspect');
});
