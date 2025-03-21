import { BaseApiClient } from '../base';

/**
 * Event search parameters interface
 */
export interface EventSearchParams {
  /**
   * Location string (e.g., address, neighborhood, city, state, zip, country)
   */
  location?: string;
  
  /**
   * Latitude coordinate
   */
  latitude?: number;
  
  /**
   * Longitude coordinate
   */
  longitude?: number;
  
  /**
   * Search radius in meters (max: 40000)
   */
  radius?: number;
  
  /**
   * Categories to filter by (comma-separated)
   */
  categories?: string;
  
  /**
   * Start date (Unix timestamp)
   */
  start_date?: number;
  
  /**
   * End date (Unix timestamp)
   */
  end_date?: number;
  
  /**
   * Whether the event is free
   */
  is_free?: boolean;
  
  /**
   * Maximum number of results to return (default: 20, max: 50)
   */
  limit?: number;
  
  /**
   * Offset for pagination
   */
  offset?: number;
  
  /**
   * Sorting mode: 'popularity' or 'time_start'
   */
  sort_by?: 'popularity' | 'time_start';
  
  /**
   * Sort on a specific field
   */
  sort_on?: string;
  
  /**
   * Locale (default: en_US)
   */
  locale?: string;
  
  /**
   * Comma-separated list of event IDs to exclude
   */
  excluded_events?: string;
}

/**
 * Event response interface
 */
export interface Event {
  /**
   * Event ID
   */
  id: string;
  
  /**
   * Event name
   */
  name: string;
  
  /**
   * Event category
   */
  category?: string;
  
  /**
   * Event description
   */
  description?: string;
  
  /**
   * Event URL on Yelp
   */
  url?: string;
  
  /**
   * Attending count
   */
  attending_count?: number;
  
  /**
   * Interested count
   */
  interested_count?: number;
  
  /**
   * Event cost
   */
  cost?: number;
  
  /**
   * Whether the event is free
   */
  is_free?: boolean;
  
  /**
   * Event start time (ISO 8601 format)
   */
  time_start?: string;
  
  /**
   * Event end time (ISO 8601 format)
   */
  time_end?: string;
  
  /**
   * Event location information
   */
  location?: {
    /**
     * Address display array
     */
    display_address?: string[];
    
    /**
     * Address line 1
     */
    address1?: string;
    
    /**
     * Address line 2
     */
    address2?: string;
    
    /**
     * Address line 3
     */
    address3?: string;
    
    /**
     * City
     */
    city?: string;
    
    /**
     * State code
     */
    state?: string;
    
    /**
     * Zip code
     */
    zip_code?: string;
    
    /**
     * Country code
     */
    country?: string;
  };
  
  /**
   * Event image URLs
   */
  image_url?: string;
  
  /**
   * Business hosting the event
   */
  business_id?: string;
  
  /**
   * Event tickets URL
   */
  tickets_url?: string;
}

/**
 * Event search response interface
 */
export interface EventSearchResponse {
  /**
   * Array of events
   */
  events: Event[];
  
  /**
   * Total number of events matching criteria
   */
  total: number;
}

/**
 * Featured event response interface
 */
export interface FeaturedEventResponse {
  /**
   * Featured event
   */
  featured_event: Event;
}

/**
 * Yelp Events API client
 */
export class EventsClient extends BaseApiClient {
  /**
   * Search for events
   * @param params Event search parameters
   * @returns Event search response
   */
  async search(params: EventSearchParams): Promise<EventSearchResponse> {
    return this.get<EventSearchResponse>('/v3/events', params);
  }
  
  /**
   * Get event details
   * @param eventId The ID of the event
   * @returns Event details
   */
  async getEvent(eventId: string): Promise<Event> {
    return this.get<Event>(`/v3/events/${eventId}`);
  }
  
  /**
   * Get featured event
   * @param params Optional parameters (locality, etc.)
   * @returns Featured event response
   */
  async getFeaturedEvent(params?: Record<string, any>): Promise<FeaturedEventResponse> {
    return this.get<FeaturedEventResponse>('/v3/events/featured', params);
  }
}

export default new EventsClient();