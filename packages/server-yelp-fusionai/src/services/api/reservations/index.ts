import { BaseApiClient } from '../base';

/**
 * Yelp Ureservations API client
 */
export class UreservationsClient extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/reservations/resources');
  }
}

export default new UreservationsClient();
