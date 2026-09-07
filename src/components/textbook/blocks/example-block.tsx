"use client";

import React, { useState } from 'react';
import { ExampleBlock as ExampleBlockType } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExampleBlockProps {
  block: ExampleBlockType;
}

export function ExampleBlock({ block }: ExampleBlockProps) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="my-6 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm overflow-hidden transition-all break-inside-avoid">
      <div className="bg-amber-100/70 dark:bg-amber-900/40 px-5 py-2.5 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm tracking-wide uppercase">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>EXEMPLE {block.number ? `${block.number}` : ''}</span>
          {block.title && <span className="font-semibold text-amber-800 dark:text-amber-300 normal-case">— {block.title}</span>}
        </div>
      </div>
      <div className="p-5 text-foreground/90 leading-relaxed font-serif text-base md:text-lg">
        <MarkdownRenderer content={block.problem} />
      </div>

      {block.solution && (
        <div className="border-t border-amber-200/80 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSolution(!showSolution)}
            className="text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 text-xs font-semibold flex items-center gap-2"
          >
            {showSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showSolution ? 'Masquer la solution de l\'exemple' : 'Voir la solution de l\'exemple'}</span>
          </Button>

          {showSolution && (
            <div className="mt-3 p-4 rounded-lg bg-background/80 border border-amber-200/60 dark:border-amber-900/30 text-foreground/90 font-serif text-sm md:text-base animate-in fade-in-50 duration-200">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">Solution :</p>
              <MarkdownRenderer content={block.solution} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
