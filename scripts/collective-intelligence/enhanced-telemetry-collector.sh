#!/bin/bash

# Enhanced Collective Intelligence Telemetry Collector
# TASK-008: Create enhanced telemetry collector script
# Captures comprehensive agentic execution data and sends to Supabase

set -euo pipefail

# Configuration with enhanced defaults
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
SUPABASE_FUNCTION_URL="${SUPABASE_FUNCTION_URL:-}"
REPO_NAME="${GITHUB_REPOSITORY:-$(basename "$(git rev-parse --show-toplevel)" 2>/dev/null || echo "unknown")}"
SCRIPT_NAME="${1:-$(basename "$0")}"
TELEMETRY_ENABLED="${TELEMETRY_ENABLED:-true}"
TELEMETRY_BATCH_SIZE="${TELEMETRY_BATCH_SIZE:-10}"
TELEMETRY_FLUSH_INTERVAL="${TELEMETRY_FLUSH_INTERVAL:-30}"

# Advanced tracking variables
START_TIME=""
END_TIME=""
EXECUTION_ID=""
PARENT_EXECUTION_ID=""
TOKENS_USED=0
API_CALLS=0
ERROR_COUNT=0
WARNING_COUNT=0
MEMORY_USAGE=0
CPU_USAGE=0
NETWORK_USAGE=0
DISCOVERIES=()
PATTERNS_DETECTED=()
COLLABORATIONS=()

# Telemetry batch storage
TELEMETRY_BATCH=()
TELEMETRY_BATCH_FILE="/tmp/collective_telemetry_$$"

# Enhanced logging
TELEMETRY_LOG_LEVEL="${TELEMETRY_LOG_LEVEL:-INFO}"

# Initialize enhanced telemetry session
init_telemetry() {
    if [[ "$TELEMETRY_ENABLED" != "true" ]]; then
        return 0
    fi
    
    START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    EXECUTION_ID=$(uuidgen 2>/dev/null || echo "exec_$(date +%s)_$$")
    PARENT_EXECUTION_ID="${COLLECTIVE_PARENT_ID:-}"
    
    # Enhanced system metrics capture
    capture_system_metrics
    
    # Set up signal handlers for graceful shutdown
    trap 'cleanup_telemetry' EXIT INT TERM
    
    # Start background telemetry flusher
    start_telemetry_flusher &
    
    log_telemetry "INFO" "Enhanced telemetry initialized for $REPO_NAME/$SCRIPT_NAME"
    log_telemetry "DEBUG" "Execution ID: $EXECUTION_ID"
}

# Capture comprehensive system metrics
capture_system_metrics() {
    # Memory usage (RSS in MB)
    if command -v ps &> /dev/null; then
        MEMORY_USAGE=$(ps -o rss= -p $$ | awk '{print int($1/1024)}' 2>/dev/null || echo 0)
    fi
    
    # CPU usage percentage
    if command -v ps &> /dev/null; then
        CPU_USAGE=$(ps -o %cpu= -p $$ | awk '{print $1}' 2>/dev/null || echo 0)
    fi
    
    # Network usage (if available)
    if command -v netstat &> /dev/null; then
        NETWORK_USAGE=$(netstat -i 2>/dev/null | awk 'NR>2 {rx+=$4; tx+=$8} END {print rx+tx}' || echo 0)
    fi
}

# Enhanced execution metrics capture
capture_execution_metrics() {
    local exit_code="${1:-0}"
    local command_line="${2:-$0 $*}"
    local additional_context="${3:-{}}"
    
    if [[ "$TELEMETRY_ENABLED" != "true" ]]; then
        return 0
    fi
    
    END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    
    # Re-capture system metrics for delta calculation
    capture_system_metrics
    
    # Calculate success rate
    local success_rate=100
    if [[ $ERROR_COUNT -gt 0 ]] || [[ $exit_code -ne 0 ]]; then
        success_rate=$((100 - (ERROR_COUNT * 10) - (exit_code != 0 ? 20 : 0)))
        success_rate=$((success_rate < 0 ? 0 : success_rate))
    fi
    
    # Prepare comprehensive telemetry payload
    local payload=$(create_execution_payload "$exit_code" "$command_line" "$success_rate" "$additional_context")
    
    # Add to batch for efficient transmission
    add_to_telemetry_batch "$payload"
    
    # Process discoveries and patterns
    process_discoveries
    process_patterns
    process_collaborations
}

