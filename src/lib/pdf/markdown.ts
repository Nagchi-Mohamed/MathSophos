

import { remarkSectionize } from "@/lib/remark-sectionize";
import { remarkLatexImages } from "@/lib/remark-latex-images";

export async function processMarkdownForPdf(content: string): Promise<string> {
  try {
    // robust dynamic imports for ESM packages
    const remarkMod = await import('remark');
    const remark = (remarkMod as any).remark || (remarkMod as any).default || remarkMod;

    const gfmMod = await import('remark-gfm');
    const remarkGfm = gfmMod.default || gfmMod;

    const mathMod = await import('remark-math');
    const remarkMath = mathMod.default || mathMod;

    const breaksMod = await import('remark-breaks');
    const remarkBreaks = breaksMod.default || breaksMod;

    const remarkRehypeMod = await import('remark-rehype');
    const remarkRehype = remarkRehypeMod.default || remarkRehypeMod;

    const rehypeKatexMod = await import('rehype-katex');
    const rehypeKatex = rehypeKatexMod.default || rehypeKatexMod;

    const rehypeStringifyMod = await import('rehype-stringify');
    const rehypeStringify = rehypeStringifyMod.default || rehypeStringifyMod;

    // Pipeline: Markdown -> GFM/Math/Breaks -> LaTeX Images -> Sectionize -> Rehype -> KaTeX (SERVER-SIDE) -> HTML
    // This matches the app's rendering pipeline exactly
    const file = await remark()
      .use(remarkGfm)
      .use(remarkMath, { singleDollarTextMath: true })
      .use(remarkBreaks)
      .use(remarkLatexImages)
      .use(remarkSectionize)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex, {
        strict: false,
        trust: true,
        throwOnError: false, // Don't crash on LaTeX errors
        output: 'html',
        macros: {
          "\\implies": "\\Rightarrow",
          "\\iff": "\\Leftrightarrow"
        }
      })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);


    return file.toString();
  } catch (error) {
    console.error("[Markdown Processor] Error:", error);
    // Return error message formatted nicely, not just raw pre tag
    return `<div class="pdf-error">
              <h3>Erreur de génération PDF</h3>
              <p>Une erreur est survenue lors du traitement du contenu.</p>
              <pre>${error instanceof Error ? error.message : String(error)}</pre>
            </div>`;
  }
}

