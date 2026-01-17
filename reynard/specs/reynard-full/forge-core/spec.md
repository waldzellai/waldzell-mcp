# Spec: forge-core

Goal: stable core types, manifest IO, hashing, and novelty scoring used by all other packages.

Functional (MUST):
1) Types: finalize GraphSpec, NodeSpec (tool/llm/router/critic), EdgeSpec, BehaviorTrace, EvalResult, NoveltyResult, CandidateManifest with side-effect policies and sandbox pins.
2) Validation: zod (or equivalent) schemas; `readManifest`/`writeManifest` validate and fail with descriptive errors; defaulting for optional fields.
3) Hashing: deterministic `hashObject` independent of key order; used for manifests and request/response traces.
4) Novelty: implement `scoreNovelty` with archive nearest neighbor (behavioral distance), structural delta, size penalty; configurable thresholds; return pass/fail and component scores.
5) Utilities: manifest hash function, UUID generation helper, time-safe JSON stringify.

Non-functional:
- Pure, dependency-light; no side effects beyond provided FS calls.
- Type-safe exports used by other packages (no circular deps).

Acceptance:
- Invalid manifests reject with specific field path.
- Same manifest yields same hash across runs; different seeds or pins change hash.
- Novelty scoring runs against empty archive and populated archive; thresholds enforced.
