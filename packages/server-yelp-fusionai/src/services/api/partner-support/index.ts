import { BaseApiClient } from '../base';

/**
 * Yelp UpartnerUsupport API client
 */
export class UpartnerUsupportClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/partner-support/resources');
  }
}

export default new UpartnerUsupportClient();
