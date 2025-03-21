import { BaseApiClient } from '../base';

/**
 * Yelp Uwebhooks API client
 */
export class UwebhooksClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/webhooks/resources');
  }
}

export default new UwebhooksClient();
