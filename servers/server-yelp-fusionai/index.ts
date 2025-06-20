#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const YELP_API_KEY = process.env.YELP_API_KEY;

if (!YELP_API_KEY) {
  console.error("YELP_API_KEY environment variable not set");
  process.exit(1);
}

const BUSINESS_SEARCH_TOOL: Tool = {
  name: "business_search",
  description: "Search Yelp businesses by term and location",
  inputSchema: {
    type: "object",
    properties: {
      term: { type: "string", description: "Search keywords" },
      location: { type: "string", description: "Location to search" },
    },
    required: ["term", "location"],
  },
};

const server = new Server(
  { name: "yelp-fusionai", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [BUSINESS_SEARCH_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "business_search") {
    const args = request.params.arguments as { term: string; location: string };
    try {
      const response = await axios.get(
        "https://api.yelp.com/v3/businesses/search",
        {
          headers: { Authorization: `Bearer ${YELP_API_KEY}` },
          params: { term: args.term, location: args.location, limit: 5 },
        }
      );

      const results = response.data.businesses.map((b: any) => ({
        name: b.name,
        rating: b.rating,
        address: b.location?.display_address?.join(", ") ?? "",
      }));

      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: "Failed to fetch data from Yelp API" }],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
    isError: true,
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

