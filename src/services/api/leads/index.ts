import { BaseApiClient } from '../base';

/**
 * Yelp Uleads API client
 */
export class UleadsClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/leads/resources');
  }
}

export default new UleadsClient();
