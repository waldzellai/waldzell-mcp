/**
 * Yelp Fusion API TypeScript types
 */

// =============================================================================
// Common Types
// =============================================================================

export interface Category {
  alias: string;
  title: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  address1: string | null;
  address2: string | null;
  address3: string | null;
  city: string;
  zip_code: string;
  country: string;
  state: string;
  display_address: string[];
  cross_streets?: string;
}

export interface BusinessHours {
  open: Array<{
    is_overnight: boolean;
    start: string;
    end: string;
    day: number;
  }>;
  hours_type: string;
  is_open_now: boolean;
}

export interface SpecialHours {
  date: string;
  is_closed: boolean | null;
  start: string | null;
  end: string | null;
  is_overnight: boolean | null;
}

// =============================================================================
// Business Types
// =============================================================================

export interface Business {
  id: string;
  alias: string;
  name: string;
  image_url: string;
  is_claimed?: boolean;
  is_closed: boolean;
  url: string;
  phone: string;
  display_phone: string;
  review_count: number;
  categories: Category[];
  rating: number;
  location: Location;
  coordinates: Coordinates;
  photos?: string[];
  price?: string;
  hours?: BusinessHours[];
  special_hours?: SpecialHours[];
  transactions: string[];
  messaging?: {
    url: string;
    use_case_text: string;
  };
  attributes?: Record<string, unknown>;
}

export interface BusinessSearchResult {
  businesses: Business[];
  total: number;
  region: {
    center: Coordinates;
  };
}

// =============================================================================
// Search Parameters
// =============================================================================

export interface BusinessSearchParams {
  /** Search term (e.g., "food", "restaurants") */
  term?: string;
  /** Location (e.g., "NYC", "350 5th Ave, New York, NY 10118") */
  location?: string;
  /** Latitude of the location */
  latitude?: number;
  /** Longitude of the location */
  longitude?: number;
  /** Search radius in meters. Max 40000 meters (25 miles) */
  radius?: number;
  /** Categories to filter by (comma-separated aliases) */
  categories?: string;
  /** Locale code (e.g., "en_US") */
  locale?: string;
  /** Price levels to filter by (1=cheap, 4=expensive). Comma-separated. */
  price?: string;
  /** Filter to businesses that are open now */
  open_now?: boolean;
  /** Unix timestamp to filter businesses open at that time */
  open_at?: number;
  /** Business attributes to filter by */
  attributes?: string;
  /** Sort by: best_match, rating, review_count, distance */
  sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance';
  /** Device platform: android, ios, mobile-generic */
  device_platform?: string;
  /** Reservation date (YYYY-MM-DD) */
  reservation_date?: string;
  /** Reservation time (HH:MM) */
  reservation_time?: string;
  /** Number of people for reservation */
  reservation_covers?: number;
  /** Match threshold for fuzzy matching */
  matches_party_size_param?: boolean;
  /** Number of results to return (max 50) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface PhoneSearchParams {
  /** Phone number to search for (format: +14159083801) */
  phone: string;
}

export interface BusinessMatchParams {
  /** Business name */
  name: string;
  /** Street address */
  address1: string;
  /** City */
  city: string;
  /** Two-letter state code */
  state: string;
  /** Two-letter country code */
  country: string;
  /** Postal code */
  postal_code?: string;
  /** Address line 2 */
  address2?: string;
  /** Address line 3 */
  address3?: string;
  /** Phone number */
  phone?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** Match threshold: none, default, strict */
  match_threshold?: 'none' | 'default' | 'strict';
}

export interface BusinessMatchResult {
  businesses: Business[];
}

// =============================================================================
// Reviews Types
// =============================================================================

export interface User {
  id: string;
  profile_url: string;
  image_url: string | null;
  name: string;
}

export interface Review {
  id: string;
  url: string;
  text: string;
  rating: number;
  time_created: string;
  user: User;
}

export interface ReviewsResult {
  reviews: Review[];
  total: number;
  possible_languages: string[];
}

