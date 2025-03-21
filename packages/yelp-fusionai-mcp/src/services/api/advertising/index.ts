import { BaseApiClient } from '../base';

/**
 * Create Program Request interface
 */
export interface CreateProgramRequest {
  /**
   * The business ID for which to create the advertising program
   */
  business_id: string;
  
  /**
   * Budget amount in cents
   */
  budget: number;
  
  /**
   * Program objectives
   */
  objectives: string[];
  
  /**
   * Ad type
   */
  ad_type?: string;
  
  /**
   * Geographic targeting
   */
  geo_targeting?: {
    /**
     * Target radius in meters
     */
    radius?: number;
    
    /**
     * Latitude coordinate
     */
    latitude?: number;
    
    /**
     * Longitude coordinate
     */
    longitude?: number;
    
    /**
     * Location name
     */
    location?: string;
  };
  
  /**
   * Additional configuration options
   */
  config?: Record<string, any>;
}

/**
 * Modify Program Request interface
 */
export interface ModifyProgramRequest {
  /**
   * Updated budget amount in cents
   */
  budget?: number;
  
  /**
   * Updated program objectives
   */
  objectives?: string[];
  
  /**
   * Updated ad type
   */
  ad_type?: string;
  
  /**
   * Updated geographic targeting
   */
  geo_targeting?: {
    /**
     * Target radius in meters
     */
    radius?: number;
    
    /**
     * Latitude coordinate
     */
    latitude?: number;
    
    /**
     * Longitude coordinate
     */
    longitude?: number;
    
    /**
     * Location name
     */
    location?: string;
  };
  
  /**
   * Updated configuration options
   */
  config?: Record<string, any>;
}

/**
 * Program response interface
 */
export interface ProgramResponse {
  /**
   * Program ID
   */
  program_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Program status
   */
  status: 'active' | 'paused' | 'terminated' | 'pending';
  
  /**
   * Budget amount in cents
   */
  budget: number;
  
  /**
   * Start date
   */
  start_date: string;
  
  /**
   * End date
   */
  end_date?: string;
  
  /**
   * Program objectives
   */
  objectives: string[];
  
  /**
   * Ad type
   */
  ad_type?: string;
  
  /**
   * Geographic targeting
   */
  geo_targeting?: {
    /**
     * Target radius in meters
     */
    radius?: number;
    
    /**
     * Latitude coordinate
     */
    latitude?: number;
    
    /**
     * Longitude coordinate
     */
    longitude?: number;
    
    /**
     * Location name
     */
    location?: string;
  };
  
  /**
   * Performance metrics
   */
  metrics?: {
    /**
     * Impressions count
     */
    impressions: number;
    
    /**
     * Clicks count
     */
    clicks: number;
    
    /**
     * Click-through rate (CTR)
     */
    ctr: number;
    
    /**
     * Spend amount in cents
     */
    spend: number;
  };
  
  /**
   * Creation date
   */
  created_at: string;
  
  /**
   * Last update date
   */
  updated_at: string;
}

/**
 * Program status response interface
 */
export interface ProgramStatusResponse {
  /**
   * Program ID
   */
  program_id: string;
  
  /**
   * Program status
   */
  status: 'active' | 'paused' | 'terminated' | 'pending';
  
  /**
   * Detailed status information
   */
  details: {
    /**
     * Status reason
     */
    reason?: string;
    
    /**
     * Status last updated
     */
    last_updated: string;
    
    /**
     * Days active
     */
    days_active?: number;
    
    /**
     * Days remaining
     */
    days_remaining?: number;
  };
  
  /**
   * Current budget status
   */
  budget_status: {
    /**
     * Total budget in cents
     */
    total_budget: number;
    
    /**
     * Spent amount in cents
     */
    spent: number;
    
    /**
     * Remaining amount in cents
     */
    remaining: number;
    
    /**
     * Daily spend in cents
     */
    daily_spend?: number;
  };
}

/**
 * Program list response interface
 */
export interface ProgramListResponse {
  /**
   * Array of programs
   */
  programs: ProgramResponse[];
  
  /**
   * Total count
   */
  total: number;
}

/**
 * Yelp Advertising API client
 */
export class AdvertisingClient extends BaseApiClient {
  /**
   * Get advertising resources
   * @returns Advertising resources
   */
  async getResources(): Promise<any> {
    return this.get<any>('/v3/advertising/resources');
  }
  
  /**
   * Create an advertising program
   * @param data Program creation data
   * @returns Program response
   */
  async createProgram(data: CreateProgramRequest): Promise<ProgramResponse> {
    return this.post<ProgramResponse>('/v3/advertising/programs', data);
  }
  
  /**
   * Modify an existing advertising program
   * @param programId Program ID
   * @param data Program modification data
   * @returns Updated program response
   */
  async modifyProgram(programId: string, data: ModifyProgramRequest): Promise<ProgramResponse> {
    return this.put<ProgramResponse>(`/v3/advertising/programs/${programId}`, data);
  }
  
  /**
   * Get program status
   * @param programId Program ID
   * @returns Program status
   */
  async getProgramStatus(programId: string): Promise<ProgramStatusResponse> {
    return this.get<ProgramStatusResponse>(`/v3/advertising/programs/${programId}/status`);
  }
  
  /**
   * Pause an advertising program
   * @param programId Program ID
   * @returns Updated program
   */
  async pauseProgram(programId: string): Promise<ProgramResponse> {
    return this.post<ProgramResponse>(`/v3/advertising/programs/${programId}/pause`, {});
  }
  
  /**
   * Resume a paused advertising program
   * @param programId Program ID
   * @returns Updated program
   */
  async resumeProgram(programId: string): Promise<ProgramResponse> {
    return this.post<ProgramResponse>(`/v3/advertising/programs/${programId}/resume`, {});
  }
  
  /**
   * Terminate an advertising program
   * @param programId Program ID
   * @returns Updated program
   */
  async terminateProgram(programId: string): Promise<ProgramResponse> {
    return this.post<ProgramResponse>(`/v3/advertising/programs/${programId}/terminate`, {});
  }
  
  /**
   * List all advertising programs
   * @param businessId Business ID (optional)
   * @returns List of programs
   */
  async listPrograms(businessId?: string): Promise<ProgramListResponse> {
    const params = businessId ? { business_id: businessId } : undefined;
    return this.get<ProgramListResponse>('/v3/advertising/programs', params);
  }
  
  /**
   * Get a specific advertising program
   * @param programId Program ID
   * @returns Program details
   */
  async getProgram(programId: string): Promise<ProgramResponse> {
    return this.get<ProgramResponse>(`/v3/advertising/programs/${programId}`);
  }
}

export default new AdvertisingClient();