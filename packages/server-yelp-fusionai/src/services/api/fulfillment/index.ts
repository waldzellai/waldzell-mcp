import { BaseApiClient } from '../base';

/**
 * Yelp Ufulfillment API client
 */
export class UfulfillmentClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/fulfillment/resources');
  }
}

export default new UfulfillmentClient();
