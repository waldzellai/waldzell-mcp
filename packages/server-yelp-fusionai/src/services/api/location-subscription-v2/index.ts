import { BaseApiClient } from '../base';

/**
 * Yelp UlocationUsubscriptionUv2 API client
 */
export class UlocationUsubscriptionUv2Client extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/location-subscription-v2/resources');
  }
}

export default new UlocationUsubscriptionUv2Client();
