/**
 * Yelp Fusion API Client
 */

import type {
  Business,
  BusinessSearchParams,
  BusinessSearchResult,
  PhoneSearchParams,
  BusinessMatchParams,
  BusinessMatchResult,
  ReviewsParams,
  ReviewsResult,
  ReviewHighlightsResult,
  EventSearchParams,
  EventSearchResult,
  Event,
  AutocompleteParams,
  AutocompleteResult,
  CategoriesResult,
  CategoryDetails,
  AIChatParams,
  AIChatResponse,
  AIChatStreamChunk,
  YelpApiError,
  TransactionSearchParams,
  TransactionSearchResult,
  ServiceOfferingsResult,
  EngagementMetricsParams,
  EngagementMetricsResult,
  BusinessInsightsParams,
  BusinessInsightsResult,
  FoodDrinksInsightsResult,
  RiskSignalsInsightsResult,
  WaitlistStatusResult,
  WaitlistInfoResult,
  VisitResult,
  PartnerRestaurantsParams,
  PartnerRestaurantsResult,
  ReservationOpeningsParams,
  ReservationOpeningsResult,
  ReservationStatusResult,
} from './types.js';
import { YelpError } from './types.js';

const YELP_API_BASE = 'https://api.yelp.com/v3';
const YELP_AI_API_BASE = 'https://api.yelp.com/v2';

/**
 * Convert a typed params object to Record<string, unknown> for URL encoding
 */
function toRecord<T extends object>(params: T): Record<string, unknown> {
  return params as unknown as Record<string, unknown>;
}

export interface YelpClientOptions {
  apiKey: string;
  timeout?: number;
}

export class YelpClient {
  private apiKey: string;
  private timeout: number;

  constructor(options: YelpClientOptions) {
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? 30000;
  }

