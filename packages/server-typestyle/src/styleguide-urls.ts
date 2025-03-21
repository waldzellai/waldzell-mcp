/**
 * Google TypeScript Style Guide URL Reference Map
 * 
 * This file provides direct links to the different sections of the Google TypeScript Style Guide.
 * These URLs are used to ground our style recommendations in the official documentation.
 */

const BASE_URL = 'https://google.github.io/styleguide/tsguide.html';

// Main categories with their corresponding anchors
export const STYLEGUIDE_CATEGORIES = {
  GENERAL: '',
  SOURCE_FILE_BASICS: '#source-file-basics',
  SOURCE_FILE_STRUCTURE: '#source-file-structure',
  LANGUAGE_FEATURES: '#language-features',
  NAMING: '#naming',
  TYPE_SYSTEM: '#type-system',
  TOOLCHAIN: '#toolchain-requirements',
  COMMENTS: '#comments-and-documentation'
};

// Source File Basics sections
export const SOURCE_FILE_BASICS = {
  FILE_ENCODING: '#file-encoding-utf-8',
  WHITESPACE: '#whitespace-characters',
  ESCAPE_SEQUENCES: '#special-escape-sequences',
  NON_ASCII: '#non-ascii-characters'
};

// Source File Structure sections
export const SOURCE_FILE_STRUCTURE = {
  OVERALL: '#source-file-structure',
  COPYRIGHT: '#copyright-information',
  FILEOVERVIEW: '#fileoverview-jsdoc',
  IMPORTS: '#imports',
  EXPORTS: '#exports'
};

// Language Features sections
export const LANGUAGE_FEATURES = {
  VARIABLES: '#local-variable-declarations',
  ARRAYS: '#array-literals',
  OBJECTS: '#object-literals',
  CLASSES: '#classes',
  FUNCTIONS: '#functions',
  THIS: '#this',
  INTERFACES: '#interfaces',
  PRIMITIVES: '#primitive-literals',
  CONTROL_STRUCTURES: '#control-structures',
  DECORATORS: '#decorators',
  DISALLOWED: '#disallowed-features'
};

// Naming sections
export const NAMING = {
  IDENTIFIERS: '#identifiers',
  NAMING_STYLE: '#naming-style',
  RULES_BY_TYPE: '#rules-by-identifier-type'
};

// Type System sections
export const TYPE_SYSTEM = {
  TYPE_INFERENCE: '#type-inference',
  UNDEFINED_NULL: '#undefined-and-null',
  STRUCTURAL_TYPES: '#use-structural-types',
  INTERFACES_VS_TYPES: '#prefer-interfaces-over-type-literal-aliases',
  ARRAY_TYPE: '#array-t-type',
  INDEXABLE_TYPES: '#indexable-types--index-signatures',
  MAPPED_CONDITIONAL: '#mapped-and-conditional-types',
  ANY_TYPE: '#any-type',
  TUPLE_TYPES: '#tuple-types',
  WRAPPER_TYPES: '#wrapper-types'
};

// Comments and Documentation sections
export const COMMENTS = {
  JSDOC_VS_COMMENTS: '#jsdoc-versus-comments',
  MULTILINE: '#multi-line-comments',
  JSDOC_FORM: '#jsdoc-general-form',
  MARKDOWN: '#markdown',
  JSDOC_TAGS: '#jsdoc-tags'
};

/**
 * Get a full URL for a specific section of the style guide
 * @param section The section anchor
 * @returns Full URL to the section
 */
export function getStyleGuideUrl(section: string = ''): string {
  return `${BASE_URL}${section}`;
}

/**
 * Map from category name to URL section
 */
export const CATEGORY_URL_MAP: Record<string, string> = {
  'source_file_structure': STYLEGUIDE_CATEGORIES.SOURCE_FILE_STRUCTURE,
  'language_features': STYLEGUIDE_CATEGORIES.LANGUAGE_FEATURES,
  'naming_conventions': STYLEGUIDE_CATEGORIES.NAMING,
  'type_system': STYLEGUIDE_CATEGORIES.TYPE_SYSTEM,
  'code_formatting': STYLEGUIDE_CATEGORIES.SOURCE_FILE_BASICS,
  'best_practices': STYLEGUIDE_CATEGORIES.LANGUAGE_FEATURES,
  'performance_optimization': STYLEGUIDE_CATEGORIES.TYPE_SYSTEM,
  'documentation': STYLEGUIDE_CATEGORIES.COMMENTS
};

