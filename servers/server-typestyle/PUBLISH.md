# Publishing Guide for TypeStyle MCP Server

This document describes how to publish the TypeStyle MCP Server to the NPM registry.

## Prerequisites

1. You need an NPM account with access to the `@waldzellai` organization
2. You need to be logged in to NPM in your terminal (`npm login`)
3. Ensure you have the latest code from the repository

## Publishing Steps

1. Ensure the version number is correct:
   - Check `package.json` and `index.ts` for consistent version numbers

2. Run the validation script:
   ```bash
   npm run validate
   ```

3. Run the prepare-publish script:
   ```bash
   npm run prepare-publish
   ```
   This script will:
   - Run tests
   - Build the package
   - Create a correct config file
   - List files to be published
   
4. Publish the package:
   ```bash
   # For a dry run (no actual publishing)
   npm publish --access public --dry-run
   
   # For actual publishing
   npm publish --access public
   ```
   
   Alternatively, use:
   ```bash
   npm run publish-package
   ```

## After Publishing

1. Create a git tag for the version:
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

2. Update the documentation to reference the new version:
   ```bash
   # Example for Claude Desktop Config
   {
     "mcpServers": {
       "typestyle": {
         "command": "npx",
         "args": [
           "-y",
           "@waldzellai/server-typestyle@0.1.1"
         ]
       }
     }
   }
   ```

## Versioning Strategy

We follow semantic versioning:
- PATCH (0.0.x): Bug fixes and minor updates
- MINOR (0.x.0): New features, backwards compatible
- MAJOR (x.0.0): Breaking changes

## Troubleshooting

- If the publish fails due to authentication, run `npm login` again
- If you need to unpublish a version (within 72 hours):
  ```bash
  npm unpublish @waldzellai/server-typestyle@0.1.1
  ```
- For other issues, refer to the NPM documentation