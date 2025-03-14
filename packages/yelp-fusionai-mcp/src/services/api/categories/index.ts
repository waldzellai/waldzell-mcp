import { BaseApiClient } from '../base';

/**
 * Yelp Categories API client
 */
export class CategoriesClient extends BaseApiClient {
  /**
   * List all categories
   */
  async getAll(): Promise<any> {
    return this.get<any>('/v3/categories');
  }
  
  /**
   * Get category details
   * @param alias The alias of the category
   */
  async getCategory(alias: string): Promise<any> {
    return this.get<any>(`/v3/categories/${alias}`);
  }
}

export default new CategoriesClient();