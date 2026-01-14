"use client"

import React from "react"
import MarkdownRenderer from "@/components/markdown-renderer"
import "katex/dist/katex.min.css"

/**
 * LessonPreview renders markdown content with LaTeX support.
 */
export interface LessonPreviewProps {
  content: string
  onLineSelected?: (line: number) => void
}

export function LessonPreview({ content, onLineSelected }: LessonPreviewProps) {
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!onLineSelected) return;

    let target = e.target as HTMLElement | null;
    while (target && target !== e.currentTarget) {
      const line = target.getAttribute('data-source-line');
      if (line) {
        onLineSelected(parseInt(line, 10));
        return;
      }
      target = target.parentElement;
    }
  };

  return (
    <div
      className="p-4 overflow-auto h-full prose dark:prose-invert"
      onDoubleClick={handleDoubleClick}
    >
      <MarkdownRenderer content={content || "*Aucun contenu à afficher*"} />
    </div>
  )
}
