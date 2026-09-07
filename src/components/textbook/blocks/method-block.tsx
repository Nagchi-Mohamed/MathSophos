"use client";

import React from 'react';
import { MethodBlock as MethodBlockType } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';
import { Target, CheckCircle2 } from 'lucide-react';

interface MethodBlockProps {
  block: MethodBlockType;
}

export function MethodBlock({ block }: MethodBlockProps) {
  return (
    <div className="my-6 rounded-xl border border-sky-300 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 shadow-sm overflow-hidden transition-all break-inside-avoid">
      <div className="bg-sky-100/80 dark:bg-sky-900/40 px-5 py-2.5 border-b border-sky-200 dark:border-sky-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sky-900 dark:text-sky-200 font-bold text-sm tracking-wide uppercase">
          <Target className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>MÉTHODE {block.number ? `${block.number}` : ''}</span>
          {block.title && <span className="font-semibold text-sky-800 dark:text-sky-300 normal-case">— {block.title}</span>}
        </div>
      </div>
      <div className="p-5 space-y-3">
        {block.steps.map((step, idx) => (
          <div key={idx} className="flex gap-3 items-start text-foreground/90 font-serif text-sm md:text-base">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-600 text-white font-sans font-bold text-xs shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <div className="flex-1">
              <MarkdownRenderer content={step} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
