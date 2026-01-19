# Checklist: adas-system
- [ ] Pipeline spec→propose→eval→select→redteam (optional)→reproduce runs end-to-end.
- [ ] Manifests hashed/stored; seeds/model pins recorded; archives under archives/agents/<id>/.
- [ ] Eval metrics and traces stored under manifests/<id>/; redteam report stored when run.
- [ ] Selection outputs winners with Pareto justification.
- [ ] Reproduce reruns deterministically with same outputs/metrics within tolerance.
- [ ] Telemetry/logging covers stage transitions and errors.
