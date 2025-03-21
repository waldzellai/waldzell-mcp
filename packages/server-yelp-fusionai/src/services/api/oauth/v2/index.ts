import { BaseApiClient } from '../../base';

/**
 * OAuth v2 token request interface
 */
export interface OAuthV2TokenRequest {
  /**
   * Grant type (always "client_credentials" for v2)
   */
  grant_type: 'client_credentials';
  
  /**
   * Client ID
   */
  client_id: string;
  
  /**
   * Client secret
   */
  client_secret: string;
}

/**
 * OAuth v2 token response interface
 */
export interface OAuthV2TokenResponse {
  /**
   * Access token
   */
  access_token: string;
  
  /**
   * Token type (usually "Bearer")
   */
  token_type: string;
  
  /**
   * Token expiration time in seconds
   */
  expires_in: number;
}

/**
 * OAuth v2 token revocation request interface
 */
export interface OAuthV2RevokeRequest {
  /**
   * The access token to revoke
   */
  token: string;
}

/**
 * OAuth v2 token revocation response interface
 */
export interface OAuthV2RevokeResponse {
  /**
   * Success status
   */
  success?: boolean;
  
  /**
   * Message
   */
  message?: string;
}

/**
 * Yelp OAuth v2 Authorization API client
 */
export class OAuthV2Client extends BaseApiClient {
  /**
   * Get an OAuth access token
   * @param clientId Client ID
   * @param clientSecret Client secret
   * @returns OAuth token response
   */
  async getToken(clientId: string, clientSecret: string): Promise<OAuthV2TokenResponse> {
    const request: OAuthV2TokenRequest = {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    };
    
    return this.post<OAuthV2TokenResponse>('/oauth2/token', request);
  }
  
  /**
   * Get an OAuth access token using credentials object
   * @param credentials Client credentials object
   * @returns OAuth token response
   */
  async getTokenWithCredentials(credentials: { clientId: string; clientSecret: string }): Promise<OAuthV2TokenResponse> {
    return this.getToken(credentials.clientId, credentials.clientSecret);
  }

  /**
   * Revoke an OAuth access token
   * @param token The access token to revoke
   * @returns Revoke response
   */
  async revokeToken(token: string): Promise<OAuthV2RevokeResponse> {
    const request: OAuthV2RevokeRequest = { token };
    return this.post<OAuthV2RevokeResponse>('/oauth2/revoke', request);
  }
  
  /**
   * Verify an OAuth access token
   * @param token The access token to verify
   * @returns Verification response
   */
  async verifyToken(token: string): Promise<any> {
    return this.get<any>('/oauth2/token/info', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}

export default new OAuthV2Client();