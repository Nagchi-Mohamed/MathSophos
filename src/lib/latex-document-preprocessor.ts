/**
 * LaTeX Document Command Preprocessor
 * 
 * Converts common LaTeX document structure commands to Markdown equivalents
 * before rendering with KaTeX (which only handles math).
 * 
 * This allows content to use LaTeX-like syntax for lists, formatting, etc.
 */

export class LatexDocumentPreprocessor {
  /**
   * Convert LaTeX document commands to Markdown
   */
  static convertToMarkdown(content: string): string {
    if (!content) return '';

    let processed = content;

    // Convert \begin{itemize}...\end{itemize} to Markdown lists
    processed = this.convertItemize(processed);

    // Convert \begin{enumerate}...\end{enumerate} to Markdown numbered lists
    processed = this.convertEnumerate(processed);

    // Convert \textbf{...} to **...**
    processed = this.convertTextBold(processed);

    // Convert \textit{...} to *...*
    processed = this.convertTextItalic(processed);

    // Convert \underline{...} to <u>...</u>
    processed = this.convertUnderline(processed);

    // Convert \section{...} to ## ...
    processed = this.convertSection(processed);

    // Convert \subsection{...} to ### ...
    processed = this.convertSubsection(processed);

    // Convert \subsubsection{...} to #### ...
    processed = this.convertSubsubsection(processed);

    // Convert \\ to <br/> (line breaks outside math mode)
    processed = this.convertLineBreaks(processed);

    return processed;
  }

  /**
   * Convert \begin{itemize}...\end{itemize} to Markdown bullet lists
   */
  private static convertItemize(content: string): string {
    // Match itemize blocks
    const itemizeRegex = /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g;

    return content.replace(itemizeRegex, (match, itemsContent) => {
      // Extract \item entries
      const items = itemsContent.split(/\\item\s+/).filter((item: string) => item.trim());

      // Convert to Markdown list
      return '\n' + items.map((item: string) => `- ${item.trim()}`).join('\n') + '\n';
    });
  }

  /**
   * Convert \begin{enumerate}...\end{enumerate} to Markdown numbered lists
   */
  private static convertEnumerate(content: string): string {
    const enumerateRegex = /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g;

    return content.replace(enumerateRegex, (match, itemsContent) => {
      const items = itemsContent.split(/\\item\s+/).filter((item: string) => item.trim());

      return '\n' + items.map((item: string, index: number) => `${index + 1}. ${item.trim()}`).join('\n') + '\n';
    });
  }

  /**
   * Convert \textbf{...} to **...**
   */
  private static convertTextBold(content: string): string {
    return content.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
  }

  /**
   * Convert \textit{...} to *...*
   */
  private static convertTextItalic(content: string): string {
    return content.replace(/\\textit\{([^}]+)\}/g, '*$1*');
  }

  /**
   * Convert \underline{...} to <u>...</u>
   */
  private static convertUnderline(content: string): string {
    return content.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');
  }

  /**
   * Convert \section{...} to ## ...
   */
  private static convertSection(content: string): string {
    return content.replace(/\\section\{([^}]+)\}/g, '\n## $1\n');
  }

  /**
   * Convert \subsection{...} to ### ...
   */
  private static convertSubsection(content: string): string {
    return content.replace(/\\subsection\{([^}]+)\}/g, '\n### $1\n');
  }

  /**
   * Convert \subsubsection{...} to #### ...
   */
  private static convertSubsubsection(content: string): string {
    return content.replace(/\\subsubsection\{([^}]+)\}/g, '\n#### $1\n');
  }

  /**
   * Convert \\ to line breaks (but preserve them in math mode)
   */
  private static convertLineBreaks(content: string): string {
    // This is tricky - we need to avoid converting \\ inside math delimiters
    // For now, we'll do a simple replacement outside of $...$ and $$...$$

    // Split by math delimiters
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/);

    return parts.map((part, index) => {
      // Even indices are non-math, odd indices are math
      if (index % 2 === 0) {
        // Not in math mode - convert \\ to <br/>
        return part.replace(/\\\\/g, '<br/>');
      }
      return part; // Keep math parts unchanged
    }).join('');
  }
}

export const latexDocumentPreprocessor = LatexDocumentPreprocessor;
