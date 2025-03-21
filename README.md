
# Waldzell MCP Servers

This is a Turborepo-powered monorepo containing MCP (Model Context Protocol) servers for various AI assistant integrations.

## What's inside?

### Packages

- **[server-yelp-fusionai](./packages/server-yelp-fusionai)** - MCP server for Yelp Fusion API
- **[server-typestyle](./packages/server-typestyle)** - Google TypeScript Style Guide MCP server
- **[server-stochasticthinking](./packages/server-stochasticthinking)** - Stochastic thinking MCP server
- **[server-clear-thought](./packages/server-clear-thought)** - Sequentialthinking fork inspired by James Clear
- **[common](./packages/common)** - Shared utilities and types

### Utilities

This monorepo uses [Turborepo](https://turbo.build/repo) with [Yarn 4 Workspaces](https://yarnpkg.com/features/workspaces).

- [Turborepo](https://turbo.build/repo) — High-performance build system for monorepos
- [Yarn 4](https://yarnpkg.com/) — Modern package management with PnP support
- [Changesets](https://github.com/changesets/changesets) — Managing versioning and changelogs
- [GitHub Actions](https://github.com/features/actions) — Automated workflows
- [Smithery](https://smithery.ai) — Deployment platform for MCP servers

## Getting Started

### Prerequisites

- Node.js 18 or higher
- [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/waldzellai/mcp-servers.git
cd mcp-servers
yarn install
```

### Development

To develop all packages:

```bash
yarn dev
```

### Building

To build all packages:

```bash
yarn build
```

The build output will be in each package's `dist/` directory.

### Testing

```bash
yarn test
```

### Linting

```bash
yarn lint
```

### Deploying to Smithery

This repo is set up to easily deploy packages to Smithery:

```bash
# Deploy all packages
yarn deploy

# Deploy specific packages
yarn smithery:yelp-fusion
yarn smithery:typestyle
yarn smithery:stochastic
yarn smithery:clear-thought
```

## Workflow

### Adding a new feature

1. Create a new branch
2. Make your changes
3. Add a changeset (documents what's changed for version bumping):
   ```bash
   yarn changeset
   ```
4. Push your changes

### Releasing new versions

We use Changesets to manage versions. Create a PR with your changes and Changesets will create a release PR that you can merge to release new versions.

For manual releases:

```bash
yarn publish-packages
```

### Adding a New Package

1. Create a new directory in the `packages` directory
2. Initialize the package with `yarn init`
3. Add your source code
4. Update `turbo.json` pipeline if needed
5. Add a `smithery.yaml` file if you want to deploy to Smithery
6. Run `yarn install` at the root to update workspaces

## Turborepo

### Remote Caching

Turborepo can use a remote cache to share build artifacts across machines. To enable Remote Caching:

```bash
yarn dlx turbo login
yarn dlx turbo link
```

## MCP Server Documentation

Each MCP server package in this monorepo has its own README with detailed documentation:

- [Yelp Fusion MCP Server](./packages/server-yelp-fusionai/README.md)
- [TypeStyle MCP Server](./packages/server-typestyle/README.md)
- [Stochastic Thinking MCP Server](./packages/server-stochasticthinking/README.md)
- [Clear Thought MCP Server](./packages/server-clear-thought/README.md)

## License

All packages in this monorepo are licensed under the MIT License - see each package's LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

