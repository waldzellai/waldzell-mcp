# @waldzellai/mcp-servers

[![smithery badge](https://smithery.ai/badge/@waldzellai/mcp-servers)](https://smithery.ai/server/@waldzellai/mcp-servers)

A collection of Model Context Protocol (MCP) servers providing various capabilities for AI assistants.

## Packages

### [@waldzellai/clear-thought](packages/server-clear-thought)
An MCP server providing advanced problem-solving capabilities through:
- Sequential thinking with dynamic thought evolution
- Mental models for structured problem decomposition
- Systematic debugging approaches

## Development

This is a monorepo using npm workspaces. To get started:

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Clean all packages
npm run clean

# Test all packages
npm run test
```

## Package Management

Each package in the `packages/` directory is published independently to npm under the `@waldzellai` organization scope.

To create a new package:
1. Create a new directory under `packages/`
2. Initialize with required files (package.json, src/, etc.)
3. Add to workspaces in root package.json if needed

## License
MIT
