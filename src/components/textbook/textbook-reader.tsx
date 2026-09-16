"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { Sun, Moon, CheckCircle, HelpCircle, ArrowLeft, ArrowRight, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { LessonAnnotation, AnnotationImage, AnnotationDropZone } from './lesson-annotation-image';

interface TextbookReaderProps {
  lesson: TextbookLesson;
  isAdmin?: boolean;
}

export function TextbookReader({ lesson, isAdmin = false }: TextbookReaderProps) {
  const [paperMode, setPaperMode] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<LessonAnnotation[]>([]);
  const [pendingPaste, setPendingPaste] = useState<File | null>(null);
  const [showPasteBlockPicker, setShowPasteBlockPicker] = useState(false);
  const [allBlockIds, setAllBlockIds] = useState<{ id: string; label: string }[]>([]);

  // Load annotations for this lesson
  useEffect(() => {
    fetch(`/api/lesson-annotations?lessonId=${lesson.id}`)
      .then(r => r.json())
      .then((data: LessonAnnotation[]) => {
        if (Array.isArray(data)) setAnnotations(data)
      })
      .catch(() => {})
  }, [lesson.id]);

  // Build list of all block ids for paste targeting
  useEffect(() => {
    const ids: { id: string; label: string }[] = [];
    lesson.sections.forEach(sec => {
      sec.blocks.forEach(block => {
        const label = block.title || block.type + " " + (block.number || "");
        ids.push({ id: block.id, label: `Section ${sec.number} — ${label.trim()}` });
      });
    });
    setAllBlockIds(ids);
  }, [lesson.sections]);

  useEffect(() => {
    const savedMode = localStorage.getItem('mathsophos_paper_mode');
    if (savedMode === 'true') setPaperMode(true);
  }, []);

  // Intercept global Ctrl+V for image paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isAdmin) return;
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          setPendingPaste(file);
          setShowPasteBlockPicker(true);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isAdmin]);

  const togglePaperMode = () => {
    const newMode = !paperMode;
    setPaperMode(newMode);
    localStorage.setItem('mathsophos_paper_mode', String(newMode));
  };

  // ── Annotation CRUD helpers ─────────────────────────────────────────────────

  const handleAnnotationCreated = useCallback((ann: LessonAnnotation) => {
    setAnnotations(prev => [...prev, ann]);
  }, []);

  const handleAnnotationUpdate = useCallback(async (id: string, patch: Partial<LessonAnnotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    try {
      await fetch("/api/lesson-annotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
    } catch { /* silent */ }
  }, []);

  const handleAnnotationDelete = useCallback(async (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`/api/lesson-annotations?id=${id}`, { method: "DELETE" });
      toast.success("Image supprimée");
    } catch { /* silent */ }
  }, []);

  // ── Paste into specific block ───────────────────────────────────────────────
  const handlePasteToBlock = useCallback(async (blockId: string, position: "before" | "after") => {
    if (!pendingPaste) return;
    setShowPasteBlockPicker(false);
    const file = pendingPaste;
    setPendingPaste(null);

    const toastId = toast.loading("Ajout de l'image collée...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", "lesson");
      fd.append("entityId", lesson.id);
      const upRes = await fetch("/api/admin/images/upload", { method: "POST", body: fd });
      let imageUrl = "";
      let imageId: string | undefined;
      if (upRes.ok) {
        const upData = await upRes.json();
        if (upData.image?.id) { imageUrl = `/api/images/${upData.image.id}`; imageId = upData.image.id; }
      }
      if (!imageUrl) {
        imageUrl = await new Promise<string>(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const annRes = await fetch("/api/lesson-annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id, blockId, imageUrl, imageId, position, float: "left", widthPct: 40 }),
      });
      if (annRes.ok) {
        const ann = await annRes.json();
        handleAnnotationCreated(ann);
        toast.success("Image insérée !", { id: toastId });
      } else {
        toast.error("Erreur lors de l'enregistrement", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur", { id: toastId });
    }
  }, [pendingPaste, lesson.id, handleAnnotationCreated]);

  // ── Block renderer with annotation zones ────────────────────────────────────

  const renderBlock = (block: ContentBlock) => {
    const before = annotations.filter(a => a.blockId === block.id && a.position === "before");
    const after  = annotations.filter(a => a.blockId === block.id && a.position === "after");

    const blockEl = (() => {
      switch (block.type) {
        case 'definition':   return <DefinitionBlock key={block.id} block={block} />;
        case 'theorem': case 'proposition': case 'lemma': case 'corollary':
          return <TheoremBlock key={block.id} block={block} />;
        case 'proof':        return <ProofBlock key={block.id} block={block} />;
        case 'example': case 'application':
          return <ExampleBlock key={block.id} block={block} />;
        case 'remark': case 'important': case 'warning':
          return <RemarkBlock key={block.id} block={block} />;
        case 'method':       return <MethodBlock key={block.id} block={block} />;
        case 'exercise':     return <ExerciseBlock key={block.id} block={block} />;
        case 'common_error': return <CommonErrorBlock key={block.id} block={block} />;
        case 'summary':      return <SummaryBlock key={block.id} block={block} />;
        case 'self_evaluation': return <SelfAssessmentBlock key={block.id} block={block} />;
        default: {
          const textContent = 'content' in block ? (block as any).content : 'statement' in block ? (block as any).statement : '';
          return (
            <div key={block.id} className="my-4 text-foreground/90 font-serif text-base md:text-lg leading-relaxed">
              <MarkdownRenderer content={textContent || ''} />
            </div>
          );
        }
      }
    })();

    return (
      <div key={block.id} style={{ position: "relative" }}>
        {/* Drop zone + annotations BEFORE the block */}
        {before.map(ann => (
          <AnnotationImage
            key={ann.id}
            annotation={ann}
            isAdmin={isAdmin}
            onUpdate={handleAnnotationUpdate}
            onDelete={handleAnnotationDelete}
          />
        ))}
        {isAdmin && (
          <AnnotationDropZone
            blockId={block.id}
            position="before"
            lessonId={lesson.id}
            onAnnotationCreated={handleAnnotationCreated}
          />
        )}

        {/* The block content itself */}
        <div style={{ overflow: "hidden" }}>
          {blockEl}
        </div>

        {/* Drop zone + annotations AFTER the block */}
        {isAdmin && (
          <AnnotationDropZone
            blockId={block.id}
            position="after"
            lessonId={lesson.id}
            onAnnotationCreated={handleAnnotationCreated}
          />
        )}
        {after.map(ann => (
          <AnnotationImage
            key={ann.id}
            annotation={ann}
            isAdmin={isAdmin}
            onUpdate={handleAnnotationUpdate}
            onDelete={handleAnnotationDelete}
          />
        ))}
        {/* Clearfix so floated images don't overflow */}
        <div style={{ clear: "both" }} />
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${paperMode ? 'bg-[#FAF8F5] text-[#2C2825]' : 'bg-background text-foreground'}`}>
      <ReadingProgressBar />

      {/* Mode Switcher */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden flex flex-col items-end gap-2">
        <Button
          onClick={togglePaperMode}
          variant="outline"
          size="sm"
          className="shadow-xl rounded-full bg-card/90 backdrop-blur-md border-border text-xs font-semibold px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform"
        >
          {paperMode ? (
            <><Moon className="w-4 h-4 text-indigo-500" /><span>Mode Sombre / Normal</span></>
          ) : (
            <><Sun className="w-4 h-4 text-amber-500" /><span>Mode Papier Académique</span></>
          )}
        </Button>

        {/* Admin paste hint */}
        {isAdmin && (
          <div className="bg-blue-600 text-white rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg flex items-center gap-1.5">
            <ImagePlus className="w-3.5 h-3.5" />
            Ctrl+V ou Glisser pour ajouter des images
          </div>
        )}
      </div>

      {/* Paste Block Picker Modal */}
      {showPasteBlockPicker && pendingPaste && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "white", borderRadius: 12, padding: 24,
            maxWidth: 480, width: "90%", maxHeight: "80vh",
            overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
          }}>
            <h3 style={{ fontWeight: "bold", fontSize: 16, marginBottom: 4 }}>📎 Où insérer l'image ?</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Choisissez le bloc de contenu où placer l'image collée :
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {allBlockIds.slice(0, 30).map(b => (
                <div key={b.id} style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handlePasteToBlock(b.id, "before")}
                    style={{
                      flex: 1, padding: "8px 10px", textAlign: "left", borderRadius: 6,
                      border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 12,
                      background: "#f8fafc", color: "#1e293b"
                    }}
                  >
                    ↑ Avant : {b.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePasteToBlock(b.id, "after")}
                    style={{
                      flex: 1, padding: "8px 10px", textAlign: "left", borderRadius: 6,
                      border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 12,
                      background: "#f8fafc", color: "#1e293b"
                    }}
                  >
                    ↓ Après : {b.label}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setShowPasteBlockPicker(false); setPendingPaste(null); }}
              style={{
                marginTop: 16, width: "100%", padding: "8px 0",
                background: "#f1f5f9", border: "none", borderRadius: 6,
                cursor: "pointer", fontSize: 13, color: "#64748b"
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

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
                        {lesson.metadata.objectives.map((obj, idx) => <li key={idx}>{obj}</li>)}
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
                        {lesson.metadata.prerequisites.map((pre, idx) => <li key={idx}>{pre}</li>)}
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

            {/* Standalone Exercises */}
            {lesson.exercises && lesson.exercises.length > 0 && (
              <section id="section-exercises" className="scroll-mt-28 mt-14 pt-8 border-t-2 border-amber-300 dark:border-amber-900/60">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">✏️</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold font-serif text-foreground">
                    Exercices d'application du chapitre
                  </h2>
                </div>
                <div className="space-y-6">
                  {lesson.exercises.map((exBlock) => <ExerciseBlock key={exBlock.id} block={exBlock} />)}
                </div>
              </section>
            )}

            {lesson.summary && (
              <section id="section-summary" className="scroll-mt-28 mt-12">
                <SummaryBlock block={lesson.summary} />
              </section>
            )}

            {lesson.selfAssessment && (
              <section className="mt-8">
                <SelfAssessmentBlock block={lesson.selfAssessment} />
              </section>
            )}

            {/* Bottom navigation */}
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

          {/* TOC Sidebar */}
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
