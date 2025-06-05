/**
 * TypeStyle Server
 * Main server class that integrates all components
 */
import { VerticalServerConfig } from './constants.js';
export interface StyleRequest {
    code?: string;
    query?: string;
    rule?: string;
    format?: boolean;
    category?: string;
    groundSearch?: boolean;
}
export declare class TypeStyleServer {
    private queryGenerator;
    private responseSynthesizer;
    private searchService;
    private config;
    constructor(config?: VerticalServerConfig);
    /**
     * Process a style request
     * @param input Request input
     * @returns Response with style analysis and grounding
     */
    processStyleRequest(input: unknown): Promise<{
        content: Array<{
            type: string;
            text: string;
        }>;
        isError?: boolean;
    }>;
    /**
     * Validate the incoming request
     * @param data Input data
     * @returns Validated request
     */
    private validateRequest;
    /**
     * Perform standard style analysis
     * @param request Style request
     * @returns Style analysis
     */
    private analyzeStyle;
    /**
     * Format the final response
     * @param response Style analysis response
     * @returns Formatted MCP response
     */
    private formatResponse;
    /**
     * Format output for console display
     * @param response Response data
     * @returns Formatted string for console
     */
    private formatOutputForConsole;
    /**
     * Get display name for a style category
     * @param category Category identifier
     * @returns User-friendly category name
     */
    private getCategoryDisplayName;
    private checkSourceFileStructure;
    private checkNamingConventions;
    private checkTypeSystem;
    private checkFormatting;
    private checkBestPractices;
    private checkPerformanceOptimizations;
    private getRuleExplanation;
}
//# sourceMappingURL=server.d.ts.map