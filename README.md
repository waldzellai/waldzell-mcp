# Waldzell MCP Servers

This repository contains a set of Model Context Protocol (MCP) servers. Each server lives in its own folder under `servers/` and can be used independently. The project is intentionally lightweight and does not make use of a complex monorepo toolchain.

## Available servers

- [Clear Thought](./servers/server-clear-thought) – Sequential thinking tools inspired by James Clear
- [Google Styleguide](./servers/server-google-styleguide) – Google TypeScript style guide server
- [Stochastic Thinking](./servers/server-stochasticthinking) – Stochastic thinking utilities
- [TypeStyle](./servers/server-typestyle) – TypeScript style guide server

## Getting started

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

Install dependencies for all servers:

```bash
npm install
```

Build every server:

```bash
npm run build --workspaces
```

Run tests for all servers:

```bash
npm test --workspaces
```

Refer to each server's README for usage instructions and additional scripts.

## Publishing

To publish the packages defined in this repository:

```bash
npm run build --workspaces && changeset publish
```

## License

All code in this repository is licensed under the MIT License.

