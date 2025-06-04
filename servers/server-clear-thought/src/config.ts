/**
 * Configuration schema and types for the Clear Thought MCP server
 */

import { z } from 'zod';

/**
 * Configuration schema for the Clear Thought MCP server
 * 
 * @property debug - Enable debug logging (default: false)
 * @property maxThoughtsPerSession - Maximum number of thoughts allowed per session (default: 100)
 * @property sessionTimeout - Session timeout in milliseconds (default: 3600000 - 1 hour)
 * @property enableMetrics - Enable metrics collection (default: false)
 */
export const ServerConfigSchema = z.object({
  debug: z.boolean().default(false).describe('Enable debug logging'),
  maxThoughtsPerSession: z.number().min(1).max(1000).default(100).describe('Maximum number of thoughts allowed per session'),
  sessionTimeout: z.number().min(60000).default(3600000).describe('Session timeout in milliseconds'),
  enableMetrics: z.boolean().default(false).describe('Enable metrics collection')
});

/**
 * Inferred type from the configuration schema
 */
export type ServerConfig = z.infer<typeof ServerConfigSchema>;

/**
 * Default configuration values
 */
export const defaultConfig: ServerConfig = {
  debug: false,
  maxThoughtsPerSession: 100,
  sessionTimeout: 3600000, // 1 hour
  enableMetrics: false
};

/**
 * Validates and parses configuration
 * @param config - Raw configuration object
 * @returns Validated configuration
 * @throws {z.ZodError} If configuration is invalid
 */
export function parseConfig(config: unknown): ServerConfig {
  return ServerConfigSchema.parse(config);
}

/**
 * Safely parses configuration with fallback to defaults
 * @param config - Raw configuration object
 * @returns Validated configuration or default configuration
 */
export function safeParseConfig(config: unknown): ServerConfig {
  const result = ServerConfigSchema.safeParse(config);
  if (result.success) {
    return result.data;
  }
  
  console.warn('Invalid configuration provided, using defaults:', result.error.issues);
  return defaultConfig;
}