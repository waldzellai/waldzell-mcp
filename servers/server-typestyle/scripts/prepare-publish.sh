#!/bin/bash
# Script to prepare and publish the package to NPM

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure we're in the project directory
cd "$(dirname "$0")/.."

echo -e "${YELLOW}Preparing TypeStyle MCP Server for NPM publishing...${NC}"

# Validate package
echo -e "\n${YELLOW}Validating package...${NC}"
npm run validate
if [ $? -ne 0 ]; then
  echo -e "${RED}Package validation failed. Fix issues before publishing.${NC}"
  exit 1
fi

# Run tests to ensure everything is working
echo -e "\n${YELLOW}Running tests...${NC}"
npm test
if [ $? -ne 0 ]; then
  echo -e "${RED}Tests failed. Fix issues before publishing.${NC}"
  exit 1
fi

# Clean and build
echo -e "\n${YELLOW}Cleaning and building...${NC}"
npm run clean
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Fix issues before publishing.${NC}"
  exit 1
fi

# Create typestyle_mcp_config.js with placeholder values
echo -e "\n${YELLOW}Creating config files...${NC}"
cp typestyle_mcp_config.template.ts typestyle_mcp_config.ts

# List files that will be published
echo -e "\n${YELLOW}Files to be published:${NC}"
npm pack --dry-run

# Final confirmation
echo -e "\n${YELLOW}Package is ready for publishing.${NC}"
echo -e "To publish, run: ${GREEN}npm publish --access public${NC}"
echo -e "Or to do a test publication: ${GREEN}npm publish --access public --dry-run${NC}"