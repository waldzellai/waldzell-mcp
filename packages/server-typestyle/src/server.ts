/**
 * TypeStyle Server
 * Main server class that integrates all components
 */

import { STYLE_CATEGORIES, VerticalServerConfig, DEFAULT_CONFIG } from './constants.js';
import { StyleGuideQueryGenerator } from './query-generator.js';
import { ResponseSynthesizer, StyleAnalysis } from './response-synthesizer.js';
import { SearchService } from './search-service.js';
import chalk from 'chalk';

// Style request interface
export interface StyleRequest {
  code?: string;
  query?: string;
  rule?: string;
  format?: boolean;
  category?: string;
  groundSearch?: boolean; // Whether to use external search for grounding
}

// TypeStyle Server class
export class TypeStyleServer {
  private queryGenerator: StyleGuideQueryGenerator;
  private responseSynthesizer: ResponseSynthesizer;
  private searchService: SearchService;
  private config: VerticalServerConfig;
  
  constructor(config: VerticalServerConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.queryGenerator = new StyleGuideQueryGenerator();
    this.responseSynthesizer = new ResponseSynthesizer();
    this.searchService = new SearchService(config);
  }
  
  /**
   * Process a style request
   * @param input Request input
   * @returns Response with style analysis and grounding
   */
  public async processStyleRequest(input: unknown): Promise<{ 
    content: Array<{ type: string; text: string }>; 
    isError?: boolean 
  }> {
    try {
      const request = this.validateRequest(input as Record<string, unknown>);
      
      // If grounded search is disabled, perform standard analysis only
      if (request.groundSearch === false) {
        const styleAnalysis = this.analyzeStyle(request);
        return this.formatResponse(styleAnalysis);
      }
      
      // Start with search-based grounding first to inform our analysis
      try {
        // Generate a search query based on the request
        let searchQuery = '';
        if (request.code) {
          searchQuery = this.queryGenerator.generateQueryFromCode(
            request.code,
            request.category
          );
        } else if (request.query) {
          searchQuery = this.queryGenerator.generateQueryFromQuestion(request.query);
        } else if (request.rule) {
          searchQuery = this.queryGenerator.generateQueryFromRule(request.rule);
        } else {
          searchQuery = "Google TypeScript Style Guide best practices";
        }
        
        // Fetch authoritative guidance first
        const searchResponse = await this.searchService.search(searchQuery);
        
        // Now perform our analysis with this context in mind
        const styleAnalysis = this.analyzeStyle(request);
        
        // Combine our analysis with the search results
        const enhancedResponse = this.responseSynthesizer.combineResults(styleAnalysis, searchResponse);
        return this.formatResponse(enhancedResponse);
      } catch (searchError) {
        console.error('Error with search-first approach:', searchError);
        // Fall back to ungrounded response if search fails
        const styleAnalysis = this.analyzeStyle(request);
        return this.formatResponse(styleAnalysis);
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
  
  /**
   * Validate the incoming request
   * @param data Input data
   * @returns Validated request
   */
  private validateRequest(data: Record<string, unknown>): StyleRequest {
    // At least one of these must be provided
    if (!data.code && !data.query && !data.rule) {
      throw new Error('Request must include at least one of: code, query, or rule');
    }
    
    return {
      code: typeof data.code === 'string' ? data.code : undefined,
      query: typeof data.query === 'string' ? data.query : undefined,
      rule: typeof data.rule === 'string' ? data.rule : undefined,
      format: typeof data.format === 'boolean' ? data.format : false,
      category: typeof data.category === 'string' ? data.category : undefined,
      groundSearch: typeof data.groundSearch === 'boolean' ? data.groundSearch : true
    };
  }
  
  /**
   * Perform standard style analysis
   * @param request Style request
   * @returns Style analysis
   */
  private analyzeStyle(request: StyleRequest): StyleAnalysis {
    const response: StyleAnalysis = {
      feedback: [],
      status: 'success'
    };
    
    // Handle rule explanation request
    if (request.rule) {
      response.explanation = this.getRuleExplanation(request.rule as string);
      response.category = request.rule;
    }
    
    // Handle code analysis request
    if (request.code) {
      const code = request.code;
      
      if (request.category) {
        // Process specific category
        switch (request.category) {
          case STYLE_CATEGORIES.SOURCE_FILE:
            response.feedback = this.checkSourceFileStructure(code);
            break;
          case STYLE_CATEGORIES.NAMING:
            response.feedback = this.checkNamingConventions(code);
            break;
          case STYLE_CATEGORIES.TYPE_SYSTEM:
            response.feedback = this.checkTypeSystem(code);
            break;
          case STYLE_CATEGORIES.FORMATTING:
            response.feedback = this.checkFormatting(code);
            break;
          case STYLE_CATEGORIES.BEST_PRACTICES:
            response.feedback = this.checkBestPractices(code);
            break;
          case STYLE_CATEGORIES.PERFORMANCE:
            response.feedback = this.checkPerformanceOptimizations(code);
            break;
          default:
            throw new Error(`Unknown category: ${request.category}`);
        }
        response.category = request.category;
      } else {
        // Process all categories
        response.feedback = [
          ...this.checkSourceFileStructure(code),
          ...this.checkNamingConventions(code),
          ...this.checkTypeSystem(code),
          ...this.checkFormatting(code),
          ...this.checkBestPractices(code),
          ...this.checkPerformanceOptimizations(code)
        ];
      }
      
      // Add recommendations based on findings
      if (response.feedback.length > 0) {
        response.recommendations = [
          "Review Google TypeScript Style Guide for detailed explanations",
          "Consider using ESLint with TypeScript rules to automate style checks",
          "Use Prettier for automatic formatting"
        ];
      } else {
        response.feedback = ["No style issues found based on checked rules."];
      }
      
      // Handle formatting request
      if (request.format) {
        // In a real implementation, this would actually format the code
        // For now, we just return a placeholder
        response.formattedCode = "// Formatted code would appear here\n" + 
                                "// This would use a proper formatter like prettier\n" + 
                                code;
      }
    }
    
    // Handle query request
    if (request.query) {
      // In a real implementation, this would use pattern matching or semantic analysis
      // For now, we just look for keywords in the query
      const query = request.query.toLowerCase();
      
      if (query.includes('naming') || query.includes('name')) {
        response.explanation = this.getRuleExplanation('naming_conventions');
        response.category = STYLE_CATEGORIES.NAMING;
      } else if (query.includes('format') || query.includes('indent') || query.includes('brace')) {
        response.explanation = this.getRuleExplanation('code_formatting');
        response.category = STYLE_CATEGORIES.FORMATTING;
      } else if (query.includes('type') || query.includes('interface')) {
        response.explanation = this.getRuleExplanation('type_system');
        response.category = STYLE_CATEGORIES.TYPE_SYSTEM;
      } else if (query.includes('file') || query.includes('import')) {
        response.explanation = this.getRuleExplanation('source_file_structure');
        response.category = STYLE_CATEGORIES.SOURCE_FILE;
      } else if (query.includes('best') || query.includes('practice')) {
        response.explanation = this.getRuleExplanation('best_practices');
        response.category = STYLE_CATEGORIES.BEST_PRACTICES;
      } else if (query.includes('performance') || query.includes('optimize')) {
        response.explanation = this.getRuleExplanation('performance_optimization');
        response.category = STYLE_CATEGORIES.PERFORMANCE;
      } else {
        response.explanation = "Please specify a style guide category or rule in your query.";
        response.recommendations = Object.values(STYLE_CATEGORIES).map(cat => 
          `Ask about ${this.getCategoryDisplayName(cat)} rules`
        );
      }
    }
    
    return response;
  }
  
  
  /**
   * Format the final response
   * @param response Style analysis response
   * @returns Formatted MCP response
   */
  private formatResponse(response: any): { 
    content: Array<{ type: string; text: string }>; 
    isError?: boolean 
  } {
    // Format for console output (debugging)
    const formattedOutput = this.formatOutputForConsole(response);
    console.error(formattedOutput);
    
    // Return JSON response
    return {
      content: [{
        type: "text",
        text: JSON.stringify(response, null, 2)
      }]
    };
  }
  
  /**
   * Format output for console display
   * @param response Response data
   * @returns Formatted string for console
   */
  private formatOutputForConsole(response: any): string {
    let title = '📘 TypeStyle';
    if (response.category) {
      title += ` - ${this.getCategoryDisplayName(response.category)}`;
    }
    
    const border = '─'.repeat(Math.max(title.length + 4, 60));
    
    let output = `
┌${border}┐
│ ${title.padEnd(border.length - 2)} │
├${border}┤`;
    
    if (response.feedback && response.feedback.length > 0) {
      output += `\n│ Feedback:${' '.repeat(border.length - 10)} │`;
      response.feedback.forEach((item: string) => {
        output += `\n│ • ${item.padEnd(border.length - 4)} │`;
      });
    }
    
    if (response.groundedExplanation) {
      output += `\n├${border}┤
│ Grounded Explanation:${' '.repeat(border.length - 21)} │
│ ${response.groundedExplanation.substring(0, border.length - 2).padEnd(border.length - 2)} │`;
      
      // If explanation is longer, add ellipsis
      if (response.groundedExplanation.length > border.length - 2) {
        output += `\n│ ...${' '.repeat(border.length - 5)} │`;
      }
    } else if (response.explanation) {
      output += `\n├${border}┤
│ Explanation:${' '.repeat(border.length - 13)} │
│ ${response.explanation.padEnd(border.length - 2)} │`;
    }
    
    if (response.authoritative && response.authoritative.length > 0) {
      output += `\n├${border}┤
│ Authoritative Sources:${' '.repeat(border.length - 22)} │`;
      response.authoritative.forEach((auth: any) => {
        output += `\n│ • ${auth.source.padEnd(border.length - 4)} │`;
      });
    }
    
    if (response.recommendations && response.recommendations.length > 0) {
      output += `\n├${border}┤
│ Recommendations:${' '.repeat(border.length - 17)} │`;
      response.recommendations.forEach((rec: string) => {
        output += `\n│ • ${rec.padEnd(border.length - 4)} │`;
      });
    }
    
    output += `\n├${border}┤
│ Status: ${response.status.padEnd(border.length - 9)} │
└${border}┘`;
    
    return output;
  }
  
  /**
   * Get display name for a style category
   * @param category Category identifier
   * @returns User-friendly category name
   */
  private getCategoryDisplayName(category: string): string {
    switch (category) {
      case STYLE_CATEGORIES.SOURCE_FILE:
        return "Source File Structure";
      case STYLE_CATEGORIES.LANGUAGE_FEATURES:
        return "Language Features";
      case STYLE_CATEGORIES.NAMING:
        return "Naming Conventions";
      case STYLE_CATEGORIES.TYPE_SYSTEM:
        return "Type System";
      case STYLE_CATEGORIES.FORMATTING:
        return "Code Formatting";
      case STYLE_CATEGORIES.BEST_PRACTICES:
        return "Best Practices";
      case STYLE_CATEGORIES.PERFORMANCE:
        return "Performance Optimization";
      default:
        return "General Style";
    }
  }
  
  // Google TypeScript Style Guide - Source File Structure rules
  private checkSourceFileStructure(code: string): string[] {
    const feedback: string[] = [];
    
    // Check UTF-8 BOM (can't actually check encoding, but we can check for BOM markers)
    if (code.charCodeAt(0) === 0xFEFF) {
      feedback.push("Remove UTF-8 BOM marker from the start of the file.");
    }
    
    // Check for license at the top
    if (!code.trimStart().startsWith("/**") && !code.trimStart().startsWith("//")) {
      feedback.push("Files should start with a license or copyright comment.");
    }
    
    // Check imports ordering
    const importLines = code.split('\n').filter(line => line.trim().startsWith('import'));
    if (importLines.length > 1) {
      // Check for grouping: standard library, third-party, and application imports
      // This is simplified and would need more robust analysis in a real implementation
      const hasUnorderedImports = importLines.some((line, i) => {
        if (i === 0) return false;
        
        const prevImport = importLines[i - 1];
        const currentImport = line;
        
        // Very basic check - would need more robust implementation
        if ((prevImport.includes("from '") && currentImport.includes('from "')) ||
            (prevImport.includes('@') && !currentImport.includes('@') && !currentImport.includes('.'))) {
          return true;
        }
        return false;
      });
      
      if (hasUnorderedImports) {
        feedback.push("Group imports by standard library, third-party, and application imports.");
      }
    }
    
    return feedback;
  }

  // Google TypeScript Style Guide - Naming Convention rules
  private checkNamingConventions(code: string): string[] {
    const feedback: string[] = [];
    
    // Check for camelCase variable names (simplified)
    const varDeclarations = code.match(/\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g) || [];
    for (const decl of varDeclarations) {
      const parts = decl.split(/\s+/);
      if (parts.length >= 2) {
        const varName = parts[1];
        
        // Check constants
        if (parts[0] === 'const' && /^[a-z]/.test(varName) && varName.toUpperCase() === varName) {
          feedback.push(`Constant "${varName}" should use CONSTANT_CASE only if it's a true constant.`);
        }
        
        // Check regular variables
        if (/^[A-Z]/.test(varName) || varName.includes('_')) {
          feedback.push(`Variable "${varName}" should use camelCase.`);
        }
      }
    }
    
    // Check for PascalCase class names
    const classDeclarations = code.match(/\bclass\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g) || [];
    for (const decl of classDeclarations) {
      const parts = decl.split(/\s+/);
      if (parts.length >= 2) {
        const className = parts[1];
        if (!/^[A-Z]/.test(className)) {
          feedback.push(`Class "${className}" should use PascalCase.`);
        }
      }
    }
    
    // Check for PascalCase interface names
    const interfaceDeclarations = code.match(/\binterface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g) || [];
    for (const decl of interfaceDeclarations) {
      const parts = decl.split(/\s+/);
      if (parts.length >= 2) {
        const interfaceName = parts[1];
        if (!/^[A-Z]/.test(interfaceName) || interfaceName.startsWith('I')) {
          if (interfaceName.startsWith('I')) {
            feedback.push(`Interface "${interfaceName}" should not use "I" prefix as per Google style guide.`);
          } else {
            feedback.push(`Interface "${interfaceName}" should use PascalCase.`);
          }
        }
      }
    }
    
    return feedback;
  }

  // Google TypeScript Style Guide - Type System rules
  private checkTypeSystem(code: string): string[] {
    const feedback: string[] = [];
    
    // Check for 'any' type usage
    const anyMatches = code.match(/\b(any)\b/g) || [];
    if (anyMatches.length > 0) {
      feedback.push("Avoid using 'any' type. Use more specific types or unknown instead.");
    }
    
    // Check null assertion operator (!.) usage
    if (code.includes('!.') || code.includes('!;') || code.includes('!)')) {
      feedback.push("Avoid using the non-null assertion operator (!) when possible.");
    }
    
    // Check for type assertion using angle brackets
    if (code.match(/<[A-Za-z_$][A-Za-z0-9_$]*>/)) {
      feedback.push("Use 'as Type' syntax instead of angle brackets '<Type>' for type assertions.");
    }
    
    // Check for triple-slash directives
    if (code.includes('///')) {
      feedback.push("Avoid triple-slash directives. Use ES6 imports instead.");
    }
    
    return feedback;
  }

  // Google TypeScript Style Guide - Formatting rules
  private checkFormatting(code: string): string[] {
    const feedback: string[] = [];
    
    // Check for lines exceeding 80 characters
    const lines = code.split('\n');
    const longLines = lines.filter(line => line.length > 80);
    if (longLines.length > 0) {
      feedback.push(`${longLines.length} line(s) exceed the 80 character limit.`);
    }
    
    // Check for inconsistent indentation
    const indentSizes = new Set();
    const indentedLines = lines.filter(line => line.startsWith(' ') || line.startsWith('\t'));
    
    for (const line of indentedLines) {
      let indentSize = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === ' ') {
          indentSize++;
        } else if (line[i] === '\t') {
          indentSize += 4; // Assuming tabs are 4 spaces
          feedback.push("Use spaces instead of tabs for indentation.");
          break;
        } else {
          break;
        }
      }
      
      if (indentSize % 2 !== 0) {
        feedback.push("Use consistent indentation (2 spaces recommended).");
        break;
      }
      
      indentSizes.add(indentSize);
    }
    
    // Check for trailing whitespace
    const hasTrailingWhitespace = lines.some(line => line.match(/\s+$/));
    if (hasTrailingWhitespace) {
      feedback.push("Remove trailing whitespace.");
    }
    
    // Check for function and bracing style
    // Google Style Guide requires braces even for single-line blocks
    const blockWithoutBraces = code.match(/\b(if|for|while|do)\s*\([^)]*\)\s*[^{;\n]/);
    if (blockWithoutBraces) {
      feedback.push("Always use braces for control flow statements, even for single-line blocks.");
    }
    
    return feedback;
  }

  // Google TypeScript Style Guide - Best Practices
  private checkBestPractices(code: string): string[] {
    const feedback: string[] = [];
    
    // Check for eval usage
    if (code.match(/\beval\s*\(/)) {
      feedback.push("Avoid using eval() for security and performance reasons.");
    }
    
    // Check for with statements
    if (code.match(/\bwith\s*\(/)) {
      feedback.push("Do not use with statements.");
    }
    
    // Recommend const over let where possible
    const letDeclarations = code.match(/\blet\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
    if (letDeclarations.length > 0) {
      feedback.push("Consider using 'const' instead of 'let' when the variable is not reassigned.");
    }
    
    // Check for explicit type annotations on initialized variables
    const redundantTypeAnnotations = code.match(/\b(const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*[a-zA-Z_$][a-zA-Z0-9_$<>]*\s*=\s*[a-zA-Z0-9_$'"]/g) || [];
    if (redundantTypeAnnotations.length > 0) {
      feedback.push("Consider letting TypeScript infer simple types when initializing variables.");
    }
    
    return feedback;
  }

  // Google TypeScript Style Guide - Performance consideration checks
  private checkPerformanceOptimizations(code: string): string[] {
    const feedback: string[] = [];
    
    // Check for excessive type assertions
    const typeAssertions = (code.match(/\bas\s+[A-Za-z_$][A-Za-z0-9_$]*/g) || []).length + 
                          (code.match(/<[A-Za-z_$][A-Za-z0-9_$]*>/g) || []).length;
    
    if (typeAssertions > 5) {
      feedback.push(`High number of type assertions (${typeAssertions}) may indicate design issues.`);
    }
    
    // Check for multiple Object.keys, values, entries calls on same object
    const objectOperations = code.match(/Object\.(keys|values|entries)\s*\(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\)/g) || [];
    const objectsManipulated = new Set(objectOperations.map(op => {
      const match = op.match(/\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/);
      return match ? match[1] : '';
    }));
    
    if (objectOperations.length > objectsManipulated.size) {
      feedback.push("Multiple Object.keys/values/entries on the same object. Consider storing results in a variable.");
    }
    
    return feedback;
  }

  // Get rule explanation for specific style rule
  private getRuleExplanation(rule: string): string {
    const ruleExplanations: Record<string, string> = {
      "source_file_structure": "Files should be encoded in UTF-8 without BOM, have license headers, and organize imports by standard library, third-party, and application imports.",
      
      "naming_conventions": "Use camelCase for variables/functions, PascalCase for classes/interfaces/types/enums, and CONSTANT_CASE for true constants. Don't use 'I' prefix for interfaces.",
      
      "type_system": "Prefer interfaces over type aliases for object types. Avoid using 'any' when possible, use 'unknown' instead. Minimize use of non-null assertions and type assertions.",
      
      "code_formatting": "Use 2 spaces for indentation, limit lines to 80 characters, use braces for all control statements, and avoid trailing whitespace.",
      
      "best_practices": "Prefer const over let, enable strict mode, avoid eval and with statements, use template strings instead of concatenation, and use ES6+ features appropriately.",
      
      "performance_optimization": "Avoid excessive type assertions, minimize runtime type checking, and be mindful of object transformations. Pre-compute values that are used multiple times.",
      
      "default_exports": "Use named exports instead of default exports to ensure consistent import naming.",
      
      "interfaces_vs_types": "Prefer interfaces over type aliases for public APIs to allow for extension/implementation and better error messages.",
      
      "array_type_style": "Use 'Array<T>' or 'T[]' consistently. Google style allows both but recommends 'T[]' for simple cases.",
      
      "null_vs_undefined": "Use undefined for uninitialized values and missing parameters. Use null only when required by APIs.",
      
      "braces": "Always use braces for control flow statements, even for single-line blocks.",
      
      "string_literals": "Use single quotes consistently for string literals unless the string contains single quotes.",
      
      "jsdoc": "Use JSDoc for exported symbols. Omit types in JSDoc comments when TypeScript already infers them correctly."
    };
    
    return ruleExplanations[rule] || "No explanation available for this rule.";
  }
}