# Waldzell MCP Servers

This is a Turborepo-powered monorepo containing MCP (Model Context Protocol) servers for various AI assistant integrations.

## What's inside?

### Packages

- **[yelp-fusionai-mcp](./packages/yelp-fusionai-mcp)** - MCP server for Yelp Fusion API
- **[server-stochasticthinking](./packages/server-stochasticthinking)** - Stochastic thinking MCP server
- **[server-clear-thought](./packages/server-clear-thought)** - Clear thought MCP server
- **[common](./packages/common)** - Shared utilities and types

### Utilities

This monorepo uses [Turborepo](https://turbo.build/repo) with [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces).

- [Turborepo](https://turbo.build/repo) — High-performance build system for monorepos
- [Changesets](https://github.com/changesets/changesets) — Managing versioning and changelogs
- [GitHub Actions](https://github.com/features/actions) — Automated workflows
- [Smithery](https://smithery.ai) — Deployment platform for MCP servers

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/waldzellai/mcp-servers.git
cd mcp-servers
npm install
```

### Development

To develop all packages:

```bash
npm run dev
```

### Building

To build all packages:

```bash
npm run build
```

The build output will be in each package's `dist/` directory.

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

### Deploying to Smithery

This repo is set up to easily deploy packages to Smithery:

```bash
# Deploy all packages
npm run deploy

# Deploy specific packages
npm run smithery:yelp
npm run smithery:stochastic
npm run smithery:clear-thought
```

## Workflow

### Adding a new feature

1. Create a new branch
2. Make your changes
3. Add a changeset (documents what's changed for version bumping):
   ```bash
   npx changeset
   ```
4. Push your changes

### Releasing new versions

We use Changesets to manage versions. Create a PR with your changes and Changesets will create a release PR that you can merge to release new versions.

For manual releases:

```bash
npm run publish-packages
```

### Adding a New Package

1. Create a new directory in the `packages` directory
2. Initialize the package with `npm init`
3. Add your source code
4. Update `turbo.json` pipeline if needed
5. Add a `smithery.yaml` file if you want to deploy to Smithery

## Turborepo

### Remote Caching

Turborepo can use a remote cache to share build artifacts across machines. To enable Remote Caching:

```bash
npx turbo login
npx turbo link
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.