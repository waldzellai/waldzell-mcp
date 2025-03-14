import { BaseApiClient } from '../base';

/**
 * Yelp Ucheckout API client
 */
export class UcheckoutClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/checkout/resources');
  }
}

export default new UcheckoutClient();
