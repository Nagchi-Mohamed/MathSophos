"use client";

import React from 'react';
import { RemarkBlock as RemarkBlockType } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';
import { Info, AlertTriangle, AlertCircle } from 'lucide-react';

interface RemarkBlockProps {
  block: RemarkBlockType;
}

export function RemarkBlock({ block }: RemarkBlockProps) {
  const isWarning = block.type === 'warning';
  const isImportant = block.type === 'important';

  const borderColor = isWarning ? 'border-amber-500' : isImportant ? 'border-purple-500' : 'border-emerald-500';
  const bgColor = isWarning ? 'bg-amber-50/40 dark:bg-amber-950/20' : isImportant ? 'bg-purple-50/40 dark:bg-purple-950/20' : 'bg-emerald-50/40 dark:bg-emerald-950/20';
  const titleColor = isWarning ? 'text-amber-700 dark:text-amber-300' : isImportant ? 'text-purple-700 dark:text-purple-300' : 'text-emerald-700 dark:text-emerald-300';
  const Icon = isWarning ? AlertTriangle : isImportant ? AlertCircle : Info;
  const label = isWarning ? 'ATTENTION' : isImportant ? 'IMPORTANT' : 'REMARQUE';

  return (
    <div className={`my-5 rounded-r-xl border-l-4 ${borderColor} ${bgColor} p-4 shadow-sm break-inside-avoid`}>
      <div className={`flex items-center gap-2 ${titleColor} font-bold text-xs tracking-wider uppercase mb-2`}>
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="text-foreground/90 font-serif text-sm md:text-base leading-relaxed">
        <MarkdownRenderer content={block.content} />
      </div>
    </div>
  );
}
