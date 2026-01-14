"use client";

import { useEffect, useRef } from "react";
import 'katex/dist/katex.min.css';

interface FicheContentRendererProps {
  content: string;
}

export function FicheContentRenderer({ content }: FicheContentRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const processedContent = content
    ? content
      // Fix HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      // Convert LaTeX \includegraphics to HTML img tags
      .replace(/\\includegraphics(?:\[([^\]]*)\])?\{([^}]+)\}/g, (match: string, options: string, imagePath: string) => {
        // Extract width parameter if present (e.g., width=0.8\linewidth)
        let widthStyle = 'width: 100%;'; // default
        if (options) {
          const widthMatch = options.match(/width\s*=\s*([\d.]+)\\linewidth/);
          if (widthMatch) {
            const percentage = parseFloat(widthMatch[1]) * 100;
            widthStyle = `width: ${percentage}%;`;
          }
        }
        return `<img src="${imagePath}" alt="Image" style="${widthStyle} height: auto; display: block; margin: 15px auto;" />`;
      })
      // Strip display math wrappers around arrays/tabulars to prevent $$ artifacts
      .replace(/(?:\$\$|\\\[)\s*(\\begin\{(?:array|tabular)\}[\s\S]*?\\end\{(?:array|tabular)\})\s*(?:\$\$|\\\])/g, '$1')
      // Convert LaTeX arrays/tabulars to HTML tables
      .replace(/\\begin\{(array|tabular)\}(?:\{.*?\})?([\s\S]*?)\\end\{\1\}/g, (match: string, env: string, tableContent: string) => {
        // Filter out empty rows often caused by trailing \\ or \hline
        const rows = tableContent.split('\\\\').filter((r: string) => r.replace(/\\hline/g, '').trim());

        if (rows.length === 0) return match;

        const htmlRows = rows.map((row: string) => {
          // Remove \hline and trim
          let cleanRow = row.replace(/\\hline/g, '').trim();
          if (!cleanRow) return '';

          // Split by & (row separator)
          const cols = cleanRow.split('&');

          return '<tr>' + cols.map((col: string) => {
            const content = col.trim();
            // If it's an array, wrap in math delimiters (unless empty)
            const finalContent = (env === 'array' && content) ? `$${content}$` : content;
            return `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${finalContent}</td>`;
          }).join('') + '</tr>';
        }).join('');

        return `<table style="border-collapse: collapse; margin: 15px auto; width: 100%; border: 1px solid #000;"><tbody>${htmlRows}</tbody></table>`;
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
            trust: (context: any) => ['\\htmlId', '\\href', '\\includegraphics', '\\class', '\\style', '\\htmlData'].includes(context.command),
            strict: false,
          });
        }
      } catch (error) {
        console.error('Error rendering KaTeX:', error);
      }
    };

    // Make images resizable
    const makeImagesResizable = () => {
      if (!containerRef.current) return;

      const images = containerRef.current.querySelectorAll('img');
      images.forEach((img: HTMLImageElement) => {
        // Make images responsive by default
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.cursor = 'pointer';
        img.style.transition = 'transform 0.2s';

        // Add resize on click (cycle through sizes)
        let currentSize = 1; // 1 = 100%, 2 = 75%, 3 = 50%, 4 = 25%
        img.onclick = (e) => {
          e.preventDefault();
          currentSize = (currentSize % 4) + 1;

          switch (currentSize) {
            case 1:
              img.style.width = '100%';
              break;
            case 2:
              img.style.width = '75%';
              break;
            case 3:
              img.style.width = '50%';
              break;
            case 4:
              img.style.width = '25%';
              break;
          }
        };

        // Hover effect
        img.onmouseenter = () => {
          img.style.transform = 'scale(1.02)';
          img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        };
        img.onmouseleave = () => {
          img.style.transform = 'scale(1)';
          img.style.boxShadow = 'none';
        };
      });
    };

    const timer = setTimeout(() => {
      renderMath();
      makeImagesResizable();
    }, 50);

    return () => clearTimeout(timer);
  }, [processedContent]);

  return (
    <div
      ref={containerRef}
      className="fiche-content text-black [&_*]:text-black [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-300"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
