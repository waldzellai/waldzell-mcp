/**
 * Response Synthesizer for TypeStyle Server
 * Combines our style analysis with search results from external MCP servers
 */

export interface StyleAnalysis {
  feedback: string[];
  formattedCode?: string;
  explanation?: string;
  recommendations?: string[];
  category?: string;
  status: string;
}

export interface SearchResult {
  content: string;
  source?: string;
  url?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query?: string;
  isError?: boolean;
}

export interface EnhancedStyleResponse extends StyleAnalysis {
  groundedExplanation?: string;
  authoritative?: {
    content: string;
    source: string;
    url?: string;
  }[];
}

export class ResponseSynthesizer {
  /**
   * Combine style analysis with search results
   * @param styleAnalysis Our internal style analysis
   * @param searchResponse Results from external search MCP
   * @returns Enhanced response with grounded explanations
   */
  combineResults(
    styleAnalysis: StyleAnalysis, 
    searchResponse: SearchResponse
  ): EnhancedStyleResponse {
    // Start with our original analysis
    const enhancedResponse: EnhancedStyleResponse = {
      ...styleAnalysis,
      authoritative: []
    };
    
    // If there was an error with the search or no results, return original analysis
    if (searchResponse.isError || !searchResponse.results || searchResponse.results.length === 0) {
      return enhancedResponse;
    }
    
    // Extract relevant content from search results
    const relevantResults = this.extractRelevantResults(
      searchResponse.results,
      styleAnalysis.category || ''
    );
    
    // Add authoritative sources
    enhancedResponse.authoritative = relevantResults.map(result => ({
      content: result.content,
      source: result.source || 'Google TypeScript Style Guide',
      url: result.url
    }));
    
    // Create grounded explanation by combining our analysis with search results
    enhancedResponse.groundedExplanation = this.createGroundedExplanation(
      styleAnalysis,
      relevantResults
    );
    
    // Enhance the feedback with authoritative context
    if (styleAnalysis.feedback && styleAnalysis.feedback.length > 0) {
      enhancedResponse.feedback = this.enhanceFeedbackWithGrounding(
        styleAnalysis.feedback,
        relevantResults
      );
    }
    
    return enhancedResponse;
  }
  
  /**
   * Extract the most relevant portions from search results
   * @param results All search results
   * @param category Optional style category to focus on
   * @returns Filtered and processed relevant results
   */
  private extractRelevantResults(
    results: SearchResult[],
    category: string
  ): SearchResult[] {
    // If we have a category, prioritize results that mention it
    if (category) {
      const categoryTerms = category.toLowerCase().split('_');
      
      // Sort results by relevance to category
      const sortedResults = [...results].sort((a, b) => {
        const aContent = a.content.toLowerCase();
        const bContent = b.content.toLowerCase();
        
        const aMatches = categoryTerms.filter(term => aContent.includes(term)).length;
        const bMatches = categoryTerms.filter(term => bContent.includes(term)).length;
        
        return bMatches - aMatches;
      });
      
      // Return top 3 most relevant results
      return sortedResults.slice(0, 3);
    }
    
    // Without a category, just take the top results
    return results.slice(0, 3);
  }
  
  /**
   * Create a grounded explanation combining our analysis with search results
   * @param styleAnalysis Our internal style analysis
   * @param relevantResults Relevant search results
   * @returns Combined explanation with citations
   */
  private createGroundedExplanation(
    styleAnalysis: StyleAnalysis,
    relevantResults: SearchResult[]
  ): string {
    // Start with our explanation if available
    let grounded = styleAnalysis.explanation || '';
    
    // Add information from the search results
    const snippets: string[] = [];
    
    for (const result of relevantResults) {
      // Extract a useful snippet (in a real implementation, this would be more sophisticated)
      let snippet = result.content;
      
      // If the snippet is too long, truncate it
      if (snippet.length > 250) {
        snippet = snippet.substring(0, 250) + '...';
      }
      
      snippets.push(snippet);
    }
    
    // If we didn't have an explanation but have snippets, use the first snippet
    if (!grounded && snippets.length > 0) {
      grounded = snippets[0];
    } 
    // Otherwise, add snippets as supporting evidence
    else if (snippets.length > 0) {
      grounded += '\n\nAccording to the Google TypeScript Style Guide:\n\n';
      grounded += snippets.map(s => `"${s}"`).join('\n\n');
    }
    
    return grounded;
  }

  /**
   * Enhance feedback items with grounding from search results
   * @param feedback Original feedback items
   * @param searchResults Relevant search results
   * @returns Enhanced feedback with authoritative citations
   */
  private enhanceFeedbackWithGrounding(
    feedback: string[],
    searchResults: SearchResult[]
  ): string[] {
    if (searchResults.length === 0) {
      return feedback;
    }

    // Extract key terms from each feedback item
    return feedback.map(item => {
      // Find the most relevant search result for this feedback item
      const relevantResult = this.findMostRelevantResult(item, searchResults);
      
      if (!relevantResult) {
        return item;
      }
      
      // Get a concise citation from the search result
      const citation = this.extractCitation(relevantResult.content, item);
      
      if (!citation) {
        return item;
      }
      
      // Return the enhanced feedback item with citation
      return `${item} (Google Style Guide: "${citation}")`;
    });
  }

  /**
   * Find the most relevant search result for a given feedback item
   * @param feedbackItem The feedback statement to match
   * @param searchResults Available search results
   * @returns The most relevant search result or undefined
   */
  private findMostRelevantResult(
    feedbackItem: string,
    searchResults: SearchResult[]
  ): SearchResult | undefined {
    // Extract key terms from the feedback
    const terms = feedbackItem.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 3)
      .filter(term => !['should', 'would', 'could', 'with', 'that', 'this', 'from', 'have'].includes(term));
    
    // No meaningful terms to match
    if (terms.length === 0) {
      return undefined;
    }
    
    // Score each result by term matches
    const scoredResults = searchResults.map(result => {
      const content = result.content.toLowerCase();
      const score = terms.filter(term => content.includes(term)).length;
      return { result, score };
    });
    
    // Sort by score (highest first) and return the best match
    scoredResults.sort((a, b) => b.score - a.score);
    
    // Return the best match if it has at least one matching term
    return scoredResults[0]?.score > 0 ? scoredResults[0].result : undefined;
  }

  /**
   * Extract a concise citation from content that is relevant to the feedback
   * @param content The content to extract from
   * @param feedbackItem The feedback item to match
   * @returns A concise citation or undefined
   */
  private extractCitation(content: string, feedbackItem: string): string | undefined {
    // This would be more sophisticated in a real implementation
    // For now, we'll take a simple approach: find the most relevant sentence

    // Extract key terms from the feedback
    const terms = feedbackItem.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 3);
    
    // Split the content into sentences (roughly)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Score each sentence
    const scoredSentences = sentences.map(sentence => {
      const sentenceLower = sentence.toLowerCase();
      const score = terms.filter(term => sentenceLower.includes(term)).length;
      return { sentence: sentence.trim(), score };
    });
    
    // Find the most relevant sentence
    scoredSentences.sort((a, b) => b.score - a.score);
    const bestSentence = scoredSentences[0];
    
    // Return the sentence if it's reasonably relevant
    if (bestSentence?.score > 0) {
      let citation = bestSentence.sentence;
      
      // Truncate if too long
      if (citation.length > 80) {
        citation = citation.substring(0, 77) + '...';
      }
      
      return citation;
    }
    
    return undefined;
  }
}