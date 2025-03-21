/**
 * Query Generator for TypeStyle Server
 * Generates optimized search queries based on code analysis or user questions
 */

// Style guide categories defined in main server
import { STYLE_CATEGORIES } from './constants.js';
import { getStyleGuideUrl, CATEGORY_URL_MAP, TOPIC_URL_MAP } from './styleguide-urls.js';

export class StyleGuideQueryGenerator {
  /**
   * Generate a search query from TypeScript code to find relevant style recommendations
   * @param code The TypeScript code to analyze
   * @param category Optional specific style category to focus on
   * @returns Optimized search query for style guide information
   */
  generateQueryFromCode(code: string, category?: string): string {
    // Analyze code for patterns that might need style guide references
    const patterns = this.detectPatterns(code);
    
    if (category) {
      // If a specific category is requested, focus the query
      return this.generateCategorySpecificQuery(category, patterns);
    }
    
    // If no specific issues found, return a general query based on code structure
    if (patterns.length === 0) {
      return `Google TypeScript Style Guide best practices ${getStyleGuideUrl()}`;
    }
    
    // Otherwise, focus on the most important pattern detected
    const primaryPattern = patterns[0];
    
    // Get a specific URL for this pattern if available
    const patternUrl = this.getUrlForPattern(primaryPattern.label, primaryPattern.context);
    
    return `Google TypeScript Style Guide ${primaryPattern.label} ${primaryPattern.context} ${patternUrl}`;
  }
  
  /**
   * Get the appropriate style guide URL for a specific pattern
   * @param label The pattern label
   * @param context The pattern context
   * @returns A URL for the relevant section of the style guide
   */
  private getUrlForPattern(label: string, context: string): string {
    // Map common patterns to their URLs
    const topic = `${label}_${context}`.toLowerCase().replace(/\s+/g, '_');
    
    // Check for direct matches in our topic map
    if (TOPIC_URL_MAP[topic]) {
      return getStyleGuideUrl(TOPIC_URL_MAP[topic]);
    }
    
    // Try the label alone
    if (TOPIC_URL_MAP[label.toLowerCase()]) {
      return getStyleGuideUrl(TOPIC_URL_MAP[label.toLowerCase()]);
    }
    
    // Try the context alone
    if (TOPIC_URL_MAP[context.toLowerCase()]) {
      return getStyleGuideUrl(TOPIC_URL_MAP[context.toLowerCase()]);
    }
    
    // Default to the general category
    const categoryKey = Object.entries(STYLE_CATEGORIES).find(([_, value]) => 
      value.toLowerCase().includes(label.toLowerCase())
    )?.[1];
    
    if (categoryKey && CATEGORY_URL_MAP[categoryKey]) {
      return getStyleGuideUrl(CATEGORY_URL_MAP[categoryKey]);
    }
    
    return getStyleGuideUrl();
  }
  
  /**
   * Generate a search query from a user question about TypeScript style
   * @param query The user's style question
   * @returns Optimized search query
   */
  generateQueryFromQuestion(query: string): string {
    // Extract key terms from the query
    const keyTerms = this.extractKeyTerms(query);
    
    // Check if query is about a specific category
    for (const [key, value] of Object.entries(STYLE_CATEGORIES)) {
      const displayName = this.getCategoryDisplayName(value as string);
      if (
        query.toLowerCase().includes(value.toLowerCase()) || 
        query.toLowerCase().includes(displayName.toLowerCase())
      ) {
        const categoryUrl = CATEGORY_URL_MAP[value] 
          ? getStyleGuideUrl(CATEGORY_URL_MAP[value]) 
          : getStyleGuideUrl();
        return `Google TypeScript Style Guide ${displayName} ${keyTerms.join(' ')} ${categoryUrl}`;
      }
    }
    
    // Look for specific topics in the query
    for (const [topic, urlPath] of Object.entries(TOPIC_URL_MAP)) {
      if (query.toLowerCase().includes(topic.toLowerCase())) {
        return `Google TypeScript Style Guide ${keyTerms.join(' ')} ${getStyleGuideUrl(urlPath)}`;
      }
    }
    
    // General style query
    return `Google TypeScript Style Guide ${keyTerms.join(' ')} ${getStyleGuideUrl()}`;
  }
  
  /**
   * Generate a search query for a specific rule explanation
   * @param rule The rule identifier
   * @returns Optimized search query
   */
  generateQueryFromRule(rule: string): string {
    const ruleName = this.getRuleDisplayName(rule);
    
    // Get a specific URL for this rule if available
    let ruleUrl = getStyleGuideUrl();
    if (TOPIC_URL_MAP[rule.toLowerCase()]) {
      ruleUrl = getStyleGuideUrl(TOPIC_URL_MAP[rule.toLowerCase()]);
    } else if (CATEGORY_URL_MAP[rule]) {
      ruleUrl = getStyleGuideUrl(CATEGORY_URL_MAP[rule]);
    }
    
    return `Google TypeScript Style Guide ${ruleName} rules specification ${ruleUrl}`;
  }
  
