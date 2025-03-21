import { BaseApiClient } from '../../base';

/**
 * OAuth v3 token request interface
 */
export interface OAuthV3TokenRequest {
  /**
   * Grant type ("client_credentials" for new token)
   */
  grant_type: 'client_credentials' | 'refresh_token';
  
  /**
   * Client ID (required for client_credentials grant)
   */
  client_id?: string;
  
  /**
   * Client secret (required for client_credentials grant)
   */
  client_secret?: string;
  
  /**
   * Refresh token (required for refresh_token grant)
   */
  refresh_token?: string;
  
  /**
   * Requested scopes (optional)
   */
  scope?: string;
}

/**
 * OAuth v3 token response interface
 */
export interface OAuthV3TokenResponse {
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
  
  /**
   * Refresh token (can be used to get a new token)
   */
  refresh_token?: string;
  
  /**
   * Scope of the token
   */
  scope?: string;
  
  /**
   * ID token (if requested)
   */
  id_token?: string;
}

/**
 * OAuth v3 refresh token request interface
 */
export interface OAuthV3RefreshRequest {
  /**
   * Grant type (always "refresh_token" for refresh)
   */
  grant_type: 'refresh_token';
  
  /**
   * Refresh token
   */
  refresh_token: string;
  
  /**
   * Requested scopes (optional)
   */
  scope?: string;
}

/**
 * OAuth v3 token info response interface
 */
export interface OAuthV3TokenInfoResponse {
  /**
   * Client ID that the token was issued to
   */
  client_id: string;
  
  /**
   * User ID associated with the token
   */
  user_id?: string;
  
  /**
   * Token expiration time in seconds
   */
  expires_in: number;
  
  /**
   * Scope of the token
   */
  scope?: string;
  
  /**
   * Whether the token is active
   */
  active: boolean;
}

/**
 * Yelp OAuth v3 Authorization API client
 */
export class OAuthV3Client extends BaseApiClient {
  /**
   * Get an OAuth v3 access token
   * @param credentials Authorization credentials
   * @returns OAuth token response
   */
  async getToken(credentials: { clientId: string; clientSecret: string }): Promise<OAuthV3TokenResponse> {
    const request: OAuthV3TokenRequest = {
      grant_type: 'client_credentials',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret
    };
    
    return this.post<OAuthV3TokenResponse>('/oauth2/v3/token', request);
  }

  /**
   * Refresh an OAuth v3 token
   * @param refreshToken The refresh token
   * @param scope Optional scope to request
   * @returns New OAuth token response
   */
  async refreshToken(refreshToken: string, scope?: string): Promise<OAuthV3TokenResponse> {
    const request: OAuthV3RefreshRequest = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    };
    
    if (scope) {
      request.scope = scope;
    }
    
    return this.post<OAuthV3TokenResponse>('/oauth2/v3/token', request);
  }
  
  /**
   * Get information about an OAuth v3 token
   * @param token Access token to check
   * @returns Token info response
   */
  async getTokenInfo(token: string): Promise<OAuthV3TokenInfoResponse> {
    return this.get<OAuthV3TokenInfoResponse>('/oauth2/v3/tokeninfo', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
  
  /**
   * Request authorization for specific scopes
   * @param clientId Client ID
   * @param redirectUri Redirect URI
   * @param scopes Array of requested scopes
   * @param state Optional state parameter for security
   * @returns Authorization URL to redirect the user to
   */
  getAuthorizationUrl(clientId: string, redirectUri: string, scopes: string[], state?: string): string {
    const scope = scopes.join(' ');
    const baseUrl = '/oauth2/v3/authorize';
    
    let authUrl = `${baseUrl}?response_type=code&client_id=${encodeURIComponent(clientId)}`;
    authUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    authUrl += `&scope=${encodeURIComponent(scope)}`;
    
    if (state) {
      authUrl += `&state=${encodeURIComponent(state)}`;
    }
    
    return authUrl;
  }
}

export default new OAuthV3Client();