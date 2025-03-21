import axios from 'axios';
import yelpService from '../services/yelp';
import { EventSearchResponse, Event, FeaturedEventResponse } from '../services/api/events';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

describe('Events API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Search Events', () => {
    it('should make a GET request to search for events', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: EventSearchResponse = {
        events: [
          {
            id: 'test-event-1',
            name: 'Test Event 1',
            description: 'This is a test event',
            time_start: '2024-01-01T18:00:00-07:00',
            time_end: '2024-01-01T21:00:00-07:00',
            is_free: true,
            category: 'food-and-drink',
            location: {
              display_address: ['123 Main St', 'San Francisco, CA 94105']
            }
          },
          {
            id: 'test-event-2',
            name: 'Test Event 2',
            description: 'Another test event',
            time_start: '2024-01-02T19:00:00-07:00',
            is_free: false,
            cost: 25.0
          }
        ],
        total: 2
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        location: 'San Francisco',
        limit: 2,
        is_free: true
      };
      const result = await yelpService.events.search(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/events', {
        params
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Event Details', () => {
    it('should make a GET request to fetch event details', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: Event = {
        id: 'test-event-id',
        name: 'Detailed Test Event',
        description: 'This is a detailed test event description',
        time_start: '2024-01-01T18:00:00-07:00',
        time_end: '2024-01-01T21:00:00-07:00',
        is_free: false,
        cost: 15.0,
        category: 'music',
        location: {
          display_address: ['456 Event St', 'San Francisco, CA 94107']
        },
        attending_count: 120,
        interested_count: 250,
        url: 'https://yelp.com/events/test-event-id'
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const eventId = 'test-event-id';
      const result = await yelpService.events.getEvent(eventId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/events/test-event-id');

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Featured Event', () => {
    it('should make a GET request to fetch featured event', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: FeaturedEventResponse = {
        featured_event: {
          id: 'featured-event-id',
          name: 'Featured Event',
          description: 'This is the featured event description',
          time_start: '2024-01-01T18:00:00-07:00',
          time_end: '2024-01-01T21:00:00-07:00',
          is_free: true,
          category: 'festivals',
          location: {
            display_address: ['789 Festival Ave', 'San Francisco, CA 94110']
          },
          attending_count: 500,
          interested_count: 1200,
          url: 'https://yelp.com/events/featured-event-id'
        }
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        location: 'San Francisco'
      };
      const result = await yelpService.events.getFeaturedEvent(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/events/featured', {
        params
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });
});