import axios from 'axios';
import yelpService from '../services/yelp';
import {
  SubscriptionPlansResponse,
  ActiveSubscription,
  SubscriptionUsage,
  SubscriptionHistory
} from '../services/api/business-subscriptions';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('Business Subscriptions API', () => {
  beforeEach(() => {
    // Clear all mock implementation
    jest.clearAllMocks();
  });

  describe('Subscription Plans', () => {
    it('should make a GET request to fetch available subscription plans', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: SubscriptionPlansResponse = {
        plans: [
          {
            plan_id: 'basic-plan',
            name: 'Basic Plan',
            description: 'Basic features for small businesses',
            price_cents: 999,
            billing_frequency: 'monthly',
            features: ['feature1', 'feature2'],
            status: 'active'
          },
          {
            plan_id: 'premium-plan',
            name: 'Premium Plan',
            description: 'Advanced features for growing businesses',
            price_cents: 2999,
            billing_frequency: 'monthly',
            features: ['feature1', 'feature2', 'feature3', 'feature4'],
            status: 'active'
          }
        ],
        total: 2
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await yelpService.businessSubscriptions.getSubscriptionPlans();

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/business_subscriptions/plans', undefined);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should include business_id param when provided', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: SubscriptionPlansResponse = {
        plans: [
          {
            plan_id: 'basic-plan',
            name: 'Basic Plan',
            description: 'Basic features for small businesses',
            price_cents: 999,
            billing_frequency: 'monthly',
            features: ['feature1', 'feature2'],
            status: 'active'
          }
        ],
        total: 1
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const businessId = 'business-123';
      const result = await yelpService.businessSubscriptions.getSubscriptionPlans(businessId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/business_subscriptions/plans', {
        business_id: businessId
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Active Subscription', () => {
    it('should make a GET request to fetch active subscription for a business', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ActiveSubscription = {
        subscription_id: 'sub-12345',
        business_id: 'business-123',
        plan_id: 'premium-plan',
        plan_name: 'Premium Plan',
        status: 'active',
        start_date: '2024-01-01T00:00:00Z',
        renewal_date: '2024-02-01T00:00:00Z',
        auto_renew: true,
        price_cents: 2999,
        billing_frequency: 'monthly',
        features: ['feature1', 'feature2', 'feature3', 'feature4']
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const businessId = 'business-123';
      const result = await yelpService.businessSubscriptions.getActiveSubscription(businessId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/business_subscriptions/businesses/business-123/subscription');

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Create Subscription', () => {
    it('should make a POST request to create a new subscription', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ActiveSubscription = {
        subscription_id: 'sub-12345',
        business_id: 'business-123',
        plan_id: 'premium-plan',
        plan_name: 'Premium Plan',
        status: 'active',
        start_date: '2024-01-01T00:00:00Z',
        renewal_date: '2024-02-01T00:00:00Z',
        auto_renew: true,
        price_cents: 2999,
        billing_frequency: 'monthly',
        features: ['feature1', 'feature2', 'feature3', 'feature4']
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const request = {
        business_id: 'business-123',
        plan_id: 'premium-plan',
        auto_renew: true,
        payment_method_id: 'pm-123'
      };
      const result = await yelpService.businessSubscriptions.createSubscription(request);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/business_subscriptions/subscriptions', request);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Update Subscription', () => {
    it('should make a PUT request to update an existing subscription', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ActiveSubscription = {
        subscription_id: 'sub-12345',
        business_id: 'business-123',
        plan_id: 'enterprise-plan',
        plan_name: 'Enterprise Plan',
        status: 'active',
        start_date: '2024-01-01T00:00:00Z',
        renewal_date: '2024-02-01T00:00:00Z',
        auto_renew: true,
        price_cents: 9999,
        billing_frequency: 'monthly',
        features: ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6']
      };
      (mockAxiosInstance.put as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const subscriptionId = 'sub-12345';
      const request = {
        plan_id: 'enterprise-plan',
        auto_renew: true
      };
      const result = await yelpService.businessSubscriptions.updateSubscription(subscriptionId, request);

      // Verify that the axios put method was called with the right arguments
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v3/business_subscriptions/subscriptions/sub-12345', request);

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Cancel Subscription', () => {
    it('should make a POST request to cancel a subscription', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ActiveSubscription = {
        subscription_id: 'sub-12345',
        business_id: 'business-123',
        plan_id: 'premium-plan',
        plan_name: 'Premium Plan',
        status: 'canceled',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-02-01T00:00:00Z',
        auto_renew: false,
        price_cents: 2999,
        billing_frequency: 'monthly',
        features: ['feature1', 'feature2', 'feature3', 'feature4']
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const subscriptionId = 'sub-12345';
      const result = await yelpService.businessSubscriptions.cancelSubscription(subscriptionId);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/business_subscriptions/subscriptions/sub-12345/cancel', {
        cancel_immediately: false
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });

    it('should pass the cancel_immediately flag when true', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: ActiveSubscription = {
        subscription_id: 'sub-12345',
        business_id: 'business-123',
        plan_id: 'premium-plan',
        plan_name: 'Premium Plan',
        status: 'canceled',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-15T00:00:00Z',
        auto_renew: false,
        price_cents: 2999,
        billing_frequency: 'monthly',
        features: ['feature1', 'feature2', 'feature3', 'feature4']
      };
      (mockAxiosInstance.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const subscriptionId = 'sub-12345';
      const result = await yelpService.businessSubscriptions.cancelSubscription(subscriptionId, true);

      // Verify that the axios post method was called with the right arguments
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/business_subscriptions/subscriptions/sub-12345/cancel', {
        cancel_immediately: true
      });

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Subscription Usage', () => {
    it('should make a GET request to fetch subscription usage data', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: SubscriptionUsage = {
        subscription_id: 'sub-12345',
        business_id: 'business-123',
        plan_id: 'premium-plan',
        period_start: '2024-01-01T00:00:00Z',
        period_end: '2024-02-01T00:00:00Z',
        feature_usage: [
          {
            feature: 'api_calls',
            used: 750,
            total: 1000,
            unit: 'requests'
          },
          {
            feature: 'storage',
            used: 2,
            total: 5,
            unit: 'GB'
          }
        ]
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const subscriptionId = 'sub-12345';
      const result = await yelpService.businessSubscriptions.getSubscriptionUsage(subscriptionId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/business_subscriptions/subscriptions/sub-12345/usage');

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Subscription History', () => {
    it('should make a GET request to fetch subscription history', async () => {
      // Mock implementation for this test
      const mockAxiosInstance = axios.create();
      const mockResponse: SubscriptionHistory = {
        subscription_id: 'sub-12345',
        business_id: 'business-123',
        history: [
          {
            date: '2024-01-01T00:00:00Z',
            event_type: 'created',
            plan_id: 'basic-plan',
            plan_name: 'Basic Plan'
          },
          {
            date: '2024-01-15T00:00:00Z',
            event_type: 'changed',
            details: {
              old_plan_id: 'basic-plan',
              new_plan_id: 'premium-plan'
            },
            plan_id: 'premium-plan',
            plan_name: 'Premium Plan'
          },
          {
            date: '2024-02-01T00:00:00Z',
            event_type: 'renewed',
            plan_id: 'premium-plan',
            plan_name: 'Premium Plan'
          }
        ]
      };
      (mockAxiosInstance.get as jest.Mock).mockResolvedValueOnce({
        data: mockResponse
      });

      const subscriptionId = 'sub-12345';
      const result = await yelpService.businessSubscriptions.getSubscriptionHistory(subscriptionId);

      // Verify that the axios get method was called with the right arguments
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/business_subscriptions/subscriptions/sub-12345/history');

      // Verify the structure of the response
      expect(result).toEqual(mockResponse);
    });
  });
});