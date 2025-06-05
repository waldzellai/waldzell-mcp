/**
 * Google TypeScript Style Guide URL Reference Map
 *
 * This file provides direct links to the different sections of the Google TypeScript Style Guide.
 * These URLs are used to ground our style recommendations in the official documentation.
 */
export declare const STYLEGUIDE_CATEGORIES: {
    GENERAL: string;
    SOURCE_FILE_BASICS: string;
    SOURCE_FILE_STRUCTURE: string;
    LANGUAGE_FEATURES: string;
    NAMING: string;
    TYPE_SYSTEM: string;
    TOOLCHAIN: string;
    COMMENTS: string;
};
export declare const SOURCE_FILE_BASICS: {
    FILE_ENCODING: string;
    WHITESPACE: string;
    ESCAPE_SEQUENCES: string;
    NON_ASCII: string;
};
export declare const SOURCE_FILE_STRUCTURE: {
    OVERALL: string;
    COPYRIGHT: string;
    FILEOVERVIEW: string;
    IMPORTS: string;
    EXPORTS: string;
};
export declare const LANGUAGE_FEATURES: {
    VARIABLES: string;
    ARRAYS: string;
    OBJECTS: string;
    CLASSES: string;
    FUNCTIONS: string;
    THIS: string;
    INTERFACES: string;
    PRIMITIVES: string;
    CONTROL_STRUCTURES: string;
    DECORATORS: string;
    DISALLOWED: string;
};
export declare const NAMING: {
    IDENTIFIERS: string;
    NAMING_STYLE: string;
    RULES_BY_TYPE: string;
};
export declare const TYPE_SYSTEM: {
    TYPE_INFERENCE: string;
    UNDEFINED_NULL: string;
    STRUCTURAL_TYPES: string;
    INTERFACES_VS_TYPES: string;
    ARRAY_TYPE: string;
    INDEXABLE_TYPES: string;
    MAPPED_CONDITIONAL: string;
    ANY_TYPE: string;
    TUPLE_TYPES: string;
    WRAPPER_TYPES: string;
};
export declare const COMMENTS: {
    JSDOC_VS_COMMENTS: string;
    MULTILINE: string;
    JSDOC_FORM: string;
    MARKDOWN: string;
    JSDOC_TAGS: string;
};
/**
 * Get a full URL for a specific section of the style guide
 * @param section The section anchor
 * @returns Full URL to the section
 */
export declare function getStyleGuideUrl(section?: string): string;
/**
 * Map from category name to URL section
 */
export declare const CATEGORY_URL_MAP: Record<string, string>;
/**
 * Map from specific topics to their most relevant URL sections
 */
export declare const TOPIC_URL_MAP: Record<string, string>;
//# sourceMappingURL=styleguide-urls.d.ts.map