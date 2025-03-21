import { BaseApiClient } from '../base';

/**
 * Lead status types
 */
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

/**
 * Lead source types
 */
export type LeadSource = 'website' | 'referral' | 'advertisement' | 'social_media' | 'event' | 'other';

/**
 * Lead priority types
 */
export type LeadPriority = 'low' | 'medium' | 'high';

/**
 * Lead interface
 */
export interface Lead {
  /**
   * Unique identifier for the lead
   */
  id: string;

  /**
   * Full name of the lead
   */
  name: string;

  /**
   * Email address of the lead
   */
  email: string;

  /**
   * Phone number of the lead (optional)
   */
  phone?: string;

  /**
   * Company or organization name (optional)
   */
  company?: string;

  /**
   * Job title or position (optional)
   */
  job_title?: string;

  /**
   * Current status of the lead
   */
  status: LeadStatus;

  /**
   * Priority level of the lead
   */
  priority: LeadPriority;

  /**
   * Source of the lead
   */
  source: LeadSource;

  /**
   * Custom source details if source is 'other'
   */
  source_details?: string;

  /**
   * Estimated value of the lead (in cents)
   */
  estimated_value_cents?: number;

  /**
   * Lead's address (optional)
   */
  address?: {
    /**
     * Street address
     */
    street?: string;

    /**
     * City
     */
    city?: string;

    /**
     * State or province
     */
    state?: string;

    /**
     * Postal code
     */
    zip_code?: string;

    /**
     * Country
     */
    country?: string;
  };

  /**
   * Notes about the lead
   */
  notes?: string;

  /**
   * Associated business ID (if applicable)
   */
  business_id?: string;

  /**
   * Associated campaign ID (if applicable)
   */
  campaign_id?: string;

  /**
   * Owner or assignee user ID
   */
  owner_id?: string;

  /**
   * Custom fields for the lead
   */
  custom_fields?: Record<string, any>;

  /**
   * Tags associated with the lead
   */
  tags?: string[];

  /**
   * Creation timestamp
   */
  created_at: string;

  /**
   * Last updated timestamp
   */
  updated_at: string;

  /**
   * Last contact date (if contacted)
   */
  last_contacted_at?: string;
}

/**
 * Lead list response interface
 */
export interface LeadListResponse {
  /**
   * List of leads
   */
  leads: Lead[];

  /**
   * Pagination information
   */
  pagination?: {
    /**
     * Total count of leads
     */
    total: number;

    /**
     * Current page number
     */
    page: number;

    /**
     * Number of leads per page
     */
    per_page: number;

    /**
     * URL for the next page (if available)
     */
    next_page?: string;
  };
}

/**
 * Lead creation request parameters
 */
export interface CreateLeadParams {
  /**
   * Full name of the lead
   */
  name: string;

  /**
   * Email address of the lead
   */
  email: string;

  /**
   * Phone number of the lead (optional)
   */
  phone?: string;

  /**
   * Company or organization name (optional)
   */
  company?: string;

  /**
   * Job title or position (optional)
   */
  job_title?: string;

  /**
   * Status of the lead (defaults to 'new')
   */
  status?: LeadStatus;

  /**
   * Priority level of the lead (defaults to 'medium')
   */
  priority?: LeadPriority;

  /**
   * Source of the lead
   */
  source: LeadSource;

  /**
   * Custom source details if source is 'other'
   */
  source_details?: string;

  /**
   * Estimated value of the lead (in cents)
   */
  estimated_value_cents?: number;

  /**
   * Lead's address (optional)
   */
  address?: {
    /**
     * Street address
     */
    street?: string;

    /**
     * City
     */
    city?: string;

    /**
     * State or province
     */
    state?: string;

    /**
     * Postal code
     */
    zip_code?: string;

    /**
     * Country
     */
    country?: string;
  };

  /**
   * Notes about the lead
   */
  notes?: string;

  /**
   * Associated business ID (if applicable)
   */
  business_id?: string;

  /**
   * Associated campaign ID (if applicable)
   */
  campaign_id?: string;

