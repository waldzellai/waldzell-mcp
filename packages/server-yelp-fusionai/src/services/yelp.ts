import businessClient from './api/businesses';
import { YelpAIResponse } from './api/businesses/ai';
import reviewsClient from './api/reviews';
import eventsClient from './api/events';
import categoriesClient from './api/categories';
import miscClient from './api/miscellaneous';
import oauthClient from './api/oauth';
import dataIngestionClient from './api/data-ingestion';
import claimBusinessClient from './api/claim-business';
import listingManagementClient from './api/listing-management';
import advertisingClient from './api/advertising';
import programFeatureClient from './api/program-feature';
import reportingV2Client from './api/reporting-v2';
import reportingV3Client from './api/reporting-v3';
import partnerSupportClient from './api/partner-support';
import locationSubV2Client from './api/location-subscription-v2';
import respondReviewsClient from './api/respond-reviews';
import checkoutClient from './api/checkout';
import leadsClient from './api/leads';
import webhooksClient from './api/webhooks';
import businessSubsClient from './api/business-subscriptions';
import locationSubV1Client from './api/location-subscription-v1';
import fulfillmentClient from './api/fulfillment';
import waitlistPartnerClient from './api/waitlist-partner';
import reservationsClient from './api/reservations';

/**
 * Main service that aggregates all Yelp API clients
 */
class YelpService {
  // Business endpoints
  readonly business = businessClient;

  // Additional endpoints organized by category
  readonly reviews = reviewsClient;
  readonly events = eventsClient;
  readonly categories = categoriesClient;
  readonly misc = miscClient;
  readonly oauth = oauthClient;
  readonly dataIngestion = dataIngestionClient;
  readonly claimBusiness = claimBusinessClient;
  readonly listingManagement = listingManagementClient;
  readonly advertising = advertisingClient;
  readonly programFeature = programFeatureClient;
  readonly reporting = {
    v2: reportingV2Client,
    v3: reportingV3Client
  };
  readonly partnerSupport = partnerSupportClient;
  readonly locationSubscription = {
    v1: locationSubV1Client,
    v2: locationSubV2Client
  };
  readonly respondReviews = respondReviewsClient;
  readonly checkout = checkoutClient;
  readonly leads = leadsClient;
  readonly webhooks = webhooksClient;
  readonly businessSubscriptions = businessSubsClient;
  readonly fulfillment = fulfillmentClient;
  readonly waitlistPartner = waitlistPartnerClient;
  readonly reservations = reservationsClient;

  /**
   * Helper method to maintain backward compatibility
   * @param query Natural language query about businesses
   */
  async chat(query: string): Promise<YelpAIResponse> {
    return this.business.ai.chat(query);
  }
}

export default new YelpService();
export { YelpAIResponse };