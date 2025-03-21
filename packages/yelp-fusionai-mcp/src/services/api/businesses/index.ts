import { BaseApiClient } from '../base';
import aiClient from './ai';

/**
 * Business location interface
 */
export interface BusinessLocation {
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  display_address?: string[];
  cross_streets?: string;
}

/**
 * Business coordinates interface
 */
export interface BusinessCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Business hours interface
 */
export interface BusinessHours {
  open: Array<{
    is_overnight: boolean;
    start: string;
    end: string;
    day: number;
  }>;
  hours_type: string;
  is_open_now: boolean;
}

/**
 * Business category interface
 */
export interface BusinessCategory {
  alias: string;
  title: string;
}

/**
 * Special hours interface
 */
export interface SpecialHours {
  date: string;
  is_closed?: boolean;
  start?: string;
  end?: string;
  is_overnight?: boolean;
}

/**
 * Business details interface
 */
export interface BusinessDetails {
  id: string;
  alias: string;
  name: string;
  image_url?: string;
  is_claimed?: boolean;
  is_closed: boolean;
  url: string;
  phone: string;
  display_phone?: string;
  review_count: number;
  categories: BusinessCategory[];
  rating: number;
  location: BusinessLocation;
  coordinates: BusinessCoordinates;
  photos?: string[];
  price?: string;
  hours?: BusinessHours[];
  special_hours?: SpecialHours[];
  transactions?: string[];
  messaging?: {
    url: string;
    use_case_text: string;
  };
  attributes?: Record<string, any>;
}

/**
 * Business search parameters interface
 */
export interface BusinessSearchParams {
  term?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  categories?: string;
  locale?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance';
  price?: string;
  open_now?: boolean;
  open_at?: number;
  attributes?: string;
}

/**
 * Business search response interface
 */
export interface BusinessSearchResponse {
  businesses: BusinessDetails[];
  total: number;
  region?: {
    center: BusinessCoordinates;
  };
}

/**
 * Business match parameters interface
 */
export interface BusinessMatchParams {
  name: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  match_threshold?: 'none' | 'default' | 'strict';
  limit?: number;
}

/**
 * Business review interface
 */
export interface BusinessReview {
  id: string;
  url: string;
  text: string;
  rating: number;
  time_created: string;
  user: {
    id: string;
    profile_url: string;
    image_url?: string;
    name: string;
  };
}

/**
 * Business reviews response interface
 */
export interface BusinessReviewsResponse {
  reviews: BusinessReview[];
  total: number;
  possible_languages?: string[];
}

/**
 * Business search by phone response
 */
export interface BusinessSearchByPhoneResponse {
  businesses: BusinessDetails[];
  total: number;
}

/**
 * Business autocomplete params
 */
export interface BusinessAutocompleteParams {
  text: string;
  latitude?: number;
  longitude?: number;
  locale?: string;
}

/**
 * Business autocomplete response
 */
export interface BusinessAutocompleteResponse {
  businesses: Array<{
    id: string;
    name: string;
    categories?: BusinessCategory[];
  }>;
  categories: BusinessCategory[];
  terms: Array<{
    text: string;
  }>;
}

/**
 * Business transactions search params
 */
export interface TransactionSearchParams {
  transaction_type: string;
  latitude?: number;
  longitude?: number;
  location?: string;
}

/**
 * Yelp Businesses API client
 */
export class BusinessClient extends BaseApiClient {
  /**
   * AI-powered business search client
   */
  readonly ai = aiClient;

  /**
   * Search for businesses using traditional parameters
   * 
   * @param params Search parameters
   * @returns Promise with business search results
   */
  async search(params: BusinessSearchParams): Promise<BusinessSearchResponse> {
    return this.get<BusinessSearchResponse>('/v3/businesses/search', params);
  }

  /**
   * Get details for a specific business
   * 
   * @param id Business ID or alias
   * @param locale Optional locale
   * @returns Promise with business details
   */
  async getBusinessDetails(id: string, locale?: string): Promise<BusinessDetails> {
    const params = locale ? { locale } : undefined;
    return this.get<BusinessDetails>(`/v3/businesses/${id}`, params);
  }

  /**
   * Get reviews for a specific business
   * 
   * @param id Business ID or alias
   * @param params Optional parameters (locale, limit, sort_by, offset)
   * @returns Promise with business reviews
   */
  async getBusinessReviews(id: string, params?: Record<string, any>): Promise<BusinessReviewsResponse> {
    return this.get<BusinessReviewsResponse>(`/v3/businesses/${id}/reviews`, params);
  }

  /**
   * Search for businesses by phone number
   * 
   * @param phone Phone number
   * @param locale Optional locale parameter
   * @returns Promise with businesses matching the phone number
   */
  async searchByPhone(phone: string, locale?: string): Promise<BusinessSearchByPhoneResponse> {
    const params: Record<string, any> = { phone };
    if (locale) {
      params.locale = locale;
    }
    return this.get<BusinessSearchByPhoneResponse>('/v3/businesses/search/phone', params);
  }

  /**
   * Match businesses based on provided criteria
   * 
   * @param params Business match parameters
   * @returns Promise with businesses matching the criteria
   */
  async matchBusinesses(params: BusinessMatchParams): Promise<BusinessDetails[]> {
    return this.get<BusinessDetails[]>('/v3/businesses/matches', params);
  }

  /**
   * Get business autocomplete suggestions
   * 
   * @param params Autocomplete parameters
   * @returns Promise with autocomplete suggestions
   */
  async autocomplete(params: BusinessAutocompleteParams): Promise<BusinessAutocompleteResponse> {
    return this.get<BusinessAutocompleteResponse>('/v3/businesses/autocomplete', params);
  }

  /**
   * Search for businesses that support a specific transaction type
   * 
   * @param params Transaction search parameters
   * @returns Promise with business search results
   */
  async searchByTransaction(params: TransactionSearchParams): Promise<BusinessSearchResponse> {
    return this.get<BusinessSearchResponse>(`/v3/transactions/${params.transaction_type}/search`, params);
  }
}

export default new BusinessClient();