  /**
   * Owner or assignee user ID
   */
  owner_id?: string;

  /**
   * Custom fields for the lead
   */
  custom_fields?: Record<string, any>;

  /**
   * Tags associated with the lead
   */
  tags?: string[];
}

/**
 * Lead update request parameters
 */
export interface UpdateLeadParams {
  /**
   * Full name of the lead
   */
  name?: string;

  /**
   * Email address of the lead
   */
  email?: string;

  /**
   * Phone number of the lead
   */
  phone?: string;

  /**
   * Company or organization name
   */
  company?: string;

  /**
   * Job title or position
   */
  job_title?: string;

  /**
   * Status of the lead
   */
  status?: LeadStatus;

  /**
   * Priority level of the lead
   */
  priority?: LeadPriority;

  /**
   * Source of the lead
   */
  source?: LeadSource;

  /**
   * Custom source details if source is 'other'
   */
  source_details?: string;

  /**
   * Estimated value of the lead (in cents)
   */
  estimated_value_cents?: number;

  /**
   * Lead's address
   */
  address?: {
    /**
     * Street address
     */
    street?: string;

    /**
     * City
     */
    city?: string;

    /**
     * State or province
     */
    state?: string;

    /**
     * Postal code
     */
    zip_code?: string;

    /**
     * Country
     */
    country?: string;
  };

  /**
   * Notes about the lead
   */
  notes?: string;

  /**
   * Associated business ID
   */
  business_id?: string;

  /**
   * Associated campaign ID
   */
  campaign_id?: string;

  /**
   * Owner or assignee user ID
   */
  owner_id?: string;

  /**
   * Custom fields for the lead
   */
  custom_fields?: Record<string, any>;

  /**
   * Tags associated with the lead
   */
  tags?: string[];
}

/**
 * Lead search parameters
 */
export interface LeadSearchParams {
  /**
   * Search query to match against lead details
   */
  query?: string;

  /**
   * Filter by lead status
   */
  status?: LeadStatus | LeadStatus[];

  /**
   * Filter by lead source
   */
  source?: LeadSource | LeadSource[];

  /**
   * Filter by lead priority
   */
  priority?: LeadPriority | LeadPriority[];

  /**
   * Filter by tags (comma-separated)
   */
  tags?: string | string[];

  /**
   * Filter by associated business ID
   */
  business_id?: string;

  /**
   * Filter by associated campaign ID
   */
  campaign_id?: string;

  /**
   * Filter by owner/assignee ID
   */
  owner_id?: string;

  /**
   * Filter by creation date (ISO format)
   */
  created_after?: string;

  /**
   * Filter by creation date (ISO format)
   */
  created_before?: string;

  /**
   * Filter by last contact date (ISO format)
   */
  contacted_after?: string;

  /**
   * Filter by last contact date (ISO format)
   */
  contacted_before?: string;

  /**
   * Sort results by a specific field
   */
  sort_by?: 'created_at' | 'updated_at' | 'last_contacted_at' | 'name' | 'priority' | 'estimated_value_cents';

  /**
   * Sort direction
   */
  sort_order?: 'asc' | 'desc';

  /**
   * Page number for pagination
   */
  page?: number;

  /**
   * Number of leads per page
   */
  per_page?: number;
}

/**
 * Lead note interface
 */
export interface LeadNote {
  /**
   * Unique identifier for the note
   */
  id: string;

  /**
   * ID of the associated lead
   */
  lead_id: string;

  /**
   * Content of the note
   */
  content: string;

  /**
   * User ID of the note creator
   */
  created_by: string;

  /**
   * Creation timestamp
   */
  created_at: string;

  /**
   * Last updated timestamp
   */
  updated_at: string;
}

/**
 * Lead note list response interface
 */
export interface LeadNoteListResponse {
  /**
   * List of lead notes
   */
  notes: LeadNote[];

