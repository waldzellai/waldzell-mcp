# Spec: forge-proposer

Goal: generate candidate graphs + code from a TaskSpec using model providers, producing runnable archives with manifests and tests.

Functional (MUST):
1) SpecWizard: interactive or programmatic completion of TaskSpec; validates schemas; exits non-zero on missing critical fields.
2) Planner: call LLM (planner model) with prompt to produce GraphSpec (nodes, edges, contracts) respecting budgets (nodes/tool kinds/LOC) and safety constraints; emits rationale.
3) Coder: realize graph into codebase under `archives/agents/<id>/` with src/, tests/, manifest.json, contracts/; include runtime validators and package.json.
4) Providers: implement OpenAI/Anthropic providers with real API calls; stub only when key missing; support temperature/model options from config.
5) Manifests: generate CandidateManifest with model pins, seeds, sandbox policy, budgets, notes; hash stored.
6) Determinism: candidate IDs via UUID; seeds and model pins recorded; reruns with same seed produce identical archives.
7) Error handling: partial failures clean up temp dirs; return structured errors.

SHOULD:
- Prompt templates versioned and configurable.
- Allow N-way candidate generation in parallel with rate-limit/backoff.
- Cache LLM calls when prompt+model unchanged and seed fixed.

Acceptance:
- Given demo TaskSpec, produces ≥N candidates with complete archives (code builds with `pnpm install && pnpm test` inside archive).
- Generated manifest validates via forge-core schema.
- When OPENAI_API_KEY missing, fails with clear configuration error (not silent stub).
- Rerun with same seed yields identical manifest hash and code content.
