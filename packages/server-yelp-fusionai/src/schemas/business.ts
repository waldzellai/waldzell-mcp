/**
 * Schemas for business-related endpoints
 */
import { z } from 'zod';

// Schema for natural language business search
export const yelpQuerySchema = z.object({
  query: z.string().describe('Your natural language query about businesses, locations, or recommendations')
});

// Schema for parameter-based business search
export const yelpBusinessSearchSchema = z.object({
  term: z.string().optional().describe('Search term (e.g. "food", "restaurants")'),
  location: z.string().optional().describe('Location (e.g. "San Francisco, CA")'),
  latitude: z.number().optional().describe('Latitude coordinate'),
  longitude: z.number().optional().describe('Longitude coordinate'),
  radius: z.number().optional().describe('Search radius in meters (max 40000)'),
  categories: z.string().optional().describe('Comma-separated list of category aliases'),
  locale: z.string().optional().describe('Locale to return results in (default: en_US)'),
  limit: z.number().optional().describe('Number of results to return (default: 20, max: 50)'),
  offset: z.number().optional().describe('Offset for pagination'),
  sort_by: z.enum(['best_match', 'rating', 'review_count', 'distance']).optional().describe('Sort order'),
  price: z.string().optional().describe('Pricing levels to filter by (1 = $, 2 = $$, 3 = $$$, 4 = $$$$)'),
  open_now: z.boolean().optional().describe('Filter to open businesses'),
  open_at: z.number().optional().describe('Filter to businesses open at this Unix timestamp'),
  attributes: z.string().optional().describe('Additional filters (e.g. "hot_and_new,reservation")')
}).refine(
  data => data.location || (data.latitude && data.longitude),
  { message: 'Either location or both latitude and longitude must be provided' }
);

// Schema for business details
export const yelpBusinessDetailsSchema = z.object({
  id: z.string().describe('The business ID to get details for')
});

// Schema for business reviews
export const yelpBusinessReviewsSchema = z.object({
  id: z.string().describe('The business ID to get reviews for'),
  locale: z.string().optional().describe('Locale to return results in (default: en_US)'),
  limit: z.number().optional().describe('Number of reviews to return (default: 20, max: 50)'),
  offset: z.number().optional().describe('Offset for pagination'),
  sort_by: z.enum(['yelp_sort', 'newest', 'oldest', 'rating_highest', 'rating_lowest', 'elites', 'mentioned']).optional().describe('Sort order')
});

// Schema for review highlights
export const yelpReviewHighlightsSchema = z.object({
  id: z.string().describe('The business ID to get review highlights for'),
  locale: z.string().optional().describe('Locale to return results in (default: en_US)')
});

// Schema for business AI
export const yelpBusinessAISchema = z.object({
  query: z.string().describe('Natural language query for the AI to respond to'),
  locale: z.string().optional().describe('Locale for the response (default: en_US)'),
  location: z.string().optional().describe('Location context for the query (e.g. "San Francisco, CA")'),
  latitude: z.number().optional().describe('Latitude coordinate for location context'),
  longitude: z.number().optional().describe('Longitude coordinate for location context')
});

// Schema for categories
export const yelpCategoriesSchema = z.object({
  locale: z.string().optional().describe('Locale to return results in (default: en_US)')
});

// Schema for category details
export const yelpCategoryDetailsSchema = z.object({
  alias: z.string().describe('The category alias to get details for'),
  locale: z.string().optional().describe('Locale to return results in (default: en_US)')
});