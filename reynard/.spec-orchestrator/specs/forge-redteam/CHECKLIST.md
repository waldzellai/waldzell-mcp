# Checklist: forge-redteam
- [ ] Scenarios cover injection, misuse, egress, PII.
- [ ] Runner uses exec with sandbox/ledger enabled.
- [ ] Findings JSON includes severity/likelihood and repro steps.
- [ ] High-severity flags candidate as failed.
- [ ] Vulnerable mock triggers finding in tests; hardened path passes.
