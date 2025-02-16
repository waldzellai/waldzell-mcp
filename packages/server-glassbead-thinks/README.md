# @waldzellai/server-glassbead-thinks

An MCP server providing advanced problem-solving capabilities through sequential thinking, mental models, and debugging approaches.

[![smithery badge](https://smithery.ai/badge/@waldzellai/mcp-servers)](https://smithery.ai/server/@waldzellai/mcp-servers)


## Usage Options

### 1. NPX (Recommended for Claude Desktop)
```bash
npx @waldzellai/server-glassbead-thinks
```

Add to Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
```json
{
  "mcpServers": {
    "glassbead-thinks": {
      "command": "npx",
      "args": ["@waldzellai/server-glassbead-thinks"],
      "env": {}
    }
  }
}
```

### 2. Docker
```bash
# Pull the image
docker pull ghcr.io/waldzellai/server-glassbead-thinks

# Run the container
docker run -it --rm ghcr.io/waldzellai/server-glassbead-thinks
```

Add to Claude Desktop configuration:
```json
{
  "mcpServers": {
    "glassbead-thinks": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "ghcr.io/waldzellai/server-glassbead-thinks"
      ],
      "env": {}
    }
  }
}
```

### 3. NPM Installation
For use in your own projects:
```bash
npm install @waldzellai/server-glassbead-thinks
```

## Features

### 1. Sequential Thinking
- Dynamic thought progression
- Revision capabilities
- Branching thought paths
- Progress tracking
- Hypothesis generation and verification

### 2. Mental Models
- First Principles Thinking
- Opportunity Cost Analysis
- Error Propagation Understanding
- Rubber Duck Debugging
- Pareto Principle
- Occam's Razor

### 3. Debugging Approaches
- Binary Search
- Reverse Engineering
- Divide and Conquer
- Backtracking
- Cause Elimination
- Program Slicing

## Usage

### As an MCP Server

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// The server will automatically register its tools
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Available Tools

1. `sequentialthinking`
```typescript
interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
}
```

2. `mentalmodel`
```typescript
interface MentalModelData {
  modelName: string;
  problem: string;
  steps: string[];
  reasoning: string;
  conclusion: string;
}
```

3. `debuggingapproach`
```typescript
interface DebuggingApproachData {
  approachName: string;
  issue: string;
  steps: string[];
  findings: string;
  resolution: string;
}
```

## Tool Examples

### Sequential Thinking
```javascript
const result = await server.callTool("sequentialthinking", {
  thought: "Breaking down the problem into components",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
});
```

### Mental Model
```javascript
const result = await server.callTool("mentalmodel", {
  modelName: "first_principles",
  problem: "Optimize database queries",
  steps: ["Identify core operations", "Analyze query patterns"],
  reasoning: "Breaking down to fundamental operations",
  conclusion: "Implement query caching"
});
```

### Debugging Approach
```javascript
const result = await server.callTool("debuggingapproach", {
  approachName: "binary_search",
  issue: "Performance degradation",
  steps: ["Isolate timing", "Check midpoint", "Narrow search"],
  findings: "Memory leak in loop",
  resolution: "Fixed resource cleanup"
});
```

## Requirements
- Node.js >= 18
- ESM module support

## License
MIT

## Author
waldzellai [fork of work by Anthropic, PBC (https://anthropic.com)]

## Contributing
Issues and pull requests welcome at https://github.com/modelcontextprotocol/servers/issues
