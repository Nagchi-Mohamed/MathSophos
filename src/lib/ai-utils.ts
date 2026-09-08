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
 * Handles ALL invalid JSON escape sequences generically by double-escaping lone backslashes.
 * Also sanitizes unescaped control characters (newlines, tabs) INSIDE string literals.
 */
export function fixLatexJsonEscapes(jsonString: string): string {
  if (!jsonString) return jsonString;

  let out = "";
  let i = 0;
  let inString = false;
  const len = jsonString.length;

  while (i < len) {
    const char = jsonString[i];

    // Handle quotes to toggle string state
    if (char === '"') {
      // Count preceding backslashes to determine if quote is escaped
      let backslashCount = 0;
      let j = i - 1;
      while (j >= 0 && jsonString[j] === '\\') { backslashCount++; j--; }
      // Even number of backslashes = real unescaped quote
      if (backslashCount % 2 === 0) inString = !inString;
      out += char;
      i++;
      continue;
    }

    if (inString) {
      // Escape raw control characters that are invalid inside JSON strings
      if (char === '\n') { out += '\\n'; i++; continue; }
      if (char === '\r') { out += '\\r'; i++; continue; }
      if (char === '\t') { out += '\\t'; i++; continue; }
      if (char === '\b') { out += '\\b'; i++; continue; }
      if (char === '\f') { out += '\\f'; i++; continue; }

      // Handle backslashes: valid JSON escapes pass through; everything else gets double-escaped
      if (char === '\\' && i + 1 < len) {
        const next = jsonString[i + 1];
        // Valid JSON escape characters: " \ / b f n r t u
        if ('"\\\/bfnrtu'.includes(next)) {
          // Valid — copy both chars and advance
          out += char + next;
          i += 2;
          continue;
        } else {
          // Invalid JSON escape (LaTeX commands: \frac, \lim, \sum, \alpha, \cdot, etc.)
          // Double-escape the backslash so it becomes a literal backslash in the parsed string
          out += '\\\\';
          i++;
          continue;
        }
      }

      // Trailing backslash at end of string
      if (char === '\\' && i + 1 === len) {
        out += '\\\\';
        i++;
        continue;
      }
    }

    // Default: copy char as-is
    out += char;
    i++;
  }

  return out;
}

export const generateText = aiGenerateText
