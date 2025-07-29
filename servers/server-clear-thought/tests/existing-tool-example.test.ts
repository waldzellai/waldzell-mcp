import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { defaultConfig } from '../src/config.js';
import { SessionState } from '../src/state/SessionState.js';
import { registerUtilityToolset } from '../src/toolsets/utility.js';

it('echoes provided text', async () => {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  const state = new SessionState('test', defaultConfig);
  registerUtilityToolset(server, state);
  const tool: any = (server as any)._registeredTools['utility'];
  const result = await tool.callback({ operation: 'existing_tool_example', text: 'hi' });
  const data = JSON.parse(result.content[0].text);
  expect(data).toEqual({ echoed: 'hi' });
});
