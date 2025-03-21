/**
 * Test Harness for TypeStyle Server
 * This file provides a framework for testing the TypeStyle server's functionality
 */

import { TypeStyleServer } from '../server.js';
import { VerticalServerConfig } from '../constants.js';

// Sample TypeScript code with various style issues
const TEST_SAMPLES = {
  // Naming conventions issues
  namingConventions: `
    // Interface with I-prefix (discouraged by Google Style Guide)
    interface IUserData {
      name: string;
      age: number;
    }
    
    // Class with non-PascalCase name
    class userData {
      constructor(public name: string, public Age: number) {}
      
      // Method with non-camelCase name
      public Get_user_info() {
        return { user_name: this.name, Age: this.Age };
      }
    }
    
    // Variables with incorrect casing
    const UserName = 'John';
    let AGE = 30;
  `,
  
  // Type system issues
  typeSystem: `
    // Using 'any' type
    function processData(data: any) {
      return data.length;
    }
    
    // Using non-null assertion
    function getLength(str?: string) {
      return str!.length;
    }
    
    // Using angle bracket type assertion
    const value = <number>getSomeValue();
    
    function getSomeValue() {
      return 42;
    }
  `,
  
  // Formatting issues
  formatting: `
    // Line exceeding 80 characters
    const veryLongVariableName = 'This is an extremely long string that exceeds the 80 character limit recommended by the Google TypeScript Style Guide';
    
    // Control statement without braces
    if (true) console.log('This should have braces');
    
    // Inconsistent spacing
    function add(a:number,b:number) {
      return a+b;
    }
    
    // Trailing whitespace
    const trailingSpace = 'value';   
  `,
  
  // Source file structure issues
  sourceFileStructure: `
    // Missing license/copyright header
    import './someInternalModule';
    import * as fs from 'fs';
    import '@company/module';
    
    // Unordered imports (standard library should come first)
    
    export function doSomething() {
      return fs.readFileSync('file.txt');
    }
  `,
  
  // Best practices issues
  bestPractices: `
    // Using eval
    function dynamicCode(expression: string) {
      return eval(expression);
    }
    
    // Using with statement
    function useWith(obj: any) {
      with (obj) {
        property = 'value';
      }
    }
    
    // Using let when const would be appropriate
    function getData() {
      let result = 42;
      return result;
    }
  `,
  
  // Performance issues
  performance: `
    function processList(items: string[]) {
      // Multiple calls to Object.keys on the same object
      const obj = { a: 1, b: 2, c: 3 };
      
      for (const key of Object.keys(obj)) {
        console.log(key);
      }
      
      const values = Object.values(obj);
      for (const val of values) {
        console.log(val);
      }
      
      // Excessive type assertions
      const a = items[0] as string;
      const b = items[1] as string;
      const c = items[2] as unknown as number;
      const d = items[3] as any as boolean;
      const e = items[4] as string;
      const f = items[5] as unknown as object;
      
      return { a, b, c, d, e, f };
    }
  `
};

// Mock responses for external search MCP
const MOCK_SEARCH_RESPONSES: Record<string, any> = {
  'naming_conventions': {
    content: [{
      type: 'text',
      text: JSON.stringify({
        results: [{
          content: 'Google TypeScript Style Guide (Naming): ' +
            'Use PascalCase for class, interface, type, and enum names. ' +
            'Use camelCase for variable, parameter, function, method, property, and module constant names. ' +
            'Do not use the "I" prefix for interface names.',
          source: 'Google TypeScript Style Guide - Naming',
          url: 'https://google.github.io/styleguide/tsguide.html#naming'
        }]
      })
    }]
  },
  
  'type_system': {
    content: [{
      type: 'text',
      text: JSON.stringify({
        results: [{
          content: 'Google TypeScript Style Guide (Type System): ' +
            'Do not use the any type unless absolutely necessary. ' +
            'Use unknown instead of any when the type is truly unknown. ' +
            'Avoid using the non-null assertion operator (!) where possible. ' +
            'Use the as Type syntax for type assertions instead of angle brackets.',
          source: 'Google TypeScript Style Guide - Type System',
          url: 'https://google.github.io/styleguide/tsguide.html#type-system'
        }]
      })
    }]
  }
};

// Mock MCP client that returns predefined responses
class MockMcpClient {
  constructor(private readonly mockResponses: Record<string, any>) {}
  
