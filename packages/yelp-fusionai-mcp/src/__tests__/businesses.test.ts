import axios from 'axios';
import yelpService from '../services/yelp';
import { 
  BusinessSearchResponse, 
  BusinessDetails,
  BusinessReviewsResponse,
  BusinessSearchByPhoneResponse,
  BusinessAutocompleteResponse
} from '../services/api/businesses';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  })),
}));

describe('Businesses API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Business Search', () => {
    it('should make a GET request to search for businesses', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BusinessSearchResponse = {
        businesses: [
          {
            id: 'business-1',
            alias: 'business-1-alias',
            name: 'Test Business 1',
            image_url: 'https://example.com/image1.jpg',
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
            phone: '+14155551234',
            display_phone: '(415) 555-1234',
            price: '$$'
          },
          {
            id: 'business-2',
            alias: 'business-2-alias',
            name: 'Test Business 2',
            image_url: 'https://example.com/image2.jpg',
            is_closed: false,
            url: 'https://example.com/business2',
            review_count: 200,
            categories: [{ alias: 'cafe', title: 'Cafe' }],
            rating: 4.0,
            coordinates: { latitude: 37.7848, longitude: -122.4074 },
            location: {
              address1: '456 Test St',
              city: 'San Francisco',
              state: 'CA',
              country: 'US',
              display_address: ['456 Test St', 'San Francisco, CA']
            },
            phone: '+14155555678',
            display_phone: '(415) 555-5678',
            price: '$'
          }
        ],
        total: 2,
        region: {
          center: { latitude: 37.7749, longitude: -122.4194 }
        }
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        term: 'coffee',
        location: 'San Francisco',
        limit: 2
      };
      const result = await yelpService.businesses.search(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/businesses/search', {
        params
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Business Details', () => {
    it('should make a GET request to fetch business details', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BusinessDetails = {
        id: 'business-1',
        alias: 'business-1-alias',
        name: 'Test Business 1',
        image_url: 'https://example.com/image1.jpg',
        is_closed: false,
        url: 'https://example.com/business1',
        review_count: 100,
        categories: [
          { alias: 'restaurant', title: 'Restaurant' },
          { alias: 'italian', title: 'Italian' }
        ],
        rating: 4.5,
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        location: {
          address1: '123 Test St',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          display_address: ['123 Test St', 'San Francisco, CA']
        },
        phone: '+14155551234',
        display_phone: '(415) 555-1234',
        price: '$$',
        hours: [{
          open: [
            {
              is_overnight: false,
              start: '1000',
              end: '2200',
              day: 0
            },
            {
              is_overnight: false,
              start: '1000',
              end: '2200',
              day: 1
            }
          ],
          hours_type: 'REGULAR',
          is_open_now: true
        }],
        photos: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg'
        ],
        transactions: ['delivery', 'pickup']
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const businessId = 'business-1';
      const result = await yelpService.businesses.getBusinessDetails(businessId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/businesses/business-1', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should include locale parameter when provided', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BusinessDetails = {
        id: 'business-1',
        alias: 'business-1-alias',
        name: 'Test Business 1',
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
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const businessId = 'business-1';
      const locale = 'fr_FR';
      const result = await yelpService.businesses.getBusinessDetails(businessId, locale);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/businesses/business-1', { locale: 'fr_FR' });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Business Reviews', () => {
    it('should make a GET request to fetch business reviews', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BusinessReviewsResponse = {
        reviews: [
          {
            id: 'review-1',
            url: 'https://example.com/review1',
            text: 'This is a great place!',
            rating: 5,
            time_created: '2022-01-01T00:00:00-0700',
            user: {
              id: 'user-1',
              profile_url: 'https://example.com/user1',
              image_url: 'https://example.com/user1.jpg',
              name: 'John D.'
            }
          },
          {
            id: 'review-2',
            url: 'https://example.com/review2',
            text: 'The food was amazing.',
            rating: 4,
            time_created: '2022-01-15T00:00:00-0700',
            user: {
              id: 'user-2',
              profile_url: 'https://example.com/user2',
              name: 'Jane S.'
            }
          }
        ],
        total: 2,
        possible_languages: ['en']
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const businessId = 'business-1';
      const params = {
        limit: 2,
        sort_by: 'newest'
      };
      const result = await yelpService.businesses.getBusinessReviews(businessId, params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/businesses/business-1/reviews', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Search By Phone', () => {
    it('should make a GET request to search businesses by phone number', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BusinessSearchByPhoneResponse = {
        businesses: [
          {
            id: 'business-1',
            alias: 'business-1-alias',
            name: 'Test Business 1',
            image_url: 'https://example.com/image1.jpg',
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
            phone: '+14155551234',
            display_phone: '(415) 555-1234'
          }
        ],
        total: 1
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const phone = '+14155551234';
      const result = await yelpService.businesses.searchByPhone(phone);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/businesses/search/phone', {
        phone: '+14155551234'
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should include locale parameter when provided', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BusinessSearchByPhoneResponse = {
        businesses: [],
        total: 0
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const phone = '+14155551234';
      const locale = 'fr_FR';
      const result = await yelpService.businesses.searchByPhone(phone, locale);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/businesses/search/phone', {
        phone: '+14155551234',
        locale: 'fr_FR'
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Match Businesses', () => {
    it('should make a GET request to match businesses based on criteria', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BusinessDetails[] = [
        {
          id: 'business-1',
          alias: 'business-1-alias',
          name: 'Test Business 1',
          image_url: 'https://example.com/image1.jpg',
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
      ];
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        name: 'Test Business',
        address1: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        country: 'US'
      };
      const result = await yelpService.businesses.matchBusinesses(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/businesses/matches', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Autocomplete', () => {
    it('should make a GET request to get autocomplete suggestions', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BusinessAutocompleteResponse = {
        businesses: [
          {
            id: 'business-1',
            name: 'Test Coffee Shop'
          },
          {
            id: 'business-2',
            name: 'Coffee Time'
          }
        ],
        categories: [
          { alias: 'coffee', title: 'Coffee & Tea' }
        ],
        terms: [
          { text: 'coffee shop' },
          { text: 'coffee near me' }
        ]
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        text: 'coffee',
        latitude: 37.7749,
        longitude: -122.4194
      };
      const result = await yelpService.businesses.autocomplete(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/businesses/autocomplete', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Search By Transaction', () => {
    it('should make a GET request to search by transaction type', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: BusinessSearchResponse = {
        businesses: [
          {
            id: 'business-1',
            alias: 'business-1-alias',
            name: 'Test Business 1',
            image_url: 'https://example.com/image1.jpg',
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
            phone: '+14155551234',
            transactions: ['delivery']
          }
        ],
        total: 1
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const params = {
        transaction_type: 'delivery',
        location: 'San Francisco'
      };
      const result = await yelpService.businesses.searchByTransaction(params);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/transactions/delivery/search', params);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });
});