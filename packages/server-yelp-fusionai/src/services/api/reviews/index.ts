import { BaseApiClient } from '../base';

/**
 * Interface for business review response
 */
export interface BusinessReviewsResponse {
  reviews: Array<{
    id: string;
    url: string;
    text: string;
    rating: number;
    time_created: string;
    user: {
      id: string;
      profile_url: string;
      image_url: string | null;
      name: string;
    };
  }>;
  total: number;
  possible_languages: string[];
}

/**
 * Interface for review query parameters
 */
export interface ReviewsQueryParams {
  /** 
   * Optional. Default language is retrieved from the business info. 
   * If specified, will return reviews written in the selected language. 
   */
  locale?: string;
  
  /** 
   * Optional. Specifies the order in which reviews appear.
   * Default: yelp_sort, other options: newest, ratings_asc, ratings_desc, elites  
   */
  sort_by?: 'yelp_sort' | 'newest' | 'ratings_asc' | 'ratings_desc' | 'elites';
  
  /** 
   * Optional. Default: 3, maximum: 50
   * Determines how many reviews to return
   */
  limit?: number;
  
  /**
   * Optional. Offsets the list of reviews (to retrieve different pages)
   */
  offset?: number;
}

/**
 * Interface for review highlights response
 */
export interface ReviewHighlightsResponse {
  review_highlights: Array<{
    id: string;
    text: string;
    highlight_text: string;
    snippet_text: string;
    rating: number;
    time_created: string;
    user: {
      id: string;
      profile_url: string;
      image_url: string | null;
      name: string;
    };
  }>;
  total: number;
}

/**
 * Interface for review highlights query parameters
 */
export interface ReviewHighlightsQueryParams {
  /**
   * Optional. Default language is retrieved from the business info.
   * If specified, will return review highlights written in the selected language.
   */
  locale?: string;
  
  /**
   * Optional. Default: 5, maximum: 10
   * Determines how many review highlights to return
   */
  limit?: number;
  
  /**
   * Optional. Specify a category to filter highlights by
   * For example: 'service', 'ambience', 'food', etc.
   */
  category?: string;
  
  /**
   * Optional. Specify a sentiment to filter highlights by
   * Values: 'positive', 'negative', or 'all' (default)
   */
  sentiment?: 'positive' | 'negative' | 'all';
}

/**
 * Yelp Reviews API client
 */
export class ReviewsClient extends BaseApiClient {
  /**
   * Get reviews for a business
   * 
   * Retrieves up to 50 user reviews for a business using the business ID or alias.
   * 
   * @param businessIdOrAlias The business ID or alias string
   * @param params Optional query parameters (locale, sort_by, limit, offset)
   * @returns Promise with the business reviews response
   */
  async getBusinessReviews(businessIdOrAlias: string, params?: ReviewsQueryParams): Promise<BusinessReviewsResponse> {
    return this.get<BusinessReviewsResponse>(`/v3/businesses/${businessIdOrAlias}/reviews`, params);
  }

  /**
   * Get review highlights for a business
   * 
   * Retrieves highlighted snippets from user reviews for a business, focusing on
   * the most useful or relevant portions of reviews.
   * 
   * @param businessIdOrAlias The business ID or alias string
   * @param params Optional query parameters (locale, limit, category, sentiment)
   * @returns Promise with the review highlights response
   */
  async getReviewHighlights(businessIdOrAlias: string, params?: ReviewHighlightsQueryParams): Promise<ReviewHighlightsResponse> {
    return this.get<ReviewHighlightsResponse>(`/v3/businesses/${businessIdOrAlias}/review_highlights`, params);
  }
}

export default new ReviewsClient();