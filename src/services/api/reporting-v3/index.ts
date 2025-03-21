import { BaseApiClient } from '../base';

/**
 * Yelp UreportingUv3 API client
 */
export class UreportingUv3Client extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/reporting-v3/resources');
  }
}

export default new UreportingUv3Client();
