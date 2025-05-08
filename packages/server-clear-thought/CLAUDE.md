# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides systematic thinking, mental models, and debugging approaches for enhanced problem-solving capabilities. It enables Claude to use various cognitive tools including sequential thinking, mental models, and structured debugging approaches.

## Commands

### Building and Running

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# Watch mode (for development)
npm run dev 

# Build Docker image
npm run docker
# or directly
docker build -t waldzellai/clear-thought .

# Run Docker container
docker run -it waldzellai/clear-thought

# Deploy to Smithery
npm run deploy
```

### Cleaning

```bash
# Clean the build directory
npm run clean
```

## Code Architecture

This project is a TypeScript-based MCP server that follows the Model Context Protocol defined by Anthropic. It consists of several key components:

1. **Server Class Definitions** - Implementation of various thinking tools:
   - `SequentialThinkingServer` - Supports multi-step thinking with revision capabilities
   - `MentalModelServer` - Provides structured mental models like First Principles, Pareto, etc.
   - `DebuggingApproachServer` - Implements debugging methodologies like Binary Search

2. **Data Interfaces** - Type definitions for the various thinking tools:
   - `ThoughtData` - For sequential thinking steps
   - `MentalModelData` - For mental model applications
   - `DebuggingApproachData` - For debugging approaches

3. **Tool Definitions** - Registration of tools with the MCP framework:
   - Each tool has a name, description, and input schema
   - Consistent schemas for use by language models

4. **Request Handlers** - Logic to process tool requests:
   - Validates input data against schemas
   - Calls appropriate processing functions
   - Returns formatted JSON responses

5. **Server Transport** - Uses stdio for communication with the MCP client

The server is implemented as a single-file application (`index.ts`) that gets compiled to JavaScript using TypeScript.

## File Structure

- `index.ts` - Main server implementation
- `dist/` - Compiled JavaScript code
- `Dockerfile` - Container definition
- `smithery.yaml` - Smithery deployment configuration
- `package.json` - Node.js package definition

## Key Implementation Notes

1. **Tool Processing Flow**:
   - Data validation through type checking
   - Server class instance processes the data
   - Results are formatted and returned as JSON

2. **Thinking Tools**:
   - Sequential Thinking: Maintains thought history with support for branching and revision
   - Mental Models: Provides structure for applying specific reasoning frameworks
   - Debugging Approaches: Implements technical problem-solving methodologies
   - Additional cognitive tools: Collaborative reasoning, decision frameworks, metacognitive monitoring, etc.

3. **Configuration**:
   - The server uses TypeScript with ES2020 target
   - Uses stdio for communication with MCP clients
   - No configuration required to run

4. **Deployment**:
   - Can be deployed via Smithery
   - Available as a Docker container
   - Can be installed via npm