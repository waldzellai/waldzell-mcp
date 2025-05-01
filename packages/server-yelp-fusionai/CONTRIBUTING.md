# Contributing to server-yelp-fusionai

Thank you for your interest in contributing to the Yelp Fusion MCP server! This document provides guidelines for contributions to this project.

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/waldzellai/waldzell-mcp.git
   cd waldzell-mcp/packages/server-yelp-fusionai
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your Yelp API credentials:
   ```
   YELP_API_KEY=your_api_key_here
   YELP_CLIENT_ID=your_client_id_here
   ```

4. Run the development server:
   ```
   npm run dev
   ```

## Project Architecture

### Toolsets Structure

The server is organized around the concept of toolsets, which are logical groupings of related tools:

- **Toolset**: A collection of related tools (e.g., business_search, reviews, events)
- **Tool**: An individual function that interacts with the Yelp API (e.g., yelpBusinessSearch)
- **Toolset Group**: A higher-level grouping of toolsets (e.g., discovery, interaction)

The main components are:

- `src/index.ts`: Entry point and server configuration
- `src/toolsets/index.ts`: Defines and initializes all toolsets
- `src/toolsets/dynamic.ts`: Handles dynamic toolset discovery
- `src/utils/toolsets.ts`: Utility functions for toolset management
- `src/utils/formatters/`: Response formatters for different API endpoints
- `src/schemas/`: Zod schemas for API requests and responses

### Adding a New Tool

To add a new tool to an existing toolset:

1. Define the tool's schema using Zod in the appropriate schema file
2. Create a formatter for the response in the appropriate formatter file
3. Add the tool to the toolset in `src/toolsets/index.ts` using `addReadToolsToToolset` or `addWriteToolsToToolset`

## Testing

Run tests with:
```
npm test
```

Run a specific test:
```
npm test -- -t "test name"
```

### Testing Guidelines

When adding new features or fixing bugs, please include appropriate tests:

1. **Unit Tests**: For individual functions and utilities
2. **Integration Tests**: For API interactions
3. **End-to-End Tests**: For complete workflows

Test files should be placed alongside the code they test with a `.test.ts` suffix.

Example test structure:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockFunction } from '../test-utils';

describe('YelpBusinessSearch', () => {
  beforeEach(() => {
    // Setup test environment
  });

  afterEach(() => {
    // Clean up after tests
  });

  it('should return formatted business results', async () => {
    // Test implementation
    expect(result).toMatchSnapshot();
  });

  it('should handle errors gracefully', async () => {
    // Test error handling
    expect(result.isError).toBe(true);
  });
});
```

## Code Style

This project uses ESLint and Prettier for code formatting:

```
npm run lint
npm run format
```

Please ensure your code passes all linting rules before submitting a pull request.

## Pull Request Process

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Add tests for your changes.
4. Ensure all tests pass and linting is clean.
5. Submit a pull request with a clear description of the changes.

## Release Process

Releases are managed by the maintainers and published to npm using GitHub Actions:

1. Update the `version` in `package.json` according to semantic versioning.
2. Update the CHANGELOG.md file with details of the changes following the Keep a Changelog format.
3. Create a new GitHub release which will trigger the publish workflow.

### Versioning Guidelines

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

Each release should be properly documented in the CHANGELOG.md file, categorizing changes as:
- Added (for new features)
- Changed (for changes in existing functionality)
- Deprecated (for soon-to-be removed features)
- Removed (for now removed features)
- Fixed (for any bug fixes)
- Security (in case of vulnerabilities)

## Code of Conduct

Please be respectful and inclusive in all interactions related to this project.

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.