  private async request<T>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: { base?: string; method?: string; body?: unknown }
  ): Promise<T> {
    const base = options?.base ?? YELP_API_BASE;
    const method = options?.method ?? 'GET';

    let url = `${base}${endpoint}`;

    if (method === 'GET' && params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: method !== 'GET' && options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json() as YelpApiError;
        throw new YelpError(errorData.error);
      }

      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof YelpError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  // ==========================================================================
  // Business Search Endpoints
  // ==========================================================================

  /**
   * Search for businesses based on location and search term
   */
  async searchBusinesses(params: BusinessSearchParams): Promise<BusinessSearchResult> {
    return this.request<BusinessSearchResult>('/businesses/search', toRecord(params));
  }

  /**
   * Search for a business by phone number
   */
  async searchByPhone(params: PhoneSearchParams): Promise<BusinessSearchResult> {
    return this.request<BusinessSearchResult>('/businesses/search/phone', toRecord(params));
  }

  /**
   * Match a business to Yelp's database based on provided details
   */
  async matchBusiness(params: BusinessMatchParams): Promise<BusinessMatchResult> {
    return this.request<BusinessMatchResult>('/businesses/matches', toRecord(params));
  }

  /**
   * Get detailed information about a specific business
   */
  async getBusinessDetails(businessId: string, locale?: string): Promise<Business> {
    const params = locale ? { locale } : undefined;
    return this.request<Business>(`/businesses/${encodeURIComponent(businessId)}`, params);
  }

  // ==========================================================================
  // Reviews Endpoints
  // ==========================================================================

  /**
   * Get reviews for a specific business
   */
  async getReviews(params: ReviewsParams): Promise<ReviewsResult> {
    const { business_id, ...queryParams } = params;
    return this.request<ReviewsResult>(
      `/businesses/${encodeURIComponent(business_id)}/reviews`,
      toRecord(queryParams)
    );
  }

  /**
   * Get review highlights for a specific business
   */
  async getReviewHighlights(businessId: string): Promise<ReviewHighlightsResult> {
    return this.request<ReviewHighlightsResult>(
      `/businesses/${encodeURIComponent(businessId)}/review_highlights`
    );
  }

  // ==========================================================================
  // Events Endpoints
  // ==========================================================================

  /**
   * Search for events
   */
  async searchEvents(params?: EventSearchParams): Promise<EventSearchResult> {
    return this.request<EventSearchResult>('/events', params ? toRecord(params) : undefined);
  }

  /**
   * Get details for a specific event
   */
  async getEventDetails(eventId: string, locale?: string): Promise<Event> {
    const params = locale ? { locale } : undefined;
    return this.request<Event>(`/events/${encodeURIComponent(eventId)}`, params);
  }

  /**
   * Get the featured event for a location
   */
  async getFeaturedEvent(params: { location?: string; latitude?: number; longitude?: number; locale?: string }): Promise<Event> {
    return this.request<Event>('/events/featured', toRecord(params));
  }

  // ==========================================================================
  // Autocomplete Endpoint
  // ==========================================================================

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(params: AutocompleteParams): Promise<AutocompleteResult> {
    return this.request<AutocompleteResult>('/autocomplete', toRecord(params));
  }

  // ==========================================================================
  // Categories Endpoints
  // ==========================================================================

  /**
   * Get all categories
   */
  async getAllCategories(locale?: string): Promise<CategoriesResult> {
    const params = locale ? { locale } : undefined;
    return this.request<CategoriesResult>('/categories', params);
  }

  /**
   * Get details for a specific category
   */
  async getCategoryDetails(alias: string, locale?: string): Promise<{ category: CategoryDetails }> {
    const params = locale ? { locale } : undefined;
    return this.request<{ category: CategoryDetails }>(`/categories/${encodeURIComponent(alias)}`, params);
  }

  // ==========================================================================
  // Transaction Search Endpoint
  // ==========================================================================

  /**
   * Search for businesses that support food delivery
   */
  async searchTransactions(params: TransactionSearchParams): Promise<TransactionSearchResult> {
    const { transaction_type, ...queryParams } = params;
    return this.request<TransactionSearchResult>(
      `/transactions/${encodeURIComponent(transaction_type)}/search`,
      toRecord(queryParams)
    );
  }

  // ==========================================================================
  // Service Offerings Endpoint
  // ==========================================================================

  /**
   * Get service offerings for a business
   */
  async getServiceOfferings(businessId: string, locale?: string): Promise<ServiceOfferingsResult> {
    const params = locale ? { locale } : undefined;
    return this.request<ServiceOfferingsResult>(
      `/businesses/${encodeURIComponent(businessId)}/service_offerings`,
      params
    );
  }

  // ==========================================================================
  // Engagement Metrics Endpoint
  // ==========================================================================

  /**
   * Get engagement metrics for businesses
   */
  async getEngagementMetrics(params: EngagementMetricsParams): Promise<EngagementMetricsResult> {
    return this.request<EngagementMetricsResult>('/businesses/engagement', toRecord(params));
  }

  // ==========================================================================
  // Business Insights Endpoints
  // ==========================================================================

  /**
   * Get business insights
   */
  async getBusinessInsights(params: BusinessInsightsParams): Promise<BusinessInsightsResult> {
    return this.request<BusinessInsightsResult>('/businesses/insights', toRecord(params));
  }

  /**
   * Get food and drinks insights for a business
   */
  async getFoodDrinksInsights(businessId: string, locale?: string): Promise<FoodDrinksInsightsResult> {
    const params = locale ? { locale } : undefined;
    return this.request<FoodDrinksInsightsResult>(
      `/businesses/${encodeURIComponent(businessId)}/food_and_drinks_insights`,
      params
    );
  }

  /**
   * Get risk signal insights for a business
   */
  async getRiskSignalsInsights(businessId: string, locale?: string): Promise<RiskSignalsInsightsResult> {
    const params = locale ? { locale } : undefined;
    return this.request<RiskSignalsInsightsResult>(
      `/businesses/${encodeURIComponent(businessId)}/risk_signals_insights`,
      params
    );
  }

  // ==========================================================================
  // Waitlist Endpoints
  // ==========================================================================

  /**
   * Get waitlist status for a business
   */
  async getWaitlistStatus(businessId: string): Promise<WaitlistStatusResult> {
    return this.request<WaitlistStatusResult>(
      `/businesses/${encodeURIComponent(businessId)}/waitlist/status`
    );
  }

  /**
   * Get waitlist info for a business
   */
  async getWaitlistInfo(businessId: string): Promise<WaitlistInfoResult> {
    return this.request<WaitlistInfoResult>(
      `/businesses/${encodeURIComponent(businessId)}/waitlist/info`
    );
  }

  /**
   * Get details of a waitlist visit
   */
  async getVisitDetails(visitId: string): Promise<VisitResult> {
    return this.request<VisitResult>(`/waitlist/visits/${encodeURIComponent(visitId)}`);
  }

  /**
   * Get partner restaurants with waitlist support
   */
  async getPartnerRestaurants(params?: PartnerRestaurantsParams): Promise<PartnerRestaurantsResult> {
    return this.request<PartnerRestaurantsResult>(
      '/waitlist/partner_restaurants',
      params ? toRecord(params) : undefined
    );
  }

  // ==========================================================================
  // Reservations Endpoints
  // ==========================================================================

  /**
   * Get reservation openings for a business
   */
  async getReservationOpenings(params: ReservationOpeningsParams): Promise<ReservationOpeningsResult> {
    const { business_id_or_alias, ...queryParams } = params;
    return this.request<ReservationOpeningsResult>(
      `/bookings/${encodeURIComponent(business_id_or_alias)}/openings`,
      toRecord(queryParams)
    );
  }

  /**
   * Get reservation status
   */
  async getReservationStatus(reservationId: string): Promise<ReservationStatusResult> {
    return this.request<ReservationStatusResult>(
      `/reservations/${encodeURIComponent(reservationId)}/status`
    );
  }

  // ==========================================================================
  // AI Chat Endpoint
  // ==========================================================================

  /**
   * Send a message to the Yelp AI Chat (non-streaming)
   */
  async chat(params: AIChatParams): Promise<AIChatResponse> {
    return this.request<AIChatResponse>(
      '/ai/chat',
      undefined,
      {
        base: YELP_AI_API_BASE,
        method: 'POST',
        body: params,
      }
    );
  }

  /**
   * Send a message to the Yelp AI Chat with streaming response
   * Returns an async generator that yields chunks
   */
  async *chatStream(params: AIChatParams): AsyncGenerator<AIChatStreamChunk, void, unknown> {
    const url = `${YELP_AI_API_BASE}/ai/chat`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2); // Double timeout for streaming

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ ...params, stream: true }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json() as YelpApiError;
        throw new YelpError(errorData.error);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              return;
            }
            try {
              const chunk = JSON.parse(data) as AIChatStreamChunk;
              yield chunk;
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim();
        if (data && data !== '[DONE]') {
          try {
            const chunk = JSON.parse(data) as AIChatStreamChunk;
            yield chunk;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof YelpError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }
}

export * from './types.js';
