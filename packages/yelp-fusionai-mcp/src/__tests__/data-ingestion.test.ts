import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import yelpService from '../services/yelp';
import { 
  DataSource, 
  DataSourceListResponse, 
  DataIngestionJob, 
  DataIngestionJobListResponse 
} from '../services/api/data-ingestion';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('Data Ingestion API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Data Sources', () => {
    it('should make a GET request to list data sources', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataSourceListResponse = {
        data_sources: [
          {
            id: 'source1',
            name: 'CSV Import Source',
            type: 'csv',
            status: 'active',
            last_updated: '2023-05-15T14:32:21Z',
            created_at: '2023-05-10T09:22:17Z',
            connection_details: {
              file_format: 'csv',
              delimiter: ','
            }
          },
          {
            id: 'source2',
            name: 'Database Connection',
            type: 'database',
            status: 'active',
            last_updated: '2023-06-20T11:15:33Z',
            created_at: '2023-06-15T08:44:12Z',
            connection_details: {
              db_type: 'postgresql',
              host: 'db.example.com'
            }
          }
        ],
        pagination: {
          total: 2,
          offset: 0,
          limit: 20
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await yelpService.dataIngestion.listDataSources();

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/data_ingestion/sources', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should include filter parameters when listing data sources', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataSourceListResponse = {
        data_sources: [
          {
            id: 'source1',
            name: 'CSV Import Source',
            type: 'csv',
            status: 'active',
            last_updated: '2023-05-15T14:32:21Z',
            created_at: '2023-05-10T09:22:17Z'
          }
        ],
        pagination: {
          total: 1,
          offset: 0,
          limit: 20
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        type: 'csv',
        status: 'active' as const,
        limit: 20
      };
      
      const result = await yelpService.dataIngestion.listDataSources(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/data_ingestion/sources', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a GET request to get data source details', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataSource = {
        id: 'source1',
        name: 'CSV Import Source',
        type: 'csv',
        status: 'active',
        last_updated: '2023-05-15T14:32:21Z',
        created_at: '2023-05-10T09:22:17Z',
        connection_details: {
          file_format: 'csv',
          delimiter: ',',
          has_header: true
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const sourceId = 'source1';
      const result = await yelpService.dataIngestion.getDataSource(sourceId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/data_ingestion/sources/source1', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to create a data source', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataSource = {
        id: 'source3',
        name: 'New API Source',
        type: 'api',
        status: 'pending',
        last_updated: '2023-07-25T16:45:12Z',
        created_at: '2023-07-25T16:45:12Z',
        connection_details: {
          api_url: 'https://api.example.com/data',
          auth_type: 'oauth2'
        }
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        name: 'New API Source',
        type: 'api',
        connection_details: {
          api_url: 'https://api.example.com/data',
          auth_type: 'oauth2'
        }
      };
      
      const result = await yelpService.dataIngestion.createDataSource(params);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/data_ingestion/sources', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a PUT request to update a data source', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataSource = {
        id: 'source1',
        name: 'Updated CSV Source',
        type: 'csv',
        status: 'active',
        last_updated: '2023-08-05T10:22:15Z',
        created_at: '2023-05-10T09:22:17Z',
        connection_details: {
          file_format: 'csv',
          delimiter: ';',
          has_header: false
        }
      };
      
      (mockAxiosInstance.put as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const sourceId = 'source1';
      const params = {
        name: 'Updated CSV Source',
        connection_details: {
          delimiter: ';',
          has_header: false
        }
      };
      
      const result = await yelpService.dataIngestion.updateDataSource(sourceId, params);

      // Verify that the axios put method was called with the right arguments
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v3/data_ingestion/sources/source1', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a DELETE request to delete a data source', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse = { success: true };
      
      (mockAxiosInstance.delete as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const sourceId = 'source2';
      const result = await yelpService.dataIngestion.deleteDataSource(sourceId);

      // Verify that the axios delete method was called with the right arguments
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v3/data_ingestion/sources/source2');

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Data Ingestion Jobs', () => {
    it('should make a GET request to list data ingestion jobs', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataIngestionJobListResponse = {
        jobs: [
          {
            job_id: 'job1',
            status: 'completed',
            job_type: 'full',
            source: {
              id: 'source1',
              type: 'csv'
            },
            created_at: '2023-06-01T09:30:15Z',
            updated_at: '2023-06-01T09:45:22Z',
            stats: {
              records_processed: 1000,
              records_failed: 5,
              records_ingested: 995
            }
          },
          {
            job_id: 'job2',
            status: 'in_progress',
            job_type: 'incremental',
            source: {
              id: 'source2',
              type: 'database'
            },
            created_at: '2023-08-15T14:20:11Z',
            updated_at: '2023-08-15T14:20:11Z'
          }
        ],
        pagination: {
          total: 2,
          offset: 0,
          limit: 20
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await yelpService.dataIngestion.listDataIngestionJobs();

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/data_ingestion/jobs', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should include filter parameters when listing data ingestion jobs', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataIngestionJobListResponse = {
        jobs: [
          {
            job_id: 'job1',
            status: 'completed',
            job_type: 'full',
            source: {
              id: 'source1',
              type: 'csv'
            },
            created_at: '2023-06-01T09:30:15Z',
            updated_at: '2023-06-01T09:45:22Z',
            stats: {
              records_processed: 1000,
              records_failed: 5,
              records_ingested: 995
            }
          }
        ],
        pagination: {
          total: 1,
          offset: 0,
          limit: 20
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        source_id: 'source1',
        status: 'completed' as const,
        job_type: 'full',
        limit: 20
      };
      
      const result = await yelpService.dataIngestion.listDataIngestionJobs(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/data_ingestion/jobs', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a GET request to get data ingestion job details', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataIngestionJob = {
        job_id: 'job1',
        status: 'completed',
        job_type: 'full',
        source: {
          id: 'source1',
          type: 'csv'
        },
        created_at: '2023-06-01T09:30:15Z',
        updated_at: '2023-06-01T09:45:22Z',
        stats: {
          records_processed: 1000,
          records_failed: 5,
          records_ingested: 995
        }
      };
      
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const jobId = 'job1';
      const result = await yelpService.dataIngestion.getDataIngestionJob(jobId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/data_ingestion/jobs/job1', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to create a data ingestion job', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataIngestionJob = {
        job_id: 'job3',
        status: 'pending',
        job_type: 'incremental',
        source: {
          id: 'source1',
          type: 'csv'
        },
        created_at: '2023-08-20T11:30:45Z',
        updated_at: '2023-08-20T11:30:45Z'
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        source_id: 'source1',
        job_type: 'incremental',
        schedule: {
          frequency: 'daily',
          time: '03:00'
        }
      };
      
      const result = await yelpService.dataIngestion.createDataIngestionJob(params);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/data_ingestion/jobs', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a PUT request to update a data ingestion job', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataIngestionJob = {
        job_id: 'job2',
        status: 'in_progress',
        job_type: 'full',
        source: {
          id: 'source2',
          type: 'database'
        },
        created_at: '2023-08-15T14:20:11Z',
        updated_at: '2023-08-20T16:45:33Z'
      };
      
      (mockAxiosInstance.put as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const jobId = 'job2';
      const params = {
        job_type: 'full',
        schedule: {
          frequency: 'weekly',
          day_of_week: 1,
          time: '02:00'
        }
      };
      
      const result = await yelpService.dataIngestion.updateDataIngestionJob(jobId, params);

      // Verify that the axios put method was called with the right arguments
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v3/data_ingestion/jobs/job2', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to cancel a data ingestion job', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse = { success: true };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const jobId = 'job2';
      const result = await yelpService.dataIngestion.cancelDataIngestionJob(jobId);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/data_ingestion/jobs/job2/cancel', {});

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to retry a failed data ingestion job', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: DataIngestionJob = {
        job_id: 'job4',
        status: 'in_progress',
        job_type: 'full',
        source: {
          id: 'source3',
          type: 'api'
        },
        created_at: '2023-08-18T09:15:22Z',
        updated_at: '2023-08-20T17:30:11Z'
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const jobId = 'job4';
      const result = await yelpService.dataIngestion.retryDataIngestionJob(jobId);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/data_ingestion/jobs/job4/retry', {});

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });
});