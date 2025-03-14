import businessesClient from './api/businesses';
import businessesAiClient from './api/businesses/ai';
import categoriesClient from './api/categories';
import eventsClient from './api/events';
import reviewsClient from './api/reviews';
import advertisingClient from './api/advertising';
import oauthClient from './api/oauth';
import waitlistPartnerClient from './api/waitlist-partner';
import respondReviewsClient from './api/respond-reviews';
import reportingV2Client from './api/reporting-v2';
import businessSubscriptionsClient from './api/business-subscriptions';
import checkoutClient from './api/checkout';
import claimBusinessClient from './api/claim-business';
import userManagementClient from './api/user-management';

/**
 * Yelp AI Response interface
 */
export interface YelpAIResponse {
  /**
   * Answer text
   */
  answer: string;
  
  /**
   * Search context
   */
  context?: string;
  
  /**
   * Businesses used in the response
   */
  businesses?: any[];
  
  /**
   * Cited sources
   */
  sources?: string[];
}

/**
 * Yelp Service class that aggregates all API clients
 */
class YelpService {
  /**
   * Businesses API client
   */
  readonly businesses = businessesClient;
  
  /**
   * Business AI API client
   */
  readonly businessesAi = businessesAiClient;
  
  /**
   * Categories API client
   */
  readonly categories = categoriesClient;
  
  /**
   * Events API client
   */
  readonly events = eventsClient;
  
  /**
   * Reviews API client
   */
  readonly reviews = reviewsClient;
  
  /**
   * Advertising API client
   */
  readonly advertising = advertisingClient;
  
  /**
   * OAuth API client
   */
  readonly oauth = oauthClient;
  
  /**
   * Waitlist Partner API client
   */
  readonly waitlistPartner = waitlistPartnerClient;
  
  /**
   * Respond Reviews API client
   */
  readonly respondReviews = respondReviewsClient;
  
  /**
   * Reporting V2 API client
   */
  readonly reportingV2 = reportingV2Client;
  
  /**
   * Business Subscriptions API client
   */
  readonly businessSubscriptions = businessSubscriptionsClient;
  
  /**
   * Checkout API client
   */
  readonly checkout = checkoutClient;
  
  /**
   * Claim Business API client
   */
  readonly claimBusiness = claimBusinessClient;
  
  /**
   * User Management API client
   */
  readonly userManagement = userManagementClient;
}

export default new YelpService();