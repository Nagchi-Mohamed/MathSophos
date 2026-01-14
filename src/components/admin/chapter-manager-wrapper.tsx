"use client"

import dynamic from "next/dynamic"
import { ChapterManager } from "@/components/admin/chapter-manager"

// Client-side wrapper to avoid hydration issues
export function ChapterManagerWrapper({ lessonId, lessonTitle, showOnlyButton }: {
  lessonId: string
  lessonTitle: string
  showOnlyButton?: boolean
}) {
  // Dynamically import to avoid SSR hydration issues
  const DynamicChapterManager = dynamic(
    () => Promise.resolve({ default: ChapterManager }),
    { ssr: false }
  )

  return <DynamicChapterManager lessonId={lessonId} lessonTitle={lessonTitle} showOnlyButton={showOnlyButton} />
}

