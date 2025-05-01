/**
 * Response formatting utilities for Yelp API responses
 */

import { GetBusinessesResponse, GetAccessTokenResponse } from '../types.js';

// Business formatters
export function formatBusinessSearchResponse(response: any): string {
  const { businesses, total } = response;
  if (!businesses || businesses.length === 0) {
    return 'No businesses found matching your search criteria.';
  }

  const formattedBusinesses = businesses.map((business: any) => {
    const { name, rating, review_count, price, categories, location, display_phone } = business;
    const categoryNames = categories?.map((c: any) => c.title).join(', ') || 'N/A';
    const address = location?.display_address?.join(', ') || 'Address not available';
    
    return `## ${name}
Rating: ${rating}/5 (${review_count} reviews)
Price: ${price || 'Not specified'}
Categories: ${categoryNames}
Address: ${address}
Phone: ${display_phone || 'Not available'}
`;
  }).join('\n');

  return `Found ${total} businesses matching your search criteria. Showing the top results:\n\n${formattedBusinesses}`;
}

export function formatBusinessDetailsResponse(response: any): string {
  if (!response) {
    return 'Business details not found.';
  }

  const { 
    name, rating, review_count, price, categories, location, display_phone, 
    hours, is_closed, url
  } = response;
  
  const categoryNames = categories?.map((c: any) => c.title).join(', ') || 'N/A';
  const address = location?.display_address?.join(', ') || 'Address not available';
  const status = is_closed ? 'Closed' : 'Open';
  
  let hoursDisplay = '';
  if (hours && hours.length > 0) {
    const regularHours = hours[0].open;
    if (regularHours && regularHours.length > 0) {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      hoursDisplay = '\n\n### Hours:\n' + regularHours.map((h: any) => {
        const day = daysOfWeek[h.day];
        const start = h.start.replace(/(\d{2})(\d{2})/, '$1:$2');
        const end = h.end.replace(/(\d{2})(\d{2})/, '$1:$2');
        return `${day}: ${start} - ${end}`;
      }).join('\n');
    }
  }

  return `# ${name}
Rating: ${rating}/5 (${review_count} reviews)
Price: ${price || 'Not specified'}
Categories: ${categoryNames}
Status: ${status}
Address: ${address}
Phone: ${display_phone || 'Not available'}
Yelp URL: ${url || 'Not available'}${hoursDisplay}`;
}

export function formatReviewsResponse(response: any): string {
  const { reviews, total } = response;
  if (!reviews || reviews.length === 0) {
    return 'No reviews found.';
  }

  const formattedReviews = reviews.map((review: any) => {
    const { user, rating, text, time_created } = review;
    const date = new Date(time_created).toLocaleDateString();
    
    return `### ${user.name} - ${rating}/5 stars (${date})
${text}
`;
  }).join('\n');

  return `Found ${total || reviews.length} reviews. Showing ${reviews.length}:\n\n${formattedReviews}`;
}

export function formatReviewHighlightsResponse(response: any): string {
  const { highlights } = response;
  if (!highlights || highlights.length === 0) {
    return 'No review highlights found.';
  }

  return highlights.map((highlight: any) => {
    const { text, score, category } = highlight;
    return `### ${category || 'Highlight'} (Score: ${score || 'N/A'})
${text}`;
  }).join('\n\n');
}

// Event formatters
export function formatEventsSearchResponse(response: any): string {
  const { events, total } = response;
  if (!events || events.length === 0) {
    return 'No events found matching your search criteria.';
  }

  const formattedEvents = events.map((event: any) => {
    const { name, description, time_start, time_end, cost, cost_max, is_free, business_id } = event;
    const startDate = new Date(time_start).toLocaleString();
    const endDate = time_end ? new Date(time_end).toLocaleString() : 'Not specified';
    const costInfo = is_free ? 'Free' : 
      (cost && cost_max ? `$${cost} - $${cost_max}` : 
        (cost ? `$${cost}` : 'Cost not specified'));
    
    return `## ${name}
${description ? description.substring(0, 200) + (description.length > 200 ? '...' : '') : 'No description available'}

**When:** ${startDate} to ${endDate}
**Cost:** ${costInfo}
**Business ID:** ${business_id || 'Not associated with a business'}
`;
  }).join('\n');

  return `Found ${total} events matching your search criteria. Showing the top results:\n\n${formattedEvents}`;
}

