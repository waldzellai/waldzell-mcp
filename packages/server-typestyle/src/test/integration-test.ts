/**
 * Integration Test for TypeStyle Server
 * This script demonstrates connecting to real MCP search servers.
 * 
 * Uses configuration from typestyle_mcp_config.ts in the project root
 */

import { TypeStyleServer } from '../server.js';
import { VerticalServerConfig } from '../constants.js';
import { MCP_CONFIG } from '../../typestyle_mcp_config.js';
import { spawn } from 'child_process';
import * as http from 'http';

// Test code with multiple style issues
const TEST_CODE = `
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

// Using 'any' type
function processData(data: any) {
  return data.length;
}

// Using non-null assertion
function getLength(str?: string) {
  return str!.length;
}
`;

// MCP Servers to start
const EXA_SERVER_PORT = 3456;

// Create configuration based on MCP config
function createServerConfig(): VerticalServerConfig {
  const config: VerticalServerConfig = {
    primaryMcpServer: {
      url: `http://localhost:${EXA_SERVER_PORT}/mcp`,
      token: MCP_CONFIG.mcpServers.exa.env.EXA_API_KEY,
      toolName: 'search'
    },
    cacheResults: false
  };
  
  return config;
}

// Start MCP server for Exa
function startExaMcpServer(): Promise<any> {
  return new Promise((resolve, reject) => {
    const serverConfig = MCP_CONFIG.mcpServers.exa;
    const env = { ...process.env, ...serverConfig.env, PORT: String(EXA_SERVER_PORT) };
    
    console.log(`Starting Exa MCP server on port ${EXA_SERVER_PORT}...`);
    const serverProcess = spawn(serverConfig.command, serverConfig.args, { env });
    
    serverProcess.stdout.on('data', (data) => {
      console.log(`Exa server: ${data}`);
      if (data.toString().includes('Server is listening')) {
        // Wait a moment for the server to fully initialize
        setTimeout(() => {
          checkServerHealth(EXA_SERVER_PORT)
            .then(() => resolve(serverProcess))
            .catch(reject);
        }, 1000);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`Exa server error: ${data}`);
    });
    
    serverProcess.on('error', (error) => {
      console.error(`Failed to start Exa server: ${error.message}`);
      reject(error);
    });
    
    // Timeout if server doesn't start in 10 seconds
    setTimeout(() => {
      reject(new Error('Timeout waiting for Exa MCP server to start'));
    }, 10000);
  });
}

// Check if the server is healthy
function checkServerHealth(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/health',
      method: 'GET'
    }, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`Server health check failed with status ${res.statusCode}`));
      }
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function runIntegrationTest() {
  console.log('Starting TypeStyle Server integration test...');
  
  let exaServerProcess: any = null;
  
  try {
    // Start the Exa MCP server
    console.log('Setting up test environment...');
    exaServerProcess = await startExaMcpServer();
    
    // Create the server with our configuration
    const config = createServerConfig();
    const server = new TypeStyleServer(config);
    
    // Log which server we're using
    const searchServer = `connected to Exa MCP Server (localhost:${EXA_SERVER_PORT})`;
    console.log(`TypeStyle integration test ${searchServer}`);
    
    // Test with full code analysis
    console.log('\n1. Full code analysis:');
    const fullResult = await server.processStyleRequest({ code: TEST_CODE });
    console.log(JSON.stringify(JSON.parse(fullResult.content[0].text), null, 2));
    
    // Test with specific category
    console.log('\n2. Naming conventions analysis:');
    const namingResult = await server.processStyleRequest({ 
      code: TEST_CODE,
      category: 'naming_conventions'
    });
    console.log(JSON.stringify(JSON.parse(namingResult.content[0].text), null, 2));
    
    // Test with style question
    console.log('\n3. Style question:');
    const questionResult = await server.processStyleRequest({ 
      query: 'What is the Google style guide recommendation for interface names?'
    });
    console.log(JSON.stringify(JSON.parse(questionResult.content[0].text), null, 2));
    
    // Test with specific rule explanation
    console.log('\n4. Specific rule explanation:');
    const ruleResult = await server.processStyleRequest({ 
      rule: 'interfaces_vs_types'
    });
    console.log(JSON.stringify(JSON.parse(ruleResult.content[0].text), null, 2));
    
    console.log('\nIntegration test complete!');
  } catch (error) {
    console.error('Integration test failed:', error);
  } finally {
    // Clean up - kill the MCP server process if it's running
    if (exaServerProcess) {
      console.log('Shutting down Exa MCP server...');
      exaServerProcess.kill();
    }
  }
}

runIntegrationTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});