  /**
   * Detect code patterns that might need style guide references
   * @param code The TypeScript code to analyze
   * @returns Array of detected patterns with context
   */
  private detectPatterns(code: string): Array<{label: string, context: string}> {
    const patterns: Array<{label: string, context: string}> = [];
    
    // Check for interface naming patterns
    const interfaceMatch = code.match(/\binterface\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
    if (interfaceMatch) {
      const interfaceName = interfaceMatch[1];
      if (interfaceName.startsWith('I')) {
        patterns.push({
          label: 'interface naming',
          context: 'I-prefix'
        });
      } else if (!/^[A-Z]/.test(interfaceName)) {
        patterns.push({
          label: 'interface naming',
          context: 'PascalCase'
        });
      }
    }
    
    // Check for class naming patterns
    const classMatch = code.match(/\bclass\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
    if (classMatch) {
      const className = classMatch[1];
      if (!/^[A-Z]/.test(className)) {
        patterns.push({
          label: 'class naming',
          context: 'PascalCase'
        });
      }
    }
    
    // Check for 'any' type usage
    if (code.match(/:\s*any\b/) || code.match(/as\s+any\b/)) {
      patterns.push({
        label: 'type system',
        context: 'any type usage'
      });
    }
    
    // Check for non-null assertion
    if (code.includes('!.') || code.match(/!\s*[;)]/)) {
      patterns.push({
        label: 'type system',
        context: 'non-null assertion'
      });
    }
    
    // Check for type assertion style
    if (code.match(/<[A-Za-z_$][A-Za-z0-9_$]*>/)) {
      patterns.push({
        label: 'type assertions',
        context: 'angle bracket syntax'
      });
    }
    
    // Check for bracing style
    if (code.match(/\b(if|for|while|do)\s*\([^)]*\)\s*[^{;\n]/)) {
      patterns.push({
        label: 'formatting',
        context: 'braces usage'
      });
    }
    
    // Check for long lines
    const lines = code.split('\n');
    if (lines.some(line => line.length > 80)) {
      patterns.push({
        label: 'formatting',
        context: 'line length'
      });
    }
    
    return patterns;
  }
  
  /**
   * Extract key terms from a user query
   * @param query The user's question
   * @returns Array of key terms
   */
  private extractKeyTerms(query: string): string[] {
    // Simple extraction of key terms by removing common words
    const commonWords = [
      'the', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with',
      'how', 'what', 'when', 'where', 'why', 'which', 'who', 'should', 'do',
      'i', 'my', 'we', 'our', 'you', 'your', 'they', 'their', 'it', 'its',
      'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'having'
    ];
    
    // Convert to lowercase and tokenize
    const tokens = query.toLowerCase().split(/\s+/);
    
    // Filter out common words and short tokens
    const keyTerms = tokens.filter(token => 
      !commonWords.includes(token) && 
      token.length > 2 &&
      // Remove punctuation
      token.replace(/[.,?!;:(){}[\]<>]/g, '').length > 2
    );
    
    return keyTerms;
  }
  
  /**
   * Generate a category-specific query
   * @param category The style category
   * @param patterns Detected code patterns
   * @returns Optimized search query
   */
  private generateCategorySpecificQuery(
    category: string, 
    patterns: Array<{label: string, context: string}>
  ): string {
    const categoryDisplay = this.getCategoryDisplayName(category);
    
    // Find patterns related to this category
    const relevantPatterns = patterns.filter(p => 
      p.label.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(p.label.toLowerCase())
    );
    
    if (relevantPatterns.length > 0) {
      return `Google TypeScript Style Guide ${categoryDisplay} ${relevantPatterns[0].context}`;
    }
    
    return `Google TypeScript Style Guide ${categoryDisplay} specification`;
  }
  
  /**
   * Get display name for a style category
   * @param category The category identifier
   * @returns User-friendly category name
   */
  private getCategoryDisplayName(category: string): string {
    // Convert from snake_case to readable format
    const words = category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    
    return words.join(' ');
  }
  
  /**
   * Get display name for a style rule
   * @param rule The rule identifier
   * @returns User-friendly rule name
   */
  private getRuleDisplayName(rule: string): string {
    // Convert from snake_case to readable format
    const words = rule.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    
    return words.join(' ');
  }
}