export interface ReviewsParams {
  /** Business ID */
  business_id: string;
  /** Locale code */
  locale?: string;
  /** Sort by: yelp_sort, newest, oldest, elites */
  sort_by?: 'yelp_sort' | 'newest' | 'oldest' | 'elites';
  /** Number of reviews to return (max 50) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface ReviewHighlight {
  sentence: {
    text: string;
    offset: number;
    length: number;
  };
  highlight_type: string;
}

export interface ReviewHighlightsResult {
  review_highlights: Array<{
    sentences: string[];
    review_id: string;
    user_id: string;
  }>;
  request_id: string;
}

// =============================================================================
// Events Types
// =============================================================================

export interface Event {
  attending_count: number;
  category: string;
  cost: number | null;
  cost_max: number | null;
  description: string;
  event_site_url: string;
  id: string;
  image_url: string;
  interested_count: number;
  is_canceled: boolean;
  is_free: boolean;
  is_official: boolean;
  latitude: number;
  longitude: number;
  name: string;
  tickets_url: string | null;
  time_end: string | null;
  time_start: string;
  location: Location;
  business_id: string | null;
}

export interface EventSearchResult {
  events: Event[];
  total: number;
}

export interface EventSearchParams {
  /** Locale code */
  locale?: string;
  /** Offset for pagination */
  offset?: number;
  /** Number of results (max 50) */
  limit?: number;
  /** Sort by: desc, asc */
  sort_by?: 'desc' | 'asc';
  /** Sort on: popularity, time_start */
  sort_on?: 'popularity' | 'time_start';
  /** Filter to events starting after this date (Unix timestamp) */
  start_date?: number;
  /** Filter to events starting before this date (Unix timestamp) */
  end_date?: number;
  /** Event categories (comma-separated) */
  categories?: string;
  /** Filter to free events */
  is_free?: boolean;
  /** Location string */
  location?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** Search radius in meters */
  radius?: number;
  /** Comma-separated list of event IDs to exclude */
  excluded_events?: string;
}

// =============================================================================
// Autocomplete Types
// =============================================================================

export interface AutocompleteResult {
  terms: Array<{ text: string }>;
  businesses: Array<{ id: string; name: string }>;
  categories: Array<{ alias: string; title: string }>;
}

export interface AutocompleteParams {
  /** Text to autocomplete */
  text: string;
  /** Latitude for location-based results */
  latitude?: number;
  /** Longitude for location-based results */
  longitude?: number;
  /** Locale code */
  locale?: string;
}

// =============================================================================
// Categories Types
// =============================================================================

export interface CategoryDetails {
  alias: string;
  title: string;
  parent_aliases: string[];
  country_whitelist: string[];
  country_blacklist: string[];
}

export interface CategoriesResult {
  categories: CategoryDetails[];
}

// =============================================================================
// AI Chat Types
// =============================================================================

export interface AIChatParams {
  /** The user's message/query */
  query: string;
  /** Location context for the query */
  location?: string;
  /** Latitude for location context */
  latitude?: number;
  /** Longitude for location context */
  longitude?: number;
  /** Conversation ID for multi-turn conversations */
  conversation_id?: string;
}

export interface AIChatResponse {
  /** The AI's response text */
  response: string;
  /** Conversation ID for continuing the conversation */
  conversation_id: string;
  /** Businesses mentioned in the response */
  businesses?: Business[];
}

export interface AIChatStreamChunk {
  /** Type of chunk: text, business, end */
  type: 'text' | 'business' | 'end';
  /** Text content (for text chunks) */
  content?: string;
  /** Business data (for business chunks) */
  business?: Business;
  /** Conversation ID (included in end chunk) */
  conversation_id?: string;
}

// =============================================================================
// Transaction Search Types
// =============================================================================

export interface TransactionSearchParams {
  /** Transaction type (currently only 'delivery') */
  transaction_type: 'delivery';
  /** Location string */
  location?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** Search term */
  term?: string;
  /** Categories to filter by */
  categories?: string[];
  /** Price levels to filter by (1-4) */
  price?: number[];
}

export interface TransactionSearchResult {
  businesses: Business[];
  total: number;
}

// =============================================================================
// Service Offerings Types
// =============================================================================

export interface ServiceOfferingsResult {
  /** List of active service offerings */
  active: string[];
  /** List of eligible service offerings */
  eligible: string[];
}

// =============================================================================
// Engagement Metrics Types
// =============================================================================

