#!/usr/bin/env node

/**
 * Yelp Fusion AI MCP Server - HTTP Entry Point
 *
 * Implements Streamable HTTP transport (MCP 2025-11-25 protocol)
 */

import crypto from 'node:crypto';
import express, { type Request, type Response } from 'express';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server-factory.js';

// =============================================================================
// Configuration
// =============================================================================

const YELP_API_KEY = process.env.YELP_API_KEY;
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

if (!YELP_API_KEY) {
  console.error('ERROR: YELP_API_KEY environment variable is required');
  process.exit(1);
}

// =============================================================================
// HTTP Server
// =============================================================================

const app = createMcpExpressApp({
  host: HOST,
});

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
}

const sessions = new Map<string, SessionEntry>();

// =============================================================================
// MCP Endpoint
// =============================================================================

app.all('/mcp', async (req: Request, res: Response) => {
  const mcpSessionId = req.headers['mcp-session-id'] as string | undefined;

  try {
    // Check for existing session
    if (mcpSessionId && sessions.has(mcpSessionId)) {
      const entry = sessions.get(mcpSessionId)!;

      // Handle session termination
      if (req.method === 'DELETE') {
        sessions.delete(mcpSessionId);
        res.status(200).json({ status: 'terminated' });
        return;
      }

      // Forward request to existing transport
      await entry.transport.handleRequest(req, res, req.body);
      return;
    }

    // Create new transport for new sessions
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (sessionId) => {
        sessions.set(sessionId, { transport });
      },
    });

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        sessions.delete(sid);
      }
    };

    // Create the MCP server
    const server = await createMcpServer({
      apiKey: YELP_API_KEY,
    });

    // Connect server to transport
    await server.connect(transport);

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP ERROR:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// =============================================================================
// Health Check
// =============================================================================

app.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'ok',
    transport: 'streamable-http',
    server: 'yelp-fusionai',
    version: '0.1.0',
  });
});

app.get('/info', (_: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: {
      name: 'yelp-fusionai',
      version: '0.1.0',
    },
    tools: [
      // Business Search
      'yelp_search',
      'yelp_phone_search',
      'yelp_business_match',
      'yelp_business_details',
      // Reviews
      'yelp_reviews',
      'yelp_review_highlights',
      // AI Chat
      'yelp_ai_chat',
      'yelp_ai_chat_stream',
      // Events
      'yelp_events',
      'yelp_event_details',
      'yelp_featured_event',
      // Autocomplete & Categories
      'yelp_autocomplete',
      'yelp_categories',
      'yelp_category_details',
      // Transactions
      'yelp_delivery_search',
      'yelp_service_offerings',
      // Insights
      'yelp_engagement_metrics',
      'yelp_business_insights',
      'yelp_food_drinks_insights',
      'yelp_risk_signals',
      // Waitlist
      'yelp_waitlist_status',
      'yelp_waitlist_info',
      'yelp_visit_details',
      'yelp_partner_restaurants',
      // Reservations
      'yelp_reservation_openings',
      'yelp_reservation_status',
    ],
  });
});

// =============================================================================
// Start Server
// =============================================================================

app.listen(PORT, () => {
  console.log(`Yelp Fusion AI MCP Server listening on http://${HOST}:${PORT}`);
  console.log(`  MCP endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`  Health check: http://${HOST}:${PORT}/health`);
});
