/**
 * Schemas for review-related endpoints
 */
import { z } from 'zod';

// Schema for getting an access token for responding to reviews
export const yelpRespondReviewsGetTokenSchema = z.object({
  client_id: z.string().describe('Your Yelp API client ID'),
  client_secret: z.string().describe('Your Yelp API client secret')
});

// Schema for getting businesses that the user can respond to reviews for
export const yelpRespondReviewsBusinessesSchema = z.object({
  access_token: z.string().describe('The access token to use')
});

// Schema for getting business owner information
export const yelpRespondReviewsBusinessOwnerSchema = z.object({
  access_token: z.string().describe('The access token to use'),
  business_id: z.string().describe('The business ID')
});

// Schema for responding to a review
export const yelpRespondToReviewSchema = z.object({
  access_token: z.string().describe('The access token to use'),
  review_id: z.string().describe('The review ID to respond to'),
  text: z.string().describe('The response text')
});