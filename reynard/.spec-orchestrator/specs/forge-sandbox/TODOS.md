# TODOs: forge-sandbox
- Implement DockerDriver run with CPU/mem/time caps, RO rootfs, writable mounts, network mode none/allowlist.
- Add egress test via curl inside container, deny-by-default when policy blocks.
- Capture stdout/stderr/exitCode and duration; optional streaming.
- Mount archives/datasets RO and scratch/ledger RW.
- Detect missing Docker and return actionable error.
- Add basic tests or dry-run checks.
