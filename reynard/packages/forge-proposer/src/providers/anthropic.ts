/**
 * Anthropic Provider for Reynard Forge
 *
 * Implements LLMProvider interface using Anthropic's API
 */

import type {
  LLMProvider,
  ModelOptions,
  Message,
  CompletionResponse,
} from './types';
import { ProviderNotConfiguredError, ProviderApiError } from './types';

/**
 * Anthropic provider implementation
 *
 * Note: Full implementation requires the '@anthropic-ai/sdk' package.
 * This is a typed stub that can be completed when the package is installed.
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(prompt: string, options: ModelOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new ProviderNotConfiguredError('Anthropic');
    }

    // TODO: Replace with actual Anthropic SDK call when package is installed
    // const response = await this.client.messages.create({
    //   model: options.model,
    //   max_tokens: options.maxTokens || 4096,
    //   temperature: options.temperature,
    //   messages: [{ role: 'user', content: prompt }],
    // });
    // return response.content[0].type === 'text' ? response.content[0].text : '';

    // Stub implementation for development
    console.warn('[Anthropic] Using stub implementation - install @anthropic-ai/sdk for real API calls');
    return this.stubResponse(prompt, options);
  }

  async chat(messages: Message[], options: ModelOptions): Promise<CompletionResponse> {
    if (!this.isConfigured()) {
      throw new ProviderNotConfiguredError('Anthropic');
    }

    // TODO: Replace with actual Anthropic SDK call
    // Anthropic uses a different message format with system prompt separate
    // const systemMessage = messages.find(m => m.role === 'system');
    // const chatMessages = messages.filter(m => m.role !== 'system');
    //
    // const response = await this.client.messages.create({
    //   model: options.model,
    //   max_tokens: options.maxTokens || 4096,
    //   temperature: options.temperature,
    //   system: systemMessage?.content,
    //   messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
    // });

    // Stub implementation
    console.warn('[Anthropic] Using stub implementation - install @anthropic-ai/sdk for real API calls');
    const content = this.stubResponse(messages.map(m => m.content).join('\n'), options);

    return {
      content,
      finishReason: 'stop',
      usage: {
        promptTokens: this.estimateTokens(messages.map(m => m.content).join(' ')),
        completionTokens: this.estimateTokens(content),
        totalTokens: 0,
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
      _provider: 'anthropic',
      _model: options.model,
      _temperature: options.temperature,
      _prompt_preview: promptPreview,
      message: 'This is a stub response. Configure ANTHROPIC_API_KEY for real completions.',
    }, null, 2);
  }

  /**
   * Rough token estimation
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

/**
 * Create Anthropic provider with optional API key
 */
export function createAnthropicProvider(apiKey?: string): AnthropicProvider {
  return new AnthropicProvider(apiKey);
}
