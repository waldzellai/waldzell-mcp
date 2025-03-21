#!/bin/bash
# Test script for running integration tests with Exa MCP server
# This script automatically handles setup of Exa MCP server for testing

# Go to the project directory
cd "$(dirname "$0")/.."

# Build the project if needed
echo "Building the project..."
npm run build

# Run the integration test with Exa configured in typestyle_mcp_config.ts
echo "Running integration test with Exa MCP server..."
echo "NOTE: Make sure you have a valid Exa API key in typestyle_mcp_config.ts"
node dist/src/test/integration-test.js