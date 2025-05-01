/**
 * Schemas for waitlist-related endpoints
 */
import { z } from 'zod';

// Schema for waitlist partner restaurants
export const yelpWaitlistPartnerRestaurantsSchema = z.object({
  location: z.string().optional().describe('Location (e.g. "San Francisco, CA")'),
  latitude: z.number().optional().describe('Latitude coordinate'),
  longitude: z.number().optional().describe('Longitude coordinate'),
  radius: z.number().optional().describe('Search radius in meters'),
  limit: z.number().optional().describe('Number of results to return (default: 20)'),
  offset: z.number().optional().describe('Offset for pagination')
});

// Schema for waitlist status
export const yelpWaitlistStatusSchema = z.object({
  business_id: z.string().describe('The business ID')
});

// Schema for waitlist info
export const yelpWaitlistInfoSchema = z.object({
  business_id: z.string().describe('The business ID')
});

// Schema for joining waitlist queue
export const yelpJoinWaitlistSchema = z.object({
  business_id: z.string().describe('The business ID'),
  party_size: z.number().describe('Number of people in your party'),
  customer_name: z.string().describe('Customer name'),
  customer_phone: z.string().describe('Customer phone number'),
  customer_email: z.string().optional().describe('Customer email address'),
  notes: z.string().optional().describe('Additional notes for the restaurant'),
  seating_preference: z.string().optional().describe('Seating preference (e.g., "Indoor", "Outdoor")')
});

// Schema for on-my-way notification
export const yelpOnMyWaySchema = z.object({
  visit_id: z.string().describe('The visit ID'),
  estimated_arrival_minutes: z.number().optional().describe('Estimated arrival time in minutes')
});

// Schema for canceling a waitlist visit
export const yelpCancelWaitlistVisitSchema = z.object({
  visit_id: z.string().describe('The visit ID')
});

// Schema for getting waitlist visit details
export const yelpWaitlistVisitDetailsSchema = z.object({
  visit_id: z.string().describe('The visit ID')
});