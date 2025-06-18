# Collective Intelligence Quick Start

## 1. Configure Environment
```bash
cp collective-intelligence/.env.template collective-intelligence/.env
# Edit .env with your Supabase credentials
```

## 2. Add to Your Scripts
Add this line near the top of your shell scripts:
```bash
source "$(dirname "${BASH_SOURCE[0]}")/collective-intelligence/integrate.sh"
```

## 3. Use Telemetry Functions
```bash
# Record API usage
record_api_call 150 "openai" 0.9 250

# Record discoveries
record_discovery "optimization_found" '{"improvement": "30% faster"}' 0.8 0.7

# Record patterns
record_pattern "caching_strategy" "lru-cache-implementation" 5 0.9
```

That's it! Your scripts now contribute to collective intelligence.
