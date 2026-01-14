"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TableOfContentsProps {
  content: string
}

interface Heading {
  id: string
  text: string
  level: number
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    // Parse markdown to extract headings
    const lines = content.split("\n")
    const extractedHeadings: Heading[] = []

    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const text = match[2].trim()
        // Create a simple slug for the ID
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")

        extractedHeadings.push({ id, text, level })
      }
    })

    setHeadings(extractedHeadings)
  }, [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "0% 0% -80% 0%" }
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="space-y-3 bg-muted/30 p-5 rounded-lg border border-border sticky top-24">
      <p className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
        <span className="text-primary">📚</span> Dans cette leçon
      </p>
      <ul className="space-y-2.5 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}
          >
            <a
              href={`#${heading.id}`}
              className={cn(
                "block py-1.5 px-3 rounded-md transition-all duration-200 border-l-2",
                activeId === heading.id
                  ? "text-primary font-semibold bg-primary/10 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent hover:border-muted-foreground/30"
              )}
              onClick={(e) => {
                e.preventDefault()
                const element = document.getElementById(heading.id)
                if (element) {
                  const offset = 100 // Account for fixed header
                  const elementPosition = element.getBoundingClientRect().top
                  const offsetPosition = elementPosition + window.pageYOffset - offset

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  })
                  setActiveId(heading.id)
                }
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
