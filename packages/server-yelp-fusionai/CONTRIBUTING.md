# Contributing to yelp-fusionai-mcp

Thank you for your interest in contributing to the Yelp Fusion MCP server! This document provides guidelines for contributions to this project.

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/waldzellai/waldzell-mcp.git
   cd waldzell-mcp/packages/yelp-fusionai-mcp
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

## Testing

Run tests with:
```
npm test
```

Run a specific test:
```
npm test -- -t "test name"
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
2. Update the CHANGELOG.md file with details of the changes.
3. Create a new GitHub release which will trigger the publish workflow.

## Code of Conduct

Please be respectful and inclusive in all interactions related to this project.

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.