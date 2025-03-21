import { Project } from 'ts-morph';

// Create a new project
const project = new Project();

// Add the source file
const sourceFile = project.addSourceFileAtPath('./src/index.ts');

// Find all arrow functions that are missing parameter types
const arrowFunctions = sourceFile.getDescendantsOfKind(4); // 4 is SyntaxKind.ArrowFunction

for (const arrowFunction of arrowFunctions) {
  const parameters = arrowFunction.getParameters();
  
  for (const parameter of parameters) {
    if (parameter.getName() === 'args' && !parameter.getType().getText()) {
      if (parameter.getText() === 'args') {
        // Add a type annotation
        parameter.setType('Record<string, any>');
        console.log(`Added type annotation to parameter: ${parameter.getText()}`);
      }
    }
  }
}

// Save the changes
sourceFile.save();

console.log('Type annotations added successfully!');