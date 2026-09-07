/**
 * MathSophos Structured Textbook Schema (v2)
 * Pure TypeScript definitions for textbook rendering and AI structured output.
 */

export type BlockType =
  | 'text'
  | 'paragraph'
  | 'heading'
  | 'definition'
  | 'theorem'
  | 'proposition'
  | 'lemma'
  | 'corollary'
  | 'proof'
  | 'remark'
  | 'example'
  | 'method'
  | 'application'
  | 'important'
  | 'warning'
  | 'common_error'
  | 'formula'
  | 'key_result'
  | 'exercise'
  | 'hint'
  | 'solution'
  | 'summary'
  | 'self_evaluation'
  | 'image'
  | 'video';

export interface BaseBlock {
  id: string;
  type: BlockType;
  title?: string;
  number?: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text' | 'paragraph' | 'heading';
  content: string;
}

export interface MathematicalEnvironmentBlock extends BaseBlock {
  type: 'definition' | 'theorem' | 'proposition' | 'lemma' | 'corollary' | 'formula' | 'key_result';
  statement: string;
  proof?: string;
  notes?: string;
}

export interface ProofBlock extends BaseBlock {
  type: 'proof';
  content: string;
}

export interface ExampleBlock extends BaseBlock {
  type: 'example' | 'application';
  problem: string;
  solution?: string;
}

export interface RemarkBlock extends BaseBlock {
  type: 'remark' | 'important' | 'warning';
  content: string;
}

export interface MethodBlock extends BaseBlock {
  type: 'method';
  title: string;
  steps: string[];
}

export interface CommonErrorBlock extends BaseBlock {
  type: 'common_error';
  mistake: string;
  explanation: string;
  correction: string;
}

export interface ExerciseBlock extends BaseBlock {
  type: 'exercise';
  statement: string;
  difficulty?: 1 | 2 | 3 | 4; // ★ to ★★★★
  hints?: string[];
  solution?: string;
}

export interface SummaryBlock extends BaseBlock {
  type: 'summary';
  keyDefinitions?: string[];
  keyResults?: string[];
  formulas?: string[];
  methods?: string[];
}

export interface SelfAssessmentBlock extends BaseBlock {
  type: 'self_evaluation';
  items: { id: string; skill: string; checked?: boolean }[];
}

export interface MediaBlock extends BaseBlock {
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

export type ContentBlock =
  | TextBlock
  | MathematicalEnvironmentBlock
  | ProofBlock
  | ExampleBlock
  | RemarkBlock
  | MethodBlock
  | CommonErrorBlock
  | ExerciseBlock
  | SummaryBlock
  | SelfAssessmentBlock
  | MediaBlock;

export interface TextbookSection {
  id: string;
  number: number;
  title: string;
  introduction?: string;
  blocks: ContentBlock[];
}

export interface TextbookLessonMetadata {
  professorName?: string;
  estimatedDuration?: string;
  difficulty?: 'Fondamental' | 'Intermédiaire' | 'Avancé' | 'Excellence';
  prerequisites?: string[];
  objectives?: string[];
  vocabulary?: { term: string; definition: string }[];
}

export interface TextbookLesson {
  schemaVersion: 2;
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  level: string;
  stream?: string | null;
  semester: number;
  category?: string | null;
  fileUrl?: string | null;
  videoUrl?: string | null;
  metadata: TextbookLessonMetadata;
  sections: TextbookSection[];
  summary?: SummaryBlock;
  commonErrors?: CommonErrorBlock[];
  selfAssessment?: SelfAssessmentBlock;
  exercises?: ExerciseBlock[];
  rawMarkdownFallback?: string;
}
