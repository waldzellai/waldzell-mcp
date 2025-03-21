const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'index.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace error parameter
content = content.replace(/catch\s*\(\s*error\s*\)\s*{/g, 'catch (error: unknown) {');

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('Error type annotations added successfully!');