"use client";

import { useEffect, useRef } from "react";
import { latexPreprocessor } from "@/lib/latex-preprocessor";
import 'katex/dist/katex.min.css';

interface FicheContentRendererProps {
  content: string;
}

export function FicheContentRenderer({ content }: FicheContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanText = (content || "")
    // French TeX accents
    .replace(/\\'[Ee]/g, 'é')
    .replace(/\\`[Ee]/g, 'è')
    .replace(/\\\^[Ee]/g, 'ê')
    .replace(/\\'[Aa]/g, 'á')
    .replace(/\\`[Aa]/g, 'à')
    .replace(/\\\^[Aa]/g, 'â')
    .replace(/\\\^[Ii]/g, 'î')
    .replace(/\\\^[Oo]/g, 'ô')
    .replace(/\\`[Uu]/g, 'ù')
    .replace(/\\\^[Uu]/g, 'û')
    .replace(/\\c\{c\}/gi, 'ç')
    // Common custom macros in Moroccan fiches
    .replace(/\\heading\{([^}]+)\}/g, '<strong class="text-blue-900 dark:text-blue-400 font-bold block mt-3 mb-1 text-sm uppercase tracking-wide">$1</strong>')
    .replace(/\\sub\{([^}]+)\}/g, '<strong class="text-primary font-bold inline-block mt-2 mb-1 mr-1">$1</strong>')
    .replace(/\\appli\{([^}]*)\}/g, '<strong class="text-emerald-700 dark:text-emerald-400 font-bold block mt-3 mb-1">Application $1</strong>')
    // Text formatting
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>')
    // Spacing
    .replace(/\\(smallskip|medskip|bigskip)/g, '<br>')
    .replace(/\\quad/g, '&nbsp;&nbsp;')
    .replace(/\\qquad/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
    // Center environment
    .replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, '<div class="text-center my-2">$1</div>')
    // Itemize & Enumerate environments
    .replace(/\\begin\{itemize\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{itemize\}/g, (match, items) => {
      const lis = items.split('\\item').filter((s: string) => s.trim()).map((s: string) => `<li>${s.trim()}</li>`).join('')
      return `<ul class="list-disc pl-5 my-2 space-y-1">${lis}</ul>`
    })
    .replace(/\\begin\{enumerate\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{enumerate\}/g, (match, items) => {
      const lis = items.split('\\item').filter((s: string) => s.trim()).map((s: string) => `<li>${s.trim()}</li>`).join('')
      return `<ol class="list-decimal pl-5 my-2 space-y-1">${lis}</ol>`
    })
    .replace(/\\item\s+/g, '<br>• ')
    // Fix mismatched delimiters like $$formula$ or $formula$$
    .replace(/\$\$([^$\n]+)\$/g, '$$$1$$')
    .replace(/\$([^$\n]+)\$\$/g, '$$$1$$')
    // Remove unwanted TeX document commands
    .replace(/\\(noindent|leavevmode)/g, '')
    // Fix linebreaks
    .replace(/\n\n+/g, '<br><br>')

  const rawContent = cleanText ? latexPreprocessor.normalizeLatex(cleanText) : '';

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
