import { BaseApiClient } from '../base';

export interface YelpAIResponse {
  response: {
    text: string;
  };
  types: string[];
  entities: any[];
  chat_id: string;
}

/**
 * Yelp Fusion AI API client for business search using natural language
 */
export class BusinessAiClient extends BaseApiClient {
  /**
   * Send a natural language query to the Yelp Fusion AI API
   * @param query Natural language query about businesses
   */
  async chat(query: string): Promise<YelpAIResponse> {
    return this.post<YelpAIResponse>('/ai/chat/v2', { query });
  }
}

export default new BusinessAiClient();