"use client";

import React from 'react';
import { MathematicalEnvironmentBlock } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';
import { Award, Layers } from 'lucide-react';

interface TheoremBlockProps {
  block: MathematicalEnvironmentBlock;
}

export function TheoremBlock({ block }: TheoremBlockProps) {
  const isProp = block.type === 'proposition';
  const label = block.type === 'proposition' ? 'PROPOSITION' : block.type === 'lemma' ? 'LEMME' : block.type === 'corollary' ? 'COROLLAIRE' : 'THÉORÈME';

  const borderColor = isProp ? 'border-indigo-300 dark:border-indigo-900/60' : 'border-blue-400 dark:border-blue-900/80';
  const bgColor = isProp ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'bg-blue-50/60 dark:bg-blue-950/20';
  const headerBg = isProp ? 'bg-indigo-100/80 dark:bg-indigo-900/40' : 'bg-blue-100/80 dark:bg-blue-900/50';
  const textColor = isProp ? 'text-indigo-800 dark:text-indigo-300' : 'text-blue-900 dark:text-blue-200';
  const iconColor = isProp ? 'text-indigo-600 dark:text-indigo-400' : 'text-blue-600 dark:text-blue-400';

  return (
    <div className={`my-6 rounded-xl border ${borderColor} ${bgColor} shadow-sm overflow-hidden transition-all break-inside-avoid`}>
      <div className={`${headerBg} px-5 py-2.5 border-b ${borderColor} flex items-center justify-between`}>
        <div className={`flex items-center gap-2 ${textColor} font-bold text-sm tracking-wide uppercase`}>
          {isProp ? <Layers className={`w-4 h-4 ${iconColor}`} /> : <Award className={`w-4 h-4 ${iconColor}`} />}
          <span>{label} {block.number ? `${block.number}` : ''}</span>
          {block.title && <span className="font-semibold opacity-90 normal-case">— {block.title}</span>}
        </div>
      </div>
      <div className="p-5 text-foreground/90 leading-relaxed font-serif text-base md:text-lg">
        <MarkdownRenderer content={block.statement} />
      </div>
      {block.proof && (
        <div className="px-5 pb-5 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Démonstration</p>
          <div className="text-sm text-foreground/80 font-serif">
            <MarkdownRenderer content={block.proof} />
          </div>
        </div>
      )}
    </div>
  );
}
