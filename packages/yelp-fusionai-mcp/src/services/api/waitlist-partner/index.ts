import { BaseApiClient } from '../base';

/**
 * Partner Restaurant response interface
 */
export interface PartnerRestaurant {
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Business name
   */
  name: string;
  
  /**
   * Business image URL
   */
  image_url?: string;
  
  /**
   * Business URL on Yelp
   */
  business_url?: string;
  
  /**
   * Business location
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
    
    /**
     * Country
     */
    country?: string;
  };
  
  /**
   * Coordinates
   */
  coordinates?: {
    /**
     * Latitude
     */
    latitude: number;
    
    /**
     * Longitude
     */
    longitude: number;
  };
  
  /**
   * Business phone
   */
  phone?: string;
  
  /**
   * Current waitlist status
   */
  waitlist_status?: string;
}

/**
 * Partner Restaurants response interface
 */
export interface PartnerRestaurantsResponse {
  /**
   * Array of partner restaurants
   */
  restaurants: PartnerRestaurant[];
  
  /**
   * Total count
   */
  total: number;
}

/**
 * Waitlist status response interface
 */
export interface WaitlistStatusResponse {
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Current waitlist status (open, closed, etc.)
   */
  status: string;
  
  /**
   * Status message
   */
  message?: string;
  
  /**
   * Current wait time (in minutes)
   */
  wait_time_minutes?: number;
  
  /**
   * People in line
   */
  people_in_line?: number;
  
  /**
   * Operating hours
   */
  hours?: {
    /**
     * Opening time
     */
    open?: string;
    
    /**
     * Closing time
     */
    close?: string;
  };
  
  /**
   * Timestamp of the status
   */
  timestamp?: string;
}

/**
 * Waitlist information response interface
 */
export interface WaitlistInfoResponse {
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Business name
   */
  name: string;
  
  /**
   * Allows on_my_way feature
   */
  allows_on_my_way: boolean;
  
  /**
   * Allows join remotely
   */
  allows_remote_join: boolean;
  
  /**
   * Maximum party size
   */
  max_party_size?: number;
  
  /**
   * Minimum party size
   */
  min_party_size?: number;
  
  /**
   * Hours of operation
   */
  hours?: {
    /**
     * Weekday
     */
    day: number;
    
    /**
     * Start time (24-hour format)
     */
    start: string;
    
    /**
     * End time (24-hour format)
     */
    end: string;
  }[];
  
  /**
   * Additional settings
   */
  settings?: Record<string, any>;
}

/**
 * On my way request interface
 */
export interface OnMyWayRequest {
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Visit ID if already in queue
   */
  visit_id?: string;
  
  /**
   * Estimated arrival time
   */
  eta_minutes?: number;
  
  /**
   * Customer information
   */
  customer?: {
    /**
     * Customer ID
     */
    id?: string;
    
    /**
     * Customer name
     */
    name: string;
    
    /**
     * Customer phone
     */
    phone: string;
    
    /**
     * Customer email
     */
    email?: string;
  };
}

/**
 * On my way response interface
 */
export interface OnMyWayResponse {
  /**
   * Status
   */
  status: string;
  
  /**
   * Message
   */
  message?: string;
  
  /**
   * Visit ID
   */
  visit_id?: string;
  
  /**
   * Business ID
   */
  business_id: string;
}

/**
 * Join queue request interface
 */
export interface JoinQueueRequest {
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Party size
   */
  party_size: number;
  
  /**
   * Customer information
   */
  customer: {
    /**
     * Customer ID
     */
    id?: string;
    
    /**
     * Customer name
     */
    name: string;
    
    /**
     * Customer phone
     */
    phone: string;
    
    /**
     * Customer email
     */
    email?: string;
  };
  
  /**
   * Notes for the business
   */
  notes?: string;
  
  /**
   * Seating preferences
   */
  seating_preference?: string;
  
  /**
   * Quoted wait time (in minutes)
   */
  quoted_wait_time_minutes?: number;
}

/**
 * Join queue response interface
 */
export interface JoinQueueResponse {
  /**
   * Visit ID
   */
  visit_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Position in line
   */
  position?: number;
  
  /**
   * Status
   */
  status: string;
  
