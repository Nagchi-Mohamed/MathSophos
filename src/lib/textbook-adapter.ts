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

  // Extract list items under "Objectifs" or "Prérequis" if present
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
  let defCounter = 0;
  let thmCounter = 0;
  let exCounter = 0;

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

    // Skip creating standalone section if it's purely Objectives/Prerequisites (already extracted)
    if (/^(Objectifs|Prérequis|Prerequisites)/i.test(sectionTitle)) {
      return;
    }

    sectionCounter++;
    defCounter = 0;
    thmCounter = 0;
    exCounter = 0;

    const blocks: ContentBlock[] = [];

    // Sub-split body into semantic environment blocks
    const paragraphBlocks = body.split(/\n{2,}/);

    paragraphBlocks.forEach((pText, blockIdx) => {
      const text = pText.trim();
      if (!text) return;

      const blockId = `sec-${sectionCounter}-block-${blockIdx}`;

      // Check for Definition
      if (/(?:Définition|Definition)\b/i.test(text)) {
        defCounter++;
        const statement = text.replace(/^#*\s*(?:Définition|Definition)\s*(?:[0-9.]*)\s*:?\s*/i, '').trim();
        blocks.push({
          id: blockId,
          type: 'definition',
          number: `${sectionCounter}.${defCounter}`,
          statement: statement || text,
        });
      }
      // Check for Theorem / Proposition / Lemma
      else if (/(?:Théorème|Theorem|Proposition|Propriété|Lemme)\b/i.test(text)) {
        thmCounter++;
        const isProp = /Proposition|Propriété/i.test(text);
        const type = isProp ? 'proposition' : 'theorem';
        const statement = text.replace(/^#*\s*(?:Théorème|Theorem|Proposition|Propriété|Lemme)\s*(?:[0-9.]*)\s*:?\s*/i, '').trim();
        blocks.push({
          id: blockId,
          type,
          number: `${sectionCounter}.${thmCounter}`,
          statement: statement || text,
        });
      }
      // Check for Proof
      else if (/(?:Démonstration|Preuve|Proof)\b/i.test(text)) {
        const content = text.replace(/^#*\s*(?:Démonstration|Preuve|Proof)\s*:?\s*/i, '').trim();
        blocks.push({
          id: blockId,
          type: 'proof',
          content: content || text,
        });
      }
      // Check for Example / Application
      else if (/(?:Exemple|Application)\b/i.test(text)) {
        exCounter++;
        const problem = text.replace(/^#*\s*(?:Exemple|Application)\s*(?:[0-9.]*)\s*:?\s*/i, '').trim();
        blocks.push({
          id: blockId,
          type: 'example',
          number: `${sectionCounter}.${exCounter}`,
          problem: problem || text,
        });
      }
      // Check for Method
      else if (/(?:Méthode|Method)\b/i.test(text)) {
        const steps = text.split('\n').map(l => l.replace(/^[\s*-]+/, '').trim()).filter(Boolean);
        blocks.push({
          id: blockId,
          type: 'method',
          title: 'Méthode',
          steps: steps.length > 0 ? steps : [text],
        });
      }
      // Check for Remark / Important / Warning
      else if (/(?:Remarque|Important|Attention|Warning)\b/i.test(text)) {
        const type = /Attention|Warning/i.test(text) ? 'warning' : /Important/i.test(text) ? 'important' : 'remark';
        const content = text.replace(/^#*\s*(?:Remarque|Important|Attention|Warning)\s*:?\s*/i, '').trim();
        blocks.push({
          id: blockId,
          type,
          content: content || text,
        });
      }
      // Default Text / Paragraph block
      else {
        blocks.push({
          id: blockId,
          type: 'paragraph',
          content: text,
        });
      }
    });

    sections.push({
      id: `sec-${sectionCounter}`,
      number: sectionCounter,
      title: sectionTitle,
      blocks,
    });
  });

  // If no sections were created (e.g. empty or unstructured text), create a single default section
  if (sections.length === 0) {
    sections.push({
      id: 'sec-1',
      number: 1,
      title: 'Contenu du cours',
      blocks: [
        {
          id: 'block-1',
          type: 'paragraph',
          content: markdown || 'Aucun contenu disponible pour cette leçon.',
        },
      ],
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
