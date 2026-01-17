/**
 * LLM Provider Types for Reynard Forge
 *
 * Defines the common interface for all LLM providers
 */

/**
 * Options for model completion
 */
export interface ModelOptions {
  model: string;
  temperature: number;
  maxTokens?: number;
  stopSequences?: string[];
}

/**
 * Response from an LLM completion
 */
export interface CompletionResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Message format for chat completions
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Common interface for all LLM providers
 */
export interface LLMProvider {
  /**
   * Provider name for logging/debugging
   */
  readonly name: string;

  /**
   * Simple text completion
   */
  complete(prompt: string, options: ModelOptions): Promise<string>;

  /**
   * Chat completion with messages
   */
  chat(messages: Message[], options: ModelOptions): Promise<CompletionResponse>;

  /**
   * Check if the provider is configured and ready
   */
  isConfigured(): boolean;
}

/**
 * Configuration for creating a provider
 */
export interface ProviderConfig {
  provider: 'openai' | 'anthropic';
  apiKey?: string;
}

/**
 * Error thrown when provider is not configured
 */
export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(
      `${provider} provider is not configured. ` +
      `Set the ${provider.toUpperCase()}_API_KEY environment variable.`
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

/**
 * Error thrown when API call fails
 */
export class ProviderApiError extends Error {
  constructor(provider: string, message: string, public readonly statusCode?: number) {
    super(`${provider} API error: ${message}`);
    this.name = 'ProviderApiError';
  }
}
