import { z } from 'zod';
import { McpServer } from '../typescript-sdk/src/server/mcp';
import { CallToolResult } from '../typescript-sdk/src/types';
import yelpService, { YelpAIResponse } from './services/yelp';
import {
  GetAccessTokenResponse,
  GetBusinessesResponse,
  BusinessOwnerInfo,
  RespondToReviewResponse
} from './services/api/respond-reviews';
import {
  SubscriptionPlansResponse,
  ActiveSubscription,
  SubscriptionUsage,
  SubscriptionHistory
} from './services/api/business-subscriptions';
import {
  Category,
  CategoriesResponse
} from './services/api/categories';
import {
  Event,
  EventSearchResponse,
  FeaturedEventResponse
} from './services/api/events';
import {
  PaymentMethod,
  PaymentMethodsResponse,
  Invoice,
  InvoicesResponse,
  Payment,
  PaymentsResponse
} from './services/api/checkout';
import {
  ClaimEligibility,
  ClaimResponse,
  ClaimStatus,
  VerificationResponse,
  DocumentUploadResponse
} from './services/api/claim-business';
import {
  UserProfile,
  UserPreferences,
  FriendsResponse,
  Collection,
  CollectionsResponse,
  CollectionItemsResponse
} from './services/api/user-management';
import {
  DataSource,
  DataSourceListResponse,
  DataIngestionJob,
  DataIngestionJobListResponse,
  CreateDataSourceParams,
  CreateDataIngestionJobParams,
  UpdateDataIngestionJobParams
} from './services/api/data-ingestion';
import {
  Lead,
  LeadListResponse,
  LeadNote,
  LeadNoteListResponse,
  LeadActivity,
  LeadActivityListResponse,
  BulkOperationResponse,
  ImportLeadsResponse,
  ExportLeadsResponse,
  ExportJobStatusResponse,
  LeadStatistics,
  LeadStatus,
  LeadSource,
  LeadPriority
} from './services/api/leads';

