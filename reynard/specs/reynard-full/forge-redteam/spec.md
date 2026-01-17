# Spec: forge-redteam

Goal: attacker suite that probes candidate agents for prompt injection, data exfiltration, and policy bypass, producing actionable findings.

Functional (MUST):
1) Attack scenarios: include prompt injection, tool misuse, egress escalation, PII extraction; configurable via scenarios file.
2) Runner: execute attacks against candidate graph via exec layer with sandbox+ledger enabled; capture traces and responses.
3) Scoring: rate findings by severity/likelihood; output JSON report with repro steps.
4) Gating: mark candidate as failed if high-severity finding present.

SHOULD:
- Allow custom attack plugins.
- Summaries suitable for operator UI.

Acceptance:
- Demo candidate run produces report file; when attack blocked, marked as pass; when intentionally vulnerable mock used, report captures issue.
