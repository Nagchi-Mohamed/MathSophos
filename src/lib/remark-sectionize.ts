
import { Plugin } from 'unified';

/**
 * Remark plugin to wrapper sections (header + content) into <section> blocks.
 * Uses a forward-pass flat grouping strategy to prevent nesting issues.
 */
export const remarkSectionize: Plugin = () => {
  return (tree: any) => {
    const newChildren = [];
    let currentSection: any = null;

    // Helper to determine box type from title
    const getBoxType = (titleText: string) => {
      if (!titleText) return 'default';
      const lower = titleText.toLowerCase();
      if (lower.includes('introduction')) return 'introduction';
      if (lower.includes('définition') || lower.includes('definition')) return 'definition';
      if (lower.includes('théorème') || lower.includes('theorem') || lower.includes('propriété')) return 'theorem';
      if (lower.includes('formule')) return 'formula';
      if (lower.includes('exemple') || lower.includes('example')) return 'example';
      if (lower.includes('exercice') || lower.includes('exercise')) return 'exercise';
      if (lower.includes('résumé') || lower.includes('summary')) return 'summary';
      if (lower.includes('erreur') || lower.includes('alert') || lower.includes('attention')) return 'alert';
      return 'default';
    };

    for (const node of tree.children) {
      // Support both H2 (##) and H3 (###) as Section Starters
      if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
        // If we have an active section, push it to newChildren first
        if (currentSection) {
          newChildren.push(currentSection);
        }

        // Start a new section
        const titleText = node.children?.[0]?.value || '';
        const boxType = getBoxType(titleText);

        currentSection = {
          type: 'wrapper', // Custom node type
          data: {
            hName: 'section', // Render as <section>
            hProperties: { className: `lesson-box box-${boxType}` }
          },
          children: [node] // Start with the heading
        };
      } else {
        // Not an H2
        if (currentSection) {
          // If we are in a section, add to it
          currentSection.children.push(node);
        } else {
          // If we are before any H2 (e.g. title or Preamble), just keep it at root
          newChildren.push(node);
        }
      }
    }

    // Push the final section if exists
    if (currentSection) {
      newChildren.push(currentSection);
    }

    // Replace tree children with the grouped structure
    tree.children = newChildren;
  };
};
