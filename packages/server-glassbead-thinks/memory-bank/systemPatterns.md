# System Patterns

## Architecture Overview

### Core Components
1. Sequential Thinking Engine
   - Thought processing and validation
   - Branch management
   - Progress tracking
   - Dynamic thought evolution

2. Mental Models Framework
   ```typescript
   interface MentalModel {
     name: string;
     description: string;
     steps: string[];
     apply: (problem: string) => Solution;
   }
   ```

3. Debugging Approaches System
   ```typescript
   interface DebuggingApproach {
     name: string;
     steps: string[];
     execute: (issue: string) => Resolution;
   }
   ```

## Mental Models Implementation

### First Principles
- Component: FirstPrinciplesModel
- Pattern: Recursive decomposition
- State Management: Immutable problem state
- Validation: Step completion verification

### Opportunity Cost
- Component: OpportunityCostModel
- Pattern: Trade-off matrix
- State Management: Option comparison tracking
- Validation: Benefit/cost verification

### Error Propagation
- Component: ErrorPropagationModel
- Pattern: Chain of responsibility
- State Management: Error state tracking
- Validation: Fault tree analysis

### Rubber Duck
- Component: RubberDuckModel
- Pattern: Step-by-step explanation
- State Management: Explanation progress
- Validation: Clarity check

### Pareto Principle
- Component: ParetoModel
- Pattern: Impact prioritization
- State Management: Priority queue
- Validation: Impact verification

### Occam's Razor
- Component: OccamModel
- Pattern: Complexity scoring
- State Management: Solution ranking
- Validation: Simplicity verification

## Debugging Approaches Implementation

### Binary Search
- Component: BinarySearchDebugger
- Pattern: Divide and conquer
- State Management: Search space tracking
- Validation: Midpoint verification

### Reverse Engineering
- Component: ReverseEngineeringDebugger
- Pattern: Backward chaining
- State Management: State history
- Validation: Cause-effect verification

### Divide and Conquer
- Component: DivideConquerDebugger
- Pattern: Recursive segmentation
- State Management: Segment tracking
- Validation: Isolation verification

### Backtracking
- Component: BacktrackingDebugger
- Pattern: State reversion
- State Management: State stack
- Validation: State consistency

### Cause Elimination
- Component: CauseEliminationDebugger
- Pattern: Hypothesis testing
- State Management: Hypothesis tracking
- Validation: Elimination verification

### Program Slicing
- Component: ProgramSlicingDebugger
- Pattern: Dependency analysis
- State Management: Slice tracking
- Validation: Relevance verification

## Integration Patterns

### Tool Registration
```typescript
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (input: unknown) => Promise<Result>;
}
```

### Response Formatting
```typescript
interface Response {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}
```

### Error Handling
- Validation errors: Input schema validation
- Runtime errors: Try-catch with formatted responses
- State errors: Consistent state management

## Data Flow
1. Request validation
2. Tool selection
3. Input processing
4. Model/approach application
5. Result formatting
6. Response delivery

## Extension Points
- New mental models
- Additional debugging approaches
- Enhanced validation rules
- Custom formatters
