/**
 * Sample TypeStyle Server Analyzer
 * A simple example of using the TypeStyle server directly
 */

import { TypeStyleServer } from '../src/server.js';
import fs from 'fs';
import path from 'path';

// Create a new TypeStyle server instance
const server = new TypeStyleServer();

// Read the sample TypeScript file
async function analyzeSampleFile() {
  try {
    // Read the sample file
    const filePath = path.resolve(process.cwd(), 'examples', 'sample.ts');
    
    // Create the sample file if it doesn't exist
    if (!fs.existsSync(filePath)) {
      const sampleCode = `// Sample TypeScript with style issues
class badClassName {
  constructor(private Name: string) {}
  
  public Get_data(): any {
    return { Name: this.Name };
  }
}

let UserAge = 30;`;
      fs.writeFileSync(filePath, sampleCode, 'utf-8');
    }
    
    const code = fs.readFileSync(filePath, 'utf-8');
    
    console.log('Analyzing TypeScript file:', filePath);
    console.log('------------------------');
    console.log(code);
    console.log('------------------------');
    
    // Process the request with the server (without external search)
    const result = await server.processStyleRequest({
      code,
      groundSearch: false
    });
    
    // Parse and display the response
    const response = JSON.parse(result.content[0].text);
    
    console.log('\nStyle Analysis Results:');
    console.log('------------------------');
    
    if (response.feedback && response.feedback.length > 0) {
      console.log('Issues found:');
      response.feedback.forEach((issue: string, index: number) => {
        console.log(`${index + 1}. ${issue}`);
      });
    } else {
      console.log('No style issues found.');
    }
    
    if (response.recommendations) {
      console.log('\nRecommendations:');
      response.recommendations.forEach((rec: string, index: number) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log('\nStatus:', response.status);
  } catch (error) {
    console.error('Error analyzing file:', error);
  }
}

// Run the analyzer
analyzeSampleFile();