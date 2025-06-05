/**
 * Constants for TypeStyle Server
 */
export declare const STYLE_CATEGORIES: {
    SOURCE_FILE: string;
    LANGUAGE_FEATURES: string;
    NAMING: string;
    TYPE_SYSTEM: string;
    FORMATTING: string;
    BEST_PRACTICES: string;
    PERFORMANCE: string;
};
export interface McpServerConfig {
    url: string;
    token?: string;
    toolName: string;
}
export interface VerticalServerConfig {
    primaryMcpServer: McpServerConfig;
    fallbackMcpServers?: McpServerConfig[];
    cacheResults?: boolean;
    cacheExpiration?: number;
}
export declare const DEFAULT_CONFIG: VerticalServerConfig;
//# sourceMappingURL=constants.d.ts.map