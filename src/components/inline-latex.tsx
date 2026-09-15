"use client"

import { useEffect, useRef } from "react"
import { latexPreprocessor } from "@/lib/latex-preprocessor"
import 'katex/dist/katex.min.css'

interface InlineLatexProps {
  content: string
  className?: string
}

export function InlineLatex({ content, className }: InlineLatexProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const normalized = content ? latexPreprocessor.normalizeLatex(content) : ""

  useEffect(() => {
    if (!containerRef.current || !normalized) return

    const renderMath = async () => {
      try {
        const renderMathInElement = (await import('katex/dist/contrib/auto-render.min.js')).default

        if (containerRef.current) {
          renderMathInElement(containerRef.current, {
            delimiters: [
              { left: '$$', right: '$$', display: false },
              { left: '$', right: '$', display: false },
              { left: '\\[', right: '\\]', display: false },
              { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false,
            strict: false,
          })
        }
      } catch (error) {
        console.error('Error rendering KaTeX:', error)
      }
    }

    renderMath()
  }, [normalized])

  return (
    <span
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: normalized }}
    />
  )
}