  /**
   * Current wait time (in minutes)
   */
  wait_time_minutes?: number;
  
  /**
   * People ahead
   */
  people_ahead?: number;
  
  /**
   * Created time
   */
  created_at?: string;
  
  /**
   * Party size
   */
  party_size: number;
}

/**
 * Cancel visit response interface
 */
export interface CancelVisitResponse {
  /**
   * Visit ID
   */
  visit_id: string;
  
  /**
   * Success status
   */
  success: boolean;
  
  /**
   * Status
   */
  status: string;
  
  /**
   * Message
   */
  message?: string;
}

/**
 * Visit details response interface
 */
export interface VisitDetailsResponse {
  /**
   * Visit ID
   */
  visit_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Status
   */
  status: string;
  
  /**
   * Party size
   */
  party_size: number;
  
  /**
   * Position in line
   */
  position?: number;
  
  /**
   * Current wait time (in minutes)
   */
  wait_time_minutes?: number;
  
  /**
   * People ahead
   */
  people_ahead?: number;
  
  /**
   * Created time
   */
  created_at: string;
  
  /**
   * Updated time
   */
  updated_at: string;
  
  /**
   * Estimated seating time
   */
  estimated_seating_time?: string;
  
  /**
   * Customer information
   */
  customer: {
    /**
     * Customer ID
     */
    id?: string;
    
    /**
     * Customer name
     */
    name: string;
    
    /**
     * Customer phone
     */
    phone: string;
    
    /**
     * Customer email
     */
    email?: string;
  };
  
  /**
   * Notes for the business
   */
  notes?: string;
  
  /**
   * Business information
   */
  business?: {
    /**
     * Business name
     */
    name: string;
    
    /**
     * Business phone
     */
    phone?: string;
    
    /**
     * Business address
     */
    address?: string[];
  };
}

/**
 * Yelp Waitlist Partner API client
 */
export class WaitlistPartnerClient extends BaseApiClient {
  /**
   * Get partner restaurants
   * @param params Optional parameters
   * @returns List of partner restaurants
   */
  async getPartnerRestaurants(params?: Record<string, any>): Promise<PartnerRestaurantsResponse> {
    return this.get<PartnerRestaurantsResponse>('/v3/waitlist_partner/restaurants', params);
  }
  
  /**
   * Get waitlist status for a business
   * @param businessId Business ID
   * @returns Waitlist status
   */
  async getWaitlistStatus(businessId: string): Promise<WaitlistStatusResponse> {
    return this.get<WaitlistStatusResponse>(`/v3/waitlist_partner/businesses/${businessId}/status`);
  }
  
  /**
   * Get waitlist information for a business
   * @param businessId Business ID
   * @returns Waitlist information
   */
  async getWaitlistInfo(businessId: string): Promise<WaitlistInfoResponse> {
    return this.get<WaitlistInfoResponse>(`/v3/waitlist_partner/businesses/${businessId}/info`);
  }
  
  /**
   * Create an on-my-way notification
   * @param request On my way request data
   * @returns On my way response
   */
  async createOnMyWay(request: OnMyWayRequest): Promise<OnMyWayResponse> {
    return this.post<OnMyWayResponse>('/v3/waitlist_partner/visit/on_my_way', request);
  }
  
  /**
   * Join a waitlist queue
   * @param request Join queue request data
   * @returns Join queue response
   */
  async joinQueue(request: JoinQueueRequest): Promise<JoinQueueResponse> {
    return this.post<JoinQueueResponse>('/v3/waitlist_partner/visit', request);
  }
  
  /**
   * Cancel a visit
   * @param visitId Visit ID
   * @returns Cancel visit response
   */
  async cancelVisit(visitId: string): Promise<CancelVisitResponse> {
    return this.post<CancelVisitResponse>(`/v3/waitlist_partner/visit/${visitId}/cancel`, {});
  }
  
  /**
   * Get visit details
   * @param visitId Visit ID
   * @returns Visit details
   */
  async getVisitDetails(visitId: string): Promise<VisitDetailsResponse> {
    return this.get<VisitDetailsResponse>(`/v3/waitlist_partner/visit/${visitId}`);
  }
}

export default new WaitlistPartnerClient();