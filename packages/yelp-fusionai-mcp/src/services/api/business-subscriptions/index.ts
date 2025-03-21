import { BaseApiClient } from '../base';

/**
 * Subscription plan interface
 */
export interface SubscriptionPlan {
  /**
   * Plan ID
   */
  plan_id: string;
  
  /**
   * Plan name
   */
  name: string;
  
  /**
   * Plan description
   */
  description?: string;
  
  /**
   * Price in cents
   */
  price_cents: number;
  
  /**
   * Billing frequency
   */
  billing_frequency: 'monthly' | 'annually';
  
  /**
   * Features included in the plan
   */
  features?: string[];
  
  /**
   * Availability status
   */
  status: 'active' | 'inactive' | 'deprecated';
}

/**
 * Subscription plans response
 */
export interface SubscriptionPlansResponse {
  /**
   * Available subscription plans
   */
  plans: SubscriptionPlan[];
  
  /**
   * Total number of plans
   */
  total: number;
}

/**
 * Active subscription interface
 */
export interface ActiveSubscription {
  /**
   * Subscription ID
   */
  subscription_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Plan ID
   */
  plan_id: string;
  
  /**
   * Plan name
   */
  plan_name: string;
  
  /**
   * Status of the subscription
   */
  status: 'active' | 'pending' | 'canceled' | 'expired';
  
  /**
   * Start date (ISO 8601 format)
   */
  start_date: string;
  
  /**
   * End date (ISO 8601 format)
   */
  end_date?: string;
  
  /**
   * Renewal date (ISO 8601 format)
   */
  renewal_date?: string;
  
  /**
   * Auto-renewal flag
   */
  auto_renew: boolean;
  
  /**
   * Price paid in cents
   */
  price_cents: number;
  
  /**
   * Billing frequency
   */
  billing_frequency: 'monthly' | 'annually';
  
  /**
   * Features included in the subscription
   */
  features?: string[];
}

/**
 * Subscription request interface
 */
export interface SubscriptionRequest {
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Plan ID
   */
  plan_id: string;
  
  /**
   * Auto-renewal flag
   */
  auto_renew?: boolean;
  
  /**
   * Payment method ID (if required)
   */
  payment_method_id?: string;
  
  /**
   * Promo code (if applicable)
   */
  promo_code?: string;
}

/**
 * Subscription update request
 */
export interface SubscriptionUpdateRequest {
  /**
   * Auto-renewal flag
   */
  auto_renew?: boolean;
  
  /**
   * Payment method ID
   */
  payment_method_id?: string;
  
  /**
   * Change plan ID (for plan upgrades/downgrades)
   */
  plan_id?: string;
}

/**
 * Subscription usage interface
 */
export interface SubscriptionUsage {
  /**
   * Subscription ID
   */
  subscription_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * Plan ID
   */
  plan_id: string;
  
  /**
   * Current billing period start
   */
  period_start: string;
  
  /**
   * Current billing period end
   */
  period_end: string;
  
  /**
   * Feature usage data
   */
  feature_usage: {
    /**
     * Feature name
     */
    feature: string;
    
    /**
     * Used quantity
     */
    used: number;
    
    /**
     * Total allocated quantity
     */
    total: number;
    
    /**
     * Unit of measurement
     */
    unit?: string;
  }[];
}

/**
 * Subscription history interface
 */
export interface SubscriptionHistory {
  /**
   * Subscription ID
   */
  subscription_id: string;
  
  /**
   * Business ID
   */
  business_id: string;
  
  /**
   * History entries
   */
  history: {
    /**
     * Event date (ISO 8601 format)
     */
    date: string;
    
    /**
     * Event type
     */
    event_type: 'created' | 'renewed' | 'canceled' | 'changed' | 'payment_failed' | 'expired';
    
    /**
     * Event details
     */
    details?: Record<string, any>;
    
    /**
     * Plan ID at the time of the event
     */
    plan_id?: string;
    
    /**
     * Plan name at the time of the event
     */
    plan_name?: string;
  }[];
}

/**
 * Business Subscriptions API client
 */
export class BusinessSubscriptionsClient extends BaseApiClient {
  /**
   * Get available subscription plans
   * 
   * @param businessId Optional business ID to filter plans available to a specific business
   * @returns Promise with subscription plans
   */
  async getSubscriptionPlans(businessId?: string): Promise<SubscriptionPlansResponse> {
    const params = businessId ? { business_id: businessId } : undefined;
    return this.get<SubscriptionPlansResponse>('/v3/business_subscriptions/plans', params);
  }
  
  /**
   * Get active subscriptions for a business
   * 
   * @param businessId Business ID
   * @returns Promise with active subscription
   */
  async getActiveSubscription(businessId: string): Promise<ActiveSubscription> {
    return this.get<ActiveSubscription>(`/v3/business_subscriptions/businesses/${businessId}/subscription`);
  }
  
  /**
   * Create a new subscription
   * 
   * @param request Subscription request
   * @returns Promise with created subscription
   */
  async createSubscription(request: SubscriptionRequest): Promise<ActiveSubscription> {
    return this.post<ActiveSubscription>('/v3/business_subscriptions/subscriptions', request);
  }
  
  /**
   * Update an existing subscription
   * 
   * @param subscriptionId Subscription ID
   * @param request Update request
   * @returns Promise with updated subscription
   */
  async updateSubscription(subscriptionId: string, request: SubscriptionUpdateRequest): Promise<ActiveSubscription> {
    return this.put<ActiveSubscription>(`/v3/business_subscriptions/subscriptions/${subscriptionId}`, request);
  }
  
  /**
   * Cancel a subscription
   * 
   * @param subscriptionId Subscription ID
   * @param cancelImmediately Whether to cancel immediately or at the end of the current period
   * @returns Promise with the updated subscription
   */
  async cancelSubscription(subscriptionId: string, cancelImmediately = false): Promise<ActiveSubscription> {
    return this.post<ActiveSubscription>(`/v3/business_subscriptions/subscriptions/${subscriptionId}/cancel`, {
      cancel_immediately: cancelImmediately
    });
  }
  
  /**
   * Get subscription usage data
   * 
   * @param subscriptionId Subscription ID
   * @returns Promise with subscription usage data
   */
  async getSubscriptionUsage(subscriptionId: string): Promise<SubscriptionUsage> {
    return this.get<SubscriptionUsage>(`/v3/business_subscriptions/subscriptions/${subscriptionId}/usage`);
  }
  
  /**
   * Get subscription history
   * 
   * @param subscriptionId Subscription ID
   * @returns Promise with subscription history
   */
  async getSubscriptionHistory(subscriptionId: string): Promise<SubscriptionHistory> {
    return this.get<SubscriptionHistory>(`/v3/business_subscriptions/subscriptions/${subscriptionId}/history`);
  }
}

export default new BusinessSubscriptionsClient();