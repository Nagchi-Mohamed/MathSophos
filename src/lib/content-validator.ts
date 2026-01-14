/**
 * Content Validation System
 * Validates and sanitizes AI-generated content
 */

export class ContentValidator {
  private static readonly REJECTION_PATTERNS = [
    // Nonsense words and garbage text
    /uéglin|teintze|Vivérification|Établissement|cognatrice/i,
    /S_3\s*e\s*1|Slim\(.*?\)|SDf|equitimptique/i,
    /Extra-close branc|missing open brace/i,
    /Sx\d|S\d\s+Sx\d/, // Garbage variables like "Sx1", "S1 Sx1"
    // Mathematically incorrect patterns
    /\\ln\(ab\)\s*=\s*\\ln\(a\s*\+\s*b\)/, // WRONG: ln(ab) = ln(a + b)
    /\\to\s*\\\+\s*\\ln\(nx\)/, // Garbage limits
    /Vrac\{/, // "Vrac" instead of "frac"
    // Incomplete expressions
    /\\frac\{[^}]*$|\\lim_\{[^}]*$/, // Unclosed commands
    // Additional incomplete LaTeX
    /\\frac\{5-\\frac\{5\+\\frac\{5\+8\}4/, // Example unbalanced fraction
    // Repeated meaningless phrases (detect duplicates longer than 20 chars)
    // This will be checked in validateContent method
  ];

  private static readonly MATHEMATICAL_ERRORS = [
    /\\ln\([^)]*\s*\+\s*[^)]*\)\s*=\s*\\ln\([^)]*\)\s*\\cdot\s*\\ln\([^)]*\)/i,
    /\\ln\(ab\)\s*=\s*\\ln\(a\s*\+\s*b\)\\ln\(b\)/i,
    // Additional common errors
    /\\log_a x = \\frac{\\ln x}{\\ln a\\ln b}/, // Wrong log property
  ];

  static validateContent(content: string): {
    isValid: boolean;
    errors: string[];
    shouldReject: boolean;
  } {
    const errors: string[] = [];

    // Check for automatic rejection patterns
    const hasRejectionPattern = this.REJECTION_PATTERNS.some(pattern =>
      pattern.test(content)
    );

    if (hasRejectionPattern) {
      errors.push('Content contains forbidden nonsense text or patterns');
    }

    // Check for mathematical errors
    const hasMathErrors = this.MATHEMATICAL_ERRORS.some(pattern =>
      pattern.test(content)
    );

    if (hasMathErrors) {
      errors.push('Content contains mathematically incorrect statements');
    }

    // Check for repeated phrases
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        if (sentences[i].trim() === sentences[j].trim()) {
          errors.push('Content contains repeated meaningless phrases');
          break;
        }
      }
    }

    // Check LaTeX syntax
    const latexErrors = this.validateLatexSyntax(content);
    errors.push(...latexErrors);

    const shouldReject = hasRejectionPattern || hasMathErrors || latexErrors.length > 5;

    return {
      isValid: errors.length === 0,
      errors,
      shouldReject
    };
  }

  static validateLatexSyntax(content: string): string[] {
    const errors: string[] = [];

    // Check for balanced braces in LaTeX
    const latexBlocks = content.match(/\\latex\{[^}]*\}|\$[^$]+\$/g) || [];
    latexBlocks.forEach((block, index) => {
      const openBraces = (block.match(/\{/g) || []).length;
      const closeBraces = (block.match(/\}/g) || []).length;

      if (openBraces !== closeBraces) {
        errors.push(`Unbalanced braces in LaTeX block ${index + 1}: ${block.substring(0, 50)}...`);
      }

      // Check for common malformed commands
      if (block.includes('\\frac{') && !block.includes('}{')) {
        errors.push(`Malformed fraction in: ${block.substring(0, 50)}...`);
      }
      if (block.includes('\\lim_') && !block.includes('\\to')) {
        errors.push(`Malformed limit in: ${block.substring(0, 50)}...`);
      }
    });

    return errors;
  }

  static sanitizeContent(content: string): { sanitized: string; wasModified: boolean } {
    let sanitized = content;
    let wasModified = false;

    // Remove all garbage text patterns
    const garbagePatterns: [RegExp, string][] = [
      [/uéglin\(teintze\)/g, ''],
      [/Vivérification légale/g, ''],
      [/Établissement d'étude/g, ''],
      [/cognatrice/g, ''],
      [/S_3\s*e\s*1/g, ''],
      [/Slim\([^)]*\)/g, ''],
      [/SDf/g, ''],
      [/equitimptique/g, ''],
      [/Extra-close branc or missing open brace/g, ''],
      [/Sx\d/g, 'x'],
      [/S\d\s+Sx\d/g, 'Si x'],
    ];

    garbagePatterns.forEach(([pattern, replacement]) => {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, replacement);
        wasModified = true;
      }
    });

    // Fix mathematically incorrect statements
    if (/\\ln\(ab\)\s*=\s*\\ln\(a\s*\+\s*b\)/.test(sanitized)) {
      sanitized = sanitized.replace(
        /\\ln\(ab\)\s*=\s*\\ln\(a\s*\+\s*b\)\\ln\(b\)/g,
        '\\latex{\\ln(ab) = \\ln a + \\ln b}'
      );
      wasModified = true;
    }

    // Simple brace balancing for common cases (e.g., add missing } for fractions)
    // This is heuristic; for full balancing, more complex logic needed
    const braceMismatch = (sanitized.match(/\{/g) || []).length - (sanitized.match(/\}/g) || []).length;
    if (braceMismatch > 0) {
      sanitized += '}'.repeat(braceMismatch);
      wasModified = true;
    }

    return { sanitized, wasModified };
  }
}
