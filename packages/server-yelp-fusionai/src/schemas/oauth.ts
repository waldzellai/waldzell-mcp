/**
 * Schemas for OAuth-related endpoints
 */
import { z } from 'zod';

// Schema for getting an OAuth token
export const yelpGetOAuthTokenSchema = z.object({
  client_id: z.string().describe('Your Yelp API client ID'),
  client_secret: z.string().describe('Your Yelp API client secret'),
  version: z.enum(['v2', 'v3']).default('v3').describe('OAuth version to use (default: v3)')
});

// Schema for refreshing an OAuth token
export const yelpRefreshOAuthTokenSchema = z.object({
  refresh_token: z.string().describe('The refresh token to use'),
  scope: z.string().optional().describe('Optional scope to request')
});

// Schema for revoking an OAuth token
export const yelpRevokeOAuthTokenSchema = z.object({
  token: z.string().describe('The access token to revoke')
});

// Schema for getting OAuth token info
export const yelpGetOAuthTokenInfoSchema = z.object({
  token: z.string().describe('The access token to check'),
  version: z.enum(['v2', 'v3']).default('v3').describe('OAuth version to use (default: v3)')
});