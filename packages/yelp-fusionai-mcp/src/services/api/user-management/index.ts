import { BaseApiClient } from '../base';

/**
 * User profile interface
 */
export interface UserProfile {
  /**
   * User ID
   */
  user_id: string;
  
  /**
   * User's display name
   */
  name: string;
  
  /**
   * User's email address (if accessible)
   */
  email?: string;
  
  /**
   * URL to user's profile image
   */
  image_url?: string;
  
  /**
   * User's location
   */
  location?: {
    /**
     * City name
     */
    city: string;
    
    /**
     * State/province code
     */
    state_code?: string;
    
    /**
     * Country code
     */
    country_code?: string;
    
    /**
     * ZIP/postal code
     */
    zip_code?: string;
  };
  
  /**
   * Date user joined Yelp (ISO 8601 format)
   */
  joined_date: string;
  
  /**
   * Total review count
   */
  review_count: number;
  
  /**
   * Total business photo count
   */
  photo_count: number;
  
  /**
   * Elite status years (if any)
   */
  elite_years?: number[];
  
  /**
   * User's social connections
   */
  social_stats?: {
    /**
     * Number of friends
     */
    friends: number;
    
    /**
     * Number of compliments received
     */
    compliments: number;
    
    /**
     * Number of fans
     */
    fans: number;
  };
  
  /**
   * User's review metrics
   */
  metrics?: {
    /**
     * Average rating given
     */
    average_rating: number;
    
    /**
     * Count of ratings by star (1-5)
     */
    rating_distribution: {
      '1'?: number;
      '2'?: number;
      '3'?: number;
      '4'?: number;
      '5'?: number;
    };
  };
}

/**
 * User preference interface
 */
export interface UserPreferences {
  /**
   * User ID
   */
  user_id: string;
  
  /**
   * Email notification preferences
   */
  email_preferences?: {
    /**
     * Receive promotional emails
     */
    promotional: boolean;
    
    /**
     * Receive friend activity notifications
     */
    friend_activity: boolean;
    
    /**
     * Receive review comment notifications
     */
    review_comments: boolean;
    
    /**
     * Receive direct messages
     */
    direct_messages: boolean;
  };
  
  /**
   * Mobile push notification preferences
   */
  push_preferences?: {
    /**
     * Receive promotional push notifications
     */
    promotional: boolean;
    
    /**
     * Receive friend activity push notifications
     */
    friend_activity: boolean;
    
    /**
     * Receive review comment push notifications
     */
    review_comments: boolean;
    
    /**
     * Receive direct message push notifications
     */
    direct_messages: boolean;
  };
  
  /**
   * Display preferences
   */
  display_preferences?: {
    /**
     * Language code
     */
    language: string;
    
    /**
     * Currency code
     */
    currency: string;
    
    /**
     * Distance unit preference (miles or kilometers)
     */
    distance_unit: 'mi' | 'km';
  };
  
  /**
   * Search preferences
   */
  search_preferences?: {
    /**
     * Default location for searches
     */
    default_location?: string;
    
    /**
     * Default search radius (in meters)
     */
    default_radius?: number;
    
    /**
     * Price filter preference (1-4)
     */
    price_filter?: number[];
    
    /**
     * Cuisine preferences (category aliases)
     */
    cuisine_preferences?: string[];
  };
}

/**
 * User update interface
 */
export interface UserProfileUpdate {
  /**
   * New display name
   */
  name?: string;
  
  /**
   * New location
   */
  location?: {
    /**
     * City name
     */
    city: string;
    
    /**
     * State/province code
     */
    state_code?: string;
    
    /**
     * Country code
     */
    country_code?: string;
    
    /**
     * ZIP/postal code
     */
    zip_code?: string;
  };
}

/**
 * Friend interface
 */
export interface Friend {
  /**
   * User ID
   */
  user_id: string;
  
  /**
   * User's display name
   */
  name: string;
  
  /**
   * URL to user's profile image
   */
  image_url?: string;
  
  /**
   * User's location
   */
  location?: string;
  
  /**
   * Total review count
   */
  review_count: number;
  
  /**
   * Elite status years (if any)
   */
  elite_years?: number[];
  
  /**
   * Friend since date (ISO 8601 format)
   */
  friend_since: string;
}

/**
 * Friends response interface
 */
export interface FriendsResponse {
  /**
   * List of friends
   */
  friends: Friend[];
  
  /**
   * Total count of friends
   */
  total: number;
  
  /**
   * Pagination details
   */
  pagination?: {
    /**
     * Next page offset (if available)
     */
    next_offset?: number;
  };
}

/**
 * Collections interface
 */
export interface Collection {
  /**
   * Collection ID
   */
  collection_id: string;
  
  /**
   * Collection name
   */
  name: string;
  
  /**
   * Collection description
   */
  description?: string;
  
  /**
   * URL to collection cover image
   */
  cover_image_url?: string;
  
  /**
   * Number of businesses in collection
   */
  item_count: number;
  
  /**
   * Collection owner user ID
   */
  user_id: string;
  
  /**
   * Is collection public
   */
  is_public: boolean;
  
  /**
   * Created date (ISO 8601 format)
   */
  created_at: string;
  
  /**
   * Last updated date (ISO 8601 format)
   */
  updated_at: string;
}

/**
 * Collections response interface
 */
export interface CollectionsResponse {
  /**
   * List of collections
   */
  collections: Collection[];
  
  /**
   * Total count of collections
   */
  total: number;
  
  /**
   * Pagination details
   */
  pagination?: {
    /**
     * Next page offset (if available)
     */
    next_offset?: number;
  };
}

/**
 * Collection item interface
 */
