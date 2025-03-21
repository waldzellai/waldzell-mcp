import { BaseApiClient } from '../base';

/**
 * Yelp UbusinessUsubscriptions API client
 */
export class UbusinessUsubscriptionsClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/business-subscriptions/resources');
  }
}

export default new UbusinessUsubscriptionsClient();
