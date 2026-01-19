/**
 * OpenAI Provider for Reynard Forge
 *
 * Implements LLMProvider interface using OpenAI's API
 */

import type {
  LLMProvider,
  ModelOptions,
  Message,
  CompletionResponse,
} from './types';
import { ProviderNotConfiguredError, ProviderApiError } from './types';

/**
 * OpenAI provider implementation
 *
 * Note: Full implementation requires the 'openai' package.
 * This is a typed stub that can be completed when the package is installed.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(prompt: string, options: ModelOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new ProviderNotConfiguredError('OpenAI');
    }

    // TODO: Replace with actual OpenAI SDK call when package is installed
    // const response = await this.client.chat.completions.create({
    //   model: options.model,
    //   temperature: options.temperature,
    //   max_tokens: options.maxTokens,
    //   messages: [{ role: 'user', content: prompt }],
    // });
    // return response.choices[0].message.content ?? '';

    // Stub implementation for development
    console.warn('[OpenAI] Using stub implementation - install openai package for real API calls');
    return this.stubResponse(prompt, options);
  }

  async chat(messages: Message[], options: ModelOptions): Promise<CompletionResponse> {
    if (!this.isConfigured()) {
      throw new ProviderNotConfiguredError('OpenAI');
    }

    // TODO: Replace with actual OpenAI SDK call
    // const response = await this.client.chat.completions.create({
    //   model: options.model,
    //   temperature: options.temperature,
    //   max_tokens: options.maxTokens,
    //   messages: messages,
    // });

    // Stub implementation
    console.warn('[OpenAI] Using stub implementation - install openai package for real API calls');
    const content = this.stubResponse(messages.map(m => m.content).join('\n'), options);

    return {
      content,
      finishReason: 'stop',
      usage: {
        promptTokens: this.estimateTokens(messages.map(m => m.content).join(' ')),
        completionTokens: this.estimateTokens(content),
        totalTokens: 0, // Calculated below
      },
    };
  }

  /**
   * Stub response for development without API key
   */
  private stubResponse(prompt: string, options: ModelOptions): string {
    const promptPreview = prompt.slice(0, 100).replace(/\n/g, ' ');
    return JSON.stringify({
      _stub: true,
      _provider: 'openai',
      _model: options.model,
      _temperature: options.temperature,
      _prompt_preview: promptPreview,
      message: 'This is a stub response. Configure OPENAI_API_KEY for real completions.',
    }, null, 2);
  }

  /**
   * Rough token estimation (actual counting requires tiktoken)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

/**
 * Create OpenAI provider with optional API key
 */
export function createOpenAIProvider(apiKey?: string): OpenAIProvider {
  return new OpenAIProvider(apiKey);
}
