"use client";

import { useEffect, useRef } from "react";
import { latexPreprocessor } from "@/lib/latex-preprocessor";
import 'katex/dist/katex.min.css';

interface FicheContentRendererProps {
  content: string;
}

export function FicheContentRenderer({ content }: FicheContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Preprocess LaTeX math commands and normalize delimiters
  const rawContent = content ? latexPreprocessor.normalizeLatex(content) : '';

  const processedContent = rawContent
    ? rawContent
      // Fix HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      // Convert LaTeX \includegraphics to HTML img tags
      .replace(/\\includegraphics(?:\[([^\]]*)\])?\{([^}]+)\}/g, (match: string, options: string, imagePath: string) => {
        let widthStyle = 'width: 100%;';
        if (options) {
          const widthMatch = options.match(/width\s*=\s*([\d.]+)\\linewidth/);
          if (widthMatch) {
            const percentage = parseFloat(widthMatch[1]) * 100;
            widthStyle = `width: ${percentage}%;`;
          }
        }
        return `<img src="${imagePath}" alt="Image" style="${widthStyle} height: auto; display: block; margin: 15px auto;" />`;
      })
      // Strip display math wrappers around arrays/tabulars
      .replace(/(?:\$\$|\\\[)\s*(\\begin\{(?:array|tabular)\}[\s\S]*?\\end\{(?:array|tabular)\})\s*(?:\$\$|\\\])/g, '$1')
      // Convert LaTeX arrays/tabulars to HTML tables
      .replace(/\\begin\{(array|tabular)\}(?:\{.*?\})?([\s\S]*?)\\end\{\1\}/g, (match: string, env: string, tableContent: string) => {
        const rows = tableContent.split('\\\\').filter((r: string) => r.replace(/\\hline/g, '').trim());

        if (rows.length === 0) return match;

        const htmlRows = rows.map((row: string) => {
          let cleanRow = row.replace(/\\hline/g, '').trim();
          if (!cleanRow) return '';
          const cols = cleanRow.split('&');
          return '<tr>' + cols.map((col: string) => {
            const cContent = col.trim();
            const finalContent = (env === 'array' && cContent) ? `$${cContent}$` : cContent;
            return `<td style="border: 1px solid #C9D2DC; padding: 6px; text-align: center;">${finalContent}</td>`;
          }).join('') + '</tr>';
        }).join('');

        return `<table style="border-collapse: collapse; margin: 10px auto; width: 100%; border: 1px solid #C9D2DC;"><tbody>${htmlRows}</tbody></table>`;
      })
    : '';

  useEffect(() => {
    if (!containerRef.current || !processedContent) return;

    const renderMath = async () => {
      try {
        const renderMathInElement = (await import('katex/dist/contrib/auto-render.min.js')).default;

        if (containerRef.current) {
          renderMathInElement(containerRef.current, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\[', right: '\\]', display: true },
              { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false,
            errorColor: '#cc0000',
            maxExpand: 10000,
            trust: true,
            strict: false,
          });
        }
      } catch (error) {
        console.error('Error rendering KaTeX:', error);
      }
    };

    const timer = setTimeout(renderMath, 30);
    return () => clearTimeout(timer);
  }, [processedContent]);

  return (
    <div
      ref={containerRef}
      className="fiche-content text-gray-900 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-300"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
