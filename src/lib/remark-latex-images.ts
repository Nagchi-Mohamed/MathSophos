import { visit } from 'unist-util-visit';
import type { Node, Parent } from 'unist';

interface TextNode extends Node {
  type: 'text';
  value: string;
}

interface HtmlNode extends Node {
  type: 'html';
  value: string;
}

/**
 * Remark plugin to convert LaTeX \includegraphics commands to HTML img tags
 * 
 * Supports:
 * - \includegraphics{path}
 * - \includegraphics[width=300px]{path}
 * - \includegraphics[height=200px]{path}
 * - \includegraphics[width=300px,height=200px]{path}
 */
export function remarkLatexImages() {
  return (tree: Node) => {
    visit(tree, 'text', (node: TextNode, index: number | null, parent: Parent | null) => {
      if (!parent || index === null) return;

      const text = node.value;

      // Match: \includegraphics[options]{path}
      // Captures: 1=options, 2=path
      const includeGraphicsRegex = /\\includegraphics(?:\[([^\]]*)\])?\{([^}]+)\}/g;

      // Match: \figure{path}{options}
      // Captures: 1=path, 2=options
      const figureRegex = /\\figure\{([^}]+)\}\{([^}]*)\}/g;

      // Find all matches from both regexes
      const allMatches = [];

      let match;
      while ((match = includeGraphicsRegex.exec(text)) !== null) {
        allMatches.push({
          fullMatch: match[0],
          options: match[1] || '',
          path: match[2],
          index: match.index,
          length: match[0].length
        });
      }

      while ((match = figureRegex.exec(text)) !== null) {
        allMatches.push({
          fullMatch: match[0],
          options: match[2] || '', // options are 2nd arg in \figure
          path: match[1],          // path is 1st arg in \figure
          index: match.index,
          length: match[0].length
        });
      }

      // Sort matches by index to process them in order
      allMatches.sort((a, b) => a.index - b.index);

      if (allMatches.length > 0) {
        const parts: Node[] = [];
        let lastIndex = 0;

        allMatches.forEach(m => {
          // Skip if this match overlaps with previous (shoudln't happen with simple regexes but good safety)
          if (m.index < lastIndex) return;

          // Add text before match
          if (m.index > lastIndex) {
            parts.push({
              type: 'text',
              value: text.slice(lastIndex, m.index)
            } as TextNode);
          }

          // Parse options
          const width = m.options?.match(/width=([^,\]\}]+)/)?.[1];
          const height = m.options?.match(/height=([^,\]\}]+)/)?.[1];

          // Convert path
          const webPath = convertLatexPathToWeb(m.path);

          parts.push({
            type: 'html',
            value: createImageHtml(webPath, width, height)
          } as HtmlNode);

          lastIndex = m.index + m.length;
        });

        // Add remaining text
        if (lastIndex < text.length) {
          parts.push({
            type: 'text',
            value: text.slice(lastIndex)
          } as TextNode);
        }

        parent.children.splice(index, 1, ...parts);
        return index + parts.length;
      }
    });
  };
}

/**
 * Convert LaTeX image path to web-accessible path
 */
function convertLatexPathToWeb(latexPath: string): string {
  // Remove ./ prefix if present
  let path = latexPath.replace(/^\.\//, '');

  // If it's already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it starts with /, it's a web path. Return as-is (browser/puppeteer will resolve relative to current page)
  if (path.startsWith('/')) {
    return path;
  }

  // Otherwise, assume it's in the uploads directory
  return `/uploads/${path}`;
}

/**
 * Create HTML img tag with optional width/height
 */
function createImageHtml(src: string, width?: string, height?: string): string {
  const styles: string[] = [];

  const processDimension = (dim: string): string => {
    // Handle \linewidth (e.g. 0.8\linewidth -> 80%)
    if (dim.includes('\\linewidth')) {
      const factor = parseFloat(dim) || 1; // Default to 100% if just \linewidth
      return `${Math.round(factor * 100)}%`;
    }
    // Handle textwidth same as linewidth
    if (dim.includes('\\textwidth')) {
      const factor = parseFloat(dim) || 1;
      return `${Math.round(factor * 100)}%`;
    }
    // Handle cm (approximate conversion to px for screen, 1cm ≈ 37.8px)
    if (dim.includes('cm')) {
      const cm = parseFloat(dim);
      return `${Math.round(cm * 37.8)}px`;
    }
    // Handle existing units
    if (dim.includes('px') || dim.includes('%')) {
      return dim;
    }
    // Default to px if no unit
    return dim + 'px';
  };

  if (width) {
    styles.push(`width: ${processDimension(width)}`);
  }

  if (height) {
    styles.push(`height: ${processDimension(height)}`);
  }

  // Add max-width to prevent images from overflowing
  // If width is relative (%), max-width 100% is good
  // If width is fixed (px), we still want max-width 100% for responsivenes
  styles.push('max-width: 100%');
  styles.push('height: auto'); // Maintain aspect ratio

  const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
  const altText = src.split('/').pop()?.split('.')[0] || 'Embedded image';

  // Add display: block and margin: auto for centering if it's a large image (common in LaTeX documents)
  // We'll wrap it in a figure for better semantics and styling options
  const imgTag = `<img src="${src}"${styleAttr} alt="${altText}" class="latex-image" />`;

  return `<span class="image-wrapper" style="display: block; text-align: center; margin: 1rem 0;">${imgTag}</span>`;
}
