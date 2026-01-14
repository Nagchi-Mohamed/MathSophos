// Node.js LaTeX Preprocessor
export const latexPreprocessor = {
  /**
   * Convert \begin{tabular} to \begin{array} for KaTeX compatibility
   * KaTeX doesn't support tabular, but array works well for mathematical tables
   */
  convertTabularToArray: (content: string) => {
    return content
      .replace(/\\begin{tabular}(\{[^}]*\})?/g, (match, alignment) => {
        // Preserve alignment if present, otherwise use default
        return `\\begin{array}${alignment || '{c}'}`
      })
      .replace(/\\end{tabular}/g, '\\end{array}')
  },

  normalizeDelimiters: (content: string) => {
    // Convert various LaTeX delimiters to MathJax format
    let normalized = content
      .replace(/\\\[/g, '$$')
      .replace(/\\\]/g, '$$')
      .replace(/\\\(/g, '$')
      .replace(/\\\)/g, '$')
      .replace(/\\begin{equation\*?}/g, '$$')
      .replace(/\\end{equation\*?}/g, '$$')
      // Precise fixes for common rendering artifacts
      .replace(/qeq1/g, 'q \\neq 1')
      .replace(/q\\neq1/g, 'q \\neq 1')
      .replace(/\(où\s*qeq1\)/g, '(où $q \\neq 1$)') // Handle (où qeq1) specifically
      .replace(/\\neq\s*1/g, '\\neq 1'); // Ensure spacing

    // Convert tabular to array for KaTeX compatibility
    normalized = latexPreprocessor.convertTabularToArray(normalized);

    return normalized;
  },

  wrapDisplayMath: (content: string) => {
    // Ensure display math has proper spacing
    return content.replace(/\$\$([\s\S]*?)\$\$/g, '\n\n$$$1$$\n\n');
  },

  escapeHTML: (content: string) => {
    // Escape HTML but preserve LaTeX
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Wrap standalone LaTeX commands in delimiters
   * This handles cases where LaTeX commands appear without $ or \( delimiters
   */
  wrapStandaloneLatexCommands: (content: string) => {
    // Common LaTeX commands that should be wrapped
    const latexCommands = [
      // Math symbols
      '\\\\mathbb', '\\\\mathcal', '\\\\mathfrak', '\\\\mathbf', '\\\\mathrm',
      // Greek letters
      '\\\\alpha', '\\\\beta', '\\\\gamma', '\\\\delta', '\\\\epsilon', '\\\\zeta', '\\\\eta', '\\\\theta',
      '\\\\iota', '\\\\kappa', '\\\\lambda', '\\\\mu', '\\\\nu', '\\\\xi', '\\\\pi', '\\\\rho',
      '\\\\sigma', '\\\\tau', '\\\\upsilon', '\\\\phi', '\\\\chi', '\\\\psi', '\\\\omega',
      '\\\\Gamma', '\\\\Delta', '\\\\Theta', '\\\\Lambda', '\\\\Xi', '\\\\Pi', '\\\\Sigma',
      '\\\\Upsilon', '\\\\Phi', '\\\\Psi', '\\\\Omega',
      // Relations and operators
      '\\\\in', '\\\\notin', '\\\\subset', '\\\\subseteq', '\\\\supset', '\\\\supseteq',
      '\\\\cup', '\\\\cap', '\\\\setminus', '\\\\emptyset', '\\\\infty',
      '\\\\leq', '\\\\geq', '\\\\neq', '\\\\approx', '\\\\equiv', '\\\\sim',
      '\\\\times', '\\\\div', '\\\\pm', '\\\\mp', '\\\\cdot', '\\\\circ',
      '\\\\mid', '\\\\nmid', '\\\\parallel', '\\\\perp',
      // Functions
      '\\\\sin', '\\\\cos', '\\\\tan', '\\\\cot', '\\\\sec', '\\\\csc',
      '\\\\arcsin', '\\\\arccos', '\\\\arctan',
      '\\\\sinh', '\\\\cosh', '\\\\tanh',
      '\\\\log', '\\\\ln', '\\\\exp',
      '\\\\lim', '\\\\sup', '\\\\inf', '\\\\max', '\\\\min',
      '\\\\sum', '\\\\prod', '\\\\int', '\\\\oint',
      // Arrows
      '\\\\rightarrow', '\\\\leftarrow', '\\\\leftrightarrow',
      '\\\\Rightarrow', '\\\\Leftarrow', '\\\\Leftrightarrow',
      '\\\\implies', '\\\\iff',
      // Others
      '\\\\frac', '\\\\sqrt', '\\\\overline', '\\\\underline',
      '\\\\vec', '\\\\hat', '\\\\tilde', '\\\\bar'
    ];

    // Create a regex pattern that matches any LaTeX command not already in delimiters
    // We need to avoid matching commands that are already inside $...$ or \(...\) or \[...\]
    let result = content;

    // Pattern to match LaTeX commands with their arguments
    // This will match things like \mathbb{N}, \frac{1}{2}, \sin x, etc.
    const commandPattern = new RegExp(
      `(${latexCommands.join('|')})(?![a-zA-Z])(?:\\{[^}]*\\}|\\s+\\w+)?`,
      'g'
    );

    // We need to be careful not to wrap commands that are already in math mode
    // Strategy: Split by existing delimiters, process only the non-math parts
    const parts: string[] = [];
    let lastIndex = 0;

    // Find all existing math delimiters
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\\$$[\s\S]*?\\$$|\\$$[^\\$$]+?\\$$)/g;
    let match;

    while ((match = mathRegex.exec(content)) !== null) {
      // Add text before math
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore) {
        // Wrap standalone commands in this text
        parts.push(textBefore.replace(commandPattern, '$$$&$$'));
      }
      // Add the math part unchanged
      parts.push(match[0]);
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    const remainingText = content.substring(lastIndex);
    if (remainingText) {
      parts.push(remainingText.replace(commandPattern, '$$$&$$'));
    }

    return parts.join('');
  },

  normalizeLatex: (content: string) => {
    // First wrap standalone commands
    let normalized = latexPreprocessor.wrapStandaloneLatexCommands(content);
    // Then normalize delimiters
    normalized = latexPreprocessor.normalizeDelimiters(normalized);
    return normalized;
  }
};

