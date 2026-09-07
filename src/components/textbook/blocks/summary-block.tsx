"use client";

import React from 'react';
import { SummaryBlock as SummaryBlockType } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';
import { Bookmark, CheckSquare } from 'lucide-react';

interface SummaryBlockProps {
  block: SummaryBlockType;
}

export function SummaryBlock({ block }: SummaryBlockProps) {
  return (
    <div className="my-10 rounded-2xl border-2 border-slate-400 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 shadow-lg overflow-hidden transition-all break-inside-avoid">
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 font-bold text-lg tracking-wide uppercase">
          <Bookmark className="w-5 h-5 text-amber-400" />
          <span>L'ESSENTIEL DU CHAPITRE — À RETENIR</span>
        </div>
      </div>

      <div className="p-6 space-y-6 font-serif">
        {block.keyDefinitions && block.keyDefinitions.length > 0 && (
          <div>
            <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Définitions clés
            </h4>
            <ul className="space-y-2 list-disc pl-5 text-foreground/90 text-base">
              {block.keyDefinitions.map((item, idx) => (
                <li key={idx}><MarkdownRenderer content={item} /></li>
              ))}
            </ul>
          </div>
        )}

        {block.keyResults && block.keyResults.length > 0 && (
          <div>
            <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Résultats et Théorèmes essentiels
            </h4>
            <ul className="space-y-2 list-disc pl-5 text-foreground/90 text-base">
              {block.keyResults.map((item, idx) => (
                <li key={idx}><MarkdownRenderer content={item} /></li>
              ))}
            </ul>
          </div>
        )}

        {block.formulas && block.formulas.length > 0 && (
          <div>
            <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Formules fondamentales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {block.formulas.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-card border border-border text-center text-base font-serif">
                  <MarkdownRenderer content={item} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
