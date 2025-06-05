/**
 * Query Generator for TypeStyle Server
 * Generates optimized search queries based on code analysis or user questions
 */
export declare class StyleGuideQueryGenerator {
    /**
     * Generate a search query from TypeScript code to find relevant style recommendations
     * @param code The TypeScript code to analyze
     * @param category Optional specific style category to focus on
     * @returns Optimized search query for style guide information
     */
    generateQueryFromCode(code: string, category?: string): string;
    /**
     * Get the appropriate style guide URL for a specific pattern
     * @param label The pattern label
     * @param context The pattern context
     * @returns A URL for the relevant section of the style guide
     */
    private getUrlForPattern;
    /**
     * Generate a search query from a user question about TypeScript style
     * @param query The user's style question
     * @returns Optimized search query
     */
    generateQueryFromQuestion(query: string): string;
    /**
     * Generate a search query for a specific rule explanation
     * @param rule The rule identifier
     * @returns Optimized search query
     */
    generateQueryFromRule(rule: string): string;
    /**
     * Detect code patterns that might need style guide references
     * @param code The TypeScript code to analyze
     * @returns Array of detected patterns with context
     */
    private detectPatterns;
    /**
     * Extract key terms from a user query
     * @param query The user's question
     * @returns Array of key terms
     */
    private extractKeyTerms;
    /**
     * Generate a category-specific query
     * @param category The style category
     * @param patterns Detected code patterns
     * @returns Optimized search query
     */
    private generateCategorySpecificQuery;
    /**
     * Get display name for a style category
     * @param category The category identifier
     * @returns User-friendly category name
     */
    private getCategoryDisplayName;
    /**
     * Get display name for a style rule
     * @param rule The rule identifier
     * @returns User-friendly rule name
     */
    private getRuleDisplayName;
}
//# sourceMappingURL=query-generator.d.ts.map