# TODOs: forge-core
- Add zod schemas for GraphSpec, CandidateManifest, BehaviorTrace, EvalResult, NoveltyResult; expose validate helpers.
- Enforce schema validation in readManifest/writeManifest with descriptive errors and defaults.
- Provide UUID helper and deterministic hash (key-order safe).
- Implement novelty scoring with archive nearest-neighbor behavioral distance, structural delta, size penalty; thresholds configurable.
- Add tests for hashing determinism, manifest validation, novelty scoring edge cases.
