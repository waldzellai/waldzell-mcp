#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
// Fixed chalk import for ESM
import chalk from 'chalk';
import { validateInput, ValidationError, ProcessResult } from "./src/utils/validation.js";
import { ThoughtDataSchema, MentalModelSchema, DebuggingApproachSchema } from "./src/schemas/core.js";
import { CollaborativeReasoningSchema } from "./src/schemas/collaborative.js";

// Data Interfaces
interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  