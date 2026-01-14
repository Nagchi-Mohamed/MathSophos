"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import { latexPreprocessor } from "@/lib/latex-preprocessor";
import { cn } from "@/lib/utils";
import 'katex/dist/katex.min.css';

interface SolverContentRendererProps {
  content: string;
}

/**
 * Solver Content Renderer
 * Renders AI solutions with Markdown and LaTeX support.
 * Uses ReactMarkdown with the same preprocessing as lessons but with a simpler, 
 * chat-friendly visual style (no heavy section boxing).
 */
export function SolverContentRenderer({ content }: SolverContentRendererProps) {
  // Pre-process content to normalize delimiters
  const processedContent = useMemo(() => {
    if (!content) return ''
    return latexPreprocessor.normalizeDelimiters(content)
  }, [content])

  return (
    <div className="solver-content w-full overflow-hidden text-base">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          // Custom components to match the chat/solver aesthetic
          p: ({ node, ...props }) => <p className="mb-3 leading-relaxed text-foreground" {...props} />,

          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-3 space-y-1 text-foreground" {...props} />,

          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-3 space-y-1 text-foreground" {...props} />,

          li: ({ node, ...props }) => <li className="" {...props} />,

          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 mt-4 text-primary" {...props} />,

          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-3 text-primary" {...props} />,

          h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-2" {...props} />,

          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 py-1 my-3 bg-muted/50 rounded-r italic" {...props} />
          ),

          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border shadow-sm">
              <table className="min-w-full divide-y divide-border" {...props} />
            </div>
          ),

          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted" {...props} />
          ),

          td: ({ node, ...props }) => (
            <td className="px-4 py-2 whitespace-nowrap text-sm border-t border-border" {...props} />
          ),

          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
                {children}
              </code>
            ) : (
              <div className="relative rounded-lg overflow-hidden my-3 bg-muted/50 border border-border">
                <div className="absolute top-0 right-0 px-2 py-1 text-xs text-muted-foreground bg-muted border-b border-l rounded-bl">
                  {match?.[1] || 'text'}
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className={cn("text-sm font-mono", className)} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            )
          },

          a: ({ node, ...props }) => <a className="text-primary hover:underline font-medium" {...props} />,

          strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />,

          // Protect math blocks from translation
          span: ({ node, className, ...props }: any) => {
            if (className?.includes('katex')) {
              return <span className={cn(className, "notranslate")} {...props} />
            }
            return <span className={className} {...props} />
          },
          div: ({ node, className, ...props }: any) => {
            if (className?.includes('katex')) {
              return <div className={cn(className, "notranslate")} {...props} />
            }
            return <div className={className} {...props} />
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
