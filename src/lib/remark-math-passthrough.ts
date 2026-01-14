
import { visit } from 'unist-util-visit';

export function remarkMathPassthrough() {
  return (tree: any) => {
    visit(tree, ['math', 'inlineMath'], (node: any) => {
      // Convert math nodes to HTML nodes so they pass through remark-rehype
      // We wrap them in standard delimiters that KaTeX auto-render expects
      const isDisplay = node.type === 'math';
      const value = node.value;

      // Mutate the node to be an HTML node
      // This "tricks" remark-rehype into just passing the string through
      node.type = 'html';
      node.children = undefined; // Ensure no children

      if (isDisplay) {
        node.value = `<div class="math-display">\\[${value}\\]</div>`;
      } else {
        node.value = `<span class="math-inline">\\(${value}\\)</span>`;
      }

      console.log('[Math Passthrough]', isDisplay ? 'Display' : 'Inline', ':', node.value);
    });
  };
}
