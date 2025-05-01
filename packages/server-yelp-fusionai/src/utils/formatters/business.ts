/**
 * Business-related formatters
 */

/**
 * Format the business search response
 */
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

/**
 * Format the business details response
 */
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

/**
 * Format the Yelp AI response
 */
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