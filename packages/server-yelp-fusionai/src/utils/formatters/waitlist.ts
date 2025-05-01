/**
 * Waitlist-related formatters
 */

/**
 * Format the waitlist partner restaurants response
 */
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

/**
 * Format the waitlist status response
 */
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

/**
 * Format the waitlist info response
 */
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

/**
 * Format the join queue response
 */
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

/**
 * Format the waitlist visit details response
 */
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

/**
 * Format the waitlist settings response
 */
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