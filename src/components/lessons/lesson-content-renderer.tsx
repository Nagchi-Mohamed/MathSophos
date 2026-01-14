"use client";

import MarkdownRenderer from "@/components/markdown-renderer";
import ClientOnly from "@/components/client-only";
import { convertLessonJsonToMarkdown } from "@/lib/markdown-converter";
import { stripChapterHeader } from "@/lib/strip-chapter-header";

import { useLanguage } from "@/contexts/language-context";

interface LessonContentRendererProps {
  content: string;
  contentEn?: string | null;
  skipHeaderStrip?: boolean; // Set to true for chapters (headers are part of content)
  hideVideoLinks?: boolean;
}

export function LessonContentRenderer({ content, contentEn, skipHeaderStrip = false, hideVideoLinks = false }: LessonContentRendererProps) {
  const { language } = useLanguage();
  const displayContent = (language === 'en' && contentEn) ? contentEn : content;

  let markdownContent = displayContent;

  // Try to parse as JSON and convert to markdown if successful
  try {
    const parsed = JSON.parse(content);
    // Check if it's a lesson JSON structure
    if (parsed && (parsed.lesson || parsed.title || parsed.introduction || parsed.definitions)) {
      // Strip header from introduction if it exists (only for lessons, not chapters)
      if (!skipHeaderStrip) {
        const lesson = parsed.lesson || parsed;
        if (lesson.introduction && typeof lesson.introduction === 'string') {
          lesson.introduction = stripChapterHeader(lesson.introduction);
        }
      }

      // Convert JSON to Markdown for consistent rendering
      markdownContent = convertLessonJsonToMarkdown(parsed);
    }
  } catch {
    // Not JSON, use content as-is (already markdown)
    // Check if markdown already has ## headings - if not, it might be old format
    // The MarkdownRenderer will handle parsing the headings
  }

  // Strip header from markdown content (handles both JSON-converted and direct markdown)
  // Skip for chapters since headers are now part of the generated content
  // Strip header from markdown content (handles both JSON-converted and direct markdown)
  // Skip for chapters since headers are now part of the generated content
  if (!skipHeaderStrip) {
    markdownContent = stripChapterHeader(markdownContent);
  }

  // MathJax typesetting is handled by MarkdownRenderer

  // Wrap in ClientOnly to prevent hydration mismatches
  return (
    <ClientOnly fallback={null}>
      <MarkdownRenderer content={markdownContent} hideVideoLinks={hideVideoLinks} />
    </ClientOnly>
  );
}
