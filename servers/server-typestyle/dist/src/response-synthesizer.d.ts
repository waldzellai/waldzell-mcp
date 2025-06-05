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
export declare class ResponseSynthesizer {
    /**
     * Combine style analysis with search results
     * @param styleAnalysis Our internal style analysis
     * @param searchResponse Results from external search MCP
     * @returns Enhanced response with grounded explanations
     */
    combineResults(styleAnalysis: StyleAnalysis, searchResponse: SearchResponse): EnhancedStyleResponse;
    /**
     * Extract the most relevant portions from search results
     * @param results All search results
     * @param category Optional style category to focus on
     * @returns Filtered and processed relevant results
     */
    private extractRelevantResults;
    /**
     * Create a grounded explanation combining our analysis with search results
     * @param styleAnalysis Our internal style analysis
     * @param relevantResults Relevant search results
     * @returns Combined explanation with citations
     */
    private createGroundedExplanation;
    /**
     * Enhance feedback items with grounding from search results
     * @param feedback Original feedback items
     * @param searchResults Relevant search results
     * @returns Enhanced feedback with authoritative citations
     */
    private enhanceFeedbackWithGrounding;
    /**
     * Find the most relevant search result for a given feedback item
     * @param feedbackItem The feedback statement to match
     * @param searchResults Available search results
     * @returns The most relevant search result or undefined
     */
    private findMostRelevantResult;
    /**
     * Extract a concise citation from content that is relevant to the feedback
     * @param content The content to extract from
     * @param feedbackItem The feedback item to match
     * @returns A concise citation or undefined
     */
    private extractCitation;
}
//# sourceMappingURL=response-synthesizer.d.ts.map