# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-04-27

### Fixed
- Use Toolsets.

## [1.1.0] - 2025-04-27

### Fixed
- Updated hardcoded version in Server constructor to match package.json (1.1.0)
- Improved API key handling with proper error messages when key is missing
- Enhanced error handling in fetch operations with timeout and specific error codes
- Enabled TypeScript strict mode for better type safety

### Changed
- Updated documentation for better clarity and completeness
- Improved installation and setup instructions in README.md
- Enhanced contributing guidelines with architecture information

## [0.1.7] - 2025-03-21

### Removed
- Removed HTML documentation files from source code to reduce package size
- Updated .gitignore to prevent HTML files from being added in future

## [0.1.6] - 2025-03-21

### Fixed
- Updated repository path in package.json to correct location
- Aligned package structure with monorepo configuration

## [0.1.0] - 2025-03-21

### Added
- Initial release of the Yelp Fusion MCP server
- Support for businesses, reviews, events, and categories API
- AI-powered natural language search with yelpQuery
- Advertising management tools
- OAuth authentication tools
- Waitlist management tools
- Respond to reviews tools
- Formatted Markdown responses
- TypeScript type definitions
- Comprehensive error handling
- Extensive documentation