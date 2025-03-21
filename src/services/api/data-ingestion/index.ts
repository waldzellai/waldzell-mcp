import { BaseApiClient } from '../base';

/**
 * Yelp UdataUingestion API client
 */
export class UdataUingestionClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/data-ingestion/resources');
  }
}

export default new UdataUingestionClient();
