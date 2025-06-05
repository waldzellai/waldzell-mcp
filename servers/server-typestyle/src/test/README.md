# TypeStyle Server Test Suite

This directory contains testing utilities for the TypeStyle MCP Server.

## Test Harness

The `test-harness.ts` file provides a comprehensive test framework that validates the TypeStyle server's functionality without requiring external MCP connections.

### Features

- Tests all style categories with sample code
- Tests with and without search grounding
- Mocks external MCP search functionality
- Validates query-based style guidance

### Sample Test Cases

The test harness includes sample TypeScript code with intentional style issues across all categories:

1. **Naming Conventions** - Tests interface naming, class naming, and variable casing
2. **Type System** - Tests any usage, non-null assertions, and type assertion syntax
3. **Formatting** - Tests line length, bracing style, and spacing
4. **Source File Structure** - Tests import ordering and file organization
5. **Best Practices** - Tests restricted language features like eval and with statements
6. **Performance** - Tests type assertion patterns and object operation efficiency

### Mock Search Service

The test harness includes a mock search service that simulates connections to external MCP servers like Perplexity or Exa. This allows testing the vertical architecture functionality without external dependencies.

## Running Tests

To run the tests:

```bash
npm run test
```

This will execute the test harness and output detailed results for each test case.

## Adding New Tests

To add a new test case:

1. Add a new code sample to the `TEST_SAMPLES` object
2. Add any necessary mock responses to `MOCK_SEARCH_RESPONSES`
3. Run the tests to validate your new test case

## Results Interpretation

The test output will show:

- Results with grounding enabled (using mock search)
- Results with grounding disabled (using only local analysis)
- Query-based style guidance

For each test, you'll see the full server response including:
- Style feedback items
- Recommendations
- Citations (when grounding is enabled)
- Explanations for style rules