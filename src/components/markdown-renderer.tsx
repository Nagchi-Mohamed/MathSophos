"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import { latexPreprocessor } from "@/lib/latex-preprocessor";
import { latexDocumentPreprocessor } from "@/lib/latex-document-preprocessor";
import { cn } from "@/lib/utils";
import { remarkSectionize } from "@/lib/remark-sectionize";
import { remarkLatexImages } from "@/lib/remark-latex-images";
import { VideoPlayerTrigger } from "@/components/content/video-player-trigger";

// Icons for different section types
const SectionIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'introduction': return <span className="text-2xl mr-2">📖</span>;
    case 'definition': return <span className="text-2xl mr-2">📝</span>;
    case 'theorem': return <span className="text-2xl mr-2">📐</span>;
    case 'formula': return <span className="text-2xl mr-2">∫</span>;
    case 'example': return <span className="text-2xl mr-2">💡</span>;
    case 'exercise': return <span className="text-2xl mr-2">✍️</span>;
    case 'summary': return <span className="text-2xl mr-2">📋</span>;
    case 'alert': return <span className="text-2xl mr-2">⚠️</span>;
    default: return null;
  }
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
  hideVideoLinks?: boolean;
}

/**
 * Enhanced component that renders markdown with organized sections in numbered boxes.
 * Uses ReactMarkdown with MathJax support and allows raw HTML (details/summary).
 */
