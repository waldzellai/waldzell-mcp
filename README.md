# Waldzell MCP Monorepo

This repository is a `pnpm` monorepo containing a collection of Model Context Protocol (MCP) servers, tools, and related projects.

## Directory Structure

This repository is organized into the following main directories:

-   `servers/`: Contains the MCP servers. Each server is a separate package.
-   `reynard/`: A tool for creating and managing MCP servers.
-   `mcp-sidecar-observability/`: A Dockerized observability stack for the MCP servers, using OpenTelemetry, Prometheus, and Grafana.
-   `agentic-scripts/`: A collection of shell scripts for "agentic enhancement" of the projects in this repository.
-   `collective-intelligence/`: A set of shell scripts for telemetry, used by the `agentic-scripts`.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (version 18 or higher)
-   [pnpm](https://pnpm.io/) (version 9 or higher)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/waldzellai/mcp-servers.git
    cd mcp-servers
    ```

2.  Install the dependencies using `pnpm`:

    ```bash
    pnpm install
    ```

## Available Scripts

The following scripts are available at the root of the repository and can be run with `pnpm`:

-   `pnpm build`: Builds all the packages in the monorepo.
-   `pnpm test`: Runs the tests for all the packages.
-   `pnpm format`: Formats the code using Prettier.

For more specific scripts, please refer to the `package.json` file in each package's directory.

## Publishing

This repository uses [Changesets](https://github.com/changesets/changesets) to manage releases. To publish the packages, run the following command:

```bash
pnpm publish-packages
```

This will build all the packages and then publish them based on the current changeset information.

## License

All code in this repository is licensed under the MIT License.
