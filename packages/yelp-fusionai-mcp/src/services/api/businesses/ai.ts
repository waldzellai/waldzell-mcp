import { BaseApiClient } from '../base';
import { BusinessDetails } from './index';

/**
 * Entity type from Yelp AI response
 */
export interface YelpAIEntity {
  id: string;
  name: string;
  type: string;
  text: string;
  spans: Array<{
    start: number;
    end: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Yelp AI Response interface
 */
export interface YelpAIResponse {
  /**
   * The AI response
   */
  response: {
    /**
     * The text of the response
     */
    text: string;
  };
  
  /**
   * Types of entities identified in the query
   */
  types: string[];
  
  /**
   * Entities identified in the query
   */
  entities: YelpAIEntity[];
  
  /**
   * Chat session ID
   */
  chat_id: string;
  
  /**
   * Referenced businesses in the response
   */
  businesses?: BusinessDetails[];
  
  /**
   * Source URLs for information in the response
   */
  sources?: string[];
  
  /**
   * Search context used to generate the response
   */
  search_context?: string;
}

/**
 * Chat history message
 */
export interface ChatHistoryMessage {
  /**
   * Role of the message sender (user or assistant)
   */
  role: 'user' | 'assistant';
  
  /**
   * Message content
   */
  content: string;
}

/**
 * Chat parameters interface
 */
export interface ChatParams {
  /**
   * Natural language query
   */
  query: string;
  
  /**
   * Optional location to contextualize the query
   */
  location?: string;
  
  /**
   * Optional latitude coordinate
   */
  latitude?: number;
  
  /**
   * Optional longitude coordinate
   */
  longitude?: number;
  
  /**
   * Optional chat history for context
   */
  history?: ChatHistoryMessage[];
  
  /**
   * Optional locale
   */
  locale?: string;
}

/**
 * Yelp Fusion AI API client for business search using natural language
 */
export class BusinessAiClient extends BaseApiClient {
  /**
   * Send a natural language query to the Yelp Fusion AI API
   * 
   * @param params Chat parameters (query, location, coordinates, history)
   * @returns Promise with AI response
   */
  async chat(params: ChatParams | string): Promise<YelpAIResponse> {
    // Handle both string input and object input for backward compatibility
    const requestBody = typeof params === 'string' 
      ? { query: params } 
      : params;

    return this.post<YelpAIResponse>('/ai/chat/v2', requestBody);
  }
  
  /**
   * Continue a conversation with the Yelp Fusion AI
   * 
   * @param chatId Previous chat ID
   * @param query New query to continue the conversation
   * @param location Optional location context
   * @returns Promise with AI response
   */
  async continueChat(chatId: string, query: string, location?: string): Promise<YelpAIResponse> {
    const requestBody: Record<string, any> = {
      query,
      chat_id: chatId
    };
    
    if (location) {
      requestBody.location = location;
    }

    return this.post<YelpAIResponse>('/ai/chat/v2', requestBody);
  }
}

export default new BusinessAiClient();