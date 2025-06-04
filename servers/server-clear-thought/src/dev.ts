#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import createClearThoughtServer from './index.js';

async function runDev() {
  const transport = new StdioServerTransport();
  
  // Create server with dev config
  const server = createClearThoughtServer({
    sessionId: 'dev-' + Date.now(),
    config: {
      debug: true,
      maxThoughtsPerSession: 100,
      sessionTimeout: 3600000,
      enableMetrics: false
    }
  });
  
  await server.connect(transport);
  console.error('[Clear Thought] Development server running on stdio');
  console.error('[Clear Thought] Session ID:', 'dev-' + Date.now());
  console.error('[Clear Thought] Debug mode: enabled');
  console.error('[Clear Thought] Press Ctrl+C to exit');
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.error('\n[Clear Thought] Shutting down...');
    transport.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.error('\n[Clear Thought] Received SIGTERM, shutting down...');
    transport.close();
    process.exit(0);
  });
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDev().catch(error => {
    console.error('[Clear Thought] Fatal error:', error);
    process.exit(1);
  });
}