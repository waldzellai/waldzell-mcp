import { BaseApiClient } from '../base';

/**
 * Data source interface
 */
export interface DataSource {
  /**
   * Unique identifier for the data source
   */
  id: string;

  /**
   * Name of the data source
   */
  name: string;

  /**
   * Type of the data source
   */
  type: string;

  /**
   * Connection status of the data source
   */
  status: 'active' | 'inactive' | 'pending' | 'error';

  /**
   * Last updated timestamp for the data source
   */
  last_updated: string;

  /**
   * Creation timestamp for the data source
   */
  created_at: string;

  /**
   * Optional connection details
   */
  connection_details?: Record<string, any>;
}

/**
 * Data source list response interface
 */
export interface DataSourceListResponse {
  /**
   * List of data sources
   */
  data_sources: DataSource[];

  /**
   * Pagination information
   */
  pagination?: {
    /**
     * Total count of data sources
     */
    total: number;

    /**
     * Offset for pagination
     */
    offset: number;

    /**
     * Limit for pagination
     */
    limit: number;
  };
}

/**
 * Data ingestion job interface
 */
export interface DataIngestionJob {
  /**
   * Unique identifier for the job
   */
  job_id: string;

  /**
   * Status of the job
   */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  /**
   * Type of the data ingestion job
   */
  job_type: string;

  /**
   * Source data information
   */
  source: {
    /**
     * ID of the source
     */
    id: string;

    /**
     * Type of the source
     */
    type: string;
  };

  /**
   * Creation timestamp for the job
   */
  created_at: string;

  /**
   * Last updated timestamp for the job
   */
  updated_at: string;

  /**
   * Statistics about the ingestion process
   */
  stats?: {
    /**
     * Number of records processed
     */
    records_processed: number;

    /**
     * Number of records failed
     */
    records_failed: number;

    /**
     * Number of records successfully ingested
     */
    records_ingested: number;
  };

  /**
   * Optional error details if the job failed
   */
  error?: {
    /**
     * Error code
     */
    code: string;

    /**
     * Error message
     */
    message: string;

    /**
     * Detailed error information
     */
    details?: string;
  };
}

/**
 * Data ingestion job list response interface
 */
export interface DataIngestionJobListResponse {
  /**
   * List of data ingestion jobs
   */
  jobs: DataIngestionJob[];

  /**
   * Pagination information
   */
  pagination?: {
    /**
     * Total count of jobs
     */
    total: number;

    /**
     * Offset for pagination
     */
    offset: number;

    /**
     * Limit for pagination
     */
    limit: number;
  };
}

/**
 * Create data source request parameters
 */
export interface CreateDataSourceParams {
  /**
   * Name of the data source
   */
  name: string;

  /**
   * Type of the data source (e.g., "csv", "database", "api")
   */
  type: string;

  /**
   * Connection details for the data source
   */
  connection_details: Record<string, any>;
}

/**
 * Create data ingestion job request parameters
 */
export interface CreateDataIngestionJobParams {
  /**
   * ID of the data source
   */
  source_id: string;

  /**
   * Type of the job (e.g., "sync", "incremental", "full")
   */
  job_type: string;

  /**
   * Optional schedule for the job
   */
  schedule?: {
    /**
     * Frequency of the job (e.g., "once", "hourly", "daily", "weekly", "monthly")
     */
    frequency: string;

    /**
     * Time of day to run the job (if applicable)
     */
    time?: string;

    /**
     * Day of week to run the job (if applicable)
     */
    day_of_week?: number;

    /**
     * Day of month to run the job (if applicable)
     */
    day_of_month?: number;
  };

  /**
   * Optional configuration for the job
   */
  configuration?: Record<string, any>;
}

/**
 * Update data ingestion job request parameters
 */
export interface UpdateDataIngestionJobParams {
  /**
   * Optional new job type
   */
  job_type?: string;

  /**
   * Optional new schedule
   */
  schedule?: {
    /**
     * Frequency of the job
     */
    frequency: string;

    /**
     * Time of day to run the job
     */
    time?: string;

    /**
     * Day of week to run the job
     */
    day_of_week?: number;

    /**
     * Day of month to run the job
     */
    day_of_month?: number;
  };

  /**
   * Optional new configuration
   */
  configuration?: Record<string, any>;
}

/**
 * Data source list request parameters
 */
export interface DataSourceListParams {
  /**
   * Optional type filter
   */
  type?: string;

  /**
   * Optional status filter
   */
  status?: 'active' | 'inactive' | 'pending' | 'error';

  /**
   * Optional offset for pagination
   */
  offset?: number;

  /**
   * Optional limit for pagination
   */
  limit?: number;
}

/**
 * Data ingestion job list request parameters
 */
export interface DataIngestionJobListParams {
  /**
   * Optional job type filter
   */
  job_type?: string;

  /**
   * Optional status filter
   */
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';

  /**
   * Optional source ID filter
   */
  source_id?: string;

  /**
   * Optional offset for pagination
   */
  offset?: number;

