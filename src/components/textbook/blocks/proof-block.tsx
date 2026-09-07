"use client";

import React from 'react';
import { ProofBlock as ProofBlockType } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';

interface ProofBlockProps {
  block: ProofBlockType;
}

export function ProofBlock({ block }: ProofBlockProps) {
  return (
    <div className="my-5 pl-5 pr-4 py-3 border-l-2 border-slate-400 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/20 italic text-foreground/90 font-serif text-sm md:text-base relative break-inside-avoid">
      <span className="not-italic font-bold text-slate-700 dark:text-slate-300 text-xs tracking-wider uppercase block mb-1.5">
        Démonstration.
      </span>
      <div className="not-italic">
        <MarkdownRenderer content={block.content} />
      </div>
      <div className="flex justify-end mt-2">
        <span className="text-slate-500 font-bold text-base select-none" title="Quod Erat Demonstrandum (CQFD)">■</span>
      </div>
    </div>
  );
}
