# Spec: forge-ui

Goal: operator UI to inspect runs, candidates, traces, metrics, and redteam findings.

Functional (MUST):
1) Data sources: fetch from local API/files (archives/, manifests/) with adapters; handle missing data gracefully.
2) Views: 
   - Runs list with status, timings, candidate IDs.
   - Candidate compare showing manifests, metrics, novelty, selection verdicts.
   - Trace viewer to step through BehaviorTrace with request/response hashes.
   - Redteam report view (if present).
3) Interactions: filter/search candidates; select winners; trigger reproduce (call CLI/API).
4) State: highlight config and model pins per candidate; show sandbox/egress policy.
5) Build/dev: Vite dev server; production build output; env config for backend URL or file mode.

SHOULD:
- Lightweight charts for metrics (latency, accuracy).
- Error toasts with actionable suggestions.

Acceptance:
- Against demo artifacts, UI renders runs list and trace viewer without console errors.
- Missing redteam report shows empty state not crash.
- Build succeeds with `pnpm --filter forge-ui run build`.
