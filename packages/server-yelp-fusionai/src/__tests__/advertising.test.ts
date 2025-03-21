import axios from 'axios';
import yelpService from '../services/yelp';
import { ProgramResponse, ProgramStatusResponse, ProgramListResponse } from '../services/api/advertising';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  })),
}));

describe('Advertising API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Create Program', () => {
    it('should make a POST request to create an advertising program', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ProgramResponse = {
        program_id: 'ad-12345',
        business_id: 'biz-67890',
        status: 'active',
        budget: 50000,
        start_date: '2024-06-01T00:00:00Z',
        objectives: ['increase_traffic', 'brand_awareness'],
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-01T00:00:00Z'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const programData = {
        business_id: 'biz-67890',
        budget: 50000,
        objectives: ['increase_traffic', 'brand_awareness'],
        ad_type: 'search_ads',
        geo_targeting: {
          location: 'San Francisco, CA',
          radius: 10000
        }
      };
      const result = await yelpService.advertising.createProgram(programData);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/advertising/programs', programData);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('List Programs', () => {
    it('should make a GET request to list advertising programs', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ProgramListResponse = {
        programs: [
          {
            program_id: 'ad-12345',
            business_id: 'biz-67890',
            status: 'active',
            budget: 50000,
            start_date: '2024-06-01T00:00:00Z',
            objectives: ['increase_traffic', 'brand_awareness'],
            created_at: '2024-06-01T00:00:00Z',
            updated_at: '2024-06-01T00:00:00Z'
          },
          {
            program_id: 'ad-12346',
            business_id: 'biz-67890',
            status: 'paused',
            budget: 75000,
            start_date: '2024-05-01T00:00:00Z',
            objectives: ['increase_traffic', 'promote_offers'],
            created_at: '2024-05-01T00:00:00Z',
            updated_at: '2024-05-15T00:00:00Z'
          }
        ],
        total: 2
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const businessId = 'biz-67890';
      const result = await yelpService.advertising.listPrograms(businessId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/advertising/programs', {
        params: { business_id: businessId }
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Program', () => {
    it('should make a GET request to fetch program details', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ProgramResponse = {
        program_id: 'ad-12345',
        business_id: 'biz-67890',
        status: 'active',
        budget: 50000,
        start_date: '2024-06-01T00:00:00Z',
        objectives: ['increase_traffic', 'brand_awareness'],
        metrics: {
          impressions: 12500,
          clicks: 450,
          ctr: 0.036,
          spend: 12500
        },
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-10T00:00:00Z'
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const programId = 'ad-12345';
      const result = await yelpService.advertising.getProgram(programId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/advertising/programs/ad-12345');

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Modify Program', () => {
    it('should make a PUT request to modify a program', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ProgramResponse = {
        program_id: 'ad-12345',
        business_id: 'biz-67890',
        status: 'active',
        budget: 75000,
        start_date: '2024-06-01T00:00:00Z',
        objectives: ['increase_traffic', 'brand_awareness', 'promote_offers'],
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-15T00:00:00Z'
      };
      (mockAxiosInstance.put as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const programId = 'ad-12345';
      const updateData = {
        budget: 75000,
        objectives: ['increase_traffic', 'brand_awareness', 'promote_offers']
      };
      const result = await yelpService.advertising.modifyProgram(programId, updateData);

      // Verify that the axios put method was called with the right arguments
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v3/advertising/programs/ad-12345', updateData);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Program Status', () => {
    it('should make a GET request to fetch program status', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ProgramStatusResponse = {
        program_id: 'ad-12345',
        status: 'active',
        details: {
          last_updated: '2024-06-15T00:00:00Z',
          days_active: 15,
          days_remaining: 15
        },
        budget_status: {
          total_budget: 50000,
          spent: 25000,
          remaining: 25000,
          daily_spend: 1667
        }
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const programId = 'ad-12345';
      const result = await yelpService.advertising.getProgramStatus(programId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/advertising/programs/ad-12345/status');

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Program Actions', () => {
    it('should make a POST request to pause a program', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ProgramResponse = {
        program_id: 'ad-12345',
        business_id: 'biz-67890',
        status: 'paused',
        budget: 50000,
        start_date: '2024-06-01T00:00:00Z',
        objectives: ['increase_traffic', 'brand_awareness'],
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-15T00:00:00Z'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const programId = 'ad-12345';
      const result = await yelpService.advertising.pauseProgram(programId);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/advertising/programs/ad-12345/pause', {});

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to resume a program', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ProgramResponse = {
        program_id: 'ad-12345',
        business_id: 'biz-67890',
        status: 'active',
        budget: 50000,
        start_date: '2024-06-01T00:00:00Z',
        objectives: ['increase_traffic', 'brand_awareness'],
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-16T00:00:00Z'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const programId = 'ad-12345';
      const result = await yelpService.advertising.resumeProgram(programId);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/advertising/programs/ad-12345/resume', {});

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to terminate a program', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ProgramResponse = {
        program_id: 'ad-12345',
        business_id: 'biz-67890',
        status: 'terminated',
        budget: 50000,
        start_date: '2024-06-01T00:00:00Z',
        end_date: '2024-06-17T00:00:00Z',
        objectives: ['increase_traffic', 'brand_awareness'],
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-17T00:00:00Z'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const programId = 'ad-12345';
      const result = await yelpService.advertising.terminateProgram(programId);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/advertising/programs/ad-12345/terminate', {});

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });
});