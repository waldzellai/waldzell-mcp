import { BaseApiClient } from '../base';

/**
 * Get Access Token Request interface
 */
export interface GetAccessTokenRequest {
  /**
   * Grant type (always "client_credentials")
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
 * Get Access Token Response interface
 */
export interface GetAccessTokenResponse {
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
 * Business interface for respond-reviews
 */
export interface RespondReviewsBusiness {
  /**
   * Business ID
   */
  id: string;
  
  /**
   * Business name
   */
  name: string;
  
  /**
   * Business URL on Yelp
   */
  url?: string;
  
  /**
   * Business image URL
   */
  image_url?: string;
  
  /**
   * Business location
   */
  location?: {
    /**
     * Address display array
     */
    display_address?: string[];
    
    /**
     * City
     */
    city?: string;
    
    /**
     * State
     */
    state?: string;
    
    /**
     * Zip code
     */
    zip_code?: string;
  };
  
  /**
   * Business information
   */
  business_info?: {
    /**
     * Review count
     */
    review_count?: number;
    
    /**
     * Rating
     */
    rating?: number;
  };
}

/**
 * Get Businesses Response interface
 */
export interface GetBusinessesResponse {
  /**
   * Array of businesses
   */
  businesses: RespondReviewsBusiness[];
  
  /**
   * Total count
   */
  total?: number;
}

/**
 * Business Owner Information interface
 */
export interface BusinessOwnerInfo {
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Business name
   */
  business_name: string;
  
  /**
   * Owner name
   */
  owner_name?: string;
  
  /**
   * Owner email
   */
  owner_email?: string;
  
  /**
   * Account status
   */
  account_status?: string;
  
  /**
   * Permissions
   */
  permissions?: string[];
  
  /**
   * Additional information
   */
  additional_info?: Record<string, any>;
}

/**
 * Respond to Review Request interface
 */
export interface RespondToReviewRequest {
  /**
   * Response text
   */
  text: string;
}

/**
 * Respond to Review Response interface
 */
export interface RespondToReviewResponse {
  /**
   * Response ID
   */
  id?: string;
  
  /**
   * Review ID
   */
  review_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Response text
   */
  text: string;
  
  /**
   * Creation timestamp
   */
  created_at?: string;
  
  /**
   * Last update timestamp
   */
  updated_at?: string;
  
  /**
   * Success status
   */
  success: boolean;
}

/**
 * Yelp Respond Reviews API client
 */
export class RespondReviewsClient extends BaseApiClient {
  /**
   * Get an OAuth access token for respond-reviews
   * @param clientId Client ID
   * @param clientSecret Client secret
   * @returns OAuth token response
   */
  async getAccessToken(clientId: string, clientSecret: string): Promise<GetAccessTokenResponse> {
    const request: GetAccessTokenRequest = {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    };
    
    return this.post<GetAccessTokenResponse>('/oauth2/token', request);
  }

  /**
   * Get businesses that the authenticated user can respond to reviews for
   * @param params Optional query parameters
   * @returns List of businesses
   */
  async getBusinesses(params?: Record<string, any>): Promise<GetBusinessesResponse> {
    return this.get<GetBusinessesResponse>('/v3/respond-reviews/businesses', params);
  }

  /**
   * Get business owner information
   * @param businessId Business ID
   * @returns Business owner information
   */
  async getBusinessOwnerInfo(businessId: string): Promise<BusinessOwnerInfo> {
    return this.get<BusinessOwnerInfo>(`/v3/respond-reviews/businesses/${businessId}/owner`);
  }

  /**
   * Respond to a review
   * @param reviewId Review ID
   * @param text Response text
   * @returns Response details
   */
  async respondToReview(reviewId: string, text: string): Promise<RespondToReviewResponse> {
    const request: RespondToReviewRequest = { text };
    return this.post<RespondToReviewResponse>(`/v3/respond-reviews/reviews/${reviewId}/response`, request);
  }
}

export default new RespondReviewsClient();