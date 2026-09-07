"use client";

import React, { useState, useEffect } from 'react';
import { TextbookLesson, ContentBlock } from '@/types/textbook';
import { TextbookHeader } from './textbook-header';
import { TextbookTOC } from './textbook-toc';
import { DefinitionBlock } from './blocks/definition-block';
import { TheoremBlock } from './blocks/theorem-block';
import { ProofBlock } from './blocks/proof-block';
import { ExampleBlock } from './blocks/example-block';
import { RemarkBlock } from './blocks/remark-block';
import { MethodBlock } from './blocks/method-block';
import { ExerciseBlock } from './blocks/exercise-block';
import { CommonErrorBlock } from './blocks/common-error-block';
import { SummaryBlock } from './blocks/summary-block';
import { SelfAssessmentBlock } from './blocks/self-assessment-block';
import MarkdownRenderer from '@/components/markdown-renderer';
import { ReadingProgressBar } from '@/components/lessons/reading-progress-bar';
import { Sun, Moon, CheckCircle, HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TextbookReaderProps {
  lesson: TextbookLesson;
}

export function TextbookReader({ lesson }: TextbookReaderProps) {
  const [paperMode, setPaperMode] = useState<boolean>(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('mathsophos_paper_mode');
    if (savedMode === 'true') {
      setPaperMode(true);
    }
  }, []);

  const togglePaperMode = () => {
    const newMode = !paperMode;
    setPaperMode(newMode);
    localStorage.setItem('mathsophos_paper_mode', String(newMode));
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'definition':
        return <DefinitionBlock key={block.id} block={block} />;
      case 'theorem':
      case 'proposition':
      case 'lemma':
      case 'corollary':
        return <TheoremBlock key={block.id} block={block} />;
      case 'proof':
        return <ProofBlock key={block.id} block={block} />;
      case 'example':
      case 'application':
        return <ExampleBlock key={block.id} block={block} />;
      case 'remark':
      case 'important':
      case 'warning':
        return <RemarkBlock key={block.id} block={block} />;
      case 'method':
        return <MethodBlock key={block.id} block={block} />;
      case 'exercise':
        return <ExerciseBlock key={block.id} block={block} />;
      case 'common_error':
        return <CommonErrorBlock key={block.id} block={block} />;
      case 'summary':
        return <SummaryBlock key={block.id} block={block} />;
      case 'self_evaluation':
        return <SelfAssessmentBlock key={block.id} block={block} />;
      case 'paragraph':
      case 'text':
      default:
        return (
          <div key={block.id} className="my-4 text-foreground/90 font-serif text-base md:text-lg leading-relaxed">
            <MarkdownRenderer content={block.content || ''} />
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${paperMode ? 'bg-[#FAF8F5] text-[#2C2825]' : 'bg-background text-foreground'}`}>
      <ReadingProgressBar />

      {/* Mode Switcher Floating Controls */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden flex items-center gap-2">
        <Button
          onClick={togglePaperMode}
          variant="outline"
          size="sm"
          className="shadow-xl rounded-full bg-card/90 backdrop-blur-md border-border text-xs font-semibold px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform"
        >
          {paperMode ? (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>Mode Sombre / Normal</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Mode Papier Académique</span>
            </>
          )}
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Reading Column */}
          <main className="lg:col-span-9 max-w-4xl mx-auto w-full">
            <TextbookHeader lesson={lesson} />

            {/* Objectives & Prerequisites Banner */}
            {((lesson.metadata.objectives && lesson.metadata.objectives.length > 0) ||
              (lesson.metadata.prerequisites && lesson.metadata.prerequisites.length > 0)) && (
              <div className="my-8 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-6 shadow-xs break-inside-avoid">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lesson.metadata.objectives && lesson.metadata.objectives.length > 0 && (
                    <div>
                      <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Objectifs d'apprentissage
                      </h3>
                      <ul className="space-y-1.5 text-sm text-foreground/90 font-serif list-disc pl-5">
                        {lesson.metadata.objectives.map((obj, idx) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lesson.metadata.prerequisites && lesson.metadata.prerequisites.length > 0 && (
                    <div>
                      <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Prérequis recommandés
                      </h3>
                      <ul className="space-y-1.5 text-sm text-foreground/90 font-serif list-disc pl-5">
                        {lesson.metadata.prerequisites.map((pre, idx) => (
                          <li key={idx}>{pre}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Sections */}
            <div className="space-y-12 mt-8">
              {lesson.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <div className="border-b-2 border-primary/30 pb-3 mb-6 flex items-center gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground font-bold font-sans text-base shadow-sm">
                      {section.number}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-foreground tracking-tight">
                      {section.title}
                    </h2>
                  </div>

                  {section.introduction && (
                    <div className="mb-6 italic text-muted-foreground font-serif text-base md:text-lg pl-4 border-l-2 border-primary/40">
                      <MarkdownRenderer content={section.introduction} />
                    </div>
                  )}

                  <div className="space-y-4">
                    {section.blocks.map((block) => renderBlock(block))}
                  </div>
                </section>
              ))}
            </div>

            {/* Standalone Exercises Section if attached */}
            {lesson.exercises && lesson.exercises.length > 0 && (
              <section id="section-exercises" className="scroll-mt-28 mt-14 pt-8 border-t-2 border-amber-300 dark:border-amber-900/60">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">✏️</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-foreground">
                    Exercices d'application du chapitre
                  </h2>
                </div>
                <div className="space-y-6">
                  {lesson.exercises.map((exBlock) => (
                    <ExerciseBlock key={exBlock.id} block={exBlock} />
                  ))}
                </div>
              </section>
            )}

            {/* Summary Section */}
            {lesson.summary && (
              <section id="section-summary" className="scroll-mt-28 mt-12">
                <SummaryBlock block={lesson.summary} />
              </section>
            )}

            {/* Self Assessment Section */}
            {lesson.selfAssessment && (
              <section className="mt-8">
                <SelfAssessmentBlock block={lesson.selfAssessment} />
              </section>
            )}

            {/* Bottom Lesson Navigation */}
            <div className="mt-14 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-4 print:hidden">
              <Link href="/lessons">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tous les cours</span>
                </Button>
              </Link>

              <Link href="/exercises">
                <Button className="flex items-center gap-2 bg-primary text-primary-foreground">
                  <span>Voir les séries d'exercices corrigés</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </main>

          {/* Sticky Table of Contents Sidebar */}
          <aside className="lg:col-span-3">
            <TextbookTOC
              sections={lesson.sections}
              hasSummary={!!lesson.summary}
              hasExercises={!!(lesson.exercises && lesson.exercises.length > 0)}
            />
          </aside>

        </div>
      </div>
    </div>
  );
}
