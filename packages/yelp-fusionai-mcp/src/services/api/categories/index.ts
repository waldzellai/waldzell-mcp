import { BaseApiClient } from '../base';

/**
 * Category interface representing a business category
 */
export interface Category {
  /**
   * The category alias (slug/identifier)
   */
  alias: string;
  
  /**
   * The display title of the category
   */
  title: string;
  
  /**
   * Optional parent categories
   */
  parent_aliases?: string[];
  
  /**
   * Optional parent display titles 
   */
  parent_titles?: string[];
  
  /**
   * Optional country whitelist
   */
  country_whitelist?: string[];
  
  /**
   * Optional country blacklist
   */
  country_blacklist?: string[];
}

/**
 * Categories response interface
 */
export interface CategoriesResponse {
  /**
   * List of categories
   */
  categories: Category[];
}

/**
 * Categories request parameters
 */
export interface CategoriesRequestParams {
  /**
   * Optional locale parameter (e.g., "en_US")
   */
  locale?: string;
  
  /**
   * Optional country code parameter
   */
  country?: string;
}

/**
 * Yelp Categories API client
 * 
 * This client provides access to the Yelp Fusion Categories API endpoints
 * for retrieving business categories information.
 */
export class CategoriesClient extends BaseApiClient {
  /**
   * List all business categories
   * 
   * This endpoint retrieves all business categories across Yelp.
   * The response includes the category alias and title for each category.
   * Categories can be used as search parameters in the business search endpoint.
   * 
   * @param params Optional request parameters (locale, country)
   * @returns Promise with categories response
   */
  async getAll(params?: CategoriesRequestParams): Promise<CategoriesResponse> {
    return this.get<CategoriesResponse>('/v3/categories', params);
  }
  
  /**
   * Get detailed information about a specific category
   * 
   * This endpoint retrieves detailed information about a specific category by alias.
   * The response includes the category alias, title, parent categories, and country
   * availability.
   * 
   * @param alias The alias (slug) of the category to retrieve
   * @param params Optional request parameters (locale, country)
   * @returns Promise with category details
   */
  async getCategory(alias: string, params?: CategoriesRequestParams): Promise<Category> {
    return this.get<Category>(`/v3/categories/${alias}`, params);
  }
  
  /**
   * Search for categories by title
   * 
   * This endpoint searches for categories that match a given search term.
   * The response includes matching categories sorted by relevance.
   * 
   * @param term The search term to match against category titles
   * @param params Optional request parameters (locale, country)
   * @returns Promise with categories response
   */
  async searchCategories(term: string, params?: CategoriesRequestParams): Promise<CategoriesResponse> {
    const searchParams = {
      ...params,
      term
    };
    return this.get<CategoriesResponse>('/v3/categories/search', searchParams);
  }
}

export default new CategoriesClient();