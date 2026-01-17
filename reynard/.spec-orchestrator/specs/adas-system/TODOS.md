# TODOs: adas-system
- Wire end-to-end pipeline: spec → propose (N) → eval → select → optional redteam → reproduce.
- Enforce deterministic manifests (hash, seeds, model pins) and archive locations.
- Persist artifacts: archives/agents/<id>/, manifests/<id>/eval.json, traces, redteam reports.
- Implement selection Pareto logic over performance/novelty/complexity; produce winners with justification.
- Add telemetry/logging across stages; structured summaries for operator/UI.
- Validate config loading and failure modes; support cancellation.