export function MarkdownRenderer({ content, className, hideVideoLinks = false }: MarkdownRendererProps) {
  // Pre-process content to normalize delimiters once
  // We use useMemo to avoid re-processing on every render if content doesn't change
  const processedContent = useMemo(() => {
    if (!content) return ''

    // Step 1: Convert LaTeX document commands to Markdown
    let processed = latexDocumentPreprocessor.convertToMarkdown(content)

    // Step 2: Normalize math delimiters
    processed = latexPreprocessor.normalizeDelimiters(processed)

    return processed
  }, [content])

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm, remarkSectionize, remarkLatexImages, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          // Handle the custom 'section' wrapper created by remarkSectionize
          // @ts-ignore
          section: ({ node, className, children, ...props }) => {
            // Mapping class names to colors
            let borderColor = "border-border";
            let bgColor = "bg-muted/30";
            let printBorderColor = "print:border-gray-300";
            let printBgColor = "print:bg-transparent";
            let boxType = 'default';

            if (className?.includes('box-introduction')) { borderColor = "border-blue-500"; bgColor = "bg-blue-500/10"; boxType = 'introduction'; printBorderColor = "print:border-blue-500"; }
            else if (className?.includes('box-definition')) { borderColor = "border-green-500"; bgColor = "bg-green-500/10"; boxType = 'definition'; printBorderColor = "print:border-green-500"; }
            else if (className?.includes('box-theorem')) { borderColor = "border-purple-500"; bgColor = "bg-purple-500/10"; boxType = 'theorem'; printBorderColor = "print:border-purple-500"; }
            else if (className?.includes('box-formula')) { borderColor = "border-red-500"; bgColor = "bg-red-500/10"; boxType = 'formula'; printBorderColor = "print:border-red-500"; }
            else if (className?.includes('box-example')) { borderColor = "border-yellow-500"; bgColor = "bg-yellow-500/10"; boxType = 'example'; printBorderColor = "print:border-yellow-500"; }
            else if (className?.includes('box-exercise')) { borderColor = "border-orange-500"; bgColor = "bg-orange-500/10"; boxType = 'exercise'; printBorderColor = "print:border-orange-500"; }
            else if (className?.includes('box-summary')) { borderColor = "border-gray-500"; bgColor = "bg-muted/50"; boxType = 'summary'; printBorderColor = "print:border-gray-500"; }


            return (
              <section
                className={`my-8 rounded-xl border-l-4 ${borderColor} ${bgColor} ${printBorderColor} print:bg-transparent p-6 shadow-sm print:shadow-none break-inside-avoid`}
                data-source-line={node?.position?.start?.line}
                {...props}
              >
                {children}
              </section>
            );
          },
          // Customize H2 to match the new box style (remove old box header logic since wrapper handles box)
          h2: ({ node, children, ...props }) => {
            // We can check the text to see if it has a number to decide if we want an icon
            const text = String(children);
            const isNumbered = /^\d+\./.test(text);

            // Determine icon based on text content (similar logic to remarkSectionize for consistency)
            let type = 'default';
            if (text.includes('Introduction')) type = 'introduction';
            else if (text.includes('Définition')) type = 'definition';
            else if (text.includes('Théorème')) type = 'theorem';
            else if (text.includes('Formule')) type = 'formula';
            else if (text.includes('Exemple')) type = 'example';
            else if (text.includes('Exercice')) type = 'exercise';
            else if (text.includes('Résumé')) type = 'summary';

            return (
              <h2
                className="text-xl font-bold flex items-center mb-4 text-foreground border-b border-border pb-2 print:text-black print:border-gray-300 break-after-avoid"
                data-source-line={node?.position?.start?.line}
                {...props}
              >
                <SectionIcon type={type} />
                <span className="text-primary print:text-black">{children}</span>
              </h2>
            );
          },
          // Custom styling for tables (variation tables, etc.)
          table: ({ node, ...props }) => (
            <div
              className="overflow-x-auto my-6 rounded-lg border border-border shadow-sm print:border-gray-800 print:shadow-none break-inside-avoid"
              data-source-line={node?.position?.start?.line}
            >
              <table className="min-w-full divide-y divide-border bg-card print:divide-gray-800 print:bg-transparent" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 print:text-black print:bg-transparent print:font-bold print:border-b print:border-gray-800" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground border-t border-border print:text-black print:border-gray-800" {...props} />
          ),
          // Custom blockquote styling
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-orange-500 pl-4 py-2 my-4 bg-muted/30 rounded-r italic text-muted-foreground print:text-black print:bg-transparent break-inside-avoid"
              data-source-line={node?.position?.start?.line}
              {...props}
            />
          ),
          // Code block styling
          pre: ({ node, ...props }) => <pre className="bg-transparent p-0 m-0 print:whitespace-pre-wrap break-inside-avoid" data-source-line={node?.position?.start?.line} {...props} />,
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            return isInline ? (
              <code className="bg-muted rounded px-1.5 py-0.5 text-sm text-orange-600 dark:text-orange-200 font-mono print:bg-gray-100 print:text-black print:border print:border-gray-300" {...props}>
                {children}
              </code>
            ) : (
              <div className="relative rounded-lg overflow-hidden my-4 bg-slate-950 border border-slate-900 print:bg-transparent print:border-gray-300 break-inside-avoid">
                <div className="absolute top-0 right-0 px-2 py-1 text-xs text-gray-500 bg-slate-900 rounded-bl print:hidden">
                  {match?.[1] || 'text'}
                </div>
                <pre className="p-4 overflow-x-auto" data-source-line={node?.position?.start?.line}>
                  <code className={`${className} text-slate-100 print:text-black print:whitespace-pre-wrap`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            )
          },
          // details/summary styling - enforce open for print
          details: ({ node, ...props }: any) => (
            <details
              className="group border border-border rounded-lg bg-card overflow-hidden mb-4 open:bg-card/90 transition-all print:block print:open print:border-gray-300 print:bg-transparent break-inside-avoid"
              open
              data-source-line={node?.position?.start?.line}
              {...props}
            />
          ),
          summary: ({ node, ...props }: any) => (
            <summary className="cursor-pointer p-4 font-semibold text-primary hover:bg-muted/50 transition-colors list-none flex items-center gap-2 select-none group-open:border-b group-open:border-border print:text-black print:border-gray-300">
              <span className="transform transition-transform group-open:rotate-90 print:hidden">▶</span>
              {props.children}
            </summary>
          ),
          p: ({ node, children, ...props }) => {
            // Check if content is a raw video URL (for existing content)
            if (typeof children === 'string') {
              const text = children.trim();
              // Match absolute paths starting with /uploads/videos/ or full URLs ending in video extensions
              if ((text.startsWith('/uploads/videos/') || text.match(/^https?:\/\/.*\.(mp4|webm|ogg)$/i)) &&
                text.match(/\.(mp4|webm|ogg)$/i) &&
                !text.includes(' ') && // Ensure it's just the URL
                text.length < 200) {   // Sanity check length

                if (hideVideoLinks) {
                  return null;
                }

                return <VideoPlayerTrigger src={text} />;
              }
            }

            return <p className="mb-4 leading-relaxed text-foreground/90 print:text-black" data-source-line={node?.position?.start?.line} {...props}>{children}</p>;
          },
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90 print:text-black" data-source-line={node?.position?.start?.line} {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground/90 print:text-black" data-source-line={node?.position?.start?.line} {...props} />,
          li: ({ node, ...props }) => <li className="print:text-black" data-source-line={node?.position?.start?.line} {...props} />,
          a: ({ node, className, href, children, ...props }) => {
            const isVideo = href?.match(/\.(mp4|webm|ogg)(\?|$)/i);

            if (isVideo) {
              if (hideVideoLinks) {
                return null;
              }

              return <VideoPlayerTrigger src={href || ""} />;
            }

            return <a href={href} className="text-primary hover:underline print:text-black print:no-underline print:font-semibold" {...props}>{children}</a>
          },
          strong: ({ node, ...props }) => <strong className="font-bold text-foreground print:text-black" {...props} />,
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
  )
}

// Default export compatibility if needed (alias)
export default MarkdownRenderer;
