import axios from 'axios';
import yelpService from '../services/yelp';
import {
  PartnerRestaurantsResponse,
  WaitlistStatusResponse,
  WaitlistInfoResponse,
  JoinQueueResponse,
  OnMyWayResponse,
  CancelVisitResponse,
  VisitDetailsResponse
} from '../services/api/waitlist-partner';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));

describe('Waitlist Partner API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Get Partner Restaurants', () => {
    it('should get a list of partner restaurants', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: PartnerRestaurantsResponse = {
        restaurants: [
          {
            business_id: 'rest-123',
            name: 'Test Restaurant 1',
            waitlist_status: 'open',
            location: {
              display_address: ['123 Main St', 'San Francisco, CA 94105']
            },
            phone: '(415) 555-1234'
          },
          {
            business_id: 'rest-456',
            name: 'Test Restaurant 2',
            waitlist_status: 'closed',
            location: {
              display_address: ['456 Market St', 'San Francisco, CA 94105']
            },
            phone: '(415) 555-5678'
          }
        ],
        total: 2
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        location: 'San Francisco, CA',
        limit: 2
      };
      const result = await yelpService.waitlistPartner.getPartnerRestaurants(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/waitlist_partner/restaurants', {
        params
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Waitlist Status', () => {
    it('should get waitlist status for a business', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: WaitlistStatusResponse = {
        business_id: 'rest-123',
        status: 'open',
        wait_time_minutes: 30,
        people_in_line: 12,
        hours: {
          open: '11:00 AM',
          close: '10:00 PM'
        },
        timestamp: '2024-03-14T15:30:00Z'
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const businessId = 'rest-123';
      const result = await yelpService.waitlistPartner.getWaitlistStatus(businessId);

      // Verify request
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/waitlist_partner/businesses/rest-123/status');

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Waitlist Info', () => {
    it('should get waitlist info for a business', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: WaitlistInfoResponse = {
        business_id: 'rest-123',
        name: 'Test Restaurant',
        allows_on_my_way: true,
        allows_remote_join: true,
        min_party_size: 1,
        max_party_size: 10,
        hours: [
          {
            day: 1, // Monday
            start: '1100',
            end: '2200'
          },
          {
            day: 2, // Tuesday
            start: '1100',
            end: '2200'
          }
        ]
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const businessId = 'rest-123';
      const result = await yelpService.waitlistPartner.getWaitlistInfo(businessId);

      // Verify request
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/waitlist_partner/businesses/rest-123/info');

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Join Queue', () => {
    it('should join a waitlist queue', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: JoinQueueResponse = {
        visit_id: 'visit-123',
        business_id: 'rest-123',
        status: 'waiting',
        position: 5,
        party_size: 4,
        wait_time_minutes: 25,
        people_ahead: 4,
        created_at: '2024-03-14T15:30:00Z'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const request = {
        business_id: 'rest-123',
        party_size: 4,
        customer: {
          name: 'John Smith',
          phone: '4155551234',
          email: 'john@example.com'
        },
        notes: 'Prefer window seating'
      };
      const result = await yelpService.waitlistPartner.joinQueue(request);

      // Verify request
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/waitlist_partner/visit', request);

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Create On My Way', () => {
    it('should create an on-my-way notification', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: OnMyWayResponse = {
        status: 'success',
        message: 'On my way notification sent',
        visit_id: 'visit-123',
        business_id: 'rest-123'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const request = {
        business_id: 'rest-123',
        eta_minutes: 15,
        customer: {
          name: 'John Smith',
          phone: '4155551234'
        }
      };
      const result = await yelpService.waitlistPartner.createOnMyWay(request);

      // Verify request
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/waitlist_partner/visit/on_my_way', request);

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Cancel Visit', () => {
    it('should cancel a visit', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: CancelVisitResponse = {
        visit_id: 'visit-123',
        success: true,
        status: 'cancelled',
        message: 'Visit successfully cancelled'
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const visitId = 'visit-123';
      const result = await yelpService.waitlistPartner.cancelVisit(visitId);

      // Verify request
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/waitlist_partner/visit/visit-123/cancel', {});

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Visit Details', () => {
    it('should get details of a visit', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: VisitDetailsResponse = {
        visit_id: 'visit-123',
        business_id: 'rest-123',
        status: 'waiting',
        party_size: 4,
        position: 3,
        wait_time_minutes: 20,
        people_ahead: 2,
        created_at: '2024-03-14T15:30:00Z',
        updated_at: '2024-03-14T15:35:00Z',
        estimated_seating_time: '2024-03-14T16:00:00Z',
        customer: {
          name: 'John Smith',
          phone: '4155551234',
          email: 'john@example.com'
        },
        notes: 'Prefer window seating',
        business: {
          name: 'Test Restaurant',
          phone: '4155555678',
          address: ['123 Main St', 'San Francisco, CA 94105']
        }
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const visitId = 'visit-123';
      const result = await yelpService.waitlistPartner.getVisitDetails(visitId);

      // Verify request
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/waitlist_partner/visit/visit-123');

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });
});