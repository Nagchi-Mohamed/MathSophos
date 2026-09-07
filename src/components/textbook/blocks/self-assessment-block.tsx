"use client";

import React, { useState } from 'react';
import { SelfAssessmentBlock as SelfAssessmentBlockType } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';
import { CheckCircle2, Circle } from 'lucide-react';

interface SelfAssessmentBlockProps {
  block: SelfAssessmentBlockType;
}

export function SelfAssessmentBlock({ block }: SelfAssessmentBlockProps) {
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedState(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const total = block.items.length;
  const countChecked = Object.values(checkedState).filter(Boolean).length;
  const percentage = total > 0 ? Math.round((countChecked / total) * 100) : 0;

  return (
    <div className="my-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden break-inside-avoid">
      <div className="bg-muted/60 px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="font-bold text-sm tracking-wide uppercase text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>AUTO-ÉVALUATION DU CHAPITRE</span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          {percentage}% acquis ({countChecked}/{total})
        </span>
      </div>

      <div className="p-5 space-y-3">
        {block.items.map((item) => {
          const isChecked = !!checkedState[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center gap-3 ${
                isChecked
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100'
                  : 'bg-background hover:bg-muted/40 border-border text-foreground'
              }`}
            >
              {isChecked ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div className={`flex-1 font-serif text-sm md:text-base ${isChecked ? 'line-through opacity-85' : ''}`}>
                <MarkdownRenderer content={item.skill} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
