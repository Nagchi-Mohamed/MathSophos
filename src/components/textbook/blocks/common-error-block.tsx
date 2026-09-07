"use client";

import React from 'react';
import { CommonErrorBlock as CommonErrorBlockType } from '@/types/textbook';
import MarkdownRenderer from '@/components/markdown-renderer';
import { AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';

interface CommonErrorBlockProps {
  block: CommonErrorBlockType;
}

export function CommonErrorBlock({ block }: CommonErrorBlockProps) {
  return (
    <div className="my-6 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 shadow-sm overflow-hidden transition-all break-inside-avoid">
      <div className="bg-red-100/80 dark:bg-red-900/40 px-5 py-2.5 border-b border-red-200 dark:border-red-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-900 dark:text-red-200 font-bold text-sm tracking-wide uppercase">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span>ERREUR À ÉVITER</span>
        </div>
      </div>

      <div className="p-5 space-y-4 font-serif text-sm md:text-base">
        {/* Mistake */}
        <div className="flex gap-3 items-start bg-red-100/50 dark:bg-red-950/40 p-3.5 rounded-lg border border-red-200 dark:border-red-900/40">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-sans font-bold text-xs uppercase tracking-wider text-red-800 dark:text-red-300 block mb-1">Erreur fréquente :</span>
            <MarkdownRenderer content={block.mistake} />
          </div>
        </div>

        {/* Explanation */}
        {block.explanation && (
          <div className="text-foreground/90 pl-3 border-l-2 border-slate-300 dark:border-slate-700 italic">
            <span className="font-sans not-italic font-semibold text-xs text-muted-foreground block mb-1">Pourquoi c'est incorrect ?</span>
            <MarkdownRenderer content={block.explanation} />
          </div>
        )}

        {/* Correction */}
        {block.correction && (
          <div className="flex gap-3 items-start bg-emerald-100/50 dark:bg-emerald-950/40 p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-sans font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">Raisonnement correct :</span>
              <MarkdownRenderer content={block.correction} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
