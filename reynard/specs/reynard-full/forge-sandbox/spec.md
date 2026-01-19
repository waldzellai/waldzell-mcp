# Spec: forge-sandbox

Goal: sandbox driver that runs candidate code and tools with enforced resource and egress policies.

Functional (MUST):
1) Docker driver: run commands in container with CPU/mem/time limits, read-only rootfs, writable mounts per config, and network mode (none or allowlist).
2) Egress control: `testEgress(host)` executes curl inside container and reports allow/deny; deny-by-default when policy is blocklisted.
3) IO: capture stdout/stderr, exitCode; stream logs optionally.
4) Inputs: mount candidate archive and datasets read-only; provide writable scratch and ledger mount.
5) API: `run(opts, limits)` used by exec; returns outputs and stats (duration, bytes).

SHOULD:
- Cache built images; detect host Docker availability and error helpfully.
- Support additional drivers pluggable (gvisor/firecracker) but optional.

Acceptance:
- Enforces mem/CPU/time caps (process killed when exceeded).
- Egress blocked when policy denies; allowed hosts succeed.
- Running demo candidate returns exitCode 0 and captured logs.
