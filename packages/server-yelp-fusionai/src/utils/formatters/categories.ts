/**
 * Categories-related formatters
 */

/**
 * Format the categories response
 */
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