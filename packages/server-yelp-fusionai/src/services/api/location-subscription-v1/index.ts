import { BaseApiClient } from '../base';

/**
 * Yelp UlocationUsubscriptionUv1 API client
 */
export class UlocationUsubscriptionUv1Client extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/location-subscription-v1/resources');
  }
}

export default new UlocationUsubscriptionUv1Client();
