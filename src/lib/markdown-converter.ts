/**
 * Markdown conversion utilities - LaTeX normalization is handled in `MarkdownRenderer`
 */

/**
 * Convert AI-generated lesson JSON to Markdown format
 * Supports both old complex structure and new simplified structure
 * @param lessonData - The lesson/chapter data from AI
 * @param header - Optional header to prepend to the markdown
 */
export function convertLessonJsonToMarkdown(lessonData: any, header?: string): string {
  // Handle both old and new structure
  const lesson = lessonData.lesson || lessonData

  // Don't add title header if header is provided (for chapters)
  let markdown = header || ""
  // Only add title if no header was provided (for lessons, not chapters)
  if (!header) {
    // Title is now handled by the page header component
    // markdown += `# ${lesson.titleFr || lesson.title || 'Leçon'}\n\n`
  }

  // Helper function to normalize newlines in text content
  const normalizeNewlines = (text: string): string => {
    if (!text) return text;
    // Convert literal \n strings to actual newlines, then normalize
    // Handle both escaped \n and actual newlines
    return text
      .replace(/\\n/g, '\n')  // Convert escaped \n to actual newline
      .replace(/\r\n/g, '\n')  // Normalize Windows line endings
      .replace(/\r/g, '\n')    // Normalize Mac line endings
      .replace(/\n{3,}/g, '\n\n'); // Collapse multiple newlines to double
  };

  // Track section numbering
  let sectionCount = 0;

  // Introduction
  if (lesson.introduction) {
    sectionCount++;
    const introduction = normalizeNewlines(lesson.introduction);
    markdown += `## ${sectionCount}. Introduction\n\n${introduction}\n\n`
  }

  // Definitions
  if (lesson.definitions && lesson.definitions.length > 0) {
    sectionCount++;
    markdown += `## ${sectionCount}. Définitions\n\n`
    lesson.definitions.forEach((def: any) => {
      markdown += `**${def.term}**\n\n`
      const definition = normalizeNewlines(def.definition || '');
      markdown += `${definition}\n\n`
      if (def.example) {
        const example = normalizeNewlines(def.example);
        markdown += `*Exemple :* ${example}\n\n`
      }
      markdown += `---\n\n`
    })
  }

  // Theorems
  if (lesson.theorems && lesson.theorems.length > 0) {
    sectionCount++;
    markdown += `## ${sectionCount}. Théorèmes et Propriétés\n\n`
    lesson.theorems.forEach((theorem: any) => {
      markdown += `**${theorem.name}**\n\n`
      const statement = normalizeNewlines(theorem.statement || '');
      markdown += `_Énoncé :_ ${statement}\n\n`
      if (theorem.proof) {
        const proof = normalizeNewlines(theorem.proof);
        markdown += `_Démonstration :_ ${proof}\n\n`
      }
      if (theorem.application) {
        const application = normalizeNewlines(theorem.application);
        markdown += `_Application :_ ${application}\n\n`
      }
      markdown += `---\n\n`
    })
  }

  // Formulas
  if (lesson.formulas && lesson.formulas.length > 0) {
    sectionCount++;
    markdown += `## ${sectionCount}. Formules Importantes\n\n`
    lesson.formulas.forEach((formula: any) => {
      let cleanFormula = formula.formula.trim();
      // Remove existing delimiters if present to avoid double wrapping
      if (cleanFormula.startsWith('$$') && cleanFormula.endsWith('$$')) {
        cleanFormula = cleanFormula.slice(2, -2);
      } else if (cleanFormula.startsWith('$') && cleanFormula.endsWith('$')) {
        cleanFormula = cleanFormula.slice(1, -1);
      } else if (cleanFormula.startsWith('\\[') && cleanFormula.endsWith('\\]')) {
        cleanFormula = cleanFormula.slice(2, -2);
      }

      markdown += `$$${cleanFormula}$$\n\n`
      if (formula.explanation) {
        markdown += `${formula.explanation}\n\n`
      }
      if (formula.variables) {
        markdown += `_Variables :_ ${formula.variables}\n\n`
      }
      markdown += `---\n\n`
    })
  }

  // Examples
  if (lesson.examples && lesson.examples.length > 0) {
    sectionCount++;
    markdown += `## ${sectionCount}. Exemples\n\n`
    lesson.examples.forEach((example: any, index: number) => {
      markdown += `**Exemple ${index + 1}${example.title ? ` : ${example.title}` : ''}**\n\n`
      if (example.problem) {
        const problem = normalizeNewlines(example.problem);
        markdown += `_Problème :_ ${problem}\n\n`
      }
      if (example.solution) {
        const solution = normalizeNewlines(example.solution);
        markdown += `_Solution :_\n\n${solution}\n\n`
      }
      if (example.explanation) {
        const explanation = normalizeNewlines(example.explanation);
        markdown += `_Explication :_ ${explanation}\n\n`
      }
      markdown += `---\n\n`
    })
  }

  // Exercises
  if (lesson.exercises && lesson.exercises.length > 0) {
    sectionCount++;
    markdown += `## ${sectionCount}. Exercices d'Application\n\n`
    lesson.exercises.forEach((exercise: any, index: number) => {
      markdown += `**Exercice ${index + 1}**\n\n`
      const question = normalizeNewlines(exercise.question || '');
      markdown += `${question}\n\n`
      if (exercise.hints && exercise.hints.length > 0) {
        markdown += `<details>\n<summary>Indices</summary>\n\n`
        exercise.hints.forEach((hint: string) => {
          const normalizedHint = normalizeNewlines(hint);
          markdown += `- ${normalizedHint}\n`
        })
        markdown += `\n</details>\n\n`
      }
      // Use solution if available, otherwise use answer - both should be labeled as "Solution"
      if (exercise.solution) {
        const solution = normalizeNewlines(exercise.solution);
        markdown += `<details>\n<summary>Solution</summary>\n\n${solution}\n\n</details>\n\n`
      } else if (exercise.answer) {
        const answer = normalizeNewlines(exercise.answer);
        markdown += `<details>\n<summary>Solution</summary>\n\n${answer}\n\n</details>\n\n`
      }
      markdown += `---\n\n`
    })
  }

  // Summary
  if (lesson.summary) {
    sectionCount++;
    markdown += `## ${sectionCount}. Résumé\n\n${lesson.summary}\n\n`
  }

  // Common Mistakes
  if (lesson.commonMistakes && lesson.commonMistakes.length > 0) {
    sectionCount++;
    markdown += `## ${sectionCount}. Erreurs Courantes à Éviter\n\n`
    lesson.commonMistakes.forEach((mistake: string) => {
      markdown += `- ${mistake}\n`
    })
    markdown += `\n`
  }

  // Fallback for old structure
  const content = lesson.content
  if (content) {
    // Old structure support
    if (content.introduction && !lesson.introduction) {
      markdown += `## Introduction\n\n`
      if (content.introduction.hook) {
        markdown += `${content.introduction.hook}\n\n`
      }
      if (content.introduction.real_world_connection) {
        markdown += `**Application pratique :** ${content.introduction.real_world_connection}\n\n`
      }
    }

    if (content.theory) {
      if (content.theory.definitions && content.theory.definitions.length > 0 && !lesson.definitions) {
        markdown += `## Définitions\n\n`
        content.theory.definitions.forEach((def: any) => {
          markdown += `**${def.term}** : ${def.definition}\n\n`
          if (def.example) {
            markdown += `*Exemple :* ${def.example}\n\n`
          }
        })
      }
    }

    if (content.summary && !lesson.summary) {
      markdown += `## Résumé\n\n`
      if (content.summary.key_points && content.summary.key_points.length > 0) {
        content.summary.key_points.forEach((point: string) => {
          markdown += `- ${point}\n`
        })
        markdown += `\n`
      }
    }
  }

  return markdown
}