  /**
   * Pagination information
   */
  pagination?: {
    /**
     * Total count of notes
     */
    total: number;

    /**
     * Current page number
     */
    page: number;

    /**
     * Number of notes per page
     */
    per_page: number;

    /**
     * URL for the next page (if available)
     */
    next_page?: string;
  };
}

/**
 * Create lead note request parameters
 */
export interface CreateLeadNoteParams {
  /**
   * Content of the note
   */
  content: string;
}

/**
 * Lead activity interface
 */
export interface LeadActivity {
  /**
   * Unique identifier for the activity
   */
  id: string;

  /**
   * ID of the associated lead
   */
  lead_id: string;

  /**
   * Type of activity
   */
  type: 'note' | 'status_change' | 'contact' | 'email' | 'call' | 'meeting' | 'task' | 'custom';

  /**
   * Description of the activity
   */
  description: string;

  /**
   * Additional details about the activity
   */
  details?: Record<string, any>;

  /**
   * User ID of the activity creator
   */
  created_by: string;

  /**
   * Creation timestamp
   */
  created_at: string;
}

/**
 * Lead activity list response interface
 */
export interface LeadActivityListResponse {
  /**
   * List of lead activities
   */
  activities: LeadActivity[];

  /**
   * Pagination information
   */
  pagination?: {
    /**
     * Total count of activities
     */
    total: number;

    /**
     * Current page number
     */
    page: number;

    /**
     * Number of activities per page
     */
    per_page: number;

    /**
     * URL for the next page (if available)
     */
    next_page?: string;
  };
}

/**
 * Create lead activity request parameters
 */
export interface CreateLeadActivityParams {
  /**
   * Type of activity
   */
  type: 'note' | 'status_change' | 'contact' | 'email' | 'call' | 'meeting' | 'task' | 'custom';

  /**
   * Description of the activity
   */
  description: string;

  /**
   * Additional details about the activity
   */
  details?: Record<string, any>;
}

/**
 * Bulk update leads request parameters
 */
export interface BulkUpdateLeadsParams {
  /**
   * Array of lead IDs to update
   */
  lead_ids: string[];

  /**
   * Updates to apply to all specified leads
   */
  updates: Partial<UpdateLeadParams>;
}

/**
 * Bulk delete leads request parameters
 */
export interface BulkDeleteLeadsParams {
  /**
   * Array of lead IDs to delete
   */
  lead_ids: string[];
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  /**
   * Number of leads successfully processed
   */
  success_count: number;

  /**
   * Number of leads that failed to process
   */
  failure_count: number;

  /**
   * Array of failed lead IDs with error messages
   */
  failures?: Array<{
    /**
     * ID of the lead that failed to process
     */
    id: string;

    /**
     * Error message
     */
    error: string;
  }>;
}

/**
 * Import leads request parameters
 */
export interface ImportLeadsParams {
  /**
   * Array of leads to import
   */
  leads: CreateLeadParams[];

  /**
   * Whether to skip duplicate checks (default: false)
   */
  skip_duplicates?: boolean;

  /**
   * Field to use for duplicate checking (default: 'email')
   */
  duplicate_check_field?: 'email' | 'phone' | 'external_id';
}

/**
 * Import leads response
 */
export interface ImportLeadsResponse {
  /**
   * Number of leads successfully imported
   */
  imported_count: number;

  /**
   * Number of leads skipped due to duplicates
   */
  skipped_count: number;

  /**
   * Number of leads that failed to import
   */
  failure_count: number;

  /**
   * Array of imported lead IDs
   */
  imported_ids: string[];

  /**
   * Array of failures with error messages
   */
  failures?: Array<{
    /**
     * Index of the lead in the original request array
     */
    index: number;

    /**
     * Error message
     */
    error: string;
  }>;
}

/**
 * Export leads request parameters
 */
export interface ExportLeadsParams extends LeadSearchParams {
  /**
   * Format of the export (default: 'csv')
   */
  format?: 'csv' | 'json' | 'xlsx';

  /**
   * Array of field names to include in the export
   * If not specified, all fields will be included
   */
  fields?: string[];
}

/**
 * Export leads response
 */