/**
 * Map from specific topics to their most relevant URL sections
 */
export const TOPIC_URL_MAP: Record<string, string> = {
  // Source file structure
  'imports': SOURCE_FILE_STRUCTURE.IMPORTS,
  'exports': SOURCE_FILE_STRUCTURE.EXPORTS,
  'file_encoding': SOURCE_FILE_BASICS.FILE_ENCODING,
  'utf8': SOURCE_FILE_BASICS.FILE_ENCODING,
  'whitespace': SOURCE_FILE_BASICS.WHITESPACE,
  'fileoverview': SOURCE_FILE_STRUCTURE.FILEOVERVIEW,
  'copyright': SOURCE_FILE_STRUCTURE.COPYRIGHT,
  
  // Language features
  'variables': LANGUAGE_FEATURES.VARIABLES,
  'const': LANGUAGE_FEATURES.VARIABLES,
  'let': LANGUAGE_FEATURES.VARIABLES,
  'arrays': LANGUAGE_FEATURES.ARRAYS,
  'objects': LANGUAGE_FEATURES.OBJECTS,
  'classes': LANGUAGE_FEATURES.CLASSES,
  'functions': LANGUAGE_FEATURES.FUNCTIONS,
  'this': LANGUAGE_FEATURES.THIS,
  'control_flow': LANGUAGE_FEATURES.CONTROL_STRUCTURES,
  'control_structures': LANGUAGE_FEATURES.CONTROL_STRUCTURES,
  'if': LANGUAGE_FEATURES.CONTROL_STRUCTURES,
  'for': LANGUAGE_FEATURES.CONTROL_STRUCTURES,
  'while': LANGUAGE_FEATURES.CONTROL_STRUCTURES,
  'switch': LANGUAGE_FEATURES.CONTROL_STRUCTURES,
  'decorators': LANGUAGE_FEATURES.DECORATORS,
  'eval': LANGUAGE_FEATURES.DISALLOWED,
  'with': LANGUAGE_FEATURES.DISALLOWED,
  
  // Naming
  'naming': NAMING.NAMING_STYLE,
  'camelCase': NAMING.NAMING_STYLE,
  'PascalCase': NAMING.NAMING_STYLE,
  'CONSTANT_CASE': NAMING.NAMING_STYLE,
  'interface_naming': NAMING.RULES_BY_TYPE,
  'class_naming': NAMING.RULES_BY_TYPE,
  'variable_naming': NAMING.RULES_BY_TYPE,
  'function_naming': NAMING.RULES_BY_TYPE,
  'enum_naming': NAMING.RULES_BY_TYPE,
  'constant_naming': NAMING.RULES_BY_TYPE,
  
  // Type system
  'types': TYPE_SYSTEM.TYPE_INFERENCE,
  'interfaces': LANGUAGE_FEATURES.INTERFACES,
  'interface': LANGUAGE_FEATURES.INTERFACES,
  'type_inference': TYPE_SYSTEM.TYPE_INFERENCE,
  'null': TYPE_SYSTEM.UNDEFINED_NULL,
  'undefined': TYPE_SYSTEM.UNDEFINED_NULL,
  'structural_types': TYPE_SYSTEM.STRUCTURAL_TYPES,
  'interfaces_vs_types': TYPE_SYSTEM.INTERFACES_VS_TYPES,
  'array_type': TYPE_SYSTEM.ARRAY_TYPE,
  'array_syntax': TYPE_SYSTEM.ARRAY_TYPE,
  'index_signature': TYPE_SYSTEM.INDEXABLE_TYPES,
  'any': TYPE_SYSTEM.ANY_TYPE,
  'tuple': TYPE_SYSTEM.TUPLE_TYPES,
  'wrapper_types': TYPE_SYSTEM.WRAPPER_TYPES,
  
  // Comments and documentation
  'comments': COMMENTS.JSDOC_VS_COMMENTS,
  'documentation': COMMENTS.JSDOC_VS_COMMENTS,
  'jsdoc': COMMENTS.JSDOC_FORM,
  'markdown': COMMENTS.MARKDOWN,
  'multiline_comments': COMMENTS.MULTILINE
};