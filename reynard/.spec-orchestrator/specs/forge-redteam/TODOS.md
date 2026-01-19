# TODOs: forge-redteam
- Define attack scenarios (prompt injection, tool misuse, egress escalation, PII extraction) as config.
- Implement runner invoking exec with sandbox+ledger; capture traces/responses.
- Score findings by severity/likelihood; output JSON report.
- Gate candidates with high-severity findings.
- Add tests using a vulnerable mock to ensure findings are detected.
