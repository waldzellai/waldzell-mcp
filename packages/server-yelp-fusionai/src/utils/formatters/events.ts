/**
 * Events-related formatters
 */

/**
 * Format the events search response
 */
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

/**
 * Format the event details response
 */
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