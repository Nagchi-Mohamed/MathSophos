"use client"

import { useEffect, useRef } from "react"
import 'katex/dist/katex.min.css'

interface InlineLatexProps {
  content: string
  className?: string
}

export function InlineLatex({ content, className }: InlineLatexProps) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!containerRef.current || !content) return

    const renderMath = async () => {
      try {
        const renderMathInElement = (await import('katex/dist/contrib/auto-render.min.js')).default

        if (containerRef.current) {
          renderMathInElement(containerRef.current, {
            delimiters: [
              { left: '$$', right: '$$', display: false }, // Force inline for titles mostly
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
  }, [content])

  return (
    <span
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
