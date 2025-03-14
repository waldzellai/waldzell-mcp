import { BaseApiClient } from '../base';

/**
 * Yelp Reporting v2 API client
 */
export class ReportingV2Client extends BaseApiClient {
  /**
   * Placeholder method
   */
  async getReports(): Promise<any> {
    return this.get<any>('/v2/reporting/reports');
  }
}

export default new ReportingV2Client();