export interface ExportLeadsResponse {
  /**
   * Job ID for the export
   */
  export_job_id: string;

  /**
   * Status of the export job
   */
  status: 'pending' | 'processing' | 'completed' | 'failed';

  /**
   * Estimated completion time (in seconds)
   */
  estimated_time_seconds?: number;
}

/**
 * Export job status response
 */
export interface ExportJobStatusResponse {
  /**
   * Job ID for the export
   */
  export_job_id: string;

  /**
   * Status of the export job
   */
  status: 'pending' | 'processing' | 'completed' | 'failed';

  /**
   * URL to download the exported file (available when status is 'completed')
   */
  download_url?: string;

  /**
   * Format of the export
   */
  format: 'csv' | 'json' | 'xlsx';

  /**
   * Number of leads included in the export
   */
  lead_count?: number;

  /**
   * Expiration time of the download URL
   */
  expires_at?: string;

  /**
   * Error message (if status is 'failed')
   */
  error?: string;
}

/**
 * Lead statistics interface
 */
export interface LeadStatistics {
  /**
   * Total count of leads
   */
  total_count: number;

  /**
   * Counts by status
   */
  status_counts: Record<LeadStatus, number>;

  /**
   * Counts by source
   */
  source_counts: Record<LeadSource, number>;

  /**
   * Counts by priority
   */
  priority_counts: Record<LeadPriority, number>;

  /**
   * Count by owner
   */
  owner_counts: Record<string, number>;

  /**
   * Average value of leads (in cents)
   */
  average_value_cents?: number;

  /**
   * Conversion rate statistics
   */
  conversion_rate?: {
    /**
     * Overall conversion rate as a percentage
     */
    overall: number;

    /**
     * Conversion rates by source
     */
    by_source: Record<LeadSource, number>;
  };

  /**
   * Time-based statistics (last 30 days)
   */
  time_stats?: {
    /**
     * New leads in the last 30 days
     */
    new_leads_last_30_days: number;

    /**
     * Converted leads in the last 30 days
     */
    conversions_last_30_days: number;

    /**
     * Average time to contact (in hours)
     */
    average_time_to_contact_hours: number;

    /**
     * Average time to conversion (in days)
     */
    average_time_to_conversion_days: number;
  };
}

/**
 * Yelp Leads API client
 * 
 * This client provides access to the Yelp Fusion Leads API endpoints
 * for managing leads, lead activities, and related operations.
 */
export class LeadsClient extends BaseApiClient {
  /**
   * Get a list of leads
   * 
   * @param params Search and filter parameters
   * @returns Promise with lead list response
   */
  async getLeads(params?: LeadSearchParams): Promise<LeadListResponse> {
    return this.get<LeadListResponse>('/v3/leads', params);
  }

  /**
   * Get details of a specific lead
   * 
   * @param leadId Lead ID to retrieve
   * @returns Promise with lead details
   */
  async getLead(leadId: string): Promise<Lead> {
    return this.get<Lead>(`/v3/leads/${leadId}`);
  }

  /**
   * Create a new lead
   * 
   * @param params Lead creation parameters
   * @returns Promise with the created lead
   */
  async createLead(params: CreateLeadParams): Promise<Lead> {
    return this.post<Lead>('/v3/leads', params);
  }

  /**
   * Update an existing lead
   * 
   * @param leadId Lead ID to update
   * @param params Lead update parameters
   * @returns Promise with the updated lead
   */
  async updateLead(leadId: string, params: UpdateLeadParams): Promise<Lead> {
    return this.put<Lead>(`/v3/leads/${leadId}`, params);
  }

