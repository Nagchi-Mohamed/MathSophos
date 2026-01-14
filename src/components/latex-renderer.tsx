"use client";

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  formula: string;
  displayMode?: boolean;
  className?: string; // Additional classes for the container
}

export function LatexRenderer({ formula, displayMode = false, className = '' }: LatexRendererProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode,
        throwOnError: false, // Render the raw string on error instead of crashing
        errorColor: '#cc0000',
        strict: false, // Less strict handling (e.g., for some legacy commands)
        trust: true, // Allow some HTML in macros if needed (use with caution)
      });
    } catch (error) {
      console.error("KaTeX rendering error:", error);
      return `<span class="text-red-500 font-mono text-sm">${formula}</span>`; // Fallback
    }
  }, [formula, displayMode]);

  return (
    <span
      className={`notranslate ${className} ${displayMode ? 'block my-2 overflow-x-auto overflow-y-hidden' : 'inline-block'}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
