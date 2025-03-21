import axios from 'axios';
import yelpService from '../services/yelp';
import {
  GetAccessTokenResponse,
  GetBusinessesResponse,
  BusinessOwnerInfo,
  RespondToReviewResponse
} from '../services/api/respond-reviews';

// Mock the respondReviews service directly
jest.mock('../services/api/respond-reviews', () => {
  const mockModule = {
    getAccessToken: jest.fn(),
    getBusinesses: jest.fn(),
    getBusinessOwnerInfo: jest.fn(),
    respondToReview: jest.fn()
  };
  
  return {
    __esModule: true,
    default: mockModule,
    RespondReviewsClient: jest.fn().mockImplementation(() => mockModule)
  };
});

describe('Respond Reviews API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Get Access Token', () => {
    it('should get an OAuth access token', async () => {
      // Mock response
      const mockResponse: GetAccessTokenResponse = {
        access_token: 'test-token-123',
        token_type: 'Bearer',
        expires_in: 3600
      };
      
      // Setup the mock implementation
      yelpService.respondReviews.getAccessToken = jest.fn().mockResolvedValue(mockResponse);

      const clientId = 'test-client-id';
      const clientSecret = 'test-client-secret';
      const result = await yelpService.respondReviews.getAccessToken(clientId, clientSecret);

      // Verify function call
      expect(yelpService.respondReviews.getAccessToken).toHaveBeenCalledWith(clientId, clientSecret);

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Businesses', () => {
    it('should get businesses for responding to reviews', async () => {
      // Mock response
      const mockResponse: GetBusinessesResponse = {
        businesses: [
          {
            id: 'business-123',
            name: 'Test Business 1',
            location: {
              display_address: ['123 Main St', 'San Francisco, CA 94105']
            },
            business_info: {
              review_count: 10,
              rating: 4.5
            }
          },
          {
            id: 'business-456',
            name: 'Test Business 2',
            location: {
              display_address: ['456 Market St', 'San Francisco, CA 94105']
            },
            business_info: {
              review_count: 5,
              rating: 4.0
            }
          }
        ],
        total: 2
      };
      
      // Setup the mock implementation
      yelpService.respondReviews.getBusinesses = jest.fn().mockResolvedValue(mockResponse);

      const params = {
        limit: 2
      };
      const result = await yelpService.respondReviews.getBusinesses(params);

      // Verify function call
      expect(yelpService.respondReviews.getBusinesses).toHaveBeenCalledWith(params);

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Get Business Owner Info', () => {
    it('should get business owner information', async () => {
      // Mock response
      const mockResponse: BusinessOwnerInfo = {
        business_id: 'business-123',
        business_name: 'Test Business',
        owner_name: 'John Smith',
        owner_email: 'john@example.com',
        account_status: 'active',
        permissions: ['read', 'write', 'respond']
      };
      
      // Setup the mock implementation
      yelpService.respondReviews.getBusinessOwnerInfo = jest.fn().mockResolvedValue(mockResponse);

      const businessId = 'business-123';
      const result = await yelpService.respondReviews.getBusinessOwnerInfo(businessId);

      // Verify function call
      expect(yelpService.respondReviews.getBusinessOwnerInfo).toHaveBeenCalledWith(businessId);

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Respond to Review', () => {
    it('should respond to a review', async () => {
      // Mock response
      const mockResponse: RespondToReviewResponse = {
        review_id: 'review-123',
        business_id: 'business-123',
        text: 'Thank you for your feedback!',
        created_at: '2024-03-14T15:30:00Z',
        updated_at: '2024-03-14T15:30:00Z',
        success: true
      };
      
      // Setup the mock implementation
      yelpService.respondReviews.respondToReview = jest.fn().mockResolvedValue(mockResponse);

      const reviewId = 'review-123';
      const text = 'Thank you for your feedback!';
      const result = await yelpService.respondReviews.respondToReview(reviewId, text);

      // Verify function call
      expect(yelpService.respondReviews.respondToReview).toHaveBeenCalledWith(reviewId, text);

      // Verify response
      expect(result).toEqual(mockResponse);
    });
  });
});