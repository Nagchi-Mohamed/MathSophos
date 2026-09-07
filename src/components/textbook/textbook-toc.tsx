"use client";

import React, { useEffect, useState } from 'react';
import { TextbookSection } from '@/types/textbook';
import { BookOpen, ChevronDown, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TextbookTOCProps {
  sections: TextbookSection[];
  hasSummary?: boolean;
  hasExercises?: boolean;
  hasSelfAssessment?: boolean;
}

export function TextbookTOC({ sections, hasSummary, hasExercises, hasSelfAssessment }: TextbookTOCProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -75% 0%' }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    if (hasSummary) {
      const el = document.getElementById('section-summary');
      if (el) observer.observe(el);
    }
    if (hasExercises) {
      const el = document.getElementById('section-exercises');
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections, hasSummary, hasExercises]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const elPos = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: elPos, behavior: 'smooth' });
      setActiveId(id);
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Collapsible TOC Drawer Trigger */}
      <div className="lg:hidden mb-6">
        <Button
          variant="outline"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full flex items-center justify-between bg-card border-border shadow-sm py-3 px-4 text-foreground"
        >
          <span className="flex items-center gap-2 font-bold text-sm">
            <List className="w-4 h-4 text-primary" />
            <span>Sommaire du chapitre</span>
          </span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isMobileOpen && "rotate-180")} />
        </Button>

        {isMobileOpen && (
          <div className="mt-2 p-4 rounded-xl border border-border bg-card shadow-lg space-y-2 animate-in fade-in-50 duration-200">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                className={cn(
                  "w-full text-left py-2 px-3 rounded-lg text-sm transition-colors flex items-center gap-2 font-serif",
                  activeId === sec.id ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="font-sans font-bold text-xs shrink-0">{sec.number}.</span>
                <span className="truncate">{sec.title}</span>
              </button>
            ))}
            {hasExercises && (
              <button
                onClick={() => scrollTo('section-exercises')}
                className="w-full text-left py-2 px-3 rounded-lg text-sm text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                ✏️ Exercices d'application
              </button>
            )}
            {hasSummary && (
              <button
                onClick={() => scrollTo('section-summary')}
                className="w-full text-left py-2 px-3 rounded-lg text-sm text-primary font-semibold hover:bg-primary/10"
              >
                📋 À retenir
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Sticky Sidebar TOC */}
      <nav className="hidden lg:block space-y-3 bg-card p-5 rounded-2xl border border-border shadow-sm sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-foreground mb-4 border-b border-border pb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>Sommaire</span>
        </div>

        <ul className="space-y-1.5 text-sm font-serif">
          {sections.map((sec) => (
            <li key={sec.id}>
              <button
                onClick={() => scrollTo(sec.id)}
                className={cn(
                  "w-full text-left py-2 px-3 rounded-lg transition-all duration-200 flex items-start gap-2 border-l-2",
                  activeId === sec.id
                    ? "bg-primary/10 text-primary font-bold border-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent"
                )}
              >
                <span className="font-sans font-bold text-xs mt-0.5 shrink-0">{sec.number}.</span>
                <span className="leading-snug">{sec.title}</span>
              </button>
            </li>
          ))}

          {hasExercises && (
            <li className="pt-2 border-t border-border/60">
              <button
                onClick={() => scrollTo('section-exercises')}
                className={cn(
                  "w-full text-left py-2 px-3 rounded-lg text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2",
                  activeId === 'section-exercises' && "bg-amber-100/60 dark:bg-amber-950/40"
                )}
              >
                <span>✏️</span>
                <span>Exercices</span>
              </button>
            </li>
          )}

          {hasSummary && (
            <li>
              <button
                onClick={() => scrollTo('section-summary')}
                className={cn(
                  "w-full text-left py-2 px-3 rounded-lg text-primary font-semibold hover:bg-primary/10 flex items-center gap-2",
                  activeId === 'section-summary' && "bg-primary/15"
                )}
              >
                <span>📋</span>
                <span>À retenir</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
