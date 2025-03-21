import { BaseApiClient } from '../base';
import v2Client, { OAuthV2TokenResponse, OAuthV2RevokeResponse } from './v2';
import v3Client, { OAuthV3TokenResponse } from './v3';

/**
 * Common OAuth interface for use across the application
 */
export interface OAuthCredentials {
  /**
   * Client ID
   */
  clientId: string;
  
  /**
   * Client secret
   */
  clientSecret: string;
}

/**
 * Yelp OAuth Authorization API client
 */
export class OAuthClient extends BaseApiClient {
  /**
   * OAuth v2 client
   */
  readonly v2 = v2Client;
  
  /**
   * OAuth v3 client
   */
  readonly v3 = v3Client;
  
  /**
   * Get an OAuth access token (uses v3 by default)
   * @param credentials Authorization credentials (client ID and secret)
   * @returns OAuth token response
   */
  async getToken(credentials: OAuthCredentials): Promise<OAuthV3TokenResponse> {
    return this.v3.getToken(credentials);
  }
  
  /**
   * Revoke an OAuth access token (v2)
   * @param token The access token to revoke
   * @returns Revoke response
   */
  async revokeToken(token: string): Promise<OAuthV2RevokeResponse> {
    return this.v2.revokeToken(token);
  }
  
  /**
   * Refresh an OAuth v3 token
   * @param refreshToken The refresh token
   * @returns New OAuth token response
   */
  async refreshToken(refreshToken: string): Promise<OAuthV3TokenResponse> {
    return this.v3.refreshToken(refreshToken);
  }
}

export default new OAuthClient();