  async callTool(toolName: string, params: any) {
    // Match query to a mock response
    const query = params.query?.toLowerCase() || '';
    
    // Find relevant mock response based on keywords in the query
    for (const [key, response] of Object.entries(this.mockResponses)) {
      if (query.includes(key)) {
        return response;
      }
    }
    
    // Default response if no match
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          results: [{
            content: 'Default search response for testing',
            source: 'Test Source'
          }]
        })
      }]
    };
  }
}

// Test harness that runs tests against the TypeStyle server
class TypeStyleTestHarness {
  private server: TypeStyleServer;
  
  constructor() {
    // Create a configuration with mock search service
    const config: VerticalServerConfig = {
      primaryMcpServer: {
        url: 'mock://search',
        token: 'mock-token',
        toolName: 'search'
      },
      cacheResults: false
    };
    
    // Create the server with test configuration
    this.server = new TypeStyleServer(config);
    
    // Replace the SearchService with our mock implementation
    const mockSearchService = {
      search: async (query: string) => {
        const mockClient = new MockMcpClient(MOCK_SEARCH_RESPONSES);
        const response = await mockClient.callTool('search', { query });
        
        try {
          // Parse the response to match the SearchResponse interface
          const responseText = response.content[0].text;
          const parsedContent = JSON.parse(responseText);
          
          return {
            results: parsedContent.results.map((item: any) => ({
              content: item.content,
              source: item.source,
              url: item.url
            })),
            query
          };
        } catch (error) {
          console.error('Error parsing mock response:', error);
          return {
            results: [],
            query,
            isError: true
          };
        }
      }
    };
    
    // @ts-ignore - Inject mock search service
    this.server.searchService = mockSearchService;
  }
  
  // Category mapping from test names to actual style categories
  private categoryMap: Record<string, string> = {
    'namingConventions': 'naming_conventions',
    'typeSystem': 'type_system',
    'formatting': 'code_formatting',
    'sourceFileStructure': 'source_file_structure',
    'bestPractices': 'best_practices',
    'performance': 'performance_optimization'
  };
  
  /**
   * Run a single test case
   * @param code TypeScript code to test
   * @param category Optional category to focus on
   * @param groundSearch Whether to use search for grounding
   */
  async runTest(code: string, category?: string, groundSearch: boolean = true) {
    console.log('\n======================================');
    console.log(`Running test${category ? ` for ${category}` : ''}:`);
    console.log('======================================');
    
    // Map test category name to actual style category
    const mappedCategory = category ? this.categoryMap[category] || category : undefined;
    
    const request = {
      code,
      category: mappedCategory,
      groundSearch
    };
    
    try {
      const result = await this.server.processStyleRequest(request);
      console.log('Test Result:');
      console.log(JSON.stringify(JSON.parse(result.content[0].text), null, 2));
      return result;
    } catch (error) {
      console.error('Test failed:', error);
      return null;
    }
  }
  
  /**
   * Run a test with each sample
   */
  async runAllTests() {
    // Test with grounding enabled
    console.log('\n\n=============================================');
    console.log('RUNNING TESTS WITH GROUNDING ENABLED');
    console.log('=============================================');
    
    for (const [category, code] of Object.entries(TEST_SAMPLES)) {
      await this.runTest(code, category, true);
    }
    
    // Test with grounding disabled
    console.log('\n\n=============================================');
    console.log('RUNNING TESTS WITH GROUNDING DISABLED');
    console.log('=============================================');
    
    for (const [category, code] of Object.entries(TEST_SAMPLES)) {
      await this.runTest(code, category, false);
    }
    
    // Test a query instead of code
    console.log('\n\n=============================================');
    console.log('TESTING STYLE QUERY');
    console.log('=============================================');
    
    try {
      const queryResult = await this.server.processStyleRequest({
        query: 'How should I name my interfaces in TypeScript?'
      });
      console.log('Query Result:');
      console.log(JSON.stringify(JSON.parse(queryResult.content[0].text), null, 2));
    } catch (error) {
      console.error('Query test failed:', error);
    }
  }
}

// Run the tests
async function runTests() {
  console.log('Starting TypeStyle Server test harness...');
  const testHarness = new TypeStyleTestHarness();
  await testHarness.runAllTests();
  console.log('\nTest harness complete!');
}

runTests().catch(error => {
  console.error('Test harness failed:', error);
  process.exit(1);
});
