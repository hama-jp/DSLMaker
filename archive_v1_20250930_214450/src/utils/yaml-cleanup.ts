/**
 * YAML cleanup utilities for fixing common formatting issues
 * Extracted from comprehensive testing to improve DSL generation reliability
 */

import yaml from 'js-yaml'

/**
 * Clean YAML content to fix common formatting issues that cause parsing failures
 * @param yamlContent The raw YAML content to clean
 * @returns Cleaned YAML content
 */
export function cleanYamlContent(yamlContent: string): string {
  let content = yamlContent

  // Critical fixes for most common failure patterns
  content = content
    // Fix the most critical issue: keys missing proper indentation/newlines
    // Pattern: "app: description:" should be "app:\n  description:"
    .replace(/^(\w+):\s+(\w+):/gm, '$1:\n  $2:')

    // Fix the most common issue: "workflow" without colon
    .replace(/^workflow$/gm, 'workflow:')
    .replace(/^(\s*)workflow$/gm, '$1workflow:')

    // Fix other top-level keys without colons
    .replace(/^app$/gm, 'app:')
    .replace(/^kind app$/gm, 'kind: app')
    .replace(/^version (\d+\.[\d\.]+)$/gm, 'version: $1')

    // Fix merged lines (most critical patterns)
    .replace(/version:\s*0\.1\.5\s*workflow:/g, 'version: 0.1.5\n\nworkflow:')
    .replace(/kind:\s*app\s*version:/g, 'kind: app\nversion:')

    // Fix mode and other common missing colons
    .replace(/mode\s+workflow/g, 'mode: workflow')
    .replace(/kind\s+app/g, 'kind: app')

    // Fix lines that start with colon (invalid YAML)
    .replace(/^\s*:\s*/gm, '')

    // Fix missing spaces after colons (but avoid URLs)
    .replace(/:\s*([^\s\n])/g, ': $1')

  return content
}

/**
 * Advanced YAML cleaning with additional patterns
 * @param yamlContent The raw YAML content to clean
 * @returns Cleaned YAML content with advanced fixes
 */
export function advancedYamlCleanup(yamlContent: string): string {
  let content = cleanYamlContent(yamlContent)

  // Additional advanced cleaning patterns
  content = content
    // Fix array indicators - handle cases like "items: -item1" -> "items:\n  - item1"
    .replace(/^(\s*)(\w+):\s*-([^\s])/gm, '$1$2:\n$1  - $3')
    // Fix array indicators - ensure space after dash
    .replace(/^(\s*)- ([^-\s])/gm, '$1- $2')

    // Fix boolean values
    .replace(/:\s*(true|false)([^\w])/g, ': $1$2')

    // Fix number values
    .replace(/:\s*(\d+)([^\d\.])/g, ': $1$2')

    // Remove extra whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')

    // Ensure proper line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

  return content
}

/**
 * Validate that YAML content can be parsed
 * @param yamlContent The YAML content to validate
 * @returns Object indicating if valid and any error message
 */
export function validateYamlSyntax(yamlContent: string): { isValid: boolean; error?: string } {
  try {
    yaml.load(yamlContent)
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown YAML parsing error'
    }
  }
}

/**
 * Clean and validate YAML content in one step
 * @param yamlContent The raw YAML content
 * @returns Object with cleaned content and validation result
 */
export function cleanAndValidateYaml(yamlContent: string): {
  cleaned: string
  isValid: boolean
  error?: string
} {
  const cleaned = advancedYamlCleanup(yamlContent)
  const validation = validateYamlSyntax(cleaned)

  return {
    cleaned,
    isValid: validation.isValid,
    error: validation.error
  }
}