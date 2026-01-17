# TODOs: forge-proposer
- Implement SpecWizard to validate/complete TaskSpec with prompts and schema checks.
- Implement planner with LLM call and prompt template; enforce budgets (nodes/tools/LOC) and safety constraints; produce rationale.
- Implement coder to generate archive under archives/agents/<id>/ with src/tests/contracts/manifest/package.json and validators.
- Wire real OpenAI/Anthropic providers; fail clearly when keys missing; add caching/backoff.
- Generate deterministic UUIDs, seeds, model pins; hash manifest; parallel candidate generation with limits.
- Clean up temp dirs on failure; add tests for determinism and manifest validation.
