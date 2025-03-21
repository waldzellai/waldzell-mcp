const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'index.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of function parameters without type annotations
content = content.replace(/async\s+\(\s*args\s*\)\s*:/g, 'async (args: Record<string, any>):');
content = content.replace(/catch\s+\(\s*error\s*\)\s*{/g, 'catch (error: unknown) {');

// Add StdioTransport import
if (!content.includes('import { StdioTransport }')) {
  const importLine = "import { McpServer } from '@modelcontextprotocol/sdk';";
  const newImportLine = "import { McpServer, StdioTransport } from '@modelcontextprotocol/sdk';";
  content = content.replace(importLine, newImportLine);
}

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('Type annotations added successfully!');