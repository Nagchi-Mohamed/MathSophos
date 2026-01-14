import { generateText as aiGenerateText } from "ai"
import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"

export interface ModelConfig {
  provider: 'google' | 'openai' | 'anthropic'
  modelId: string
}

export function getModel(config: ModelConfig) {
  if (config.provider === 'google') {
    return google(config.modelId)
  }
  if (config.provider === 'openai') {
    return openai(config.modelId)
  }
  throw new Error(`Unsupported provider: ${config.provider}`)
}

/**
 * System prompt with strict LaTeX formatting rules
 * This is prepended to all AI generation prompts to ensure clean, renderable output
 */
export const LATEX_FORMATTING_SYSTEM_PROMPT = `# STRICT LaTeX FORMATTING RULES - MUST FOLLOW EXACTLY

## CRITICAL RULES:

1. **MATH DELIMITERS:**
   - Use $expression$ for inline math (NO spaces: "$x$" ✓ | "$ x $" ✗)
   - Use $$expression$$ for display math on its own line
   - NEVER mix $ $ and \\( \\) delimiters

2. **TABLE FORMATTING - ABSOLUTE RULES:**
   - NEVER split math expressions across table cells
   - WRONG: | $ | q | < 1$ |
   - CORRECT: | Condition | $|q| < 1$ |
   - Each cell must contain COMPLETE expressions only

3. **COMPLETENESS:**
   - Every $ must have a matching $
   - Every { must have a matching }
   - Every \\begin must have a matching \\end
   - NO line breaks inside math expressions

4. **GEOMETRIC SERIES TABLE TEMPLATE:**
| Expression | Condition | Convergence | Sum Formula |
|---|---|---|---|
| $\\sum_{n=0}^{\\infty} q^n$ | $|q| < 1$ | Converges | $\\frac{1}{1-q}$ |
| $\\sum_{n=1}^{\\infty} q^n$ | $|q| < 1$ | Converges | $\\frac{q}{1-q}$ |
| $\\sum_{n=k}^{\\infty} q^n$ | $|q| < 1$ | Converges | $\\frac{q^k}{1-q}$ |

5. **VALIDATION BEFORE OUTPUT:**
   - Count $ symbols: must be EVEN
   - No math in table | separators
   - All expressions complete in single cells
   - No spaces between $ and expression

FAILURE TO FOLLOW THESE RULES WILL CAUSE RENDERING ERRORS.
`;


/**
 * Improves raw AI response text by fixing common LaTeX vs JSON escaping issues.
 * Specifically handles LaTeX commands that start with characters that JSON considers escape sequences (\n, \r, \t, \b, \f).
 * Also sanitizes unescaped control characters (newlines, tabs) INSIDE string literals, which causes "Bad control character" errors.
 */
export function fixLatexJsonEscapes(jsonString: string): string {
  if (!jsonString) return jsonString;

  let out = "";
  let i = 0;
  let inString = false;
  let len = jsonString.length;

  while (i < len) {
    const char = jsonString[i];

    // Handle quotes to toggle string state
    if (char === '"') {
      // Check if it's an escaped quote
      let backslashCount = 0;
      let j = i - 1;
      while (j >= 0 && jsonString[j] === '\\') {
        backslashCount++;
        j--;
      }
      // If even number of backslashes, the quote is real (not escaped)
      if (backslashCount % 2 === 0) {
        inString = !inString;
      }
      out += char;
      i++;
      continue;
    }

    // If we are inside a string, we need to handle control characters and specific LaTeX patterns
    if (inString) {
      // 0. Handle double backslashes (already escaped)
      // If we encounter \\, it means a literal backslash in the final string.
      // We should preserve it as \\ and skip the next character (which is the second slash).
      if (char === '\\' && i + 1 < len && jsonString[i + 1] === '\\') {
        out += '\\\\';
        i += 2;
        continue;
      }

      // 1. Handle actual control characters (newlines, tabs, etc.)
      // These are invalid in standard JSON strings and must be escaped
      if (char === '\n') {
        out += '\\n';
        i++;
        continue;
      }
      if (char === '\r') {
        // Just ignore CR or start a newline? Usually ignore if followed by \n
        // But let's just escape it to be safe
        out += '\\r';
        i++;
        continue;
      }
      if (char === '\t') {
        out += '\\t';
        i++;
        continue;
      }

      // 2. Handle LaTeX command collisions (e.g. \neq -> \n + eq)
      // Check for backslash followed by specific chars
      if (char === '\\') {
        // Look ahead
        if (i + 1 < len) {
          const remaining = jsonString.slice(i);
          let matched = false;

          // List of problematic LaTeX commands that start with chars colliding with JSON escapes:
          // \b (backspace): \beta, \bar, \begin, \binom, \bigcap, \bigcup, \mathbf, \mathbb
          // \f (form feed): \frac, \forall
          // \n (newline): \neq, \nabla, \notin, \nexists
          // \r (carriage return): \rho, \right, \rightarrow, \Re
          // \t (tab): \tan, \tau, \theta, \times, \text, \to, \top, \triangle

          // We check longest matches first to avoid prefix issues (though rare here)
          const commands = [
            '\\rightarrow', '\\triangle', '\\mathbf', '\\mathbb', '\\bigcap', '\\bigcup',
            '\\right', '\\frac', '\\prod', '\\perp', // \prod starts with \p (not escape), but \perp too. Wait \p is invalid escape.
            // Focusing on collisions (\b, \f, \n, \r, \t)
            '\\begin', '\\binom', '\\beta', '\\bar',
            '\\frac', '\\forall',
            '\\neq', '\\nabla', '\\notin',
            '\\rho', '\\right',
            '\\times', '\\text', '\\theta', '\\tan', '\\tau', '\\top'
          ];

          for (const cmd of commands) {
            if (remaining.startsWith(cmd)) {
              out += '\\' + cmd; // double escape: \\frac
              i += cmd.length;
              matched = true;
              break;
            }
          }

          if (matched) continue;
        }
      }
    }

    // Default: just copy char
    out += char;
    i++;
  }

  return out;
}

export const generateText = aiGenerateText
