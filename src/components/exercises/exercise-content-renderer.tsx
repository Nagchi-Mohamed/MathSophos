"use client";

import MarkdownRenderer from "@/components/markdown-renderer";
import ClientOnly from "@/components/client-only";
import { convertExerciseJsonToMarkdown } from "@/lib/markdown-converter";

import { useLanguage } from "@/contexts/language-context";

interface ExerciseContentRendererProps {
  content: string;
  contentEn?: string | null;
}

export function ExerciseContentRenderer({ content, contentEn }: ExerciseContentRendererProps) {
  const { language } = useLanguage();
  const displayContent = (language === 'en' && contentEn) ? contentEn : content;
  let markdownContent = displayContent;

  // Try to parse as JSON and convert to markdown if successful
  try {
    const parsed = JSON.parse(content);
    // Check if it's an exercise JSON structure
    if (parsed && (parsed.exercise || parsed.problemText || parsed.solution || parsed.hints)) {
      // Convert JSON to Markdown for consistent rendering
      markdownContent = convertExerciseJsonToMarkdown(parsed);
    }
  } catch {
    // Not JSON, use content as-is (already markdown)
  }

  // MathJax typesetting and LaTeX normalization are handled by MarkdownRenderer
  // (same approach as lessons - ensures consistent table rendering)

  // Wrap in ClientOnly to prevent hydration mismatches
  return (
    <ClientOnly fallback={<div className="prose prose-slate dark:prose-invert max-w-none">Loading content...</div>}>
      <MarkdownRenderer content={markdownContent} />
    </ClientOnly>
  );
}
