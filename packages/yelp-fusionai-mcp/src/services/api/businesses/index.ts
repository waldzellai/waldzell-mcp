import { BaseApiClient } from '../base';
import aiClient from './ai';

/**
 * Yelp Businesses API client
 */
export class BusinessClient extends BaseApiClient {
  /**
   * AI-powered business search client
   */
  readonly ai = aiClient;

  /**
   * Search for businesses using traditional parameters
   * @param params Search parameters
   */
  async search(params: Record<string, any>): Promise<any> {
    return this.get<any>('/v3/businesses/search', params);
  }

  /**
   * Get details for a specific business
   * @param id Business ID
   */
  async getBusinessDetails(id: string): Promise<any> {
    return this.get<any>(`/v3/businesses/${id}`);
  }

  /**
   * Get reviews for a specific business
   * @param id Business ID
   */
  async getBusinessReviews(id: string): Promise<any> {
    return this.get<any>(`/v3/businesses/${id}/reviews`);
  }

  /**
   * Search by phone number
   * @param phone Phone number
   */
  async searchByPhone(phone: string): Promise<any> {
    return this.get<any>('/v3/businesses/search/phone', { phone });
  }
}

export default new BusinessClient();