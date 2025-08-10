import { runFunctionalSuite } from './suites/functional.js';
import { runChaosSuite } from './suites/chaos.js';
import { runIdempotencySuite } from './suites/idempotency.js';

export async function runAllSuites() {
  const f = await runFunctionalSuite();
  const c = await runChaosSuite();
  const i = await runIdempotencySuite();
  return { ...f, ...c, ...i };
}