export interface EngagementMetricsParams {
  /** Comma-separated list of business IDs (max 50) */
  business_ids: string;
  /** Start date for metrics (YYYY-MM-DD) */
  start_date?: string;
  /** End date for metrics (YYYY-MM-DD) */
  end_date?: string;
}

export interface BusinessEngagement {
  business_id: string;
  metrics: {
    impressions?: number;
    leads?: number;
    calls?: number;
    direction_requests?: number;
    website_clicks?: number;
    bookmarks?: number;
    photo_views?: number;
    [key: string]: unknown;
  };
}

export interface EngagementMetricsResult {
  businesses: BusinessEngagement[];
}

// =============================================================================
// Business Insights Types
// =============================================================================

export interface BusinessInsightsParams {
  /** Comma-separated list of business IDs */
  business_ids: string;
  /** Locale code */
  locale?: string;
}

export interface BusinessInsight {
  business_id: string;
  insights: Record<string, unknown>;
}

export interface BusinessInsightsResult {
  businesses: BusinessInsight[];
}

// =============================================================================
// Food & Drinks Insights Types
// =============================================================================

export interface FoodDrinksInsightsResult {
  business_id: string;
  popular_dishes?: Array<{
    name: string;
    count: number;
  }>;
  popular_drinks?: Array<{
    name: string;
    count: number;
  }>;
}

// =============================================================================
// Risk Signal Insights Types
// =============================================================================

export interface RiskSignalsInsightsResult {
  business_id: string;
  risk_signals?: Array<{
    signal_type: string;
    severity: string;
    description: string;
  }>;
}

// =============================================================================
// Waitlist Types
// =============================================================================

export interface WaitEstimate {
  est_wait: number;
  min_wait: number;
  max_wait: number;
  wait_range: string;
}

export interface WaitlistStatusResult {
  business_id: string;
  state: 'OPEN' | 'ON_MY_WAY' | 'CLOSED';
  closed_reason: 'resto_closed' | 'remote_entry_disabled' | 'special_event' | 'no_current_wait' | 'waitlist_closed' | null;
  wait_estimates: Record<string, WaitEstimate>;
}

export interface WaitlistInfoResult {
  business_id: string;
  name: string;
  is_waitlist_enabled: boolean;
  operating_hours?: Array<{
    day: number;
    start: string;
    end: string;
  }>;
}

export interface VisitResult {
  visit_id: string;
  business_id: string;
  party_size: number;
  status: string;
  estimated_wait_time?: number;
  check_in_time?: string;
  seated_time?: string;
  customer_name?: string;
}

export interface PartnerRestaurantsParams {
  /** Location string */
  location?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
  /** Search radius in meters */
  radius?: number;
  /** Number of results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface PartnerRestaurant {
  business_id: string;
  name: string;
  alias: string;
  image_url?: string;
  location: Location;
  coordinates: Coordinates;
  is_waitlist_enabled: boolean;
}

export interface PartnerRestaurantsResult {
  restaurants: PartnerRestaurant[];
  total: number;
}

// =============================================================================
// Reservations Types
// =============================================================================

export interface ReservationOpeningsParams {
  /** Business ID or alias */
  business_id_or_alias: string;
  /** Number of people (1-10) */
  covers: number;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Time in HH:MM format */
  time: string;
  /** Include covers range info */
  get_covers_range?: boolean;
}

export interface ReservationTime {
  time: string;
  credit_card_required: boolean;
}

export interface ReservationDay {
  date: string;
  times: ReservationTime[];
}

export interface ReservationOpeningsResult {
  reservation_times: ReservationDay[];
  covers_range?: {
    min_party_size: number;
    max_party_size: number;
  };
}

export interface ReservationStatusResult {
  reservation_id: string;
  business_id: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  covers: number;
  date: string;
  time: string;
  customer_name?: string;
  customer_phone?: string;
  special_requests?: string;
}

// =============================================================================
// Error Types
// =============================================================================

export interface YelpApiError {
  error: {
    code: string;
    description: string;
    field?: string;
    instance?: string;
  };
}

export class YelpError extends Error {
  code: string;
  field?: string;

  constructor(error: YelpApiError['error']) {
    super(error.description);
    this.name = 'YelpError';
    this.code = error.code;
    this.field = error.field;
  }
}
