/**
 * Respond to Reviews-related formatters
 */

// Import types directly
interface GetAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface GetBusinessesResponse {
  businesses: Array<{
    id: string;
    name: string;
    business_info?: {
      rating?: number;
      review_count?: number;
    };
  }>;
}

interface RespondToReviewResponse {
  id?: string;
  text?: string;
  created_at?: string;
}

/**
 * Format the respond reviews get token response
 */
export function formatRespondReviewsGetTokenResponse(response: GetAccessTokenResponse): string {
  if (!response) {
    return 'Failed to get access token for responding to reviews.';
  }

  const { access_token, token_type, expires_in } = response;

  return `### Access Token for Responding to Reviews
**Access Token:** ${access_token}
**Token Type:** ${token_type || 'bearer'}
**Expires In:** ${expires_in || 'Not specified'} seconds`;
}

/**
 * Format the respond reviews businesses response
 */
export function formatRespondReviewsBusinessesResponse(response: GetBusinessesResponse): string {
  const { businesses } = response;
  if (!businesses || businesses.length === 0) {
    return 'No businesses found that you can respond to reviews for.';
  }

  const formattedBusinesses = businesses.map(business => {
    const { id, name, business_info } = business;
    const rating = business_info?.rating || 'N/A';
    const review_count = business_info?.review_count || 'N/A';

    return `## ${name}
**Business ID:** ${id}
**Rating:** ${rating}${typeof rating === 'number' ? '/5' : ''} (${review_count} reviews)`;
  }).join('\n\n');

  return `Businesses you can respond to reviews for:\n\n${formattedBusinesses}`;
}

/**
 * Format the respond to review response
 */
export function formatRespondToReviewResponse(response: RespondToReviewResponse): string {
  if (!response) {
    return 'Failed to respond to review.';
  }

  const { id, text, created_at } = response;
  const createdDate = created_at ? new Date(created_at).toLocaleString() : 'Not available';

  return `### Successfully Responded to Review
**Response ID:** ${id}
**Response Text:** ${text}
**Created At:** ${createdDate}`;
}