export function formatEventDetailsResponse(response: any): string {
  if (!response) {
    return 'Event details not found.';
  }

  const { 
    name, description, time_start, time_end, cost, cost_max, is_free, 
    business_id, attending_count, interested_count, category, location
  } = response;
  
  const startDate = new Date(time_start).toLocaleString();
  const endDate = time_end ? new Date(time_end).toLocaleString() : 'Not specified';
  const costInfo = is_free ? 'Free' : 
    (cost && cost_max ? `$${cost} - $${cost_max}` : 
      (cost ? `$${cost}` : 'Cost not specified'));
  
  let locationInfo = 'Location not specified';
  if (location) {
    const { display_address, city, state, country } = location;
    locationInfo = display_address ? display_address.join(', ') : 
      [city, state, country].filter(Boolean).join(', ');
  }

  return `# ${name}
${description || 'No description available'}

**When:** ${startDate} to ${endDate}
**Category:** ${category || 'Not categorized'}
**Cost:** ${costInfo}
**Location:** ${locationInfo}
**Interest:** ${attending_count || 0} attending, ${interested_count || 0} interested
**Business ID:** ${business_id || 'Not associated with a business'}`;
}

// OAuth formatters
export function formatOAuthTokenResponse(response: any, version: string): string {
  if (!response) {
    return 'Failed to get OAuth token.';
  }

  const { access_token, token_type, expires_in, refresh_token, scope } = response;
  
  let result = `### OAuth ${version} Access Token
**Access Token:** ${access_token}
**Token Type:** ${token_type || 'bearer'}
**Expires In:** ${expires_in || 'Not specified'} seconds`;

  if (refresh_token) {
    result += `\n**Refresh Token:** ${refresh_token}`;
  }
  
  if (scope) {
    result += `\n**Scope:** ${scope}`;
  }

  return result;
}

// Waitlist formatters
export function formatWaitlistPartnerRestaurantsResponse(response: any): string {
  const { businesses, total } = response;
  if (!businesses || businesses.length === 0) {
    return 'No waitlist partner restaurants found.';
  }

  const formattedBusinesses = businesses.map((business: any) => {
    const { name, rating, review_count, location, waitlist_info } = business;
    const address = location?.display_address?.join(', ') || 'Address not available';
    const waitTime = waitlist_info?.current_wait_time_minutes || 'Not available';
    
    return `## ${name}
Rating: ${rating}/5 (${review_count} reviews)
Address: ${address}
Current Wait Time: ${waitTime} minutes
`;
  }).join('\n');

  return `Found ${total} waitlist partner restaurants. Showing the top results:\n\n${formattedBusinesses}`;
}

export function formatWaitlistStatusResponse(response: any): string {
  if (!response) {
    return 'Waitlist status not available.';
  }

  const { 
    is_waitlist_enabled, current_queue_size, estimated_wait_time_minutes 
  } = response;

  return `### Waitlist Status
**Enabled:** ${is_waitlist_enabled ? 'Yes' : 'No'}
**Current Queue Size:** ${current_queue_size || 0}
**Estimated Wait Time:** ${estimated_wait_time_minutes || 0} minutes`;
}

export function formatWaitlistInfoResponse(response: any): string {
  if (!response) {
    return 'Waitlist information not available.';
  }

  const { 
    is_waitlist_enabled, max_party_size, average_wait_time_minutes,
    operating_hours
  } = response;

  let hoursInfo = '';
  if (operating_hours && operating_hours.length > 0) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    hoursInfo = '\n\n### Operating Hours:\n' + operating_hours.map((h: any) => {
      const day = daysOfWeek[h.day];
      const start = h.start.replace(/(\d{2})(\d{2})/, '$1:$2');
      const end = h.end.replace(/(\d{2})(\d{2})/, '$1:$2');
      return `${day}: ${start} - ${end}`;
    }).join('\n');
  }

  return `### Waitlist Configuration
**Enabled:** ${is_waitlist_enabled ? 'Yes' : 'No'}
**Maximum Party Size:** ${max_party_size || 'Not set'}
**Average Wait Time:** ${average_wait_time_minutes || 0} minutes${hoursInfo}`;
}

