/**
 * Strip old chapter headers from content (for backward compatibility)
 * Removes old markdown headers that contained MathSophos Platform, professor, filière, module, lesson, and chapter info
 * Note: New chapters use the ChapterHeader React component, not markdown headers
 */
export function stripChapterHeader(content: string): string {
  if (!content) return content;

  let cleaned = content;

  // Pattern 1: Exact format from image - no space between --- and MathSophos Platform
  // ---MathSophos Platform | Prof:Mohamed Nagchi
  // **Filière:** MIPC | **Module:** Analyse | **Leçon:** Analyse 1
  // **Chapitre 1:** les suites numérique
  const exactPattern = /^---MathSophos Platform[^\n]*Prof:[^\n]*\n\*\*Filière:\*\*[^\n]*\n\*\*Chapitre \d+:\*\*[^\n]*\n?/m;
  cleaned = cleaned.replace(exactPattern, '');

  // Pattern 2: Full header block with --- delimiters (multi-line with spaces)
  // ---
  // **MathSophos Platform** | Prof:Mohamed Nagchi
  // **Filière:** MIPC | **Module:** Analyse | **Leçon:** Analyse 1
  // **Chapitre 1:** les suites numérique
  // ---
  const fullHeaderPattern = /^---[\s\S]*?\*\*MathSophos Platform\*\*[\s\S]*?\*\*Chapitre \d+:\*\*[\s\S]*?---\s*\n?/;
  cleaned = cleaned.replace(fullHeaderPattern, '');

  // Pattern 3: Header starting with ---MathSophos (no space, no **)
  const noSpaceNoBoldPattern = /^---MathSophos Platform[^\n]*Prof:[^\n]*\n\*\*?Filière:\*\*?[^\n]*\n\*\*?Chapitre \d+:\*\*?[^\n]*(\n---)?\s*\n?/m;
  cleaned = cleaned.replace(noSpaceNoBoldPattern, '');

  // Pattern 4: Header without closing ---
  const headerWithoutClosing = /^---[\s\S]*?MathSophos Platform[\s\S]*?Chapitre \d+:[\s\S]*?\n\n/;
  cleaned = cleaned.replace(headerWithoutClosing, '');

  // Pattern 5: Remove individual header lines if they appear separately (multiline mode)
  // Remove line: ---MathSophos Platform | Prof:... (with or without **)
  cleaned = cleaned.replace(/^---\*?\*?MathSophos Platform\*?\*?[^\n]*Prof:[^\n]*\n?/gm, '');

  // Remove line: **Filière:** ... | **Module:** ... | **Leçon:** ...
  cleaned = cleaned.replace(/^\*\*Filière:\*\*[^\n]*\*\*Module:\*\*[^\n]*\*\*Leçon:\*\*[^\n]*\n?/gm, '');

  // Remove line: **Chapitre X:** ...
  cleaned = cleaned.replace(/^\*\*Chapitre \d+:\*\*[^\n]*\n?/gm, '');

  // Pattern 6: More aggressive - match any sequence of these header lines
  const aggressivePattern = /(^|\n)(---\*?\*?MathSophos Platform\*?\*?[^\n]*Prof:[^\n]*|MathSophos Platform[^\n]*Prof:[^\n]*)\n(\*\*?Filière:\*\*?[^\n]*\n)?(\*\*?Module:\*\*?[^\n]*\n)?(\*\*?Leçon:\*\*?[^\n]*\n)?\*\*?Chapitre \d+:\*\*?[^\n]*(\n---)?\s*\n+/;
  cleaned = cleaned.replace(aggressivePattern, '$1');

  // Pattern 7: Remove any remaining standalone --- lines
  cleaned = cleaned.replace(/^---\s*$/gm, '');

  // Pattern 8: Remove lines containing just "MathSophos Platform" with professor (any format)
  cleaned = cleaned.replace(/^[^\n]*MathSophos Platform[^\n]*Prof:[^\n]*\n?/gm, '');

  // Pattern 9: Remove lines containing "Filière:" and "Module:" and "Leçon:" together
  cleaned = cleaned.replace(/^[^\n]*\*\*?Filière:\*\*?[^\n]*\*\*?Module:\*\*?[^\n]*\*\*?Leçon:\*\*?[^\n]*\n?/gm, '');

  // Pattern 10: Remove any line with "Chapitre X:" at the start (if it's a header line, not content)
  // Only remove if it's near the beginning and followed by content
  const chapitreHeaderPattern = /^(---\s*)?\*\*?Chapitre \d+:\*\*?[^\n]*\n\n/;
  cleaned = cleaned.replace(chapitreHeaderPattern, '');

  // Note: New chapters use the ChapterHeader React component, not markdown headers.
  // This function is kept for backward compatibility with old lesson/chapter content
  // that might have markdown headers embedded in them.

  // Pattern 13: Most aggressive - remove any occurrence of these header elements anywhere
  // But be careful not to remove actual content that might mention these terms
  // Only remove if they appear in the header pattern format
  // Note: Headers in introduction section are already handled by patterns 11 and 12
  const anywherePattern = /(^|\n\n)---?\*?\*?MathSophos Platform\*?\*?[^\n]*Prof:[^\n]*(\n\*\*?Filière:\*\*?[^\n]*)?(\n\*\*?Module:\*\*?[^\n]*)?(\n\*\*?Leçon:\*\*?[^\n]*)?\n\*\*?Chapitre \d+:\*\*?[^\n]*(\n---)?\s*\n+/;
  cleaned = cleaned.replace(anywherePattern, '$1');

  // Remove any leading/trailing whitespace and extra newlines
  return cleaned.trim().replace(/^\n+/, '');
}
