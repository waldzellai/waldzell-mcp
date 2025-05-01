/**
 * Schemas for event-related endpoints
 */
import { z } from 'zod';

// Schema for event search
export const yelpEventsSearchSchema = z.object({
  location: z.string().optional().describe('Location (e.g. "San Francisco, CA")'),
  latitude: z.number().optional().describe('Latitude coordinate'),
  longitude: z.number().optional().describe('Longitude coordinate'),
  radius: z.number().optional().describe('Search radius in meters (max 40000)'),
  categories: z.string().optional().describe('Comma-separated list of category names'),
  start_date: z.number().optional().describe('Start date as Unix timestamp'),
  end_date: z.number().optional().describe('End date as Unix timestamp'),
  is_free: z.boolean().optional().describe('Filter for free events'),
  limit: z.number().optional().describe('Number of results to return (default: 20, max: 50)'),
  offset: z.number().optional().describe('Offset for pagination'),
  sort_by: z.enum(['popularity', 'time_start']).optional().describe('Sort order'),
  sort_on: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  locale: z.string().optional().describe('Locale to return results in (default: en_US)')
}).refine(
  data => data.location || (data.latitude && data.longitude),
  { message: 'Either location or both latitude and longitude must be provided' }
);

// Schema for event details
export const yelpEventDetailsSchema = z.object({
  id: z.string().describe('The event ID to get details for'),
  locale: z.string().optional().describe('Locale to return results in (default: en_US)')
});

// Schema for featured event
export const yelpFeaturedEventSchema = z.object({
  location: z.string().optional().describe('Location (e.g. "San Francisco, CA")'),
  latitude: z.number().optional().describe('Latitude coordinate'),
  longitude: z.number().optional().describe('Longitude coordinate'),
  locale: z.string().optional().describe('Locale to return results in (default: en_US)')
}).refine(
  data => data.location || (data.latitude && data.longitude),
  { message: 'Either location or both latitude and longitude must be provided' }
);