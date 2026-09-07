import { TextbookLesson, TextbookSection, ContentBlock, ExerciseBlock } from '@/types/textbook';
import { convertLessonJsonToMarkdown } from '@/lib/markdown-converter';
import { stripChapterHeader } from '@/lib/strip-chapter-header';

interface RawDbLesson {
  id: string;
  slug?: string | null;
  titleFr: string;
  titleEn?: string | null;
  contentFr?: string | null;
  contentEn?: string | null;
  level: string;
  stream?: string | null;
  semester: number;
  category?: string | null;
  fileUrl?: string | null;
  exercises?: any[];
  chapters?: any[];
}

/**
 * Robust stateful block parser function that matches environment headers accurately,
 * keeps problem, statement, solution, and proof content strictly inside their respective environment cards,
 * and ensures box titles match their content.
 */
function parseSectionBlocks(sectionBody: string, sectionNumber: number): ContentBlock[] {
  const lines = sectionBody.split('\n');
  const blocks: ContentBlock[] = [];

  let defCount = 0;
  let thmCount = 0;
  let exCount = 0;

  let currentBlock: any = null;

  const flushCurrentBlock = () => {
    if (!currentBlock) return;

    // Clean up strings
    if (currentBlock.statement) currentBlock.statement = currentBlock.statement.trim();
    if (currentBlock.proof) currentBlock.proof = currentBlock.proof.trim();
    if (currentBlock.problem) currentBlock.problem = currentBlock.problem.trim();
    if (currentBlock.solution) currentBlock.solution = currentBlock.solution.trim();
    if (currentBlock.content) currentBlock.content = currentBlock.content.trim();

    // Check if problem contains inline Solution / Résolution
    if (currentBlock.type === 'example' || currentBlock.type === 'application') {
      if (!currentBlock.solution && currentBlock.problem) {
        const solMatch = currentBlock.problem.match(/^([\s\S]*?)(?:\n|\b)(?:Solution|Résolution|Correction)\s*:?\s*([\s\S]*)$/i);
        if (solMatch && solMatch[2].trim()) {
          currentBlock.problem = solMatch[1].trim();
          currentBlock.solution = solMatch[2].trim();
        }
      }
    }

    // Check if statement contains inline Démonstration / Preuve
    if (['theorem', 'proposition', 'lemma', 'corollary'].includes(currentBlock.type)) {
      if (!currentBlock.proof && currentBlock.statement) {
        const proofMatch = currentBlock.statement.match(/^([\s\S]*?)(?:\n|\b)(?:Démonstration|Preuve|Proof)\s*:?\s*([\s\S]*)$/i);
        if (proofMatch && proofMatch[2].trim()) {
          currentBlock.statement = proofMatch[1].trim();
          currentBlock.proof = proofMatch[2].trim();
        }
      }
    }

    // Ensure non-empty problem or statement
    if (currentBlock.type === 'example') {
      if (!currentBlock.problem && currentBlock.solution) {
        currentBlock.problem = currentBlock.title || 'Exemple d\'application';
      }
    }

    delete currentBlock.activeTarget;
    blocks.push(currentBlock);
    currentBlock = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      if (currentBlock && currentBlock[currentBlock.activeTarget] !== undefined) {
        currentBlock[currentBlock.activeTarget] += '\n\n';
      }
      continue;
    }

    // 1. Definition check
    const defMatch = trimmedLine.match(/^(?:#{3,4}|\*\*|\*|_)*\s*(?:Définition|Definition)\s*(?:[0-9.]*)\s*:?\s*(.*)$/i);
    if (defMatch) {
      flushCurrentBlock();
      defCount++;
      let title = defMatch[1] ? defMatch[1].replace(/^(?:\*\*|\*|_)+|(?:\*\*|\*|_)+$/g, '').trim() : undefined;
      if (title && title.startsWith(':')) title = title.substring(1).trim();

      currentBlock = {
        id: `sec-${sectionNumber}-b-${blocks.length}`,
        type: 'definition',
        number: `${sectionNumber}.${defCount}`,
        title: title || undefined,
        statement: '',
        activeTarget: 'statement'
      };
      continue;
    }

    // 2. Theorem / Proposition / Lemma / Corollary check
    const thmMatch = trimmedLine.match(/^(?:#{3,4}|\*\*|\*|_)*\s*(Théorème|Theorem|Proposition|Propriété|Lemme|Corollaire)\s*(?:[0-9.]*)\s*:?\s*(.*)$/i);
    if (thmMatch) {
      flushCurrentBlock();
      thmCount++;
      const matchedKey = thmMatch[1];
      const isProp = /Proposition|Propriété/i.test(matchedKey);
      const type = isProp ? 'proposition' : /Lemme/i.test(matchedKey) ? 'lemma' : /Corollaire/i.test(matchedKey) ? 'corollary' : 'theorem';
      let title = thmMatch[2] ? thmMatch[2].replace(/^(?:\*\*|\*|_)+|(?:\*\*|\*|_)+$/g, '').trim() : undefined;
      if (title && title.startsWith(':')) title = title.substring(1).trim();

      currentBlock = {
        id: `sec-${sectionNumber}-b-${blocks.length}`,
        type,
        number: `${sectionNumber}.${thmCount}`,
        title: title || undefined,
        statement: '',
        proof: '',
        activeTarget: 'statement'
      };
      continue;
    }

    // 3. Example / Application check
    const exMatch = trimmedLine.match(/^(?:#{3,4}|\*\*|\*|_)*\s*(Exemple|Application)\s*(?:[0-9.]*)\s*:?\s*(.*)$/i);
    if (exMatch) {
      flushCurrentBlock();
      exCount++;
      let title = exMatch[2] ? exMatch[2].replace(/^(?:\*\*|\*|_)+|(?:\*\*|\*|_)+$/g, '').trim() : undefined;
      if (title && title.startsWith(':')) title = title.substring(1).trim();

      currentBlock = {
        id: `sec-${sectionNumber}-b-${blocks.length}`,
        type: 'example',
        number: `${sectionNumber}.${exCount}`,
        title: title || undefined,
        problem: '',
        solution: '',
        activeTarget: 'problem'
      };
      continue;
    }

    // 4. Method check
    const methodMatch = trimmedLine.match(/^(?:#{3,4}|\*\*|\*|_)*\s*(?:Méthode|Method)\s*:?\s*(.*)$/i);
    if (methodMatch) {
      flushCurrentBlock();
      let title = methodMatch[1] ? methodMatch[1].replace(/^(?:\*\*|\*|_)+|(?:\*\*|\*|_)+$/g, '').trim() : undefined;
      currentBlock = {
        id: `sec-${sectionNumber}-b-${blocks.length}`,
        type: 'method',
        title: title || 'Méthode',
        steps: [],
        content: '',
        activeTarget: 'content'
      };
      continue;
    }

    // 5. Remark / Warning / Important check
    const remMatch = trimmedLine.match(/^(?:#{3,4}|\*\*|\*|_)*\s*(Remarque|Important|Attention|Warning)\s*:?\s*(.*)$/i);
    if (remMatch) {
      flushCurrentBlock();
      const matchedKey = remMatch[1];
      const type = /Attention|Warning/i.test(matchedKey) ? 'warning' : /Important/i.test(matchedKey) ? 'important' : 'remark';
      let content = remMatch[2] ? remMatch[2].replace(/^(?:\*\*|\*|_)+|(?:\*\*|\*|_)+$/g, '').trim() : '';

      currentBlock = {
        id: `sec-${sectionNumber}-b-${blocks.length}`,
        type,
        content: content,
        activeTarget: 'content'
      };
      continue;
    }

    // 6. Sub-section marker: Démonstration / Preuve
    const proofMarker = trimmedLine.match(/^(?:#{3,4}|\*\*|\*|_)*\s*(?:Démonstration|Preuve|Proof)\s*:?\s*(.*)$/i);
    if (proofMarker) {
      if (currentBlock && ['theorem', 'proposition', 'lemma', 'corollary'].includes(currentBlock.type)) {
        currentBlock.activeTarget = 'proof';
        if (proofMarker[1]) currentBlock.proof += proofMarker[1] + '\n';
        continue;
      } else if (currentBlock && currentBlock.type === 'example') {
        currentBlock.activeTarget = 'solution';
        if (proofMarker[1]) currentBlock.solution += proofMarker[1] + '\n';
        continue;
      } else {
        // Attach to previous theorem if valid
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && ['theorem', 'proposition', 'lemma', 'corollary'].includes(lastBlock.type) && !lastBlock.proof) {
          lastBlock.proof = proofMarker[1] || '';
          currentBlock = lastBlock;
          currentBlock.activeTarget = 'proof';
          blocks.pop();
          continue;
        } else {
          flushCurrentBlock();
          currentBlock = {
            id: `sec-${sectionNumber}-b-${blocks.length}`,
            type: 'proof',
            content: proofMarker[1] || '',
            activeTarget: 'content'
          };
          continue;
        }
      }
    }

    // 7. Sub-section marker: Solution / Résolution / Correction
    const solMarker = trimmedLine.match(/^(?:#{3,4}|\*\*|\*|_)*\s*(?:Solution|Résolution|Correction)\s*:?\s*(.*)$/i);
    if (solMarker) {
      if (currentBlock && (currentBlock.type === 'example' || currentBlock.type === 'exercise')) {
        currentBlock.activeTarget = 'solution';
        if (solMarker[1]) currentBlock.solution += solMarker[1] + '\n';
        continue;
      } else if (currentBlock && ['theorem', 'proposition', 'lemma', 'corollary'].includes(currentBlock.type)) {
        currentBlock.activeTarget = 'proof';
        if (solMarker[1]) currentBlock.proof += solMarker[1] + '\n';
        continue;
      }
    }

    // 8. Sub-section marker: Problème / Énoncé
    const probMarker = trimmedLine.match(/^(?:#{3,4}|\*\*|\*|_)*\s*(?:Problème|Énoncé)\s*:?\s*(.*)$/i);
    if (probMarker) {
      if (currentBlock && (currentBlock.type === 'example' || currentBlock.type === 'exercise')) {
        currentBlock.activeTarget = 'problem';
        if (probMarker[1]) currentBlock.problem += 'Problème : ' + probMarker[1] + '\n';
        else currentBlock.problem += 'Problème : ';
        continue;
      } else if (currentBlock && ['theorem', 'proposition', 'lemma', 'corollary', 'definition'].includes(currentBlock.type)) {
        currentBlock.activeTarget = 'statement';
        if (probMarker[1]) currentBlock.statement += probMarker[1] + '\n';
        continue;
      }
    }

    // 9. Standalone Title Extraction for Example / Theorem / Definition if title wasn't on header line
    if (currentBlock && !currentBlock.title) {
      const titleCandidate = trimmedLine.match(/^(?:\*\*|__|\*|_)*(Exemple\s+\d+[^:\n]*|[A-ZÀ-ÿ0-9\s'’-]{3,60})(?:\*\*|__|\*|_)*:?$/);
      if (titleCandidate && (currentBlock[currentBlock.activeTarget] === '' || currentBlock[currentBlock.activeTarget] === '\n\n')) {
        currentBlock.title = titleCandidate[1].trim();
        continue;
      }
    }

    // Default: Append line to current activeTarget or start paragraph block
    if (currentBlock) {
      if (currentBlock.activeTarget === 'content' && currentBlock.type === 'method') {
        currentBlock.steps = currentBlock.steps || [];
        currentBlock.steps.push(trimmedLine);
      } else {
        currentBlock[currentBlock.activeTarget] = (currentBlock[currentBlock.activeTarget] || '') + line + '\n';
      }
    } else {
      currentBlock = {
        id: `sec-${sectionNumber}-b-${blocks.length}`,
        type: 'paragraph',
        content: line + '\n',
        activeTarget: 'content'
      };
    }
  }

  flushCurrentBlock();
  return blocks;
}

/**
 * Intelligent Read-Only Runtime Adapter:
 * Converts legacy DB records (Markdown or legacy JSON) into structured TextbookLesson (Schema v2).
 * Preserves 100% of existing text, formulas, exercises, hints, solutions, images, and videos.
 */
export function toTextbookLesson(lesson: RawDbLesson): TextbookLesson {
  const contentRaw = lesson.contentFr || '';

  // 1. Try parsing directly if it's already a Schema v2 JSON
  try {
    const parsed = JSON.parse(contentRaw);
    if (parsed && parsed.schemaVersion === 2 && Array.isArray(parsed.sections)) {
      return {
        ...parsed,
        id: lesson.id,
        slug: lesson.slug || '',
        title: lesson.titleFr,
        titleEn: lesson.titleEn,
        level: lesson.level,
        stream: lesson.stream,
        semester: lesson.semester,
        category: lesson.category,
        fileUrl: lesson.fileUrl,
      };
    }
  } catch {
    // Not a direct v2 JSON structure, proceed to parse markdown/legacy content
  }

  // 2. Normalize content (convert legacy JSON to markdown if applicable)
  let markdown = contentRaw;
  try {
    const parsedLegacy = JSON.parse(contentRaw);
    if (parsedLegacy && (parsedLegacy.lesson || parsedLegacy.title || parsedLegacy.introduction || parsedLegacy.definitions)) {
      markdown = convertLessonJsonToMarkdown(parsedLegacy);
    }
  } catch {
    // Content is already Markdown
  }

  markdown = stripChapterHeader(markdown);

  // 3. Extract metadata, objectives, prerequisites
  const objectives: string[] = [];
  const prerequisites: string[] = [];
  const vocabulary: { term: string; definition: string }[] = [];

  const objMatch = markdown.match(/(?:#+|\*\*)\s*(?:Objectifs|Objectifs d'apprentissage)[^\n]*\n([\s\S]*?)(?=\n#+|\n\*\*|\n\n[A-Z]|$)/i);
  if (objMatch) {
    objMatch[1].split('\n').forEach(line => {
      const clean = line.replace(/^[\s*-]+/, '').trim();
      if (clean) objectives.push(clean);
    });
  }

  const preMatch = markdown.match(/(?:#+|\*\*)\s*(?:Prérequis|Prerequisites)[^\n]*\n([\s\S]*?)(?=\n#+|\n\*\*|\n\n[A-Z]|$)/i);
  if (preMatch) {
    preMatch[1].split('\n').forEach(line => {
      const clean = line.replace(/^[\s*-]+/, '').trim();
      if (clean) prerequisites.push(clean);
    });
  }

  // 4. Split content into structured sections based on Heading 1 or Heading 2
  const sectionChunks = markdown.split(/\n(?=#{1,2}\s+)/);
  const sections: TextbookSection[] = [];
  let sectionCounter = 0;

  sectionChunks.forEach((chunk) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;

    const headingMatch = trimmed.match(/^#{1,2}\s+(.+)$/m);
    let sectionTitle = 'Généralités';
    let body = trimmed;

    if (headingMatch) {
      sectionTitle = headingMatch[1].replace(/^[0-9.]+\s*/, '').trim();
      body = trimmed.replace(/^#{1,2}\s+.+$/m, '').trim();
    }

    if (/^(Objectifs|Prérequis|Prerequisites)/i.test(sectionTitle)) {
      return;
    }

    sectionCounter++;
    const blocks = parseSectionBlocks(body, sectionCounter);

    sections.push({
      id: `sec-${sectionCounter}`,
      number: sectionCounter,
      title: sectionTitle,
      blocks,
    });
  });

  if (sections.length === 0) {
    sections.push({
      id: 'sec-1',
      number: 1,
      title: 'Contenu du cours',
      blocks: parseSectionBlocks(markdown, 1),
    });
  }

  // 5. Adapt attached DB Exercises if present
  const exercises: ExerciseBlock[] = [];
  if (lesson.exercises && Array.isArray(lesson.exercises)) {
    lesson.exercises.forEach((ex, idx) => {
      exercises.push({
        id: ex.id || `ex-${idx + 1}`,
        type: 'exercise',
        number: `${idx + 1}`,
        statement: ex.problemTextFr || ex.statement || '',
        difficulty: ex.difficulty || 2,
        hints: ex.hints || [],
        solution: ex.solutionFr || ex.solution || '',
      });
    });
  }

  return {
    schemaVersion: 2,
    id: lesson.id,
    slug: lesson.slug || '',
    title: lesson.titleFr,
    titleEn: lesson.titleEn,
    level: lesson.level,
    stream: lesson.stream,
    semester: lesson.semester,
    category: lesson.category,
    fileUrl: lesson.fileUrl,
    metadata: {
      professorName: process.env.NEXT_PUBLIC_PROFESSOR_NAME || 'Prof: Mohamed Nagchi',
      estimatedDuration: '2h 30min',
      difficulty: 'Fondamental',
      objectives: objectives.length > 0 ? objectives : ['Comprendre les notions fondamentales du chapitre', 'Savoir appliquer les définitions et théorèmes principaux', 'Résoudre les exercices d\'application directe'],
      prerequisites: prerequisites.length > 0 ? prerequisites : ['Rappels des niveaux précédents'],
      vocabulary: vocabulary,
    },
    sections,
    exercises: exercises.length > 0 ? exercises : undefined,
    rawMarkdownFallback: markdown,
  };
}
