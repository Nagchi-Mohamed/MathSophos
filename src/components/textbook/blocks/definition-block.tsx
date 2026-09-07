"use client";

import React from 'react';
import { MathematicalEnvironmentBlock } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';
import { BookOpen } from 'lucide-react';

interface DefinitionBlockProps {
  block: MathematicalEnvironmentBlock;
}

export function DefinitionBlock({ block }: DefinitionBlockProps) {
  return (
    <div className="my-6 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 shadow-sm overflow-hidden transition-all break-inside-avoid">
      <div className="bg-rose-100/80 dark:bg-rose-900/40 px-5 py-2.5 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm tracking-wide uppercase">
          <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>DÉFINITION {block.number ? `${block.number}` : ''}</span>
          {block.title && <span className="font-semibold text-rose-700 dark:text-rose-300 normal-case">— {block.title}</span>}
        </div>
      </div>
      <div className="p-5 text-foreground/90 leading-relaxed font-serif text-base md:text-lg">
        <MarkdownRenderer content={block.statement} />
      </div>
    </div>
  );
}
