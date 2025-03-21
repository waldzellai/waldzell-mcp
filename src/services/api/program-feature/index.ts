import { BaseApiClient } from '../base';

/**
 * Yelp UprogramUfeature API client
 */
export class UprogramUfeatureClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/program-feature/resources');
  }
}

export default new UprogramUfeatureClient();
