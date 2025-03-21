import { BaseApiClient } from '../base';

/**
 * Yelp UlistingUmanagement API client
 */
export class UlistingUmanagementClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/listing-management/resources');
  }
}

export default new UlistingUmanagementClient();