/**
 * Convert AI-generated exercise JSON to Markdown format
 * Applies LaTeX normalization to ensure proper delimiters and escaping
 * This ensures consistent rendering of math in exercises, solutions, and hints
 */
export function convertExerciseJsonToMarkdown(exerciseData: any, forPdf: boolean = false): string {
  // Handle both old and new structure
  const exercise = exerciseData.exercise || exerciseData

  // Helper function to normalize newlines in text content
  const normalizeNewlines = (text: string): string => {
    if (!text) return text;
    // Convert literal \n strings to actual newlines, then normalize
    // Handle both escaped \n and actual newlines
    return text
      .replace(/\\n/g, '\n')  // Convert escaped \n to actual newline
      .replace(/\r\n/g, '\n')  // Normalize Windows line endings
      .replace(/\r/g, '\n')    // Normalize Mac line endings
      .replace(/\n{3,}/g, '\n\n'); // Collapse multiple newlines to double
  };

  let markdown = ''

  // Problem Text - normalize LaTeX for proper rendering
  if (exercise.problemText) {
    const problemText = normalizeNewlines(exercise.problemText);
    markdown += `## Énoncé\n\n${problemText}\n\n`
  }

  // Hints - normalize each hint's LaTeX and newlines
  if (exercise.hints && exercise.hints.length > 0) {
    markdown += `## Indices\n\n`
    exercise.hints.forEach((hint: string, index: number) => {
      const normalizedHint = normalizeNewlines(hint);
      if (forPdf) {
        // For PDF: use regular sections, not collapsible
        markdown += `### Indice ${index + 1}\n\n${normalizedHint}\n\n`
      } else {
        // For web: use collapsible details
        markdown += `<details>\n<summary>Indice ${index + 1}</summary>\n\n${normalizedHint}\n\n</details>\n\n`
      }
    })
  }

  // Solution - normalize LaTeX and newlines in solution
  if (exercise.solution) {
    const solution = normalizeNewlines(exercise.solution);
    if (forPdf) {
      // For PDF: use regular section, not collapsible
      markdown += `## Solution\n\n${solution}\n\n`
    } else {
      // For web: use collapsible details
      markdown += `<details>\n<summary>Solution</summary>\n\n${solution}\n\n</details>\n\n`
    }
  }

  // Answer (if different from solution) - normalize LaTeX and newlines
  if (exercise.answer && exercise.answer !== exercise.solution) {
    const answer = normalizeNewlines(exercise.answer);
    if (forPdf) {
      markdown += `## Réponse\n\n${answer}\n\n`
    } else {
      markdown += `<details>\n<summary>Réponse</summary>\n\n${answer}\n\n</details>\n\n`
    }
  }

  // Explanation - normalize LaTeX and newlines
  if (exercise.explanation) {
    const explanation = normalizeNewlines(exercise.explanation);
    if (forPdf) {
      markdown += `## Explication\n\n${explanation}\n\n`
    } else {
      markdown += `<details>\n<summary>Explication</summary>\n\n${explanation}\n\n</details>\n\n`
    }
  }

  return markdown
}
