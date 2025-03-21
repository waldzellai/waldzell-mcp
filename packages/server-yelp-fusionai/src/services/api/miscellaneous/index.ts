import { BaseApiClient } from '../base';

/**
 * Yelp Miscellaneous API client
 */
export class MiscellaneousClient extends BaseApiClient {
  /**
   * Get API health status
   */
  async healthCheck(): Promise<any> {
    return this.get<any>('/v3/health');
  }
}

export default new MiscellaneousClient();