/**
 * Reviews-related formatters
 */

/**
 * Format the reviews response
 */
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

/**
 * Format the review highlights response
 */
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