"use client";

import React, { useState } from 'react';
import { ExerciseBlock as ExerciseBlockType } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';
import { Pencil, Lightbulb, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExerciseBlockProps {
  block: ExerciseBlockType;
}

export function ExerciseBlock({ block }: ExerciseBlockProps) {
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const difficultyStars = '★'.repeat(block.difficulty || 1) + '☆'.repeat(4 - (block.difficulty || 1));

  return (
    <div className="my-8 rounded-xl border-2 border-slate-300 dark:border-slate-800 bg-card shadow-md overflow-hidden transition-all break-inside-avoid">
      <div className="bg-slate-100 dark:bg-slate-800/80 px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm">
            <Pencil className="w-4 h-4" />
          </span>
          <span className="font-bold text-base md:text-lg text-foreground">
            EXERCICE {block.number ? `${block.number}` : ''}
          </span>
        </div>

        {block.difficulty && (
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 font-mono tracking-widest text-xs">
            {difficultyStars}
          </Badge>
        )}
      </div>

      <div className="p-6 text-foreground/90 leading-relaxed font-serif text-base md:text-lg">
        <MarkdownRenderer content={block.statement} />
      </div>

      {/* Hints & Solution Section */}
      <div className="px-6 pb-6 pt-2 flex flex-wrap gap-3 border-t border-border/60 bg-muted/20">
        {block.hints && block.hints.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHints(!showHints)}
            className="border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold"
          >
            <Lightbulb className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            <span>Indications ({block.hints.length})</span>
            {showHints ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </Button>
        )}

        {block.solution && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSolution(!showSolution)}
            className="border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            <span>Solution détaillée</span>
            {showSolution ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </Button>
        )}
      </div>

      {/* Collapsible Hints Panel */}
      {showHints && block.hints && block.hints.length > 0 && (
        <div className="mx-6 mb-6 p-4 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2 text-sm text-foreground/90 animate-in fade-in-50 duration-200">
          <p className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">Aide & Indications :</p>
          {block.hints.map((hint, hIdx) => (
            <div key={hIdx} className="flex gap-2.5 items-start">
              <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">{hIdx + 1}.</span>
              <div className="flex-1 font-serif">
                <MarkdownRenderer content={hint} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible Solution Panel */}
      {showSolution && block.solution && (
        <div className="mx-6 mb-6 p-5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-foreground/90 font-serif text-base animate-in fade-in-50 duration-200">
          <p className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-3">Correction détaillée :</p>
          <MarkdownRenderer content={block.solution} />
        </div>
      )}
    </div>
  );
}
