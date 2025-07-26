import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { defaultConfig } from '../src/config.js';
import { SessionState } from '../src/state/SessionState.js';
import { registerAssumptionXray } from '../src/tools/assumption-xray.js';
import { registerValueOfInformation } from '../src/tools/value-of-information.js';
import { registerDragPointAudit } from '../src/tools/drag-point-audit.js';
import { registerSafeStruggleDesigner } from '../src/tools/safe-struggle-designer.js';
import { registerComparativeAdvantage } from '../src/tools/comparative-advantage.js';
import { registerAnalogicalMapper } from '../src/tools/analogical-mapper.js';
import { registerSevenSeekersOrchestrator } from '../src/tools/seven-seekers-orchestrator.js';

function setupServer() {
  const server = new McpServer({ name: 'test', version: '0.0.0' });
  const state = new SessionState('test', defaultConfig);
  return { server, state };
}

type ToolCallback = (args: any) => Promise<any>;

function getCallback(server: McpServer, slug: string): ToolCallback {
  return (server as any)._registeredTools[slug].callback;
}

it('assumption xray returns assumptions, confidence and tests', async () => {
  const { server, state } = setupServer();
  registerAssumptionXray(server, state);
  const cb = getCallback(server, 'assumption_xray');
  const result = await cb({ claim: 'A', context: 'B' });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['assumptions', 'confidence', 'tests']);
});

it('value of information returns score and questions', async () => {
  const { server, state } = setupServer();
  registerValueOfInformation(server, state);
  const cb = getCallback(server, 'value_of_information');
  const result = await cb({ decision_options: ['a'], uncertainties: ['u'], payoffs: [1] });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['voi_score', 'high_impact_questions']);
});

it('drag point audit returns drag points and summary score', async () => {
  const { server, state } = setupServer();
  registerDragPointAudit(server, state);
  const cb = getCallback(server, 'drag_point_audit');
  const result = await cb({ log: '...' });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['drag_points', 'summary_score']);
});

it('safe struggle designer returns steps, measures and intervals', async () => {
  const { server, state } = setupServer();
  registerSafeStruggleDesigner(server, state);
  const cb = getCallback(server, 'safe_struggle_designer');
  const result = await cb({ skill: 'x', current_level: 1, target_level: 2 });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['scaffold_steps', 'safety_measures', 'review_intervals']);
});

it('comparative advantage returns advantage map', async () => {
  const { server, state } = setupServer();
  registerComparativeAdvantage(server, state);
  const cb = getCallback(server, 'comparative_advantage');
  const result = await cb({ skills: { a: 1 }, tasks: { t1: ['a'] } });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['advantage_map']);
});

it('analogical mapper returns analogies and prompts', async () => {
  const { server, state } = setupServer();
  registerAnalogicalMapper(server, state);
  const cb = getCallback(server, 'analogical_mapper');
  const result = await cb({ problem: 'p' });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['analogies', 'suggested_prompts']);
});

it('seven seekers orchestrator returns results, resonance and synthesis', async () => {
  const { server, state } = setupServer();
  registerSevenSeekersOrchestrator(server, state);
  const cb = getCallback(server, 'seven_seekers_orchestrator');
  const result = await cb({ query: 'q' });
  const data = JSON.parse(result.content[0].text);
  expect(Object.keys(data)).toEqual(['seeker_results', 'resonance_map', 'synthesis']);
});
