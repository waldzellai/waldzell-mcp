import { BaseApiClient } from '../../base';

/**
 * Yelp Fusion AI API client
 */
export class FusionAIClient extends BaseApiClient {
  /**
   * Search and chat with Yelp's AI assistant
   * @param query The search query or chat message
   * @param params Additional parameters
   */
  async searchAndChat(query: string, params: Record<string, any> = {}): Promise<any> {
    return this.post<any>('/v2/ai/chat', {
      query,
      ...params
    });
  }
}

export default new FusionAIClient();