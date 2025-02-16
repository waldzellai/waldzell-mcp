# Technical Context

## Technology Stack

### Core Dependencies
- @modelcontextprotocol/sdk: ^0.5.0
- TypeScript: ^5.3.3
- Node.js: ^22
- chalk: ^5.3.0 (for formatted output)

### Development Tools
- tsc (TypeScript compiler)
- shx (for cross-platform shell commands)
- ESM modules (type: "module")

## Implementation Details

### Server Configuration
```typescript
{
  name: "sequential-thinking-server",
  version: "0.6.2",
  capabilities: {
    tools: {
      sequentialthinking: {...},
      mentalmodel: {...},
      debuggingapproach: {...}
    }
  }
}
```

### Data Structures

#### Mental Model Data
```typescript
interface MentalModelData {
  modelName: string;          // Name of the mental model being applied
  problem: string;           // Problem description
  steps: string[];          // Steps taken in applying the model
  reasoning: string;       // Explanation of the thought process
  conclusion: string;     // Final outcome or solution
}
```

#### Debugging Approach Data
```typescript
interface DebuggingApproachData {
  approachName: string;      // Name of the debugging approach
  issue: string;            // Description of the issue
  steps: string[];         // Steps taken in debugging
  findings: string;       // What was discovered
  resolution: string;    // How the issue was resolved
}
```

### Tool Schemas

#### Mental Model Tool
```typescript
{
  name: "mentalmodel",
  inputSchema: {
    type: "object",
    properties: {
      modelName: {
        type: "string",
        enum: [
          "first_principles",
          "opportunity_cost",
          "error_propagation",
          "rubber_duck",
          "pareto_principle",
          "occams_razor"
        ]
      },
      problem: { type: "string" },
      steps: { 
        type: "array",
        items: { type: "string" }
      },
      reasoning: { type: "string" },
      conclusion: { type: "string" }
    },
    required: ["modelName", "problem"]
  }
}
```

#### Debugging Approach Tool
```typescript
{
  name: "debuggingapproach",
  inputSchema: {
    type: "object",
    properties: {
      approachName: {
        type: "string",
        enum: [
          "binary_search",
          "reverse_engineering",
          "divide_conquer",
          "backtracking",
          "cause_elimination",
          "program_slicing"
        ]
      },
      issue: { type: "string" },
      steps: {
        type: "array",
        items: { type: "string" }
      },
      findings: { type: "string" },
      resolution: { type: "string" }
    },
    required: ["approachName", "issue"]
  }
}
```

## Technical Constraints

### Performance
- Synchronous tool execution
- In-memory state management
- No external database required

### Error Handling
- Input validation using JSON Schema
- Structured error responses
- Graceful degradation

### Security
- No external network access required
- Input sanitization
- No file system access needed

## Development Guidelines

### Code Style
- ESM module syntax
- Strict TypeScript typing
- Functional programming patterns where applicable
- Immutable state management

### Testing
- Unit tests for each model/approach
- Integration tests for tool handlers
- Schema validation tests
- Error handling tests

### Documentation
- TSDoc comments
- README.md updates
- Changelog maintenance
- Type definitions

## Deployment

### Package Structure
```
dist/
├── index.js
└── types/
    ├── mental-models.d.ts
    └── debugging-approaches.d.ts
```

### Distribution
- npm package
- Executable binary
- Docker container (optional)
