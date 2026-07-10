# Provenance and Historical Status

Three commits are retained as source archaeology:

- `d9d75bb` — introduced the Waldzell agentic Bash bundle and orchestration
  workflow.
- `1937631` — introduced the original Reynard Forge monorepo scaffold.
- `41fb5ab` — expanded the Reynard Forge ADAS implementation while retaining
  simulated verification paths.

These commits are historical sources, not verified releases. Their presence in
Git does not make their scripts supported, safe to execute, compatible with the
current package, or acceptable evidence for the reliability lab. They predate
the current fail-closed Docker path, public-CLI acceptance suite, negative
control, content-addressed artifact validation, production-source guard, and
retirement guard.

The removed executable bundle remains available only through Git history for
review. It must not be copied into a quick start, workflow, package script, or
production source. Restoring it would require a new explicit security decision;
it is not a rollback mechanism for Reynard.

The supported implementation begins with the retirement and narrow revival
commits documented by `RELIABILITY_LAB_PLAN.md`. Current behavior is established
only by the checked-in source, package lock, fixture digests, and fresh
verification output for the exact commit under review.