  /**
   * Optional limit for pagination
   */
  limit?: number;
}

/**
 * Yelp Data Ingestion API client
 * 
 * This client provides access to the Yelp Fusion Data Ingestion API endpoints
 * for managing data sources and ingestion jobs.
 */
export class DataIngestionClient extends BaseApiClient {
  /**
   * List all data sources
   * 
   * This endpoint retrieves all data sources for the authenticated user.
   * 
   * @param params Optional request parameters (type, status, offset, limit)
   * @returns Promise with data source list response
   */
  async listDataSources(params?: DataSourceListParams): Promise<DataSourceListResponse> {
    return this.get<DataSourceListResponse>('/v3/data_ingestion/sources', params);
  }

  /**
   * Get detailed information about a specific data source
   * 
   * This endpoint retrieves detailed information about a specific data source by ID.
   * 
   * @param sourceId The ID of the data source to retrieve
   * @returns Promise with data source details
   */
  async getDataSource(sourceId: string): Promise<DataSource> {
    return this.get<DataSource>(`/v3/data_ingestion/sources/${sourceId}`);
  }

  /**
   * Create a new data source
   * 
   * This endpoint creates a new data source with the specified parameters.
   * 
   * @param params Request parameters for creating a data source
   * @returns Promise with the created data source
   */
  async createDataSource(params: CreateDataSourceParams): Promise<DataSource> {
    return this.post<DataSource>('/v3/data_ingestion/sources', params);
  }

  /**
   * Update an existing data source
   * 
   * This endpoint updates an existing data source with the specified parameters.
   * 
   * @param sourceId The ID of the data source to update
   * @param params Request parameters for updating the data source
   * @returns Promise with the updated data source
   */
  async updateDataSource(
    sourceId: string, 
    params: Partial<CreateDataSourceParams>
  ): Promise<DataSource> {
    return this.put<DataSource>(`/v3/data_ingestion/sources/${sourceId}`, params);
  }

  /**
   * Delete a data source
   * 
   * This endpoint deletes a specific data source by ID.
   * 
   * @param sourceId The ID of the data source to delete
   * @returns Promise with a success response
   */
  async deleteDataSource(sourceId: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/v3/data_ingestion/sources/${sourceId}`);
  }

  /**
   * List all data ingestion jobs
   * 
   * This endpoint retrieves all data ingestion jobs for the authenticated user.
   * 
   * @param params Optional request parameters (job_type, status, source_id, offset, limit)
   * @returns Promise with data ingestion job list response
   */
  async listDataIngestionJobs(params?: DataIngestionJobListParams): Promise<DataIngestionJobListResponse> {
    return this.get<DataIngestionJobListResponse>('/v3/data_ingestion/jobs', params);
  }

  /**
   * Get detailed information about a specific data ingestion job
   * 
   * This endpoint retrieves detailed information about a specific data ingestion job by ID.
   * 
   * @param jobId The ID of the data ingestion job to retrieve
   * @returns Promise with data ingestion job details
   */
  async getDataIngestionJob(jobId: string): Promise<DataIngestionJob> {
    return this.get<DataIngestionJob>(`/v3/data_ingestion/jobs/${jobId}`);
  }

  /**
   * Create a new data ingestion job
   * 
   * This endpoint creates a new data ingestion job with the specified parameters.
   * 
   * @param params Request parameters for creating a data ingestion job
   * @returns Promise with the created data ingestion job
   */
  async createDataIngestionJob(params: CreateDataIngestionJobParams): Promise<DataIngestionJob> {
    return this.post<DataIngestionJob>('/v3/data_ingestion/jobs', params);
  }

  /**
   * Update an existing data ingestion job
   * 
   * This endpoint updates an existing data ingestion job with the specified parameters.
   * 
   * @param jobId The ID of the data ingestion job to update
   * @param params Request parameters for updating the data ingestion job
   * @returns Promise with the updated data ingestion job
   */
  async updateDataIngestionJob(
    jobId: string, 
    params: UpdateDataIngestionJobParams
  ): Promise<DataIngestionJob> {
    return this.put<DataIngestionJob>(`/v3/data_ingestion/jobs/${jobId}`, params);
  }

  /**
   * Cancel a data ingestion job
   * 
   * This endpoint cancels a specific data ingestion job by ID.
   * 
   * @param jobId The ID of the data ingestion job to cancel
   * @returns Promise with a success response
   */
  async cancelDataIngestionJob(jobId: string): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(`/v3/data_ingestion/jobs/${jobId}/cancel`, {});
  }

  /**
   * Retry a failed data ingestion job
   * 
   * This endpoint retries a failed data ingestion job by ID.
   * 
   * @param jobId The ID of the data ingestion job to retry
   * @returns Promise with the retried data ingestion job
   */
  async retryDataIngestionJob(jobId: string): Promise<DataIngestionJob> {
    return this.post<DataIngestionJob>(`/v3/data_ingestion/jobs/${jobId}/retry`, {});
  }
}

export default new DataIngestionClient();