  /**
   * Delete a lead
   * 
   * @param leadId Lead ID to delete
   * @returns Promise with success response
   */
  async deleteLead(leadId: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/v3/leads/${leadId}`);
  }

  /**
   * Get notes for a lead
   * 
   * @param leadId Lead ID to get notes for
   * @param page Page number for pagination
   * @param perPage Number of notes per page
   * @returns Promise with lead notes response
   */
  async getLeadNotes(
    leadId: string, 
    page?: number, 
    perPage?: number
  ): Promise<LeadNoteListResponse> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (perPage !== undefined) params.per_page = perPage;

    return this.get<LeadNoteListResponse>(`/v3/leads/${leadId}/notes`, params);
  }

  /**
   * Add a note to a lead
   * 
   * @param leadId Lead ID to add a note to
   * @param params Note creation parameters
   * @returns Promise with the created note
   */
  async addLeadNote(leadId: string, params: CreateLeadNoteParams): Promise<LeadNote> {
    return this.post<LeadNote>(`/v3/leads/${leadId}/notes`, params);
  }

  /**
   * Delete a lead note
   * 
   * @param leadId Lead ID the note belongs to
   * @param noteId Note ID to delete
   * @returns Promise with success response
   */
  async deleteLeadNote(leadId: string, noteId: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/v3/leads/${leadId}/notes/${noteId}`);
  }

  /**
   * Get activity history for a lead
   * 
   * @param leadId Lead ID to get activities for
   * @param page Page number for pagination
   * @param perPage Number of activities per page
   * @returns Promise with lead activities response
   */
  async getLeadActivities(
    leadId: string, 
    page?: number, 
    perPage?: number
  ): Promise<LeadActivityListResponse> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (perPage !== undefined) params.per_page = perPage;

    return this.get<LeadActivityListResponse>(`/v3/leads/${leadId}/activities`, params);
  }

  /**
   * Add an activity to a lead
   * 
   * @param leadId Lead ID to add an activity to
   * @param params Activity creation parameters
   * @returns Promise with the created activity
   */
  async addLeadActivity(leadId: string, params: CreateLeadActivityParams): Promise<LeadActivity> {
    return this.post<LeadActivity>(`/v3/leads/${leadId}/activities`, params);
  }

  /**
   * Update multiple leads in bulk
   * 
   * @param params Bulk update parameters
   * @returns Promise with bulk operation response
   */
  async bulkUpdateLeads(params: BulkUpdateLeadsParams): Promise<BulkOperationResponse> {
    return this.post<BulkOperationResponse>('/v3/leads/bulk/update', params);
  }

  /**
   * Delete multiple leads in bulk
   * 
   * @param params Bulk delete parameters
   * @returns Promise with bulk operation response
   */
  async bulkDeleteLeads(params: BulkDeleteLeadsParams): Promise<BulkOperationResponse> {
    return this.post<BulkOperationResponse>('/v3/leads/bulk/delete', params);
  }

  /**
   * Import leads from a data source
   * 
   * @param params Import parameters
   * @returns Promise with import response
   */
  async importLeads(params: ImportLeadsParams): Promise<ImportLeadsResponse> {
    return this.post<ImportLeadsResponse>('/v3/leads/import', params);
  }

  /**
   * Export leads to a file
   * 
   * @param params Export parameters
   * @returns Promise with export response
   */
  async exportLeads(params: ExportLeadsParams): Promise<ExportLeadsResponse> {
    return this.post<ExportLeadsResponse>('/v3/leads/export', params);
  }

  /**
   * Check status of an export job
   * 
   * @param exportJobId Export job ID to check
   * @returns Promise with export job status
   */
  async getExportStatus(exportJobId: string): Promise<ExportJobStatusResponse> {
    return this.get<ExportJobStatusResponse>(`/v3/leads/export/${exportJobId}`);
  }

  /**
   * Get lead statistics
   * 
   * @param timeframe Timeframe for statistics (default: 'all_time')
   * @param ownerId Filter statistics by owner ID
   * @returns Promise with lead statistics
   */
  async getLeadStatistics(
    timeframe?: 'all_time' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'year_to_date',
    ownerId?: string
  ): Promise<LeadStatistics> {
    const params: Record<string, any> = {};
    if (timeframe !== undefined) params.timeframe = timeframe;
    if (ownerId !== undefined) params.owner_id = ownerId;

    return this.get<LeadStatistics>('/v3/leads/statistics', params);
  }
}

export default new LeadsClient();