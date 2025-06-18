#!/bin/bash
# Quick integration helper for collective intelligence

# Source this file in your scripts:
# source "$(dirname "${BASH_SOURCE[0]}")/collective-intelligence/integrate.sh"

CI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$CI_DIR/enhanced-telemetry-collector.sh" ]]; then
    source "$CI_DIR/enhanced-telemetry-collector.sh"
    export COLLECTIVE_SCRIPT_NAME="$(basename "${BASH_SOURCE[1]}")"
fi
