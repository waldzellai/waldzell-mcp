import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { defaultConfig } from '../src/config.js';
import { SessionState } from '../src/state/SessionState.js';
import { registerUtilityToolset } from '../src/toolsets/utility.js';

function setupServer() {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  const state = new SessionState('test', defaultConfig);
  return { server, state };
}

type ToolCallback = (args: any) => Promise<any>;

function getCallback(server: McpServer): ToolCallback {
  return (server as any)._registeredTools['utility'].callback;
}

it('assumption xray returns assumptions, confidence and tests', async () => {
  const { server, state } = setupServer();
  registerUtilityToolset(server, state);
  const cb = getCallback(server);
  const result = await cb({ operation: 'assumption_xray', claim: 'A', context: 'B' });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['assumptions', 'confidence', 'tests']);
});

it('value of information returns score and questions', async () => {
  const { server, state } = setupServer();
  registerUtilityToolset(server, state);
  const cb = getCallback(server);
  const result = await cb({ operation: 'value_of_information', decision_options: ['a'], uncertainties: ['u'], payoffs: [1] });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['voi_score', 'high_impact_questions']);
});

it('drag point audit returns drag points and summary score', async () => {
  const { server, state } = setupServer();
  registerUtilityToolset(server, state);
  const cb = getCallback(server);
  const result = await cb({ operation: 'drag_point_audit', log: '...' });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['drag_points', 'summary_score']);
});

it('safe struggle designer returns steps, measures and intervals', async () => {
  const { server, state } = setupServer();
  registerUtilityToolset(server, state);
  const cb = getCallback(server);
  const result = await cb({ operation: 'safe_struggle_designer', skill: 'x', current_level: 1, target_level: 2 });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['scaffold_steps', 'safety_measures', 'review_intervals']);
});

it('comparative advantage returns advantage map', async () => {
  const { server, state } = setupServer();
  registerUtilityToolset(server, state);
  const cb = getCallback(server);
  const result = await cb({ operation: 'comparative_advantage', skills: { a: 1 }, tasks: { t1: ['a'] } });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['advantage_map']);
});

it('analogical mapper returns analogies and prompts', async () => {
  const { server, state } = setupServer();
  registerUtilityToolset(server, state);
  const cb = getCallback(server);
  const result = await cb({ operation: 'analogical_mapper', problem: 'p' });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['analogies', 'suggested_prompts']);
});

it('seven seekers orchestrator returns results, resonance and synthesis', async () => {
  const { server, state } = setupServer();
  registerUtilityToolset(server, state);
  const cb = getCallback(server);
  const result = await cb({ operation: 'seven_seekers_orchestrator', query: 'q' });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['seeker_results', 'resonance_map', 'synthesis']);
});
