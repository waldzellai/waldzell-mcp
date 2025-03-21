# Changesets

This directory contains [changesets](https://github.com/changesets/changesets) that help manage package versioning and changelog generation.

## Using changesets

### Adding a changeset

When you make changes to packages, you need to create a changeset file:

```bash
npx changeset
```

This interactive command will ask you:
1. Which packages you've modified
2. What type of version bump is needed (patch, minor, major)
3. A brief description of the changes

### Publishing

To publish packages with changesets:

```bash
npm run publish-packages
```

This will:
1. Bump all package versions according to changesets
2. Generate/update changelogs
3. Publish packages to npm
4. Create a new commit with the version changes
5. Remove the applied changesets