// Define our implementation
const server = new McpServer({
  instructions: `
  # Yelp Fusion AI MCP Server

  This server provides access to Yelp Fusion API services through a conversational interface.
  
  Available Tools:
  
  Search Tools:
  - yelpQuery: Natural language business search
  - yelpBusinessSearch: Parameter-based business search
  - yelpBusinessDetails: Get business details by ID
  - yelpBusinessReviews: Get business reviews
  - yelpReviewHighlights: Get highlighted snippets from reviews
  - yelpEventsSearch: Search for events in a location
  - yelpEventDetails: Get detailed information about a specific event
  - yelpFeaturedEvent: Get the featured event for a location
  
  Categories Tools:
  - yelpGetCategories: Get all business categories from Yelp
  - yelpGetCategoryDetails: Get detailed information about a specific category
  - yelpSearchCategories: Search for business categories by name
  
  Advertising Tools:
  - yelpCreateAdProgram: Create a new advertising program
  - yelpListAdPrograms: List all advertising programs
  - yelpGetAdProgram: Get details of a specific advertising program
  - yelpModifyAdProgram: Modify an existing advertising program
  - yelpAdProgramStatus: Get status information for an advertising program
  - yelpPauseAdProgram: Pause an active advertising program
  - yelpResumeAdProgram: Resume a paused advertising program
  - yelpTerminateAdProgram: Terminate an advertising program
  
  Business Subscriptions Tools:
  - yelpGetSubscriptionPlans: Get available subscription plans
  - yelpGetActiveSubscription: Get active subscription for a business
  - yelpCreateSubscription: Create a new subscription
  - yelpUpdateSubscription: Update an existing subscription
  - yelpCancelSubscription: Cancel a subscription
  - yelpGetSubscriptionUsage: Get subscription usage data
  - yelpGetSubscriptionHistory: Get subscription history
  
  Checkout Tools:
  - yelpGetPaymentMethods: Get a list of payment methods
  - yelpGetPaymentMethod: Get details for a specific payment method
  - yelpCreatePaymentMethod: Create a new payment method
  - yelpDeletePaymentMethod: Delete a payment method
  - yelpGetInvoices: Get a list of invoices
  - yelpGetInvoice: Get details for a specific invoice
  - yelpPayInvoice: Pay an invoice using a payment method
  - yelpGetPayments: Get a list of payments
  - yelpGetPayment: Get details for a specific payment
  - yelpRefundPayment: Request a refund for a payment
  
  Claim Business Tools:
  - yelpCheckClaimEligibility: Check if a business is eligible for claiming
  - yelpSubmitBusinessClaim: Submit a claim for a business
  - yelpGetClaimStatus: Get the status of a business claim
  - yelpVerifyClaimCode: Submit verification code for a claim
  - yelpCancelClaim: Cancel a pending business claim
  
  User Management Tools:
  - yelpGetUserProfile: Get the current user's profile
  - yelpGetUserById: Get a user profile by ID
  - yelpUpdateUserProfile: Update the current user's profile
  - yelpGetUserPreferences: Get the current user's preferences
  - yelpUpdateUserPreferences: Update the current user's preferences
  - yelpGetFriends: Get a user's friends
  - yelpGetUserCollections: Get a user's collections
  - yelpGetCollectionDetails: Get details for a specific collection
  - yelpCreateCollection: Create a new collection
  - yelpUpdateCollection: Update an existing collection
  - yelpDeleteCollection: Delete a collection
  - yelpGetCollectionItems: Get items in a collection
  - yelpAddBusinessToCollection: Add a business to a collection
  - yelpRemoveBusinessFromCollection: Remove a business from a collection
  
  Data Ingestion Tools:
  - yelpListDataSources: List all data sources
  - yelpGetDataSource: Get details about a specific data source
  - yelpCreateDataSource: Create a new data source
  - yelpUpdateDataSource: Update an existing data source
  - yelpDeleteDataSource: Delete a data source
  - yelpListDataIngestionJobs: List all data ingestion jobs
  - yelpGetDataIngestionJob: Get details about a specific data ingestion job
  - yelpCreateDataIngestionJob: Create a new data ingestion job
  - yelpUpdateDataIngestionJob: Update an existing data ingestion job
  - yelpCancelDataIngestionJob: Cancel a data ingestion job
  - yelpRetryDataIngestionJob: Retry a failed data ingestion job
  
  Leads Management Tools:
  - yelpGetLeads: Get list of leads with optional filtering
  - yelpGetLead: Get details about a specific lead
  - yelpCreateLead: Create a new lead
  - yelpUpdateLead: Update an existing lead
  - yelpDeleteLead: Delete a lead
  - yelpGetLeadNotes: Get notes for a lead
  - yelpAddLeadNote: Add a note to a lead
  - yelpDeleteLeadNote: Delete a note from a lead
  - yelpGetLeadActivities: Get activity history for a lead
  - yelpAddLeadActivity: Add an activity to a lead
  - yelpBulkUpdateLeads: Update multiple leads in bulk
  - yelpBulkDeleteLeads: Delete multiple leads in bulk
  - yelpImportLeads: Import leads from a data source
  - yelpExportLeads: Export leads to a file
  - yelpGetExportStatus: Check status of an export job
  - yelpGetLeadStatistics: Get statistics about leads
  
  OAuth Tools:
  - yelpGetOAuthToken: Get an OAuth access token (v2 or v3)
  - yelpRefreshOAuthToken: Refresh an OAuth v3 access token
  - yelpRevokeOAuthToken: Revoke an OAuth access token
  - yelpGetOAuthTokenInfo: Get information about an OAuth token
  
  Waitlist Tools:
  - yelpWaitlistPartnerRestaurants: Get restaurants that support Yelp Waitlist
  - yelpWaitlistStatus: Get current waitlist status for a business
  - yelpWaitlistInfo: Get detailed waitlist configuration for a business
  - yelpJoinWaitlist: Join a restaurant's waitlist remotely
  - yelpOnMyWay: Notify a restaurant that you're on your way
  - yelpCancelWaitlistVisit: Cancel a waitlist visit
  - yelpWaitlistVisitDetails: Get details about a waitlist visit
  
  Respond to Reviews Tools:
  - yelpRespondReviewsGetToken: Get an OAuth access token for responding to reviews
  - yelpRespondReviewsBusinesses: Get businesses that the user can respond to reviews for
  - yelpRespondReviewsBusinessOwner: Get business owner information
  - yelpRespondToReview: Respond to a review as a business owner
  `,
  
  tools: {
    // Categories Tools
    yelpGetCategories: {
      description: "Get all business categories from Yelp",
      schema: z.object({
        locale: z.string().optional().describe('Optional locale parameter (e.g., "en_US")'),
        country: z.string().optional().describe('Optional country code parameter (e.g., "US")'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.categories.getAll(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatCategoriesResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting categories: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetCategoryDetails: {
      description: "Get detailed information about a specific business category",
      schema: z.object({
        alias: z.string().describe('The category alias/slug (e.g., "restaurants", "italian")'),
        locale: z.string().optional().describe('Optional locale parameter (e.g., "en_US")'),
        country: z.string().optional().describe('Optional country code parameter (e.g., "US")'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const { alias, ...params } = args;
          const response = await yelpService.categories.getCategory(alias, params);
          
          return {
            content: [
              {
                type: 'text',
                text: formatCategoryDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting category details: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpSearchCategories: {
      description: "Search for business categories by name",
      schema: z.object({
        term: z.string().describe('The search term to match against category titles'),
        locale: z.string().optional().describe('Optional locale parameter (e.g., "en_US")'),
        country: z.string().optional().describe('Optional country code parameter (e.g., "US")'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const { term, ...params } = args;
          const response = await yelpService.categories.searchCategories(term, params);
          
          return {
            content: [
              {
                type: 'text',
                text: formatCategoriesResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error searching categories: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    // Events Tools
    yelpEventsSearch: {
      description: "Search for events in a location",
      schema: z.object({
        location: z.string().optional().describe('Location string (e.g., address, city, state)'),
        latitude: z.number().optional().describe('Latitude coordinate'),
        longitude: z.number().optional().describe('Longitude coordinate'),
        radius: z.number().optional().describe('Search radius in meters (max: 40000)'),
        categories: z.string().optional().describe('Categories to filter by (comma-separated)'),
        start_date: z.number().optional().describe('Start date (Unix timestamp)'),
        end_date: z.number().optional().describe('End date (Unix timestamp)'),
        is_free: z.boolean().optional().describe('Whether the event is free'),
        limit: z.number().optional().describe('Maximum number of results to return (default: 20, max: 50)'),
        offset: z.number().optional().describe('Offset for pagination'),
        sort_by: z.enum(['popularity', 'time_start']).optional().describe('Sorting mode: popularity or time_start'),
        locale: z.string().optional().describe('Locale (default: en_US)'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.events.search(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatEventSearchResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error searching events: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpEventDetails: {
      description: "Get detailed information about a specific event",
      schema: z.object({
        event_id: z.string().describe('The ID of the event'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.events.getEvent(args.event_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatEventDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting event details: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpFeaturedEvent: {
      description: "Get the featured event for a location",
      schema: z.object({
        location: z.string().optional().describe('Location string (e.g., address, city, state)'),
        latitude: z.number().optional().describe('Latitude coordinate'),
        longitude: z.number().optional().describe('Longitude coordinate'),
        locale: z.string().optional().describe('Locale (default: en_US)'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.events.getFeaturedEvent(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatFeaturedEventResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting featured event: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    // Business Subscriptions Tools
    yelpGetSubscriptionPlans: {
      description: "Get available subscription plans",
      schema: z.object({
        business_id: z.string().optional().describe('Optional business ID to filter plans available for a specific business'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.businessSubscriptions.getSubscriptionPlans(args.business_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatSubscriptionPlansResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting subscription plans: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetActiveSubscription: {
      description: "Get active subscription for a business",
      schema: z.object({
        business_id: z.string().describe('Business ID to get the active subscription for'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.businessSubscriptions.getActiveSubscription(args.business_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatActiveSubscriptionResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting active subscription: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpCreateSubscription: {
      description: "Create a new subscription",
      schema: z.object({
        business_id: z.string().describe('Business ID'),
        plan_id: z.string().describe('Plan ID to subscribe to'),
        auto_renew: z.boolean().optional().describe('Whether the subscription should auto-renew'),
        payment_method_id: z.string().optional().describe('Payment method ID to use for billing'),
        promo_code: z.string().optional().describe('Promo code to apply to the subscription'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.businessSubscriptions.createSubscription(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatActiveSubscriptionResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error creating subscription: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpUpdateSubscription: {
      description: "Update an existing subscription",
      schema: z.object({
        subscription_id: z.string().describe('Subscription ID to update'),
        auto_renew: z.boolean().optional().describe('Whether the subscription should auto-renew'),
        payment_method_id: z.string().optional().describe('Payment method ID to use for billing'),
        plan_id: z.string().optional().describe('Plan ID to change to (for upgrades/downgrades)'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const { subscription_id, ...updateData } = args;
          const response = await yelpService.businessSubscriptions.updateSubscription(subscription_id, updateData);
          
          return {
            content: [
              {
                type: 'text',
                text: formatActiveSubscriptionResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating subscription: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpCancelSubscription: {
      description: "Cancel a subscription",
      schema: z.object({
        subscription_id: z.string().describe('Subscription ID to cancel'),
        cancel_immediately: z.boolean().optional().describe('Whether to cancel immediately or at the end of the current period'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.businessSubscriptions.cancelSubscription(
            args.subscription_id, 
            args.cancel_immediately
          );
          
          return {
            content: [
              {
                type: 'text',
                text: formatActiveSubscriptionResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error canceling subscription: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetSubscriptionUsage: {
      description: "Get subscription usage data",
      schema: z.object({
        subscription_id: z.string().describe('Subscription ID to get usage data for'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.businessSubscriptions.getSubscriptionUsage(args.subscription_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatSubscriptionUsageResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting subscription usage: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetSubscriptionHistory: {
      description: "Get subscription history",
      schema: z.object({
        subscription_id: z.string().describe('Subscription ID to get history for'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.businessSubscriptions.getSubscriptionHistory(args.subscription_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatSubscriptionHistoryResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting subscription history: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    // Checkout Tools
    yelpGetPaymentMethods: {
      description: "Get a list of payment methods",
      schema: z.object({
        business_id: z.string().optional().describe('Optional business ID to filter by'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.checkout.getPaymentMethods(args.business_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatPaymentMethodsResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting payment methods: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetPaymentMethod: {
      description: "Get details for a specific payment method",
      schema: z.object({
        payment_method_id: z.string().describe('Payment method ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.checkout.getPaymentMethod(args.payment_method_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatPaymentMethodDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting payment method: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpCreatePaymentMethod: {
      description: "Create a new payment method",
      schema: z.object({
        payment_token: z.string().describe('Payment token from the payment processor'),
        set_default: z.boolean().optional().describe('Set as default payment method'),
        business_id: z.string().optional().describe('Business ID to associate with'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const request = {
            payment_token: args.payment_token,
            set_default: args.set_default,
            business_id: args.business_id
          };
          
          const response = await yelpService.checkout.createPaymentMethod(request);
          
          return {
            content: [
              {
                type: 'text',
                text: formatPaymentMethodDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error creating payment method: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpDeletePaymentMethod: {
      description: "Delete a payment method",
      schema: z.object({
        payment_method_id: z.string().describe('Payment method ID to delete'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.checkout.deletePaymentMethod(args.payment_method_id);
          
          return {
            content: [
              {
                type: 'text',
                text: `Payment method deletion status: ${response.success ? 'Successful' : 'Failed'}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error deleting payment method: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetInvoices: {
      description: "Get a list of invoices",
      schema: z.object({
        business_id: z.string().optional().describe('Business ID to filter by'),
        subscription_id: z.string().optional().describe('Subscription ID to filter by'),
        limit: z.number().optional().describe('Number of results to return (max 50)'),
        offset: z.number().optional().describe('Offset the list of returned results by this amount'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.checkout.getInvoices(
            args.business_id,
            args.subscription_id,
            args.limit,
            args.offset
          );
          
          return {
            content: [
              {
                type: 'text',
                text: formatInvoicesResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting invoices: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetInvoice: {
      description: "Get details for a specific invoice",
      schema: z.object({
        invoice_id: z.string().describe('Invoice ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.checkout.getInvoice(args.invoice_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatInvoiceDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting invoice: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpPayInvoice: {
      description: "Pay an invoice using a payment method",
      schema: z.object({
        invoice_id: z.string().describe('Invoice ID to pay'),
        payment_method_id: z.string().describe('Payment method ID to use'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.checkout.payInvoice(args.invoice_id, args.payment_method_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatPaymentDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error paying invoice: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetPayments: {
      description: "Get a list of payments",
      schema: z.object({
        business_id: z.string().optional().describe('Business ID to filter by'),
        subscription_id: z.string().optional().describe('Subscription ID to filter by'),
        invoice_id: z.string().optional().describe('Invoice ID to filter by'),
        limit: z.number().optional().describe('Number of results to return (max 50)'),
        offset: z.number().optional().describe('Offset the list of returned results by this amount'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.checkout.getPayments(
            args.business_id,
            args.subscription_id,
            args.invoice_id,
            args.limit,
            args.offset
          );
          
          return {
            content: [
              {
                type: 'text',
                text: formatPaymentsResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting payments: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetPayment: {
      description: "Get details for a specific payment",
      schema: z.object({
        payment_id: z.string().describe('Payment ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.checkout.getPayment(args.payment_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatPaymentDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting payment: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpRefundPayment: {
      description: "Request a refund for a payment",
      schema: z.object({
        payment_id: z.string().describe('Payment ID to refund'),
        amount_cents: z.number().optional().describe('Amount to refund in cents (default: full amount)'),
        reason: z.string().optional().describe('Reason for the refund'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.checkout.refundPayment(
            args.payment_id,
            args.amount_cents,
            args.reason
          );
          
          return {
            content: [
              {
                type: 'text',
                text: formatPaymentDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error refunding payment: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    // Claim Business Tools
    yelpCheckClaimEligibility: {
      description: "Check if a business is eligible for claiming",
      schema: z.object({
        business_id: z.string().describe('Business ID to check eligibility for'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.claimBusiness.checkEligibility(args.business_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatClaimEligibilityResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error checking claim eligibility: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpSubmitBusinessClaim: {
      description: "Submit a claim for a business",
      schema: z.object({
        business_id: z.string().describe('Business ID to claim'),
        full_name: z.string().describe('Full name of the business owner or authorized representative'),
        email: z.string().describe('Email address'),
        phone: z.string().describe('Phone number'),
        job_title: z.string().optional().describe('Job title or role at the business'),
        verification_method: z.enum(['phone', 'email', 'mail', 'document']).optional().describe('Preferred verification method'),
        website_url: z.string().optional().describe('Business website URL'),
        notes: z.string().optional().describe('Additional notes or comments'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.claimBusiness.submitClaim(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatClaimResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error submitting business claim: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetClaimStatus: {
      description: "Get the status of a business claim",
      schema: z.object({
        claim_id: z.string().describe('Claim ID to check status for'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.claimBusiness.getClaimStatus(args.claim_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatClaimStatusResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting claim status: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpVerifyClaimCode: {
      description: "Submit verification code for a claim",
      schema: z.object({
        claim_id: z.string().describe('Claim ID to verify'),
        verification_code: z.string().describe('Verification code provided by Yelp'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.claimBusiness.verifyCode(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatVerificationResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error verifying claim code: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpCancelClaim: {
      description: "Cancel a pending business claim",
      schema: z.object({
        claim_id: z.string().describe('Claim ID to cancel'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.claimBusiness.cancelClaim(args.claim_id);
          
          return {
            content: [
              {
                type: 'text',
                text: `Claim cancellation status: ${response.success ? '✅ Successfully canceled' : '❌ Failed to cancel'}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error canceling claim: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    // User Management Tools
    yelpGetUserProfile: {
      description: "Get the current user's profile",
      schema: z.object({}),
      async (): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.getCurrentUserProfile();
          
          return {
            content: [
              {
                type: 'text',
                text: formatUserProfileResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting user profile: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetUserById: {
      description: "Get a user profile by ID",
      schema: z.object({
        user_id: z.string().describe('User ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.getUserProfile(args.user_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatUserProfileResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting user profile: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpUpdateUserProfile: {
      description: "Update the current user's profile",
      schema: z.object({
        name: z.string().optional().describe('New display name'),
        city: z.string().optional().describe('City name'),
        state_code: z.string().optional().describe('State/province code'),
        country_code: z.string().optional().describe('Country code'),
        zip_code: z.string().optional().describe('ZIP/postal code'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const updates: any = {};
          
          if (args.name) {
            updates.name = args.name;
          }
          
          if (args.city || args.state_code || args.country_code || args.zip_code) {
            updates.location = {
              city: args.city || '',
              state_code: args.state_code,
              country_code: args.country_code,
              zip_code: args.zip_code
            };
          }
          
          const response = await yelpService.userManagement.updateUserProfile(updates);
          
          return {
            content: [
              {
                type: 'text',
                text: formatUserProfileResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating user profile: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetUserPreferences: {
      description: "Get the current user's preferences",
      schema: z.object({}),
      async (): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.getUserPreferences();
          
          return {
            content: [
              {
                type: 'text',
                text: formatUserPreferencesResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting user preferences: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpUpdateUserPreferences: {
      description: "Update the current user's preferences",
      schema: z.object({
        language: z.string().optional().describe('Language code (e.g., "en_US")'),
        currency: z.string().optional().describe('Currency code (e.g., "USD")'),
        distance_unit: z.enum(['mi', 'km']).optional().describe('Distance unit (miles or kilometers)'),
        default_location: z.string().optional().describe('Default location for searches'),
        default_radius: z.number().optional().describe('Default search radius in meters'),
        promotional_emails: z.boolean().optional().describe('Receive promotional emails'),
        friend_activity_emails: z.boolean().optional().describe('Receive friend activity email notifications'),
        review_comments_emails: z.boolean().optional().describe('Receive review comment email notifications'),
        direct_messages_emails: z.boolean().optional().describe('Receive direct message email notifications'),
        promotional_push: z.boolean().optional().describe('Receive promotional push notifications'),
        friend_activity_push: z.boolean().optional().describe('Receive friend activity push notifications'),
        review_comments_push: z.boolean().optional().describe('Receive review comment push notifications'),
        direct_messages_push: z.boolean().optional().describe('Receive direct message push notifications'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const updates: any = { user_id: 'me' };
          
          // Display preferences
          if (args.language || args.currency || args.distance_unit) {
            updates.display_preferences = {};
            if (args.language) updates.display_preferences.language = args.language;
            if (args.currency) updates.display_preferences.currency = args.currency;
            if (args.distance_unit) updates.display_preferences.distance_unit = args.distance_unit;
          }
          
          // Search preferences
          if (args.default_location || args.default_radius) {
            updates.search_preferences = {};
            if (args.default_location) updates.search_preferences.default_location = args.default_location;
            if (args.default_radius) updates.search_preferences.default_radius = args.default_radius;
          }
          
          // Email preferences
          if (args.promotional_emails !== undefined || args.friend_activity_emails !== undefined || 
              args.review_comments_emails !== undefined || args.direct_messages_emails !== undefined) {
            updates.email_preferences = {};
            if (args.promotional_emails !== undefined) updates.email_preferences.promotional = args.promotional_emails;
            if (args.friend_activity_emails !== undefined) updates.email_preferences.friend_activity = args.friend_activity_emails;
            if (args.review_comments_emails !== undefined) updates.email_preferences.review_comments = args.review_comments_emails;
            if (args.direct_messages_emails !== undefined) updates.email_preferences.direct_messages = args.direct_messages_emails;
          }
          
          // Push preferences
          if (args.promotional_push !== undefined || args.friend_activity_push !== undefined || 
              args.review_comments_push !== undefined || args.direct_messages_push !== undefined) {
            updates.push_preferences = {};
            if (args.promotional_push !== undefined) updates.push_preferences.promotional = args.promotional_push;
            if (args.friend_activity_push !== undefined) updates.push_preferences.friend_activity = args.friend_activity_push;
            if (args.review_comments_push !== undefined) updates.push_preferences.review_comments = args.review_comments_push;
            if (args.direct_messages_push !== undefined) updates.push_preferences.direct_messages = args.direct_messages_push;
          }
          
          const response = await yelpService.userManagement.updateUserPreferences(updates);
          
          return {
            content: [
              {
                type: 'text',
                text: formatUserPreferencesResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating user preferences: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetFriends: {
      description: "Get a user's friends",
      schema: z.object({
        user_id: z.string().optional().describe('User ID (defaults to current user)'),
        limit: z.number().optional().describe('Number of results to return (max 50)'),
        offset: z.number().optional().describe('Offset the list of returned results by this amount'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.getFriends(
            args.user_id,
            args.limit,
            args.offset
          );
          
          return {
            content: [
              {
                type: 'text',
                text: formatFriendsResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting friends: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetUserCollections: {
      description: "Get a user's collections",
      schema: z.object({
        user_id: z.string().optional().describe('User ID (defaults to current user)'),
        limit: z.number().optional().describe('Number of results to return (max 50)'),
        offset: z.number().optional().describe('Offset the list of returned results by this amount'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.getCollections(
            args.user_id,
            args.limit,
            args.offset
          );
          
          return {
            content: [
              {
                type: 'text',
                text: formatCollectionsResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting collections: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetCollectionDetails: {
      description: "Get details for a specific collection",
      schema: z.object({
        collection_id: z.string().describe('Collection ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.getCollection(args.collection_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatCollectionDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting collection details: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpCreateCollection: {
      description: "Create a new collection",
      schema: z.object({
        name: z.string().describe('Collection name'),
        description: z.string().optional().describe('Collection description'),
        is_public: z.boolean().optional().describe('Whether the collection is public (default: true)'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.createCollection(
            args.name,
            args.description,
            args.is_public
          );
          
          return {
            content: [
              {
                type: 'text',
                text: formatCollectionDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error creating collection: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpUpdateCollection: {
      description: "Update an existing collection",
      schema: z.object({
        collection_id: z.string().describe('Collection ID'),
        name: z.string().optional().describe('New collection name'),
        description: z.string().optional().describe('New collection description'),
        is_public: z.boolean().optional().describe('New public status'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.updateCollection(
            args.collection_id,
            args.name,
            args.description,
            args.is_public
          );
          
          return {
            content: [
              {
                type: 'text',
                text: formatCollectionDetails(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating collection: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpDeleteCollection: {
      description: "Delete a collection",
      schema: z.object({
        collection_id: z.string().describe('Collection ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.deleteCollection(args.collection_id);
          
          return {
            content: [
              {
                type: 'text',
                text: `Collection deletion status: ${response.success ? '✅ Successfully deleted' : '❌ Failed to delete'}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error deleting collection: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetCollectionItems: {
      description: "Get items in a collection",
      schema: z.object({
        collection_id: z.string().describe('Collection ID'),
        limit: z.number().optional().describe('Number of results to return (max 50)'),
        offset: z.number().optional().describe('Offset the list of returned results by this amount'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.getCollectionItems(
            args.collection_id,
            args.limit,
            args.offset
          );
          
          return {
            content: [
              {
                type: 'text',
                text: formatCollectionItemsResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting collection items: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpAddBusinessToCollection: {
      description: "Add a business to a collection",
      schema: z.object({
        collection_id: z.string().describe('Collection ID'),
        business_id: z.string().describe('Business ID'),
        note: z.string().optional().describe('Note about the business'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.addBusinessToCollection(
            args.collection_id,
            args.business_id,
            args.note
          );
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ Added "${response.business_name}" to collection successfully.`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error adding business to collection: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpRemoveBusinessFromCollection: {
      description: "Remove a business from a collection",
      schema: z.object({
        collection_id: z.string().describe('Collection ID'),
        item_id: z.string().describe('Collection item ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.userManagement.removeBusinessFromCollection(
            args.collection_id,
            args.item_id
          );
          
          return {
            content: [
              {
                type: 'text',
                text: `Business removal status: ${response.success ? '✅ Successfully removed' : '❌ Failed to remove'}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error removing business from collection: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    // Data Ingestion Tools
    yelpListDataSources: {
      description: "List all data sources",
      schema: z.object({
        type: z.string().optional().describe('Filter by data source type'),
        status: z.enum(['active', 'inactive', 'pending', 'error']).optional().describe('Filter by status'),
        offset: z.number().optional().describe('Pagination offset'),
        limit: z.number().optional().describe('Pagination limit'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.dataIngestion.listDataSources(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatDataSourceListResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error listing data sources: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetDataSource: {
      description: "Get details about a specific data source",
      schema: z.object({
        source_id: z.string().describe('Data source ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.dataIngestion.getDataSource(args.source_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatDataSource(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting data source details: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpCreateDataSource: {
      description: "Create a new data source",
      schema: z.object({
        name: z.string().describe('Name of the data source'),
        type: z.string().describe('Type of the data source (e.g., "csv", "database", "api")'),
        connection_details: z.record(z.any()).describe('Connection details for the data source'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.dataIngestion.createDataSource(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatDataSource(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error creating data source: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpUpdateDataSource: {
      description: "Update an existing data source",
      schema: z.object({
        source_id: z.string().describe('Data source ID to update'),
        name: z.string().optional().describe('New name for the data source'),
        connection_details: z.record(z.any()).optional().describe('New connection details for the data source'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const { source_id, ...updateData } = args;
          const response = await yelpService.dataIngestion.updateDataSource(source_id, updateData);
          
          return {
            content: [
              {
                type: 'text',
                text: formatDataSource(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating data source: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpDeleteDataSource: {
      description: "Delete a data source",
      schema: z.object({
        source_id: z.string().describe('Data source ID to delete'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.dataIngestion.deleteDataSource(args.source_id);
          
          return {
            content: [
              {
                type: 'text',
                text: `Data source deletion status: ${response.success ? '✅ Successfully deleted' : '❌ Failed to delete'}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error deleting data source: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpListDataIngestionJobs: {
      description: "List all data ingestion jobs",
      schema: z.object({
        job_type: z.string().optional().describe('Filter by job type'),
        status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional().describe('Filter by status'),
        source_id: z.string().optional().describe('Filter by source ID'),
        offset: z.number().optional().describe('Pagination offset'),
        limit: z.number().optional().describe('Pagination limit'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.dataIngestion.listDataIngestionJobs(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatDataIngestionJobListResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error listing data ingestion jobs: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetDataIngestionJob: {
      description: "Get details about a specific data ingestion job",
      schema: z.object({
        job_id: z.string().describe('Data ingestion job ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.dataIngestion.getDataIngestionJob(args.job_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatDataIngestionJob(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting data ingestion job details: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpCreateDataIngestionJob: {
      description: "Create a new data ingestion job",
      schema: z.object({
        source_id: z.string().describe('ID of the data source'),
        job_type: z.string().describe('Type of the job (e.g., "sync", "incremental", "full")'),
        schedule: z.object({
          frequency: z.string().describe('Frequency of the job (e.g., "once", "hourly", "daily", "weekly", "monthly")'),
          time: z.string().optional().describe('Time of day to run the job (if applicable)'),
          day_of_week: z.number().optional().describe('Day of week to run the job (if applicable)'),
          day_of_month: z.number().optional().describe('Day of month to run the job (if applicable)'),
        }).optional().describe('Optional schedule for the job'),
        configuration: z.record(z.any()).optional().describe('Optional configuration for the job'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.dataIngestion.createDataIngestionJob(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatDataIngestionJob(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error creating data ingestion job: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpUpdateDataIngestionJob: {
      description: "Update an existing data ingestion job",
      schema: z.object({
        job_id: z.string().describe('Data ingestion job ID to update'),
        job_type: z.string().optional().describe('New job type'),
        schedule: z.object({
          frequency: z.string().describe('Frequency of the job'),
          time: z.string().optional().describe('Time of day to run the job'),
          day_of_week: z.number().optional().describe('Day of week to run the job'),
          day_of_month: z.number().optional().describe('Day of month to run the job'),
        }).optional().describe('New schedule'),
        configuration: z.record(z.any()).optional().describe('New configuration'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const { job_id, ...updateData } = args;
          const response = await yelpService.dataIngestion.updateDataIngestionJob(job_id, updateData);
          
          return {
            content: [
              {
                type: 'text',
                text: formatDataIngestionJob(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating data ingestion job: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpCancelDataIngestionJob: {
      description: "Cancel a data ingestion job",
      schema: z.object({
        job_id: z.string().describe('Data ingestion job ID to cancel'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.dataIngestion.cancelDataIngestionJob(args.job_id);
          
          return {
            content: [
              {
                type: 'text',
                text: `Job cancellation status: ${response.success ? '✅ Successfully cancelled' : '❌ Failed to cancel'}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error cancelling data ingestion job: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpRetryDataIngestionJob: {
      description: "Retry a failed data ingestion job",
      schema: z.object({
        job_id: z.string().describe('Data ingestion job ID to retry'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.dataIngestion.retryDataIngestionJob(args.job_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatDataIngestionJob(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error retrying data ingestion job: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    // Leads Management Tools
    yelpGetLeads: {
      description: "Get list of leads with optional filtering",
      schema: z.object({
        query: z.string().optional().describe('Search query to match against lead details'),
        status: z.union([
          z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
          z.array(z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']))
        ]).optional().describe('Filter by lead status'),
        source: z.union([
          z.enum(['website', 'referral', 'advertisement', 'social_media', 'event', 'other']),
          z.array(z.enum(['website', 'referral', 'advertisement', 'social_media', 'event', 'other']))
        ]).optional().describe('Filter by lead source'),
        priority: z.union([
          z.enum(['low', 'medium', 'high']),
          z.array(z.enum(['low', 'medium', 'high']))
        ]).optional().describe('Filter by lead priority'),
        tags: z.union([z.string(), z.array(z.string())]).optional().describe('Filter by tags'),
        business_id: z.string().optional().describe('Filter by associated business ID'),
        campaign_id: z.string().optional().describe('Filter by associated campaign ID'),
        owner_id: z.string().optional().describe('Filter by owner/assignee ID'),
        created_after: z.string().optional().describe('Filter by creation date (ISO format)'),
        created_before: z.string().optional().describe('Filter by creation date (ISO format)'),
        contacted_after: z.string().optional().describe('Filter by last contact date (ISO format)'),
        contacted_before: z.string().optional().describe('Filter by last contact date (ISO format)'),
        sort_by: z.enum(['created_at', 'updated_at', 'last_contacted_at', 'name', 'priority', 'estimated_value_cents']).optional().describe('Sort results by a specific field'),
        sort_order: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
        page: z.number().optional().describe('Page number for pagination'),
        per_page: z.number().optional().describe('Number of leads per page'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.getLeads(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatLeadListResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting leads: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetLead: {
      description: "Get details about a specific lead",
      schema: z.object({
        lead_id: z.string().describe('Lead ID to retrieve'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.getLead(args.lead_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatLead(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting lead details: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpCreateLead: {
      description: "Create a new lead",
      schema: z.object({
        name: z.string().describe('Full name of the lead'),
        email: z.string().describe('Email address of the lead'),
        phone: z.string().optional().describe('Phone number of the lead'),
        company: z.string().optional().describe('Company or organization name'),
        job_title: z.string().optional().describe('Job title or position'),
        status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional().describe('Status of the lead (defaults to new)'),
        priority: z.enum(['low', 'medium', 'high']).optional().describe('Priority level of the lead (defaults to medium)'),
        source: z.enum(['website', 'referral', 'advertisement', 'social_media', 'event', 'other']).describe('Source of the lead'),
        source_details: z.string().optional().describe('Custom source details if source is other'),
        estimated_value_cents: z.number().optional().describe('Estimated value of the lead in cents'),
        address: z.object({
          street: z.string().optional().describe('Street address'),
          city: z.string().optional().describe('City'),
          state: z.string().optional().describe('State or province'),
          zip_code: z.string().optional().describe('Postal code'),
          country: z.string().optional().describe('Country'),
        }).optional().describe('Lead\'s address'),
        notes: z.string().optional().describe('Notes about the lead'),
        business_id: z.string().optional().describe('Associated business ID'),
        campaign_id: z.string().optional().describe('Associated campaign ID'),
        owner_id: z.string().optional().describe('Owner or assignee user ID'),
        tags: z.array(z.string()).optional().describe('Tags associated with the lead'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.createLead(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatLead(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error creating lead: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpUpdateLead: {
      description: "Update an existing lead",
      schema: z.object({
        lead_id: z.string().describe('Lead ID to update'),
        name: z.string().optional().describe('Full name of the lead'),
        email: z.string().optional().describe('Email address of the lead'),
        phone: z.string().optional().describe('Phone number of the lead'),
        company: z.string().optional().describe('Company or organization name'),
        job_title: z.string().optional().describe('Job title or position'),
        status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional().describe('Status of the lead'),
        priority: z.enum(['low', 'medium', 'high']).optional().describe('Priority level of the lead'),
        source: z.enum(['website', 'referral', 'advertisement', 'social_media', 'event', 'other']).optional().describe('Source of the lead'),
        source_details: z.string().optional().describe('Custom source details if source is other'),
        estimated_value_cents: z.number().optional().describe('Estimated value of the lead in cents'),
        address: z.object({
          street: z.string().optional().describe('Street address'),
          city: z.string().optional().describe('City'),
          state: z.string().optional().describe('State or province'),
          zip_code: z.string().optional().describe('Postal code'),
          country: z.string().optional().describe('Country'),
        }).optional().describe('Lead\'s address'),
        notes: z.string().optional().describe('Notes about the lead'),
        business_id: z.string().optional().describe('Associated business ID'),
        campaign_id: z.string().optional().describe('Associated campaign ID'),
        owner_id: z.string().optional().describe('Owner or assignee user ID'),
        tags: z.array(z.string()).optional().describe('Tags associated with the lead'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const { lead_id, ...updateData } = args;
          const response = await yelpService.leads.updateLead(lead_id, updateData);
          
          return {
            content: [
              {
                type: 'text',
                text: formatLead(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating lead: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpDeleteLead: {
      description: "Delete a lead",
      schema: z.object({
        lead_id: z.string().describe('Lead ID to delete'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.deleteLead(args.lead_id);
          
          return {
            content: [
              {
                type: 'text',
                text: `Lead deletion status: ${response.success ? '✅ Successfully deleted' : '❌ Failed to delete'}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error deleting lead: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetLeadNotes: {
      description: "Get notes for a lead",
      schema: z.object({
        lead_id: z.string().describe('Lead ID to get notes for'),
        page: z.number().optional().describe('Page number for pagination'),
        per_page: z.number().optional().describe('Number of notes per page'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.getLeadNotes(args.lead_id, args.page, args.per_page);
          
          return {
            content: [
              {
                type: 'text',
                text: formatLeadNoteListResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting lead notes: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpAddLeadNote: {
      description: "Add a note to a lead",
      schema: z.object({
        lead_id: z.string().describe('Lead ID to add a note to'),
        content: z.string().describe('Content of the note'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.addLeadNote(args.lead_id, { content: args.content });
          
          return {
            content: [
              {
                type: 'text',
                text: formatLeadNote(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error adding lead note: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpDeleteLeadNote: {
      description: "Delete a note from a lead",
      schema: z.object({
        lead_id: z.string().describe('Lead ID the note belongs to'),
        note_id: z.string().describe('Note ID to delete'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.deleteLeadNote(args.lead_id, args.note_id);
          
          return {
            content: [
              {
                type: 'text',
                text: `Note deletion status: ${response.success ? '✅ Successfully deleted' : '❌ Failed to delete'}`
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error deleting lead note: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetLeadActivities: {
      description: "Get activity history for a lead",
      schema: z.object({
        lead_id: z.string().describe('Lead ID to get activities for'),
        page: z.number().optional().describe('Page number for pagination'),
        per_page: z.number().optional().describe('Number of activities per page'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.getLeadActivities(args.lead_id, args.page, args.per_page);
          
          return {
            content: [
              {
                type: 'text',
                text: formatLeadActivityListResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting lead activities: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpAddLeadActivity: {
      description: "Add an activity to a lead",
      schema: z.object({
        lead_id: z.string().describe('Lead ID to add an activity to'),
        type: z.enum(['note', 'status_change', 'contact', 'email', 'call', 'meeting', 'task', 'custom']).describe('Type of activity'),
        description: z.string().describe('Description of the activity'),
        details: z.record(z.any()).optional().describe('Additional details about the activity'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const { lead_id, ...activityData } = args;
          const response = await yelpService.leads.addLeadActivity(lead_id, activityData);
          
          return {
            content: [
              {
                type: 'text',
                text: formatLeadActivity(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error adding lead activity: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpBulkUpdateLeads: {
      description: "Update multiple leads in bulk",
      schema: z.object({
        lead_ids: z.array(z.string()).describe('Array of lead IDs to update'),
        updates: z.object({
          status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional().describe('Status to set for all leads'),
          priority: z.enum(['low', 'medium', 'high']).optional().describe('Priority to set for all leads'),
          owner_id: z.string().optional().describe('Owner ID to set for all leads'),
          tags: z.array(z.string()).optional().describe('Tags to add to all leads'),
        }).describe('Updates to apply to all specified leads'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.bulkUpdateLeads(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatBulkOperationResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error updating leads in bulk: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpBulkDeleteLeads: {
      description: "Delete multiple leads in bulk",
      schema: z.object({
        lead_ids: z.array(z.string()).describe('Array of lead IDs to delete'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.bulkDeleteLeads(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatBulkOperationResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error deleting leads in bulk: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpImportLeads: {
      description: "Import leads from a data source",
      schema: z.object({
        leads: z.array(z.object({
          name: z.string().describe('Full name of the lead'),
          email: z.string().describe('Email address of the lead'),
          phone: z.string().optional().describe('Phone number of the lead'),
          company: z.string().optional().describe('Company or organization name'),
          job_title: z.string().optional().describe('Job title or position'),
          status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional().describe('Status of the lead'),
          priority: z.enum(['low', 'medium', 'high']).optional().describe('Priority level of the lead'),
          source: z.enum(['website', 'referral', 'advertisement', 'social_media', 'event', 'other']).describe('Source of the lead'),
          source_details: z.string().optional().describe('Custom source details if source is other'),
          estimated_value_cents: z.number().optional().describe('Estimated value of the lead in cents'),
          tags: z.array(z.string()).optional().describe('Tags associated with the lead'),
        })).describe('Array of leads to import'),
        skip_duplicates: z.boolean().optional().describe('Whether to skip duplicate checks (default: false)'),
        duplicate_check_field: z.enum(['email', 'phone', 'external_id']).optional().describe('Field to use for duplicate checking (default: email)'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.importLeads(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatImportLeadsResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error importing leads: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpExportLeads: {
      description: "Export leads to a file",
      schema: z.object({
        status: z.union([
          z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
          z.array(z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']))
        ]).optional().describe('Filter by lead status'),
        source: z.union([
          z.enum(['website', 'referral', 'advertisement', 'social_media', 'event', 'other']),
          z.array(z.enum(['website', 'referral', 'advertisement', 'social_media', 'event', 'other']))
        ]).optional().describe('Filter by lead source'),
        created_after: z.string().optional().describe('Filter by creation date (ISO format)'),
        created_before: z.string().optional().describe('Filter by creation date (ISO format)'),
        format: z.enum(['csv', 'json', 'xlsx']).optional().describe('Format of the export (default: csv)'),
        fields: z.array(z.string()).optional().describe('Array of field names to include in the export'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.exportLeads(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatExportLeadsResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error exporting leads: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetExportStatus: {
      description: "Check status of an export job",
      schema: z.object({
        export_job_id: z.string().describe('Export job ID to check'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.getExportStatus(args.export_job_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatExportJobStatusResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error checking export status: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpGetLeadStatistics: {
      description: "Get statistics about leads",
      schema: z.object({
        timeframe: z.enum(['all_time', 'last_7_days', 'last_30_days', 'last_90_days', 'year_to_date']).optional().describe('Timeframe for statistics (default: all_time)'),
        owner_id: z.string().optional().describe('Filter statistics by owner ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.leads.getLeadStatistics(args.timeframe, args.owner_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatLeadStatistics(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting lead statistics: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    // Respond Reviews Tools
    yelpRespondReviewsGetToken: {
      description: "Get an OAuth access token for responding to reviews",
      schema: z.object({
        client_id: z.string().describe('Client ID'),
        client_secret: z.string().describe('Client secret'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.respondReviews.getAccessToken(args.client_id, args.client_secret);
          
          return {
            content: [
              {
                type: 'text',
                text: formatRespondReviewsTokenResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting access token: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpRespondReviewsBusinesses: {
      description: "Get businesses that the user can respond to reviews for",
      schema: z.object({
        limit: z.number().optional().describe('Number of results to return (max 50)'),
        offset: z.number().optional().describe('Offset the list of returned results by this amount'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.respondReviews.getBusinesses(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatRespondReviewsBusinessesResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting businesses: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpRespondReviewsBusinessOwner: {
      description: "Get business owner information",
      schema: z.object({
        business_id: z.string().describe('Business ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.respondReviews.getBusinessOwnerInfo(args.business_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatRespondReviewsBusinessOwnerResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting business owner information: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpRespondToReview: {
      description: "Respond to a review as a business owner",
      schema: z.object({
        review_id: z.string().describe('Review ID'),
        text: z.string().describe('Response text'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.respondReviews.respondToReview(args.review_id, args.text);
          
          return {
            content: [
              {
                type: 'text',
                text: formatRespondToReviewResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error responding to review: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
  }
});

/**
 * Format respond reviews token response
 */
function formatRespondReviewsTokenResponse(response: GetAccessTokenResponse): string {
  let formattedResponse = '## OAuth Access Token\n\n';
  formattedResponse += `Token: ${response.access_token}\n`;
  formattedResponse += `Type: ${response.token_type}\n`;
  formattedResponse += `Expires In: ${response.expires_in} seconds\n`;
  
  return formattedResponse;
}

/**
 * Format respond reviews businesses response
 */
function formatRespondReviewsBusinessesResponse(response: GetBusinessesResponse): string {
  let formattedResponse = '## Your Businesses\n\n';
  
  if (response.total !== undefined) {
    formattedResponse += `Total Businesses: ${response.total}\n\n`;
  }
  
  if (response.businesses.length === 0) {
    formattedResponse += 'No businesses found.\n';
    return formattedResponse;
  }
  
  response.businesses.forEach((business, index) => {
    formattedResponse += `### ${index + 1}. ${business.name}\n`;
    formattedResponse += `ID: ${business.id}\n`;
    
    if (business.location?.display_address) {
      formattedResponse += `Address: ${business.location.display_address.join(', ')}\n`;
    }
    
    if (business.business_info) {
      if (business.business_info.review_count !== undefined) {
        formattedResponse += `Reviews: ${business.business_info.review_count}\n`;
      }
      
      if (business.business_info.rating !== undefined) {
        formattedResponse += `Rating: ${business.business_info.rating} stars\n`;
      }
    }
    
    formattedResponse += '\n';
  });
  
  return formattedResponse;
}

/**
 * Format respond reviews business owner response
 */
function formatRespondReviewsBusinessOwnerResponse(response: BusinessOwnerInfo): string {
  let formattedResponse = '## Business Owner Information\n\n';
  
  formattedResponse += `Business ID: ${response.business_id}\n`;
  formattedResponse += `Business Name: ${response.business_name}\n`;
  
  if (response.owner_name) {
    formattedResponse += `Owner Name: ${response.owner_name}\n`;
  }
  
  if (response.owner_email) {
    formattedResponse += `Owner Email: ${response.owner_email}\n`;
  }
  
  if (response.account_status) {
    formattedResponse += `Account Status: ${response.account_status}\n`;
  }
  
  if (response.permissions && response.permissions.length > 0) {
    formattedResponse += `Permissions: ${response.permissions.join(', ')}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format respond to review response
 */
function formatRespondToReviewResponse(response: RespondToReviewResponse): string {
  let formattedResponse = '## Response Submitted\n\n';
  
  formattedResponse += `Review ID: ${response.review_id}\n`;
  formattedResponse += `Business ID: ${response.business_id}\n`;
  formattedResponse += `Response: ${response.text}\n`;
  
  if (response.success) {
    formattedResponse += `Status: Success\n`;
  } else {
    formattedResponse += `Status: Failed\n`;
  }
  
  if (response.created_at) {
    const created = new Date(response.created_at).toLocaleString();
    formattedResponse += `Created: ${created}\n`;
  }
  
  if (response.updated_at) {
    const updated = new Date(response.updated_at).toLocaleString();
    formattedResponse += `Last Updated: ${updated}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format subscription plans response
 */
function formatSubscriptionPlansResponse(response: SubscriptionPlansResponse): string {
  let formattedResponse = '## Available Subscription Plans\n\n';
  
  if (response.total !== undefined) {
    formattedResponse += `Total Plans: ${response.total}\n\n`;
  }
  
  if (response.plans.length === 0) {
    formattedResponse += 'No subscription plans available.\n';
    return formattedResponse;
  }
  
  response.plans.forEach((plan, index) => {
    formattedResponse += `### ${index + 1}. ${plan.name}\n`;
    formattedResponse += `ID: ${plan.plan_id}\n`;
    
    if (plan.description) {
      formattedResponse += `Description: ${plan.description}\n`;
    }
    
    formattedResponse += `Price: $${(plan.price_cents / 100).toFixed(2)} ${plan.billing_frequency}\n`;
    formattedResponse += `Status: ${plan.status}\n`;
    
    if (plan.features && plan.features.length > 0) {
      formattedResponse += `Features:\n`;
      plan.features.forEach(feature => {
        formattedResponse += `- ${feature}\n`;
      });
    }
    
    formattedResponse += '\n';
  });
  
  return formattedResponse;
}

/**
 * Format active subscription response
 */
function formatActiveSubscriptionResponse(response: ActiveSubscription): string {
  let formattedResponse = '## Active Subscription\n\n';
  
  formattedResponse += `Subscription ID: ${response.subscription_id}\n`;
  formattedResponse += `Business ID: ${response.business_id}\n`;
  formattedResponse += `Plan: ${response.plan_name} (${response.plan_id})\n`;
  formattedResponse += `Status: ${response.status}\n`;
  formattedResponse += `Price: $${(response.price_cents / 100).toFixed(2)} ${response.billing_frequency}\n`;
  formattedResponse += `Auto-Renew: ${response.auto_renew ? 'Yes' : 'No'}\n`;
  
  const startDate = new Date(response.start_date).toLocaleDateString();
  formattedResponse += `Start Date: ${startDate}\n`;
  
  if (response.end_date) {
    const endDate = new Date(response.end_date).toLocaleDateString();
    formattedResponse += `End Date: ${endDate}\n`;
  }
  
  if (response.renewal_date) {
    const renewalDate = new Date(response.renewal_date).toLocaleDateString();
    formattedResponse += `Next Renewal: ${renewalDate}\n`;
  }
  
  if (response.features && response.features.length > 0) {
    formattedResponse += `\nFeatures:\n`;
    response.features.forEach(feature => {
      formattedResponse += `- ${feature}\n`;
    });
  }
  
  return formattedResponse;
}

/**
 * Format subscription usage response
 */
function formatSubscriptionUsageResponse(response: SubscriptionUsage): string {
  let formattedResponse = '## Subscription Usage\n\n';
  
  formattedResponse += `Subscription ID: ${response.subscription_id}\n`;
  formattedResponse += `Business ID: ${response.business_id}\n`;
  formattedResponse += `Plan ID: ${response.plan_id}\n`;
  
  const periodStart = new Date(response.period_start).toLocaleDateString();
  const periodEnd = new Date(response.period_end).toLocaleDateString();
  formattedResponse += `Current Billing Period: ${periodStart} to ${periodEnd}\n\n`;
  
  if (response.feature_usage.length === 0) {
    formattedResponse += 'No usage data available.\n';
    return formattedResponse;
  }
  
  formattedResponse += `### Feature Usage\n\n`;
  
  formattedResponse += `| Feature | Used | Total | Percentage | Unit |\n`;
  formattedResponse += `| ------- | ---- | ----- | ---------- | ---- |\n`;
  
  response.feature_usage.forEach(feature => {
    const percentUsed = ((feature.used / feature.total) * 100).toFixed(1);
    const unit = feature.unit || '';
    formattedResponse += `| ${feature.feature} | ${feature.used} | ${feature.total} | ${percentUsed}% | ${unit} |\n`;
  });
  
  return formattedResponse;
}

/**
 * Format subscription history response
 */
function formatSubscriptionHistoryResponse(response: SubscriptionHistory): string {
  let formattedResponse = '## Subscription History\n\n';
  
  formattedResponse += `Subscription ID: ${response.subscription_id}\n`;
  formattedResponse += `Business ID: ${response.business_id}\n\n`;
  
  if (response.history.length === 0) {
    formattedResponse += 'No history available.\n';
    return formattedResponse;
  }
  
  formattedResponse += `### Event History\n\n`;
  
  response.history.forEach((event, index) => {
    const date = new Date(event.date).toLocaleString();
    formattedResponse += `**${date}**: ${formatEventType(event.event_type)}`;
    
    if (event.plan_id || event.plan_name) {
      formattedResponse += ` - ${event.plan_name || event.plan_id}`;
    }
    
    formattedResponse += '\n';
    
    if (event.details) {
      if (event.event_type === 'changed' && event.details.old_plan_id && event.details.new_plan_id) {
        formattedResponse += `  Changed from ${event.details.old_plan_id} to ${event.details.new_plan_id}\n`;
      } else {
        formattedResponse += `  Details: ${JSON.stringify(event.details)}\n`;
      }
    }
    
    if (index < response.history.length - 1) {
      formattedResponse += '\n';
    }
  });
  
  return formattedResponse;
}

/**
 * Format event type for better readability
 */
function formatEventType(eventType: string): string {
  switch (eventType) {
    case 'created':
      return 'Subscription Created';
    case 'renewed':
      return 'Subscription Renewed';
    case 'canceled':
      return 'Subscription Canceled';
    case 'changed':
      return 'Plan Changed';
    case 'payment_failed':
      return 'Payment Failed';
    case 'expired':
      return 'Subscription Expired';
    default:
      return eventType.charAt(0).toUpperCase() + eventType.slice(1);
  }
}

/**
 * Format categories response
 */
function formatCategoriesResponse(response: CategoriesResponse): string {
  let formattedResponse = '## Yelp Business Categories\n\n';
  
  if (response.categories.length === 0) {
    formattedResponse += 'No categories found.\n';
    return formattedResponse;
  }
  
  formattedResponse += `Found ${response.categories.length} categories.\n\n`;
  
  // Group categories by parent
  const topLevelCategories = response.categories.filter(cat => !cat.parent_aliases || cat.parent_aliases.length === 0);
  const childCategories = response.categories.filter(cat => cat.parent_aliases && cat.parent_aliases.length > 0);
  
  // List top-level categories first
  if (topLevelCategories.length > 0) {
    formattedResponse += '### Top-Level Categories\n\n';
    topLevelCategories.forEach(cat => {
      formattedResponse += `- ${cat.title} (${cat.alias})\n`;
    });
    formattedResponse += '\n';
  }
  
  // Then categorize others by their first parent
  if (childCategories.length > 0) {
    formattedResponse += '### Sub-Categories\n\n';
    
    // Group by first parent
    const groupedByParent: Record<string, Category[]> = {};
    childCategories.forEach(cat => {
      if (cat.parent_aliases && cat.parent_aliases.length > 0) {
        const parentAlias = cat.parent_aliases[0];
        if (!groupedByParent[parentAlias]) {
          groupedByParent[parentAlias] = [];
        }
        groupedByParent[parentAlias].push(cat);
      }
    });
    
    // Output each group
    Object.keys(groupedByParent).sort().forEach(parentAlias => {
      const parentTitle = response.categories.find(c => c.alias === parentAlias)?.title || parentAlias;
      formattedResponse += `**${parentTitle}**\n`;
      
      groupedByParent[parentAlias].sort((a, b) => a.title.localeCompare(b.title)).forEach(cat => {
        formattedResponse += `- ${cat.title} (${cat.alias})\n`;
      });
      
      formattedResponse += '\n';
    });
  }
  
  return formattedResponse;
}

/**
 * Format category details response
 */
function formatCategoryDetails(category: Category): string {
  let formattedResponse = `## Category: ${category.title}\n\n`;
  
  formattedResponse += `Alias: ${category.alias}\n\n`;
  
  if (category.parent_aliases && category.parent_aliases.length > 0) {
    formattedResponse += '### Parent Categories\n';
    for (let i = 0; i < category.parent_aliases.length; i++) {
      const parentAlias = category.parent_aliases[i];
      const parentTitle = category.parent_titles?.[i] || parentAlias;
      formattedResponse += `- ${parentTitle} (${parentAlias})\n`;
    }
    formattedResponse += '\n';
  }
  
  if (category.country_whitelist && category.country_whitelist.length > 0) {
    formattedResponse += '### Available In\n';
    formattedResponse += category.country_whitelist.join(', ') + '\n\n';
  }
  
  if (category.country_blacklist && category.country_blacklist.length > 0) {
    formattedResponse += '### Not Available In\n';
    formattedResponse += category.country_blacklist.join(', ') + '\n\n';
  }
  
  return formattedResponse;
}

/**
 * Format event search response
 */
function formatEventSearchResponse(response: EventSearchResponse): string {
  let formattedResponse = '## Yelp Events\n\n';
  
  if (response.total !== undefined) {
    formattedResponse += `Found ${response.total} events.\n\n`;
  }
  
  if (response.events.length === 0) {
    formattedResponse += 'No events found matching your criteria.\n';
    return formattedResponse;
  }
  
  response.events.forEach((event, index) => {
    formattedResponse += `### ${index + 1}. ${event.name}\n`;
    
    if (event.description) {
      formattedResponse += `${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}\n\n`;
    }
    
    if (event.time_start) {
      const startDate = new Date(event.time_start).toLocaleString();
      formattedResponse += `**When**: ${startDate}`;
      
      if (event.time_end) {
        const endDate = new Date(event.time_end).toLocaleString();
        formattedResponse += ` to ${endDate}`;
      }
      
      formattedResponse += '\n';
    }
    
    if (event.location && event.location.display_address) {
      formattedResponse += `**Where**: ${event.location.display_address.join(', ')}\n`;
    }
    
    if (event.is_free !== undefined) {
      formattedResponse += `**Cost**: ${event.is_free ? 'Free' : (event.cost ? '$' + event.cost : 'Paid')}\n`;
    }
    
    if (event.category) {
      formattedResponse += `**Category**: ${event.category}\n`;
    }
    
    if (event.attending_count) {
      formattedResponse += `**Attending**: ${event.attending_count} people\n`;
    }
    
    if (event.url) {
      formattedResponse += `**Details**: ${event.url}\n`;
    }
    
    formattedResponse += '\n';
  });
  
  return formattedResponse;
}

/**
 * Format event details response
 */
function formatEventDetails(event: Event): string {
  let formattedResponse = `## ${event.name}\n\n`;
  
  if (event.description) {
    formattedResponse += `${event.description}\n\n`;
  }
  
  formattedResponse += '### Event Details\n\n';
  
  if (event.time_start) {
    const startDate = new Date(event.time_start).toLocaleString();
    formattedResponse += `**Date**: ${startDate}`;
    
    if (event.time_end) {
      const endDate = new Date(event.time_end).toLocaleString();
      formattedResponse += ` to ${endDate}`;
    }
    
    formattedResponse += '\n';
  }
  
  if (event.location) {
    formattedResponse += '**Location**: ';
    if (event.location.display_address) {
      formattedResponse += event.location.display_address.join(', ');
    } else {
      const addressParts = [];
      if (event.location.address1) addressParts.push(event.location.address1);
      if (event.location.address2) addressParts.push(event.location.address2);
      if (event.location.address3) addressParts.push(event.location.address3);
      
      if (event.location.city) {
        const cityStateParts = [event.location.city];
        if (event.location.state) cityStateParts.push(event.location.state);
        if (event.location.zip_code) cityStateParts.push(event.location.zip_code);
        addressParts.push(cityStateParts.join(', '));
      }
      
      if (event.location.country) addressParts.push(event.location.country);
      
      formattedResponse += addressParts.join(', ');
    }
    formattedResponse += '\n';
  }
  
  if (event.is_free !== undefined) {
    formattedResponse += `**Cost**: ${event.is_free ? 'Free' : (event.cost ? '$' + event.cost : 'Paid')}\n`;
  }
  
  if (event.category) {
    formattedResponse += `**Category**: ${event.category}\n`;
  }
  
  if (event.business_id) {
    formattedResponse += `**Hosted by**: Business ID ${event.business_id}\n`;
  }
  
  formattedResponse += '\n### Attendance\n\n';
  
  if (event.attending_count !== undefined) {
    formattedResponse += `**Going**: ${event.attending_count} people\n`;
  }
  
  if (event.interested_count !== undefined) {
    formattedResponse += `**Interested**: ${event.interested_count} people\n`;
  }
  
  formattedResponse += '\n';
  
  if (event.tickets_url) {
    formattedResponse += `**Tickets**: ${event.tickets_url}\n\n`;
  }
  
  if (event.url) {
    formattedResponse += `**Event page**: ${event.url}\n\n`;
  }
  
  return formattedResponse;
}

/**
 * Format featured event response
 */
function formatFeaturedEventResponse(response: FeaturedEventResponse): string {
  let formattedResponse = '## Featured Event\n\n';
  formattedResponse += formatEventDetails(response.featured_event);
  return formattedResponse;
}

/**
 * Format payment methods response
 */
function formatPaymentMethodsResponse(response: PaymentMethodsResponse): string {
  let formattedResponse = '## Payment Methods\n\n';
  
  if (response.total !== undefined) {
    formattedResponse += `Total: ${response.total} payment methods\n\n`;
  }
  
  if (response.payment_methods.length === 0) {
    formattedResponse += 'No payment methods found.\n';
    return formattedResponse;
  }
  
  response.payment_methods.forEach((method, index) => {
    formattedResponse += `### ${index + 1}. Payment Method\n`;
    formattedResponse += `ID: ${method.payment_method_id}\n`;
    formattedResponse += `Type: ${method.type}\n`;
    formattedResponse += `Status: ${method.status}\n`;
    formattedResponse += `Default: ${method.is_default ? 'Yes' : 'No'}\n`;
    
    if (method.card_details) {
      formattedResponse += `Card: ${method.card_details.brand} ending in ${method.card_details.last4}\n`;
      formattedResponse += `Expires: ${method.card_details.exp_month}/${method.card_details.exp_year}\n`;
    }
    
    const createdDate = new Date(method.created_at).toLocaleDateString();
    formattedResponse += `Created: ${createdDate}\n\n`;
  });
  
  return formattedResponse;
}

/**
 * Format payment method details
 */
function formatPaymentMethodDetails(method: PaymentMethod): string {
  let formattedResponse = '## Payment Method Details\n\n';
  
  formattedResponse += `ID: ${method.payment_method_id}\n`;
  formattedResponse += `Type: ${method.type}\n`;
  formattedResponse += `Status: ${method.status}\n`;
  formattedResponse += `Default: ${method.is_default ? 'Yes' : 'No'}\n`;
  
  if (method.card_details) {
    formattedResponse += '\n### Card Details\n\n';
    formattedResponse += `Brand: ${method.card_details.brand}\n`;
    formattedResponse += `Last 4 Digits: ${method.card_details.last4}\n`;
    formattedResponse += `Expiration: ${method.card_details.exp_month}/${method.card_details.exp_year}\n`;
  }
  
  const createdDate = new Date(method.created_at).toLocaleDateString();
  const updatedDate = new Date(method.updated_at).toLocaleDateString();
  
  formattedResponse += '\n### Dates\n\n';
  formattedResponse += `Created: ${createdDate}\n`;
  formattedResponse += `Last Updated: ${updatedDate}\n`;
  
  return formattedResponse;
}

/**
 * Format invoices response
 */
function formatInvoicesResponse(response: InvoicesResponse): string {
  let formattedResponse = '## Invoices\n\n';
  
  if (response.total !== undefined) {
    formattedResponse += `Total: ${response.total} invoices\n\n`;
  }
  
  if (response.invoices.length === 0) {
    formattedResponse += 'No invoices found.\n';
    return formattedResponse;
  }
  
  formattedResponse += '| Invoice # | Date | Amount | Status |\n';
  formattedResponse += '| --------- | ---- | ------ | ------ |\n';
  
  response.invoices.forEach(invoice => {
    const issueDate = new Date(invoice.issue_date).toLocaleDateString();
    const amount = `$${(invoice.amount_cents / 100).toFixed(2)}`;
    const status = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
    formattedResponse += `| [${invoice.invoice_number}](${invoice.portal_url || '#'}) | ${issueDate} | ${amount} | ${status} |\n`;
  });
  
  formattedResponse += '\nClick on an invoice number to view details.\n';
  
  return formattedResponse;
}

/**
 * Format invoice details
 */
function formatInvoiceDetails(invoice: Invoice): string {
  let formattedResponse = `## Invoice #${invoice.invoice_number}\n\n`;
  
  formattedResponse += `ID: ${invoice.invoice_id}\n`;
  
  if (invoice.business_id) {
    formattedResponse += `Business ID: ${invoice.business_id}\n`;
  }
  
  if (invoice.subscription_id) {
    formattedResponse += `Subscription ID: ${invoice.subscription_id}\n`;
  }
  
  formattedResponse += `Amount: $${(invoice.amount_cents / 100).toFixed(2)} ${invoice.currency}\n`;
  formattedResponse += `Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}\n`;
  
  const issueDate = new Date(invoice.issue_date).toLocaleDateString();
  const dueDate = new Date(invoice.due_date).toLocaleDateString();
  
  formattedResponse += `Issue Date: ${issueDate}\n`;
  formattedResponse += `Due Date: ${dueDate}\n`;
  
  if (invoice.payment_date) {
    const paymentDate = new Date(invoice.payment_date).toLocaleDateString();
    formattedResponse += `Payment Date: ${paymentDate}\n`;
  }
  
  if (invoice.line_items && invoice.line_items.length > 0) {
    formattedResponse += '\n### Line Items\n\n';
    formattedResponse += '| Description | Type | Quantity | Amount |\n';
    formattedResponse += '| ----------- | ---- | -------- | ------ |\n';
    
    invoice.line_items.forEach(item => {
      const type = item.type.charAt(0).toUpperCase() + item.type.slice(1);
      const amount = `$${(item.amount_cents / 100).toFixed(2)}`;
      formattedResponse += `| ${item.description} | ${type} | ${item.quantity} | ${amount} |\n`;
    });
  }
  
  if (invoice.pdf_url) {
    formattedResponse += `\n[Download PDF Invoice](${invoice.pdf_url})\n`;
  }
  
  if (invoice.portal_url) {
    formattedResponse += `\n[View in Portal](${invoice.portal_url})\n`;
  }
  
  return formattedResponse;
}

/**
 * Format payments response
 */
function formatPaymentsResponse(response: PaymentsResponse): string {
  let formattedResponse = '## Payments\n\n';
  
  if (response.total !== undefined) {
    formattedResponse += `Total: ${response.total} payments\n\n`;
  }
  
  if (response.payments.length === 0) {
    formattedResponse += 'No payments found.\n';
    return formattedResponse;
  }
  
  formattedResponse += '| Date | Amount | Status | Invoice # |\n';
  formattedResponse += '| ---- | ------ | ------ | --------- |\n';
  
  response.payments.forEach(payment => {
    const paymentDate = new Date(payment.payment_date).toLocaleDateString();
    const amount = `$${(payment.amount_cents / 100).toFixed(2)}`;
    const status = payment.status.charAt(0).toUpperCase() + payment.status.slice(1);
    formattedResponse += `| ${paymentDate} | ${amount} | ${status} | ${payment.invoice_id} |\n`;
  });
  
  return formattedResponse;
}

/**
 * Format payment details
 */
function formatPaymentDetails(payment: Payment): string {
  let formattedResponse = '## Payment Details\n\n';
  
  formattedResponse += `Payment ID: ${payment.payment_id}\n`;
  formattedResponse += `Invoice ID: ${payment.invoice_id}\n`;
  
  if (payment.business_id) {
    formattedResponse += `Business ID: ${payment.business_id}\n`;
  }
  
  if (payment.subscription_id) {
    formattedResponse += `Subscription ID: ${payment.subscription_id}\n`;
  }
  
  formattedResponse += `Amount: $${(payment.amount_cents / 100).toFixed(2)} ${payment.currency}\n`;
  formattedResponse += `Status: ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}\n`;
  formattedResponse += `Payment Method ID: ${payment.payment_method_id}\n`;
  
  const paymentDate = new Date(payment.payment_date).toLocaleDateString();
  formattedResponse += `Payment Date: ${paymentDate}\n`;
  
  if (payment.failure_reason) {
    formattedResponse += `\n### Failure Details\n\nReason: ${payment.failure_reason}\n`;
  }
  
  if (payment.receipt_url) {
    formattedResponse += `\n[View Receipt](${payment.receipt_url})\n`;
  }
  
  return formattedResponse;
}

/**
 * Format event search response
 */
function formatEventSearchResponse(response: EventSearchResponse): string {
  let formattedResponse = '## Yelp Events\n\n';
  
  if (response.total !== undefined) {
    formattedResponse += `Found ${response.total} events.\n\n`;
  }
  
  if (response.events.length === 0) {
    formattedResponse += 'No events found matching your criteria.\n';
    return formattedResponse;
  }
  
  response.events.forEach((event, index) => {
    formattedResponse += `### ${index + 1}. ${event.name}\n`;
    
    if (event.description) {
      formattedResponse += `${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}\n\n`;
    }
    
    if (event.time_start) {
      const startDate = new Date(event.time_start).toLocaleString();
      formattedResponse += `**When**: ${startDate}`;
      
      if (event.time_end) {
        const endDate = new Date(event.time_end).toLocaleString();
        formattedResponse += ` to ${endDate}`;
      }
      
      formattedResponse += '\n';
    }
    
    if (event.location && event.location.display_address) {
      formattedResponse += `**Where**: ${event.location.display_address.join(', ')}\n`;
    }
    
    if (event.is_free !== undefined) {
      formattedResponse += `**Cost**: ${event.is_free ? 'Free' : (event.cost ? '$' + event.cost : 'Paid')}\n`;
    }
    
    if (event.category) {
      formattedResponse += `**Category**: ${event.category}\n`;
    }
    
    if (event.attending_count) {
      formattedResponse += `**Attending**: ${event.attending_count} people\n`;
    }
    
    if (event.url) {
      formattedResponse += `**Details**: ${event.url}\n`;
    }
    
    formattedResponse += '\n';
  });
  
  return formattedResponse;
}

/**
 * Format event details response
 */
function formatEventDetails(event: Event): string {
  let formattedResponse = `## ${event.name}\n\n`;
  
  if (event.description) {
    formattedResponse += `${event.description}\n\n`;
  }
  
  formattedResponse += '### Event Details\n\n';
  
  if (event.time_start) {
    const startDate = new Date(event.time_start).toLocaleString();
    formattedResponse += `**Date**: ${startDate}`;
    
    if (event.time_end) {
      const endDate = new Date(event.time_end).toLocaleString();
      formattedResponse += ` to ${endDate}`;
    }
    
    formattedResponse += '\n';
  }
  
  if (event.location) {
    formattedResponse += '**Location**: ';
    if (event.location.display_address) {
      formattedResponse += event.location.display_address.join(', ');
    } else {
      const addressParts = [];
      if (event.location.address1) addressParts.push(event.location.address1);
      if (event.location.address2) addressParts.push(event.location.address2);
      if (event.location.address3) addressParts.push(event.location.address3);
      
      if (event.location.city) {
        const cityStateParts = [event.location.city];
        if (event.location.state) cityStateParts.push(event.location.state);
        if (event.location.zip_code) cityStateParts.push(event.location.zip_code);
        addressParts.push(cityStateParts.join(', '));
      }
      
      if (event.location.country) addressParts.push(event.location.country);
      
      formattedResponse += addressParts.join(', ');
    }
    formattedResponse += '\n';
  }
  
  if (event.is_free !== undefined) {
    formattedResponse += `**Cost**: ${event.is_free ? 'Free' : event.cost ? '$' + event.cost : 'Paid'}\n`;
  }
  
  if (event.category) {
    formattedResponse += `**Category**: ${event.category}\n`;
  }
  
  if (event.business_id) {
    formattedResponse += `**Hosted by**: Business ID ${event.business_id}\n`;
  }
  
  formattedResponse += '\n### Attendance\n\n';
  
  if (event.attending_count !== undefined) {
    formattedResponse += `**Going**: ${event.attending_count} people\n`;
  }
  
  if (event.interested_count !== undefined) {
    formattedResponse += `**Interested**: ${event.interested_count} people\n`;
  }
  
  formattedResponse += '\n';
  
  if (event.tickets_url) {
    formattedResponse += `**Tickets**: ${event.tickets_url}\n\n`;
  }
  
  if (event.url) {
    formattedResponse += `**Event page**: ${event.url}\n\n`;
  }
  
  return formattedResponse;
}

/**
 * Format featured event response
 */
function formatFeaturedEventResponse(response: FeaturedEventResponse): string {
  let formattedResponse = '## Featured Event\n\n';
  formattedResponse += formatEventDetails(response.featured_event);
  return formattedResponse;
}

/**
 * Format claim eligibility response
 */
function formatClaimEligibilityResponse(response: ClaimEligibility): string {
  let formattedResponse = '## Business Claim Eligibility\n\n';
  
  formattedResponse += `Business ID: ${response.business_id}\n`;
  formattedResponse += `Eligibility: ${response.eligible ? '✅ Eligible' : '❌ Not Eligible'}\n`;
  
  if (response.claim_status) {
    const statusMap: Record<string, string> = {
      'unclaimed': '📝 Unclaimed',
      'claimed': '✅ Already Claimed',
      'pending': '⏳ Claim Pending',
      'ineligible': '❌ Ineligible'
    };
    
    const formattedStatus = statusMap[response.claim_status] || response.claim_status;
    formattedResponse += `Claim Status: ${formattedStatus}\n`;
  }
  
  if (response.ineligibility_reason) {
    formattedResponse += `\n### Ineligibility Reason\n${response.ineligibility_reason}\n`;
  }
  
  if (response.details) {
    formattedResponse += `\n### Additional Details\n${response.details}\n`;
  }
  
  if (response.available_methods && response.available_methods.length > 0) {
    formattedResponse += '\n### Available Verification Methods\n';
    response.available_methods.forEach(method => {
      formattedResponse += `- ${method.charAt(0).toUpperCase() + method.slice(1)}\n`;
    });
  }
  
  return formattedResponse;
}

/**
 * Format claim response
 */
function formatClaimResponse(response: ClaimResponse): string {
  let formattedResponse = '## Business Claim Submitted\n\n';
  
  formattedResponse += `Claim ID: ${response.claim_id}\n`;
  formattedResponse += `Business ID: ${response.business_id}\n`;
  
  const statusMap: Record<string, string> = {
    'pending': '⏳ Pending',
    'approved': '✅ Approved',
    'rejected': '❌ Rejected',
    'verification_needed': '🔍 Verification Needed'
  };
  
  const formattedStatus = statusMap[response.status] || response.status;
  formattedResponse += `Status: ${formattedStatus}\n`;
  formattedResponse += `Verification Method: ${response.verification_method.charAt(0).toUpperCase() + response.verification_method.slice(1)}\n`;
  
  if (response.verification_code) {
    formattedResponse += `\n### Verification Code\n${response.verification_code}\n`;
  }
  
  if (response.verification_instructions) {
    formattedResponse += `\n### Verification Instructions\n${response.verification_instructions}\n`;
  }
  
  if (response.verification_expires_at) {
    const expiresDate = new Date(response.verification_expires_at).toLocaleString();
    formattedResponse += `\n**Verification Expires**: ${expiresDate}\n`;
  }
  
  const createdDate = new Date(response.created_at).toLocaleDateString();
  formattedResponse += `\nSubmitted: ${createdDate}\n`;
  
  return formattedResponse;
}

/**
 * Format claim status response
 */
function formatClaimStatusResponse(response: ClaimStatus): string {
  let formattedResponse = '## Business Claim Status\n\n';
  
  formattedResponse += `Claim ID: ${response.claim_id}\n`;
  formattedResponse += `Business ID: ${response.business_id}\n`;
  
  const statusMap: Record<string, string> = {
    'pending': '⏳ Pending',
    'approved': '✅ Approved',
    'rejected': '❌ Rejected',
    'verification_needed': '🔍 Verification Needed'
  };
  
  const formattedStatus = statusMap[response.status] || response.status;
  formattedResponse += `Status: ${formattedStatus}\n`;
  
  if (response.status_message) {
    formattedResponse += `Status Message: ${response.status_message}\n`;
  }
  
  formattedResponse += `Verification Method: ${response.verification_method.charAt(0).toUpperCase() + response.verification_method.slice(1)}\n`;
  formattedResponse += `Verification Completed: ${response.verification_completed ? 'Yes' : 'No'}\n`;
  
  if (response.decision_date) {
    const decisionDate = new Date(response.decision_date).toLocaleDateString();
    formattedResponse += `Decision Date: ${decisionDate}\n`;
  }
  
  const createdDate = new Date(response.created_at).toLocaleDateString();
  const updatedDate = new Date(response.updated_at).toLocaleDateString();
  
  formattedResponse += `Created: ${createdDate}\n`;
  formattedResponse += `Last Updated: ${updatedDate}\n`;
  
  if (response.next_steps) {
    formattedResponse += `\n### Next Steps\n${response.next_steps}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format verification response
 */
function formatVerificationResponse(response: VerificationResponse): string {
  let formattedResponse = '## Verification Result\n\n';
  
  formattedResponse += `Claim ID: ${response.claim_id}\n`;
  formattedResponse += `Verification: ${response.success ? '✅ Successful' : '❌ Failed'}\n`;
  
  const statusMap: Record<string, string> = {
    'pending': '⏳ Pending',
    'approved': '✅ Approved',
    'rejected': '❌ Rejected',
    'verification_needed': '🔍 Verification Needed'
  };
  
  const formattedStatus = statusMap[response.claim_status] || response.claim_status;
  formattedResponse += `Claim Status: ${formattedStatus}\n`;
  
  if (response.error_message) {
    formattedResponse += `\n### Error\n${response.error_message}\n`;
  }
  
  if (response.next_steps) {
    formattedResponse += `\n### Next Steps\n${response.next_steps}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format document upload response
 */
function formatDocumentUploadResponse(response: DocumentUploadResponse): string {
  let formattedResponse = '## Document Upload\n\n';
  
  formattedResponse += `Upload ID: ${response.upload_id}\n`;
  formattedResponse += `Claim ID: ${response.claim_id}\n`;
  
  const statusMap: Record<string, string> = {
    'pending': '⏳ Pending Review',
    'approved': '✅ Approved',
    'rejected': '❌ Rejected'
  };
  
  const formattedStatus = statusMap[response.status] || response.status;
  formattedResponse += `Status: ${formattedStatus}\n`;
  
  const documentTypeMap: Record<string, string> = {
    'business_license': 'Business License',
    'utility_bill': 'Utility Bill',
    'tax_document': 'Tax Document',
    'other': 'Other Document'
  };
  
  const formattedType = documentTypeMap[response.document_type] || response.document_type;
  formattedResponse += `Document Type: ${formattedType}\n`;
  
  const createdDate = new Date(response.created_at).toLocaleDateString();
  formattedResponse += `Uploaded: ${createdDate}\n`;
  
  return formattedResponse;
}

/**
 * Format user profile response
 */
function formatUserProfileResponse(profile: UserProfile): string {
  let formattedResponse = '## User Profile\n\n';
  
  formattedResponse += `Name: ${profile.name}\n`;
  formattedResponse += `User ID: ${profile.user_id}\n`;
  
  if (profile.email) {
    formattedResponse += `Email: ${profile.email}\n`;
  }
  
  if (profile.location) {
    let location = profile.location.city;
    if (profile.location.state_code) location += `, ${profile.location.state_code}`;
    if (profile.location.country_code) location += `, ${profile.location.country_code}`;
    formattedResponse += `Location: ${location}\n`;
  }
  
  const joinedDate = new Date(profile.joined_date).toLocaleDateString();
  formattedResponse += `Joined Yelp: ${joinedDate}\n`;
  formattedResponse += `Review Count: ${profile.review_count}\n`;
  formattedResponse += `Photo Count: ${profile.photo_count}\n`;
  
  if (profile.elite_years && profile.elite_years.length > 0) {
    formattedResponse += `Elite Years: ${profile.elite_years.join(', ')}\n`;
  }
  
  if (profile.social_stats) {
    formattedResponse += '\n### Social Stats\n';
    formattedResponse += `Friends: ${profile.social_stats.friends}\n`;
    formattedResponse += `Fans: ${profile.social_stats.fans}\n`;
    formattedResponse += `Compliments: ${profile.social_stats.compliments}\n`;
  }
  
  if (profile.metrics) {
    formattedResponse += '\n### Review Metrics\n';
    formattedResponse += `Average Rating: ${profile.metrics.average_rating.toFixed(1)} stars\n`;
    
    if (profile.metrics.rating_distribution) {
      formattedResponse += '\n**Rating Distribution**\n';
      for (let i = 5; i >= 1; i--) {
        const count = profile.metrics.rating_distribution[i.toString() as '1'|'2'|'3'|'4'|'5'] || 0;
        formattedResponse += `${i} Star${i !== 1 ? 's' : ''}: ${count}\n`;
      }
    }
  }
  
  if (profile.image_url) {
    formattedResponse += `\n![Profile Image](${profile.image_url})\n`;
  }
  
  return formattedResponse;
}

/**
 * Format user preferences response
 */
function formatUserPreferencesResponse(preferences: UserPreferences): string {
  let formattedResponse = '## User Preferences\n\n';
  
  if (preferences.display_preferences) {
    formattedResponse += '### Display Preferences\n';
    formattedResponse += `Language: ${preferences.display_preferences.language}\n`;
    formattedResponse += `Currency: ${preferences.display_preferences.currency}\n`;
    formattedResponse += `Distance Unit: ${preferences.display_preferences.distance_unit === 'mi' ? 'Miles' : 'Kilometers'}\n\n`;
  }
  
  if (preferences.email_preferences) {
    formattedResponse += '### Email Notifications\n';
    formattedResponse += `Promotional: ${preferences.email_preferences.promotional ? '✅' : '❌'}\n`;
    formattedResponse += `Friend Activity: ${preferences.email_preferences.friend_activity ? '✅' : '❌'}\n`;
    formattedResponse += `Review Comments: ${preferences.email_preferences.review_comments ? '✅' : '❌'}\n`;
    formattedResponse += `Direct Messages: ${preferences.email_preferences.direct_messages ? '✅' : '❌'}\n\n`;
  }
  
  if (preferences.push_preferences) {
    formattedResponse += '### Push Notifications\n';
    formattedResponse += `Promotional: ${preferences.push_preferences.promotional ? '✅' : '❌'}\n`;
    formattedResponse += `Friend Activity: ${preferences.push_preferences.friend_activity ? '✅' : '❌'}\n`;
    formattedResponse += `Review Comments: ${preferences.push_preferences.review_comments ? '✅' : '❌'}\n`;
    formattedResponse += `Direct Messages: ${preferences.push_preferences.direct_messages ? '✅' : '❌'}\n\n`;
  }
  
  if (preferences.search_preferences) {
    formattedResponse += '### Search Preferences\n';
    
    if (preferences.search_preferences.default_location) {
      formattedResponse += `Default Location: ${preferences.search_preferences.default_location}\n`;
    }
    
    if (preferences.search_preferences.default_radius) {
      const radiusInMiles = (preferences.search_preferences.default_radius / 1609.34).toFixed(1);
      formattedResponse += `Default Radius: ${preferences.search_preferences.default_radius}m (${radiusInMiles} miles)\n`;
    }
    
    if (preferences.search_preferences.price_filter && preferences.search_preferences.price_filter.length > 0) {
      const priceFilters = preferences.search_preferences.price_filter
        .map(p => '$'.repeat(p))
        .join(', ');
      formattedResponse += `Price Filters: ${priceFilters}\n`;
    }
    
    if (preferences.search_preferences.cuisine_preferences && preferences.search_preferences.cuisine_preferences.length > 0) {
      formattedResponse += `Cuisine Preferences: ${preferences.search_preferences.cuisine_preferences.join(', ')}\n`;
    }
  }
  
  return formattedResponse;
}

/**
 * Format friends response
 */
function formatFriendsResponse(response: FriendsResponse): string {
  let formattedResponse = '## Friends\n\n';
  
  formattedResponse += `Total Friends: ${response.total}\n\n`;
  
  if (response.friends.length === 0) {
    formattedResponse += 'No friends found.\n';
    return formattedResponse;
  }
  
  response.friends.forEach((friend, index) => {
    formattedResponse += `### ${index + 1}. ${friend.name}\n`;
    formattedResponse += `User ID: ${friend.user_id}\n`;
    
    if (friend.location) {
      formattedResponse += `Location: ${friend.location}\n`;
    }
    
    formattedResponse += `Reviews: ${friend.review_count}\n`;
    
    if (friend.elite_years && friend.elite_years.length > 0) {
      formattedResponse += `Elite Years: ${friend.elite_years.join(', ')}\n`;
    }
    
    const friendSince = new Date(friend.friend_since).toLocaleDateString();
    formattedResponse += `Friends Since: ${friendSince}\n\n`;
  });
  
  if (response.pagination && response.pagination.next_offset) {
    formattedResponse += `*There are more friends available. Use offset=${response.pagination.next_offset} to see more.*\n`;
  }
  
  return formattedResponse;
}

/**
 * Format collections response
 */
function formatCollectionsResponse(response: CollectionsResponse): string {
  let formattedResponse = '## Collections\n\n';
  
  formattedResponse += `Total Collections: ${response.total}\n\n`;
  
  if (response.collections.length === 0) {
    formattedResponse += 'No collections found.\n';
    return formattedResponse;
  }
  
  response.collections.forEach((collection, index) => {
    formattedResponse += `### ${index + 1}. ${collection.name}\n`;
    formattedResponse += `ID: ${collection.collection_id}\n`;
    
    if (collection.description) {
      formattedResponse += `Description: ${collection.description}\n`;
    }
    
    formattedResponse += `Items: ${collection.item_count}\n`;
    formattedResponse += `Public: ${collection.is_public ? 'Yes' : 'No'}\n`;
    
    const createdDate = new Date(collection.created_at).toLocaleDateString();
    formattedResponse += `Created: ${createdDate}\n\n`;
  });
  
  if (response.pagination && response.pagination.next_offset) {
    formattedResponse += `*There are more collections available. Use offset=${response.pagination.next_offset} to see more.*\n`;
  }
  
  return formattedResponse;
}

/**
 * Format collection details
 */
function formatCollectionDetails(collection: Collection): string {
  let formattedResponse = `## Collection: ${collection.name}\n\n`;
  
  formattedResponse += `ID: ${collection.collection_id}\n`;
  formattedResponse += `Owner ID: ${collection.user_id}\n`;
  
  if (collection.description) {
    formattedResponse += `Description: ${collection.description}\n`;
  }
  
  formattedResponse += `Items: ${collection.item_count}\n`;
  formattedResponse += `Public: ${collection.is_public ? 'Yes' : 'No'}\n`;
  
  const createdDate = new Date(collection.created_at).toLocaleDateString();
  const updatedDate = new Date(collection.updated_at).toLocaleDateString();
  
  formattedResponse += `Created: ${createdDate}\n`;
  formattedResponse += `Last Updated: ${updatedDate}\n`;
  
  if (collection.cover_image_url) {
    formattedResponse += `\n![Cover Image](${collection.cover_image_url})\n`;
  }
  
  return formattedResponse;
}

/**
 * Format collection items response
 */
function formatCollectionItemsResponse(response: CollectionItemsResponse): string {
  let formattedResponse = `## Collection: ${response.name}\n\n`;
  
  formattedResponse += `Collection ID: ${response.collection_id}\n`;
  formattedResponse += `Total Items: ${response.total}\n\n`;
  
  if (response.items.length === 0) {
    formattedResponse += 'No items in this collection.\n';
    return formattedResponse;
  }
  
  response.items.forEach((item, index) => {
    formattedResponse += `### ${index + 1}. ${item.business_name}\n`;
    formattedResponse += `Business ID: ${item.business_id}\n`;
    
    if (item.note) {
      formattedResponse += `Note: ${item.note}\n`;
    }
    
    const addedDate = new Date(item.added_at).toLocaleDateString();
    formattedResponse += `Added: ${addedDate}\n`;
    
    if (item.business_image_url) {
      formattedResponse += `\n![Business Image](${item.business_image_url})\n`;
    }
    
    formattedResponse += '\n';
  });
  
  if (response.pagination && response.pagination.next_offset) {
    formattedResponse += `*There are more items available. Use offset=${response.pagination.next_offset} to see more.*\n`;
  }
  
  return formattedResponse;
}

/**
 * Format data source response
 */
function formatDataSource(dataSource: DataSource): string {
  const statusEmoji = {
    'active': '✅',
    'inactive': '⚪',
    'pending': '⏳',
    'error': '❌'
  };

  let formattedResponse = `## Data Source: ${dataSource.name}\n\n`;
  formattedResponse += `Source ID: ${dataSource.id}\n`;
  formattedResponse += `Type: ${dataSource.type}\n`;
  formattedResponse += `Status: ${statusEmoji[dataSource.status] || ''} ${dataSource.status}\n`;
  formattedResponse += `Last Updated: ${dataSource.last_updated}\n`;
  formattedResponse += `Created: ${dataSource.created_at}\n\n`;

  if (dataSource.connection_details && Object.keys(dataSource.connection_details).length > 0) {
    formattedResponse += '### Connection Details\n\n';
    
    for (const [key, value] of Object.entries(dataSource.connection_details)) {
      const formattedValue = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);
      formattedResponse += `${key}: ${formattedValue}\n`;
    }
  }

  return formattedResponse;
}

/**
 * Format data source list response
 */
function formatDataSourceListResponse(response: DataSourceListResponse): string {
  let formattedResponse = '## Data Sources\n\n';
  
  if (response.data_sources.length === 0) {
    formattedResponse += 'No data sources found.\n';
    return formattedResponse;
  }
  
  const statusEmoji = {
    'active': '✅',
    'inactive': '⚪',
    'pending': '⏳',
    'error': '❌'
  };

  response.data_sources.forEach((source, index) => {
    formattedResponse += `### ${index + 1}. ${source.name}\n`;
    formattedResponse += `Source ID: ${source.id}\n`;
    formattedResponse += `Type: ${source.type}\n`;
    formattedResponse += `Status: ${statusEmoji[source.status] || ''} ${source.status}\n`;
    formattedResponse += `Last Updated: ${source.last_updated}\n`;
    formattedResponse += `Created: ${source.created_at}\n\n`;
  });
  
  if (response.pagination) {
    formattedResponse += `Found ${response.pagination.total} total data sources.\n`;
    
    if (response.pagination.offset > 0 || response.pagination.limit < response.pagination.total) {
      formattedResponse += `Showing items ${response.pagination.offset + 1} to ${Math.min(response.pagination.offset + response.pagination.limit, response.pagination.total)}.\n`;
    }
  }
  
  return formattedResponse;
}

/**
 * Format data ingestion job response
 */
function formatDataIngestionJob(job: DataIngestionJob): string {
  const statusEmoji = {
    'pending': '⏳',
    'in_progress': '🔄',
    'completed': '✅',
    'failed': '❌'
  };

  let formattedResponse = `## Data Ingestion Job: ${job.job_id}\n\n`;
  formattedResponse += `Status: ${statusEmoji[job.status] || ''} ${job.status}\n`;
  formattedResponse += `Type: ${job.job_type}\n`;
  formattedResponse += `Source: ${job.source.type} (ID: ${job.source.id})\n`;
  formattedResponse += `Created: ${job.created_at}\n`;
  formattedResponse += `Updated: ${job.updated_at}\n\n`;

  if (job.stats) {
    formattedResponse += '### Statistics\n\n';
    formattedResponse += `Records Processed: ${job.stats.records_processed}\n`;
    formattedResponse += `Records Ingested: ${job.stats.records_ingested}\n`;
    formattedResponse += `Records Failed: ${job.stats.records_failed}\n\n`;
  }

  if (job.error) {
    formattedResponse += '### Error\n\n';
    formattedResponse += `Code: ${job.error.code}\n`;
    formattedResponse += `Message: ${job.error.message}\n`;
    
    if (job.error.details) {
      formattedResponse += `Details: ${job.error.details}\n`;
    }
  }

  return formattedResponse;
}

/**
 * Format data ingestion job list response
 */
function formatDataIngestionJobListResponse(response: DataIngestionJobListResponse): string {
  let formattedResponse = '## Data Ingestion Jobs\n\n';
  
  if (response.jobs.length === 0) {
    formattedResponse += 'No data ingestion jobs found.\n';
    return formattedResponse;
  }
  
  const statusEmoji = {
    'pending': '⏳',
    'in_progress': '🔄',
    'completed': '✅',
    'failed': '❌'
  };

  response.jobs.forEach((job, index) => {
    formattedResponse += `### ${index + 1}. Job ${job.job_id}\n`;
    formattedResponse += `Status: ${statusEmoji[job.status] || ''} ${job.status}\n`;
    formattedResponse += `Type: ${job.job_type}\n`;
    formattedResponse += `Source: ${job.source.type} (ID: ${job.source.id})\n`;
    formattedResponse += `Created: ${job.created_at}\n`;
    formattedResponse += `Updated: ${job.updated_at}\n`;
    
    if (job.stats) {
      formattedResponse += `Statistics: ${job.stats.records_processed} processed, ${job.stats.records_ingested} ingested, ${job.stats.records_failed} failed\n`;
    }
    
    if (job.error) {
      formattedResponse += `Error: ${job.error.code} - ${job.error.message}\n`;
    }
    
    formattedResponse += '\n';
  });
  
  if (response.pagination) {
    formattedResponse += `Found ${response.pagination.total} total jobs.\n`;
    
    if (response.pagination.offset > 0 || response.pagination.limit < response.pagination.total) {
      formattedResponse += `Showing items ${response.pagination.offset + 1} to ${Math.min(response.pagination.offset + response.pagination.limit, response.pagination.total)}.\n`;
    }
  }
  
  return formattedResponse;
}

/**
 * Format a lead for display
 */
function formatLead(lead: Lead): string {
  const statusEmoji = {
    'new': '🆕',
    'contacted': '📞',
    'qualified': '✅',
    'converted': '🌟',
    'lost': '❌'
  };

  const priorityEmoji = {
    'low': '⬇️',
    'medium': '➡️',
    'high': '⬆️'
  };

  let formattedResponse = `## Lead: ${lead.name}\n\n`;
  formattedResponse += `**ID**: ${lead.id}\n`;
  formattedResponse += `**Email**: ${lead.email}\n`;
  
  if (lead.phone) {
    formattedResponse += `**Phone**: ${lead.phone}\n`;
  }
  
  if (lead.company) {
    formattedResponse += `**Company**: ${lead.company}\n`;
  }
  
  if (lead.job_title) {
    formattedResponse += `**Job Title**: ${lead.job_title}\n`;
  }
  
  formattedResponse += `**Status**: ${statusEmoji[lead.status] || ''} ${lead.status}\n`;
  formattedResponse += `**Priority**: ${priorityEmoji[lead.priority] || ''} ${lead.priority}\n`;
  formattedResponse += `**Source**: ${lead.source}${lead.source_details ? ` (${lead.source_details})` : ''}\n`;
  
  if (lead.estimated_value_cents) {
    formattedResponse += `**Estimated Value**: $${(lead.estimated_value_cents / 100).toFixed(2)}\n`;
  }
  
  if (lead.address) {
    const addressParts = [];
    if (lead.address.street) addressParts.push(lead.address.street);
    if (lead.address.city) addressParts.push(lead.address.city);
    if (lead.address.state) addressParts.push(lead.address.state);
    if (lead.address.zip_code) addressParts.push(lead.address.zip_code);
    if (lead.address.country) addressParts.push(lead.address.country);
    
    if (addressParts.length > 0) {
      formattedResponse += `**Address**: ${addressParts.join(', ')}\n`;
    }
  }
  
  if (lead.notes) {
    formattedResponse += `**Notes**: ${lead.notes}\n`;
  }
  
  if (lead.business_id) {
    formattedResponse += `**Business ID**: ${lead.business_id}\n`;
  }
  
  if (lead.campaign_id) {
    formattedResponse += `**Campaign ID**: ${lead.campaign_id}\n`;
  }
  
  if (lead.owner_id) {
    formattedResponse += `**Owner ID**: ${lead.owner_id}\n`;
  }
  
  if (lead.tags && lead.tags.length > 0) {
    formattedResponse += `**Tags**: ${lead.tags.join(', ')}\n`;
  }
  
  formattedResponse += `**Created**: ${new Date(lead.created_at).toLocaleString()}\n`;
  formattedResponse += `**Updated**: ${new Date(lead.updated_at).toLocaleString()}\n`;
  
  if (lead.last_contacted_at) {
    formattedResponse += `**Last Contacted**: ${new Date(lead.last_contacted_at).toLocaleString()}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format a list of leads for display
 */
function formatLeadListResponse(response: LeadListResponse): string {
  if (!response.leads || response.leads.length === 0) {
    return "No leads found.";
  }
  
  const statusEmoji = {
    'new': '🆕',
    'contacted': '📞',
    'qualified': '✅',
    'converted': '🌟',
    'lost': '❌'
  };

  const priorityEmoji = {
    'low': '⬇️',
    'medium': '➡️',
    'high': '⬆️'
  };
  
  let formattedResponse = '## Leads\n\n';
  
  response.leads.forEach((lead, index) => {
    formattedResponse += `### ${index + 1}. ${lead.name}\n`;
    formattedResponse += `**ID**: ${lead.id}\n`;
    formattedResponse += `**Email**: ${lead.email}\n`;
    formattedResponse += `**Status**: ${statusEmoji[lead.status] || ''} ${lead.status}\n`;
    formattedResponse += `**Priority**: ${priorityEmoji[lead.priority] || ''} ${lead.priority}\n`;
    formattedResponse += `**Source**: ${lead.source}\n`;
    
    if (lead.company) {
      formattedResponse += `**Company**: ${lead.company}\n`;
    }
    
    if (lead.last_contacted_at) {
      formattedResponse += `**Last Contacted**: ${new Date(lead.last_contacted_at).toLocaleString()}\n`;
    }
    
    formattedResponse += '\n';
  });
  
  if (response.pagination) {
    formattedResponse += `Total: ${response.pagination.total} leads | Page: ${response.pagination.page} of ${Math.ceil(response.pagination.total / response.pagination.per_page)}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format a lead note for display
 */
function formatLeadNote(note: LeadNote): string {
  let formattedResponse = `## Lead Note\n\n`;
  formattedResponse += `**ID**: ${note.id}\n`;
  formattedResponse += `**Lead ID**: ${note.lead_id}\n`;
  formattedResponse += `**Created By**: ${note.created_by}\n`;
  formattedResponse += `**Created**: ${new Date(note.created_at).toLocaleString()}\n`;
  formattedResponse += `**Updated**: ${new Date(note.updated_at).toLocaleString()}\n\n`;
  formattedResponse += `${note.content}\n`;
  
  return formattedResponse;
}

/**
 * Format a list of lead notes for display
 */
function formatLeadNoteListResponse(response: LeadNoteListResponse): string {
  if (!response.notes || response.notes.length === 0) {
    return "No notes found for this lead.";
  }
  
  let formattedResponse = '## Lead Notes\n\n';
  
  response.notes.forEach((note, index) => {
    formattedResponse += `### Note ${index + 1}\n`;
    formattedResponse += `**ID**: ${note.id}\n`;
    formattedResponse += `**Created By**: ${note.created_by}\n`;
    formattedResponse += `**Date**: ${new Date(note.created_at).toLocaleString()}\n\n`;
    formattedResponse += `${note.content}\n\n`;
  });
  
  if (response.pagination) {
    formattedResponse += `Total: ${response.pagination.total} notes | Page: ${response.pagination.page} of ${Math.ceil(response.pagination.total / response.pagination.per_page)}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format a lead activity for display
 */
function formatLeadActivity(activity: LeadActivity): string {
  let formattedResponse = `## Lead Activity\n\n`;
  formattedResponse += `**ID**: ${activity.id}\n`;
  formattedResponse += `**Lead ID**: ${activity.lead_id}\n`;
  formattedResponse += `**Type**: ${activity.type}\n`;
  formattedResponse += `**Description**: ${activity.description}\n`;
  formattedResponse += `**Created By**: ${activity.created_by}\n`;
  formattedResponse += `**Created**: ${new Date(activity.created_at).toLocaleString()}\n`;
  
  if (activity.details) {
    formattedResponse += '\n### Details\n\n';
    for (const [key, value] of Object.entries(activity.details)) {
      formattedResponse += `**${key}**: ${JSON.stringify(value)}\n`;
    }
  }
  
  return formattedResponse;
}

/**
 * Format a list of lead activities for display
 */
function formatLeadActivityListResponse(response: LeadActivityListResponse): string {
  if (!response.activities || response.activities.length === 0) {
    return "No activities found for this lead.";
  }
  
  const typeEmoji = {
    'note': '📝',
    'status_change': '🔄',
    'contact': '👋',
    'email': '📧',
    'call': '📞',
    'meeting': '🗓️',
    'task': '✅',
    'custom': '🔹'
  };
  
  let formattedResponse = '## Lead Activities\n\n';
  
  response.activities.forEach((activity, index) => {
    const emoji = typeEmoji[activity.type] || '';
    formattedResponse += `### ${index + 1}. ${emoji} ${activity.type}\n`;
    formattedResponse += `**ID**: ${activity.id}\n`;
    formattedResponse += `**Description**: ${activity.description}\n`;
    formattedResponse += `**Created By**: ${activity.created_by}\n`;
    formattedResponse += `**Date**: ${new Date(activity.created_at).toLocaleString()}\n`;
    
    if (activity.details) {
      formattedResponse += '**Details**:\n';
      for (const [key, value] of Object.entries(activity.details)) {
        formattedResponse += `- ${key}: ${JSON.stringify(value)}\n`;
      }
    }
    
    formattedResponse += '\n';
  });
  
  if (response.pagination) {
    formattedResponse += `Total: ${response.pagination.total} activities | Page: ${response.pagination.page} of ${Math.ceil(response.pagination.total / response.pagination.per_page)}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format a bulk operation response for display
 */
function formatBulkOperationResponse(response: BulkOperationResponse): string {
  let formattedResponse = `## Bulk Operation Results\n\n`;
  formattedResponse += `**Success Count**: ${response.success_count}\n`;
  formattedResponse += `**Failure Count**: ${response.failure_count}\n`;
  
  if (response.failures && response.failures.length > 0) {
    formattedResponse += '\n### Failures\n\n';
    response.failures.forEach(failure => {
      formattedResponse += `- **ID**: ${failure.id}, **Error**: ${failure.error}\n`;
    });
  }
  
  return formattedResponse;
}

/**
 * Format an import leads response for display
 */
function formatImportLeadsResponse(response: ImportLeadsResponse): string {
  let formattedResponse = `## Lead Import Results\n\n`;
  formattedResponse += `**Imported**: ${response.imported_count} leads\n`;
  formattedResponse += `**Skipped**: ${response.skipped_count} leads\n`;
  formattedResponse += `**Failed**: ${response.failure_count} leads\n`;
  
  if (response.imported_ids && response.imported_ids.length > 0) {
    formattedResponse += '\n### Imported Lead IDs\n\n';
    response.imported_ids.forEach(id => {
      formattedResponse += `- ${id}\n`;
    });
  }
  
  if (response.failures && response.failures.length > 0) {
    formattedResponse += '\n### Import Failures\n\n';
    response.failures.forEach(failure => {
      formattedResponse += `- **Index**: ${failure.index}, **Error**: ${failure.error}\n`;
    });
  }
  
  return formattedResponse;
}

/**
 * Format an export leads response for display
 */
function formatExportLeadsResponse(response: ExportLeadsResponse): string {
  let formattedResponse = `## Lead Export Job\n\n`;
  formattedResponse += `**Export Job ID**: ${response.export_job_id}\n`;
  formattedResponse += `**Status**: ${response.status}\n`;
  
  if (response.estimated_time_seconds !== undefined) {
    formattedResponse += `**Estimated Time**: ${response.estimated_time_seconds} seconds\n`;
  }
  
  formattedResponse += '\nUse the `yelpGetExportStatus` tool with this job ID to check the status and get the download link when complete.\n';
  
  return formattedResponse;
}

/**
 * Format an export job status response for display
 */
function formatExportJobStatusResponse(response: ExportJobStatusResponse): string {
  const statusEmoji = {
    'pending': '⏳',
    'processing': '🔄',
    'completed': '✅',
    'failed': '❌'
  };

  let formattedResponse = `## Export Job Status\n\n`;
  formattedResponse += `**Export Job ID**: ${response.export_job_id}\n`;
  formattedResponse += `**Status**: ${statusEmoji[response.status] || ''} ${response.status}\n`;
  formattedResponse += `**Format**: ${response.format}\n`;
  
  if (response.lead_count !== undefined) {
    formattedResponse += `**Lead Count**: ${response.lead_count}\n`;
  }
  
  if (response.download_url) {
    formattedResponse += `**Download URL**: ${response.download_url}\n`;
    
    if (response.expires_at) {
      formattedResponse += `**URL Expires**: ${new Date(response.expires_at).toLocaleString()}\n`;
    }
  }
  
  if (response.error) {
    formattedResponse += `**Error**: ${response.error}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format lead statistics for display
 */
function formatLeadStatistics(stats: LeadStatistics): string {
  let formattedResponse = `## Lead Statistics\n\n`;
  formattedResponse += `**Total Leads**: ${stats.total_count}\n`;
  
  if (stats.average_value_cents !== undefined) {
    formattedResponse += `**Average Value**: $${(stats.average_value_cents / 100).toFixed(2)}\n`;
  }
  
  if (stats.conversion_rate?.overall !== undefined) {
    formattedResponse += `**Overall Conversion Rate**: ${stats.conversion_rate.overall.toFixed(1)}%\n`;
  }
  
  // Status counts
  formattedResponse += '\n### Status Counts\n\n';
  for (const [status, count] of Object.entries(stats.status_counts)) {
    formattedResponse += `- **${status}**: ${count}\n`;
  }
  
  // Source counts
  formattedResponse += '\n### Source Counts\n\n';
  for (const [source, count] of Object.entries(stats.source_counts)) {
    formattedResponse += `- **${source}**: ${count}\n`;
  }
  
  // Priority counts
  formattedResponse += '\n### Priority Counts\n\n';
  for (const [priority, count] of Object.entries(stats.priority_counts)) {
    formattedResponse += `- **${priority}**: ${count}\n`;
  }
  
  // Owner counts
  formattedResponse += '\n### Owner Counts\n\n';
  for (const [ownerId, count] of Object.entries(stats.owner_counts)) {
    formattedResponse += `- **${ownerId}**: ${count}\n`;
  }
  
  // Conversion rates by source
  if (stats.conversion_rate?.by_source) {
    formattedResponse += '\n### Conversion Rates by Source\n\n';
    for (const [source, rate] of Object.entries(stats.conversion_rate.by_source)) {
      formattedResponse += `- **${source}**: ${rate.toFixed(1)}%\n`;
    }
  }
  
  // Time stats
  if (stats.time_stats) {
    formattedResponse += '\n### Time Statistics\n\n';
    formattedResponse += `- **New Leads (Last 30 Days)**: ${stats.time_stats.new_leads_last_30_days}\n`;
    formattedResponse += `- **Conversions (Last 30 Days)**: ${stats.time_stats.conversions_last_30_days}\n`;
    formattedResponse += `- **Average Time to Contact**: ${stats.time_stats.average_time_to_contact_hours.toFixed(1)} hours\n`;
    formattedResponse += `- **Average Time to Conversion**: ${stats.time_stats.average_time_to_conversion_days.toFixed(1)} days\n`;
  }
  
  return formattedResponse;
}

// Start the server using stdio transport
class StdioTransport {
  async start(): Promise<void> { 
    return Promise.resolve();
  }
  
  async close(): Promise<void> {
    return Promise.resolve();
  }
  
  async send(message: any): Promise<void> {
    process.stdout.write(JSON.stringify(message) + '\n');
    return Promise.resolve();
  }

  async connect(callback: (message: any) => Promise<any>): Promise<void> {
    process.stdin.on('data', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const response = await callback(message);
        await this.send(response);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    return Promise.resolve();
  }
}

async function main() {
  const transport = new StdioTransport();
  await server.connect(transport);
  console.error('Yelp Fusion AI MCP server started and connected via stdio');
}

// Start the server when this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

// Export for tests
export default server;