export interface CollectionItem {
  /**
   * Collection item ID
   */
  item_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Business name
   */
  business_name: string;
  
  /**
   * Business image URL
   */
  business_image_url?: string;
  
  /**
   * Note about the business
   */
  note?: string;
  
  /**
   * Added date (ISO 8601 format)
   */
  added_at: string;
}

/**
 * Collection items response interface
 */
export interface CollectionItemsResponse {
  /**
   * Collection ID
   */
  collection_id: string;
  
  /**
   * Collection name
   */
  name: string;
  
  /**
   * Collection items
   */
  items: CollectionItem[];
  
  /**
   * Total count of items
   */
  total: number;
  
  /**
   * Pagination details
   */
  pagination?: {
    /**
     * Next page offset (if available)
     */
    next_offset?: number;
  };
}

/**
 * User Management API Client
 */
export class UserManagementClient extends BaseApiClient {
  /**
   * Get current user profile
   * 
   * @returns Promise with user profile
   */
  async getCurrentUserProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/v3/users/me');
  }
  
  /**
   * Get user profile by ID
   * 
   * @param userId User ID
   * @returns Promise with user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    return this.get<UserProfile>(`/v3/users/${userId}`);
  }
  
  /**
   * Update current user profile
   * 
   * @param updates Profile updates
   * @returns Promise with updated profile
   */
  async updateUserProfile(updates: UserProfileUpdate): Promise<UserProfile> {
    return this.put<UserProfile>('/v3/users/me', updates);
  }
  
  /**
   * Get current user preferences
   * 
   * @returns Promise with user preferences
   */
  async getUserPreferences(): Promise<UserPreferences> {
    return this.get<UserPreferences>('/v3/users/me/preferences');
  }
  
  /**
   * Update user preferences
   * 
   * @param preferences Updated preference settings
   * @returns Promise with updated preferences
   */
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return this.put<UserPreferences>('/v3/users/me/preferences', preferences);
  }
  
  /**
   * Get user's friends
   * 
   * @param userId User ID (defaults to current user)
   * @param limit Optional result limit
   * @param offset Optional pagination offset
   * @returns Promise with friends response
   */
  async getFriends(userId = 'me', limit?: number, offset?: number): Promise<FriendsResponse> {
    const params: Record<string, any> = {};
    
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    
    return this.get<FriendsResponse>(`/v3/users/${userId}/friends`, params);
  }
  
  /**
   * Get user's collections
   * 
   * @param userId User ID (defaults to current user)
   * @param limit Optional result limit
   * @param offset Optional pagination offset
   * @returns Promise with collections response
   */
  async getCollections(userId = 'me', limit?: number, offset?: number): Promise<CollectionsResponse> {
    const params: Record<string, any> = {};
    
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    
    return this.get<CollectionsResponse>(`/v3/users/${userId}/collections`, params);
  }
  
  /**
   * Get collection by ID
   * 
   * @param collectionId Collection ID
   * @returns Promise with collection details
   */
  async getCollection(collectionId: string): Promise<Collection> {
    return this.get<Collection>(`/v3/collections/${collectionId}`);
  }
  
  /**
   * Create a new collection
   * 
   * @param name Collection name
   * @param description Optional collection description
   * @param isPublic Whether the collection is public (default: true)
   * @returns Promise with created collection
   */
  async createCollection(name: string, description?: string, isPublic = true): Promise<Collection> {
    return this.post<Collection>('/v3/collections', {
      name,
      description,
      is_public: isPublic
    });
  }
  
  /**
   * Update collection details
   * 
   * @param collectionId Collection ID
   * @param name New collection name
   * @param description New collection description
   * @param isPublic New public status
   * @returns Promise with updated collection
   */
  async updateCollection(
    collectionId: string,
    name?: string,
    description?: string,
    isPublic?: boolean
  ): Promise<Collection> {
    const updates: Record<string, any> = {};
    
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isPublic !== undefined) updates.is_public = isPublic;
    
    return this.put<Collection>(`/v3/collections/${collectionId}`, updates);
  }
  
  /**
   * Delete a collection
   * 
   * @param collectionId Collection ID
   * @returns Promise with success status
   */
  async deleteCollection(collectionId: string): Promise<{success: boolean}> {
    return this.delete<{success: boolean}>(`/v3/collections/${collectionId}`);
  }
  
  /**
   * Get items in a collection
   * 
   * @param collectionId Collection ID
   * @param limit Optional result limit
   * @param offset Optional pagination offset
   * @returns Promise with collection items
   */
  async getCollectionItems(collectionId: string, limit?: number, offset?: number): Promise<CollectionItemsResponse> {
    const params: Record<string, any> = {};
    
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    
    return this.get<CollectionItemsResponse>(`/v3/collections/${collectionId}/items`, params);
  }
  
  /**
   * Add business to collection
   * 
   * @param collectionId Collection ID
   * @param businessId Business ID
   * @param note Optional note about the business
   * @returns Promise with added collection item
   */
  async addBusinessToCollection(
    collectionId: string,
    businessId: string,
    note?: string
  ): Promise<CollectionItem> {
    const data: Record<string, any> = {
      business_id: businessId
    };
    
    if (note) data.note = note;
    
    return this.post<CollectionItem>(`/v3/collections/${collectionId}/items`, data);
  }
  
  /**
   * Remove business from collection
   * 
   * @param collectionId Collection ID
   * @param itemId Collection item ID
   * @returns Promise with success status
   */
  async removeBusinessFromCollection(collectionId: string, itemId: string): Promise<{success: boolean}> {
    return this.delete<{success: boolean}>(`/v3/collections/${collectionId}/items/${itemId}`);
  }
}

export default new UserManagementClient();