export function formatJoinQueueResponse(response: any): string {
  if (!response) {
    return 'Failed to join waitlist queue.';
  }

  const { 
    id, position, estimated_wait_time_minutes, 
    customer_name, party_size, status 
  } = response;

  return `### Successfully Joined Waitlist
**Visit ID:** ${id}
**Position in Queue:** ${position || 'Not available'}
**Estimated Wait Time:** ${estimated_wait_time_minutes || 0} minutes
**Customer Name:** ${customer_name}
**Party Size:** ${party_size}
**Status:** ${status || 'Active'}`;
}

export function formatWaitlistVisitDetailsResponse(response: any): string {
  if (!response) {
    return 'Visit details not available.';
  }

  const { 
    id, position, estimated_wait_time_minutes, 
    customer_name, party_size, status, 
    created_at, updated_at 
  } = response;

  const createdDate = created_at ? new Date(created_at).toLocaleString() : 'Not available';
  const updatedDate = updated_at ? new Date(updated_at).toLocaleString() : 'Not available';

  return `### Waitlist Visit Details
**Visit ID:** ${id}
**Position in Queue:** ${position || 'Not available'}
**Estimated Wait Time:** ${estimated_wait_time_minutes || 0} minutes
**Customer Name:** ${customer_name}
**Party Size:** ${party_size}
**Status:** ${status || 'Active'}
**Created At:** ${createdDate}
**Last Updated:** ${updatedDate}`;
}

// Respond to Reviews formatters
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

export function formatRespondReviewsBusinessesResponse(response: GetBusinessesResponse): string {
  const { businesses } = response;
  if (!businesses || businesses.length === 0) {
    return 'No businesses found that you can respond to reviews for.';
  }

  const formattedBusinesses = businesses.map(business => {
    const { id, name, rating, review_count } = business;
    
    return `## ${name}
**Business ID:** ${id}
**Rating:** ${rating}/5 (${review_count} reviews)`;
  }).join('\n\n');

  return `Businesses you can respond to reviews for:\n\n${formattedBusinesses}`;
}

import { RespondToReviewResponse } from '../types.js';

export function formatRespondToReviewResponse(response: RespondToReviewResponse): string {
  if (!response) {
    return 'Failed to respond to review.';
  }

  const { id, text, created_time } = response;
  const createdDate = created_time ? new Date(created_time).toLocaleString() : 'Not available';

  return `### Successfully Responded to Review
**Response ID:** ${id}
**Response Text:** ${text}
**Created At:** ${createdDate}`;
}

// AI formatters
export function formatYelpAIResponse(response: any): string {
  if (!response) {
    return 'No response from Yelp AI.';
  }

  const { output, businesses } = response;
  
  let result = output || 'No AI response text available.';
  
  if (businesses && businesses.length > 0) {
    result += '\n\n### Mentioned Businesses:\n\n';
    
    result += businesses.map((business: any) => {
      const { name, rating, review_count, price, categories, location } = business;
      const categoryNames = categories?.map((c: any) => c.title).join(', ') || 'N/A';
      const address = location?.display_address?.join(', ') || 'Address not available';
      
      return `## ${name}
Rating: ${rating}/5 (${review_count} reviews)
Price: ${price || 'Not specified'}
Categories: ${categoryNames}
Address: ${address}`;
    }).join('\n\n');
  }
  
  return result;
}

// Other formatters
export function formatCategoriesResponse(response: any): string {
  const { categories } = response;
  if (!categories || categories.length === 0) {
    return 'No categories found.';
  }

  const formattedCategories = categories.map((category: any) => {
    const { alias, title, parent_aliases } = category;
    const parents = parent_aliases?.join(', ') || 'None';
    
    return `**${title}** (${alias})
Parent Categories: ${parents}`;
  }).join('\n\n');

  return `### Yelp Business Categories\n\n${formattedCategories}`;
}

export function formatWaitlistSettingsResponse(response: any): string {
  if (!response) {
    return 'No waitlist settings found.';
  }

  const {
    is_waitlist_enabled,
    estimated_wait_time_minutes,
    max_party_size,
    current_queue_size,
  } = response;

  return `Waitlist Status:
Enabled: ${is_waitlist_enabled ? 'Yes' : 'No'}
Current Queue Size: ${current_queue_size || 0}
Estimated Wait Time: ${estimated_wait_time_minutes || 0} minutes
Maximum Party Size: ${max_party_size || 'Not set'}`;
}