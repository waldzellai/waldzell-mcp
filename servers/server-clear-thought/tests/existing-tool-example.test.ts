import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { defaultConfig } from '../src/config.js';
import { SessionState } from '../src/state/SessionState.js';
import { registerExistingToolExample } from '../src/tools/existing-tool-example.js';

it('echoes provided text', async () => {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  const state = new SessionState('test', defaultConfig);
  registerExistingToolExample(server, state);
  const tool: any = (server as any)._registeredTools['existing_tool_example'];
  const result = await tool.callback({ text: 'hi' });
  const data = JSON.parse(result.content[0].text);
  expect(data).toEqual({ echoed: 'hi' });
});