# Create comprehensive execution payload
create_execution_payload() {
    local exit_code="$1"
    local command_line="$2"
    local success_rate="$3"
    local additional_context="$4"
    
    cat <<EOF
{
    "repository_name": "$REPO_NAME",
    "script_name": "$SCRIPT_NAME",
    "execution_start": "$START_TIME",
    "execution_end": "$END_TIME",
    "tokens_used": $TOKENS_USED,
    "api_calls": $API_CALLS,
    "success_rate": $success_rate,
    "error_count": $ERROR_COUNT,
    "memory_usage_mb": $MEMORY_USAGE,
    "cpu_usage_percent": $CPU_USAGE,
    "exit_code": $exit_code,
    "command_line": $(echo "$command_line" | jq -R .),
    "environment_info": {
        "os": "$(uname -s)",
        "arch": "$(uname -m)",
        "shell": "$SHELL",
        "user": "$(whoami)",
        "pwd": "$(pwd)",
        "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
        "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
        "parent_execution_id": "$PARENT_EXECUTION_ID",
        "network_usage": $NETWORK_USAGE,
        "warning_count": $WARNING_COUNT
    },
    "additional_context": $additional_context
}
EOF
}

# Enhanced API usage recording
record_api_call() {
    local tokens="${1:-0}"
    local api_type="${2:-claude}"
    local response_quality="${3:-0.8}"
    local latency_ms="${4:-0}"
    
    ((API_CALLS++))
    ((TOKENS_USED += tokens))
    
    # Record detailed API metrics
    local api_metrics=$(cat <<EOF
{
    "api_type": "$api_type",
    "tokens": $tokens,
    "response_quality": $response_quality,
    "latency_ms": $latency_ms,
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF
    )
    
    log_telemetry "DEBUG" "API call recorded: $api_type, $tokens tokens, ${latency_ms}ms"
}

# Enhanced error recording
record_error() {
    local error_msg="${1:-Unknown error}"
    local error_type="${2:-generic}"
    local severity="${3:-medium}"
    local context="${4:-{}}"
    
    ((ERROR_COUNT++))
    
    # Enhanced error tracking
    local error_record=$(cat <<EOF
{
    "error_message": $(echo "$error_msg" | jq -R .),
    "error_type": "$error_type",
    "severity": "$severity",
    "context": $context,
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
    "stack_trace": "$(caller 2>/dev/null || echo 'N/A')"
}
EOF
    )
    
    log_telemetry "ERROR" "Error recorded: $error_type - $error_msg"
}

# Record warnings
record_warning() {
    local warning_msg="${1:-Unknown warning}"
    local warning_type="${2:-generic}"
    local context="${3:-{}}"
    
    ((WARNING_COUNT++))
    
    log_telemetry "WARN" "Warning recorded: $warning_type - $warning_msg"
}

# Enhanced discovery recording for collective learning
record_discovery() {
    local discovery_type="$1"
    local pattern_data="$2"
    local confidence="${3:-0.5}"
    local impact="${4:-0.5}"
    local validation_data="${5:-{}}"
    
    if [[ "$TELEMETRY_ENABLED" != "true" ]]; then
        return 0
    fi
    
    local discovery=$(cat <<EOF
{
    "source_repo": "$REPO_NAME",
    "source_script": "$SCRIPT_NAME",
    "discovery_type": "$discovery_type",
    "pattern_data": $pattern_data,
    "confidence_score": $confidence,
    "impact_score": $impact,
    "validation_data": $validation_data,
    "execution_id": "$EXECUTION_ID",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF
    )
    
    DISCOVERIES+=("$discovery")
    log_telemetry "INFO" "Discovery recorded: $discovery_type (confidence: $confidence)"
}

# Record pattern detection
record_pattern() {
    local pattern_type="$1"
    local pattern_signature="$2"
    local occurrence_count="${3:-1}"
    local effectiveness="${4:-0.5}"
    
    local pattern=$(cat <<EOF
{
    "pattern_type": "$pattern_type",
    "pattern_signature": $(echo "$pattern_signature" | jq -R .),
    "occurrence_count": $occurrence_count,
    "effectiveness": $effectiveness,
    "detected_by": "$SCRIPT_NAME",
    "repository": "$REPO_NAME",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF
    )
    
    PATTERNS_DETECTED+=("$pattern")
    log_telemetry "INFO" "Pattern detected: $pattern_type"
}

# Record collaboration events
record_collaboration() {
    local collaboration_type="$1"
    local target_repo="$2"
    local collaboration_data="$3"
    local success_metrics="${4:-{}}"
    
    local collaboration=$(cat <<EOF
{
    "initiator_repo": "$REPO_NAME",
    "target_repo": "$target_repo",
    "collaboration_type": "$collaboration_type",
    "event_data": $collaboration_data,
    "success_metrics": $success_metrics,
    "execution_id": "$EXECUTION_ID",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF
    )
    
    COLLABORATIONS+=("$collaboration")
    log_telemetry "INFO" "Collaboration recorded: $collaboration_type with $target_repo"
}

# Batch telemetry management
add_to_telemetry_batch() {
    local payload="$1"
    TELEMETRY_BATCH+=("$payload")
    
    # Auto-flush if batch is full
    if [[ ${#TELEMETRY_BATCH[@]} -ge $TELEMETRY_BATCH_SIZE ]]; then
        flush_telemetry_batch
    fi
}

# Flush telemetry batch to Supabase
flush_telemetry_batch() {
    if [[ ${#TELEMETRY_BATCH[@]} -eq 0 ]]; then
        return 0
    fi
    
    local batch_payload="[$(IFS=','; echo "${TELEMETRY_BATCH[*]}")]"
    
    # Send batch to Supabase
    if send_telemetry_batch "$batch_payload"; then
        log_telemetry "DEBUG" "Telemetry batch flushed: ${#TELEMETRY_BATCH[@]} items"
        TELEMETRY_BATCH=()
    else
        log_telemetry "WARN" "Failed to flush telemetry batch, retrying later"
    fi
}

# Send telemetry batch with enhanced error handling
send_telemetry_batch() {
    local batch_payload="$1"
    
    if [[ -z "$SUPABASE_URL" ]] || [[ -z "$SUPABASE_ANON_KEY" ]]; then
        log_telemetry "DEBUG" "Supabase credentials not configured, skipping telemetry"
        return 0
    fi
    
    local endpoint="$SUPABASE_URL/rest/v1/agentic_executions"
    if [[ -n "$SUPABASE_FUNCTION_URL" ]]; then
        endpoint="$SUPABASE_FUNCTION_URL/analytics/performance"
    fi
    
    # Enhanced retry logic with exponential backoff
    local max_retries=3
    local retry_count=0
    local base_delay=2
    
    while [[ $retry_count -lt $max_retries ]]; do
        local delay=$((base_delay ** retry_count))
        
        if curl -s -X POST \
            "$endpoint" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=minimal" \
            -d "$batch_payload" > /dev/null 2>&1; then
            return 0
        else
            ((retry_count++))
            log_telemetry "DEBUG" "Telemetry send failed, retry $retry_count/$max_retries in ${delay}s"
            sleep $delay
        fi
    done
    
    # Store failed batch for later retry
    echo "$batch_payload" >> "$TELEMETRY_BATCH_FILE"
    return 1
}

# Process and send discoveries
process_discoveries() {
    if [[ ${#DISCOVERIES[@]} -eq 0 ]]; then
        return 0
    fi
    
    local discoveries_payload="[$(IFS=','; echo "${DISCOVERIES[*]}")]"
    
    if [[ -n "$SUPABASE_URL" ]] && [[ -n "$SUPABASE_ANON_KEY" ]]; then
        local endpoint="$SUPABASE_URL/rest/v1/collective_discoveries"
        if [[ -n "$SUPABASE_FUNCTION_URL" ]]; then
            endpoint="$SUPABASE_FUNCTION_URL/analytics/discoveries"
        fi
        
        curl -s -X POST \
            "$endpoint" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=minimal" \
            -d "$discoveries_payload" > /dev/null 2>&1 || true
    fi
    
    log_telemetry "INFO" "Processed ${#DISCOVERIES[@]} discoveries"
}

# Process and send pattern data
process_patterns() {
    if [[ ${#PATTERNS_DETECTED[@]} -eq 0 ]]; then
        return 0
    fi
    
    # Send pattern data for network analysis
    local patterns_payload="[$(IFS=','; echo "${PATTERNS_DETECTED[*]}")]"
    
    if [[ -n "$SUPABASE_FUNCTION_URL" ]]; then
        curl -s -X POST \
            "$SUPABASE_FUNCTION_URL/intelligence/pattern-detection" \
            -H "Content-Type: application/json" \
            -d "$patterns_payload" > /dev/null 2>&1 || true
    fi
    
    log_telemetry "INFO" "Processed ${#PATTERNS_DETECTED[@]} patterns"
}

# Process collaboration events
process_collaborations() {
    if [[ ${#COLLABORATIONS[@]} -eq 0 ]]; then
        return 0
    fi
    
    local collaborations_payload="[$(IFS=','; echo "${COLLABORATIONS[*]}")]"
    
    if [[ -n "$SUPABASE_URL" ]] && [[ -n "$SUPABASE_ANON_KEY" ]]; then
        curl -s -X POST \
            "$SUPABASE_URL/rest/v1/collaboration_events" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=minimal" \
            -d "$collaborations_payload" > /dev/null 2>&1 || true
    fi
    
    log_telemetry "INFO" "Processed ${#COLLABORATIONS[@]} collaborations"
}

# Background telemetry flusher
start_telemetry_flusher() {
    while sleep "$TELEMETRY_FLUSH_INTERVAL"; do
        if [[ ${#TELEMETRY_BATCH[@]} -gt 0 ]]; then
            flush_telemetry_batch
        fi
    done &
}

# Enhanced health status update
update_health_status() {
    local health_score="${1:-1.0}"
    local performance_trend="${2:-stable}"
    local issues=("${@:3}")
    
    if [[ "$TELEMETRY_ENABLED" != "true" ]]; then
        return 0
    fi
    
    local issues_json="[]"
    if [[ ${#issues[@]} -gt 0 ]]; then
        issues_json=$(printf '%s\n' "${issues[@]}" | jq -R . | jq -s .)
    fi
    
    local uptime_percentage=$(awk "BEGIN {printf \"%.2f\", (1 - ($ERROR_COUNT / ($API_CALLS + 1))) * 100}")
    local error_rate=$(awk "BEGIN {printf \"%.2f\", ($ERROR_COUNT * 100) / ($API_CALLS + 1)}")
    
    local health_payload=$(cat <<EOF
{
    "repository_name": "$REPO_NAME",
    "health_score": $health_score,
    "uptime_percentage": $uptime_percentage,
    "error_rate": $error_rate,
    "performance_trend": "$performance_trend",
    "last_execution": "$END_TIME",
    "issues_detected": $issues_json,
    "auto_fixes_applied": 0,
    "manual_intervention_required": $([ "$health_score" -lt 0.7 ] && echo "true" || echo "false")
}
EOF
    )
    
    # Send health update
    if [[ -n "$SUPABASE_URL" ]] && [[ -n "$SUPABASE_ANON_KEY" ]]; then
        curl -s -X POST \
            "$SUPABASE_URL/rest/v1/system_health" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
            -H "Content-Type: application/json" \
            -H "Prefer: return=minimal" \
            -d "$health_payload" > /dev/null 2>&1 || true
    fi
}

# Enhanced logging with levels
log_telemetry() {
    local level="$1"
    local message="$2"
    
    # Check if we should log this level
    case "$TELEMETRY_LOG_LEVEL" in
        "ERROR")
            [[ "$level" != "ERROR" ]] && return 0
            ;;
        "WARN")
            [[ "$level" =~ ^(DEBUG|INFO)$ ]] && return 0
            ;;
        "INFO")
            [[ "$level" == "DEBUG" ]] && return 0
            ;;
        "DEBUG")
            # Log everything
            ;;
    esac
    
    echo "[TELEMETRY-$level] $(date -u +"%Y-%m-%d %H:%M:%S UTC") $message" >&2
}

# Enhanced cleanup function
cleanup_telemetry() {
    local exit_code=$?
    
    # Capture final metrics
    capture_execution_metrics "$exit_code" "$0 $*"
    
    # Flush any remaining telemetry
    flush_telemetry_batch
    
    # Calculate final health score
    local final_health_score
    if [[ $ERROR_COUNT -eq 0 ]] && [[ $exit_code -eq 0 ]]; then
        final_health_score="1.0"
    else
        final_health_score=$(awk "BEGIN {printf \"%.2f\", 1.0 - (($ERROR_COUNT * 0.1) + ($exit_code != 0 ? 0.2 : 0))}")
    fi
    
    update_health_status "$final_health_score"
    
    # Clean up temporary files
    [[ -f "$TELEMETRY_BATCH_FILE" ]] && rm -f "$TELEMETRY_BATCH_FILE"
    
    log_telemetry "INFO" "Telemetry session completed. Health score: $final_health_score"
}

# Auto-initialize if sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced - auto-initialize
    init_telemetry
fi

# Enhanced usage demonstration
demonstrate_usage() {
    cat << EOF
Enhanced Collective Intelligence Telemetry Collector
==================================================

Basic Usage:
source /path/to/enhanced-telemetry-collector.sh

API Recording:
record_api_call 150 "claude" 0.9 250  # tokens, type, quality, latency_ms

Error/Warning Recording:
record_error "API timeout" "network" "high" '{"endpoint": "/api/v1"}'
record_warning "Slow response" "performance" '{"response_time": 2500}'

Discovery Recording:
record_discovery "optimization_found" '{"improvement": "25% faster"}' 0.8 0.7

Pattern Recording:
record_pattern "retry_pattern" "3-exponential-backoff" 5 0.9

Collaboration Recording:
record_collaboration "knowledge_transfer" "target-repo" '{"patterns": ["p1"]}' '{"success": true}'

Health Updates:
update_health_status 0.95 "improving" "Minor latency detected"

Configuration:
export TELEMETRY_ENABLED=true
export TELEMETRY_LOG_LEVEL=INFO
export TELEMETRY_BATCH_SIZE=5
export TELEMETRY_FLUSH_INTERVAL=15
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
export SUPABASE_FUNCTION_URL=https://your-project.functions.supabase.co/collective-intelligence

EOF
}

# If called directly, show usage
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    demonstrate_usage
fi