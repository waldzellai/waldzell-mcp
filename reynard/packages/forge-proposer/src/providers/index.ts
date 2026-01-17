export * from './types.js';
export * from './openai.js';
export * from './anthropic.js';

import type { LLMProvider, ProviderConfig } from './types.js';
import { createOpenAIProvider } from './openai.js';
import { createAnthropicProvider } from './anthropic.js';
import { ProviderNotConfiguredError } from './types.js';

/**
 * Create an LLM provider based on configuration
 */
export function createProvider(config: ProviderConfig): LLMProvider {
  switch (config.provider) {
    case 'openai':
      return createOpenAIProvider(config.apiKey);
    
    case 'anthropic':
      return createAnthropicProvider(config.apiKey);
    
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

/**
 * Get default provider from environment
 */
export function getDefaultProvider(): LLMProvider {
  // Try OpenAI first
  if (process.env.OPENAI_API_KEY) {
    return createOpenAIProvider();
  }
  
  // Try Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    return createAnthropicProvider();
  }
  
  // Return unconfigured OpenAI (will error on use with clear message)
  console.warn('No LLM provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
  return createOpenAIProvider();
}
