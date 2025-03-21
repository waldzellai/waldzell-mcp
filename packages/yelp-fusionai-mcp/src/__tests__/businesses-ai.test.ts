import axios from 'axios';
import yelpService from '../services/yelp';
import { YelpAIResponse, YelpAIEntity, ChatParams } from '../services/api/businesses/ai';
import { BusinessDetails } from '../services/api/businesses';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
  })),
}));

describe('Business AI API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Chat API', () => {
    it('should make a POST request to the Yelp AI API with a string query', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: YelpAIResponse = {
        response: {
          text: 'Here are some restaurants in Chicago',
        },
        types: ['business_search'],
        entities: [
          {
            id: 'entity-1',
            name: 'Chicago',
            type: 'location',
            text: 'Chicago',
            spans: [{ start: 24, end: 31 }]
          }
        ],
        chat_id: 'test-chat-id',
        businesses: [
          {
            id: 'business-1',
            alias: 'business-1-alias',
            name: 'Test Restaurant',
            is_closed: false,
            url: 'https://example.com/business1',
            review_count: 100,
            categories: [{ alias: 'restaurant', title: 'Restaurant' }],
            rating: 4.5,
            coordinates: { latitude: 37.7749, longitude: -122.4194 },
            location: {
              address1: '123 Test St',
              city: 'Chicago',
              state: 'IL',
              country: 'US',
              display_address: ['123 Test St', 'Chicago, IL']
            },
            phone: '+13125551234'
          }
        ],
        sources: ['https://example.com/source1'],
        search_context: 'restaurants in Chicago'
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const query = 'Find restaurants in Chicago';
      const result = await yelpService.businessesAi.chat(query);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/ai/chat/v2', {
        query
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request to the Yelp AI API with parameter object', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: YelpAIResponse = {
        response: {
          text: 'Here are some restaurants near you in San Francisco',
        },
        types: ['business_search'],
        entities: [
          {
            id: 'entity-1',
            name: 'San Francisco',
            type: 'location',
            text: 'San Francisco',
            spans: [{ start: 25, end: 38 }]
          }
        ],
        chat_id: 'test-chat-id',
        businesses: [
          {
            id: 'business-1',
            alias: 'business-1-alias',
            name: 'Test Restaurant',
            is_closed: false,
            url: 'https://example.com/business1',
            review_count: 100,
            categories: [{ alias: 'restaurant', title: 'Restaurant' }],
            rating: 4.5,
            coordinates: { latitude: 37.7749, longitude: -122.4194 },
            location: {
              address1: '123 Test St',
              city: 'San Francisco',
              state: 'CA',
              country: 'US',
              display_address: ['123 Test St', 'San Francisco, CA']
            },
            phone: '+14155551234'
          }
        ]
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params: ChatParams = {
        query: 'Find restaurants near me',
        latitude: 37.7749,
        longitude: -122.4194,
        location: 'San Francisco',
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'How can I help you?' }
        ],
        locale: 'en_US'
      };
      
      const result = await yelpService.businessesAi.chat(params);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/ai/chat/v2', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Continue Chat', () => {
    it('should make a POST request to continue a conversation', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: YelpAIResponse = {
        response: {
          text: 'Yes, there are several Italian restaurants in Chicago',
        },
        types: ['business_search'],
        entities: [
          {
            id: 'entity-1',
            name: 'Italian',
            type: 'cuisine',
            text: 'Italian',
            spans: [{ start: 24, end: 31 }]
          },
          {
            id: 'entity-2',
            name: 'Chicago',
            type: 'location',
            text: 'Chicago',
            spans: [{ start: 45, end: 52 }]
          }
        ],
        chat_id: 'test-chat-id',
        businesses: [
          {
            id: 'business-1',
            alias: 'business-1-alias',
            name: 'Italian Test Restaurant',
            is_closed: false,
            url: 'https://example.com/business1',
            review_count: 100,
            categories: [
              { alias: 'restaurant', title: 'Restaurant' },
              { alias: 'italian', title: 'Italian' }
            ],
            rating: 4.5,
            coordinates: { latitude: 41.8781, longitude: -87.6298 },
            location: {
              address1: '123 Test St',
              city: 'Chicago',
              state: 'IL',
              country: 'US',
              display_address: ['123 Test St', 'Chicago, IL']
            },
            phone: '+13125551234'
          }
        ]
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const chatId = 'test-chat-id';
      const query = 'Are there any Italian restaurants?';
      const location = 'Chicago';
      
      const result = await yelpService.businessesAi.continueChat(chatId, query, location);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/ai/chat/v2', {
        query,
        chat_id: chatId,
        location
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should make a POST request without location if not provided', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: YelpAIResponse = {
        response: {
          text: 'Could you tell me which city you are interested in?',
        },
        types: [],
        entities: [],
        chat_id: 'test-chat-id'
      };
      
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const chatId = 'test-chat-id';
      const query = 'Are there any Italian restaurants?';
      
      const result = await yelpService.businessesAi.continueChat(chatId, query);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/ai/chat/v2', {
        query,
        chat_id: chatId
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });
});