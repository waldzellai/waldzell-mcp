import { BaseApiClient } from '../base';

/**
 * Yelp UclaimUbusiness API client
 */
export class UclaimUbusinessClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/claim-business/resources');
  }
}

export default new UclaimUbusinessClient();
