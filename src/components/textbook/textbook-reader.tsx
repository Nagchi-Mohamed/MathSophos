"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { LessonAnnotation, AnnotationImage } from './lesson-annotation-image';

interface TextbookReaderProps {
  lesson: TextbookLesson;
  isAdmin?: boolean;
}

export function TextbookReader({ lesson, isAdmin = false }: TextbookReaderProps) {
  const [paperMode, setPaperMode] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<LessonAnnotation[]>([]);

  // Currently active cursor / selection spot
  const [activeCursor, setActiveCursor] = useState<{ blockId: string; position: 'before' | 'after' } | null>(null);

  // Track the block the mouse is hovering over right now
  const hoveredBlockRef = useRef<{ blockId: string; position: 'before' | 'after' } | null>(null);

  // Hidden file input for double-click to upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputTargetRef = useRef<{ blockId: string; position: 'before' | 'after' } | null>(null);

  // Flat list of all block IDs in order
  const orderedBlockIds = useMemo(() => {
    const list: string[] = [];
    lesson.sections.forEach(sec => {
      sec.blocks.forEach(b => list.push(b.id));
    });
    return list;
  }, [lesson.sections]);

  // Load existing annotations
  useEffect(() => {
    fetch(`/api/lesson-annotations?lessonId=${lesson.id}`)
      .then(r => r.json())
      .then((data: LessonAnnotation[]) => {
        if (Array.isArray(data)) setAnnotations(data);
      })
      .catch(() => {});
  }, [lesson.id]);

  useEffect(() => {
    const savedMode = localStorage.getItem('mathsophos_paper_mode');
    if (savedMode === 'true') setPaperMode(true);
  }, []);

  // ── Upload & Create Annotation ──────────────────────────────────────────────
  const createAnnotation = useCallback(async (
    file: File,
    blockId: string,
    position: 'before' | 'after'
  ) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 8 Mo)");
      return;
    }

    const toastId = toast.loading("Ajout de l'image...");
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
        if (upData.image?.id) {
          imageUrl = `/api/images/${upData.image.id}`;
          imageId = upData.image.id;
        }
      }
      if (!imageUrl) {
        // base64 fallback
        imageUrl = await new Promise<string>(res => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const annRes = await fetch("/api/lesson-annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          blockId,
          imageUrl,
          imageId,
          position,
          float: "left",
          widthPct: 40
        }),
      });

      if (annRes.ok) {
        const ann = await annRes.json();
        setAnnotations(prev => [...prev, ann]);
        toast.success("Image insérée avec succès !", { id: toastId });
      } else {
        toast.error("Erreur lors de l'enregistrement", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'envoi", { id: toastId });
    }
  }, [lesson.id]);

  // ── Global Ctrl+V (Paste) — Direct to Cursor (NO MODAL) ─────────────────────
  useEffect(() => {
    if (!isAdmin) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData?.files?.length) return;
      const file = e.clipboardData.files[0];
      if (!file.type.startsWith('image/')) return;
      e.preventDefault();

      // 1. Target = explicitly clicked cursor
      // 2. Or = currently hovered block
      // 3. Or = block closest to current scroll viewport
      const target = activeCursor || hoveredBlockRef.current;
      if (target) {
        createAnnotation(file, target.blockId, target.position);
      } else {
        const allBlocks = document.querySelectorAll('[data-block-id]');
        const scrollMid = window.scrollY + window.innerHeight / 3;
        let closest: Element | null = null;
        let closestDist = Infinity;
        allBlocks.forEach(el => {
          const rect = el.getBoundingClientRect();
          const elMid = rect.top + window.scrollY + rect.height / 2;
          const dist = Math.abs(elMid - scrollMid);
          if (dist < closestDist) {
            closestDist = dist;
            closest = el;
          }
        });
        const fallbackId = closest ? (closest as HTMLElement).dataset.blockId! : orderedBlockIds[0];
        if (fallbackId) {
          createAnnotation(file, fallbackId, 'before');
        } else {
          toast.info("Cliquez d'abord sur la zone où vous souhaitez coller l'image.");
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isAdmin, activeCursor, createAnnotation, orderedBlockIds]);

  // ── Annotation Update & Delete ──────────────────────────────────────────────
  const handleUpdate = useCallback(async (id: string, patch: Partial<LessonAnnotation>) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    try {
      await fetch("/api/lesson-annotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
    } catch { /* silent */ }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`/api/lesson-annotations?id=${id}`, { method: "DELETE" });
      toast.success("Image supprimée");
    } catch { /* silent */ }
  }, []);

  // ── Move Up / Move Down ─────────────────────────────────────────────────────
  const handleMoveUp = useCallback((annotationId: string) => {
    const ann = annotations.find(a => a.id === annotationId);
    if (!ann) return;

    if (ann.position === 'after') {
      handleUpdate(annotationId, { position: 'before' });
      return;
    }

    // Move to previous block
    const currentIndex = orderedBlockIds.indexOf(ann.blockId);
    if (currentIndex > 0) {
      const prevBlockId = orderedBlockIds[currentIndex - 1];
      handleUpdate(annotationId, { blockId: prevBlockId, position: 'after' });
      toast.info("Image déplacée vers le haut");
    }
  }, [annotations, orderedBlockIds, handleUpdate]);

  const handleMoveDown = useCallback((annotationId: string) => {
    const ann = annotations.find(a => a.id === annotationId);
    if (!ann) return;

    if (ann.position === 'before') {
      handleUpdate(annotationId, { position: 'after' });
      return;
    }

    // Move to next block
    const currentIndex = orderedBlockIds.indexOf(ann.blockId);
    if (currentIndex >= 0 && currentIndex < orderedBlockIds.length - 1) {
      const nextBlockId = orderedBlockIds[currentIndex + 1];
      handleUpdate(annotationId, { blockId: nextBlockId, position: 'before' });
      toast.info("Image déplacée vers le bas");
    }
  }, [annotations, orderedBlockIds, handleUpdate]);

  // ── Move Annotation to another Block (Drag & Drop) ─────────────────────────
  const handleDropMoveAnnotation = useCallback((annotationId: string, newBlockId: string, newPos: 'before' | 'after') => {
    handleUpdate(annotationId, { blockId: newBlockId, position: newPos });
    toast.success("Image repositionnée !");
  }, [handleUpdate]);

  // ── Paper mode toggle ─────────────────────────────────────────────────────
  const togglePaperMode = () => {
    const newMode = !paperMode;
    setPaperMode(newMode);
    localStorage.setItem('mathsophos_paper_mode', String(newMode));
  };

  // ── File input change handler (from double click) ───────────────────────────
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && fileInputTargetRef.current) {
      createAnnotation(file, fileInputTargetRef.current.blockId, fileInputTargetRef.current.position);
    }
    e.target.value = '';
  };

  // ── Block Zone Component ──────────────────────────────────────────────────
  const BlockZone = useCallback(({ block }: { block: ContentBlock }) => {
    const zoneRef = useRef<HTMLDivElement>(null);
    const [dragOverHalf, setDragOverHalf] = useState<'before' | 'after' | null>(null);

    const getHalf = (e: React.MouseEvent | React.DragEvent): 'before' | 'after' => {
      const el = zoneRef.current;
      if (!el) return 'before';
      const rect = el.getBoundingClientRect();
      return e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    };

    const handleClick = (e: React.MouseEvent) => {
      if (!isAdmin) return;
      const half = getHalf(e);
      setActiveCursor({ blockId: block.id, position: half });
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      if (!isAdmin) return;
      e.stopPropagation();
      const half = getHalf(e);
      fileInputTargetRef.current = { blockId: block.id, position: half };
      fileInputRef.current?.click();
    };

    const onMouseMove = (e: React.MouseEvent) => {
      if (!isAdmin) return;
      const half = getHalf(e);
      hoveredBlockRef.current = { blockId: block.id, position: half };
    };

    const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!isAdmin) return;
      setDragOverHalf(getHalf(e));
    };

    const onDragLeave = () => {
      setDragOverHalf(null);
    };

    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (!isAdmin) return;
      const half = getHalf(e);
      setDragOverHalf(null);

      // Check if this is an existing annotation being dragged
      const existingAnnotationId = e.dataTransfer.getData("text/annotation-id");
      if (existingAnnotationId) {
        handleDropMoveAnnotation(existingAnnotationId, block.id, half);
        return;
      }

      // Or a file dropped from outside
      const file = e.dataTransfer.files?.[0];
      if (file) {
        createAnnotation(file, block.id, half);
      }
    };

    const isCursorHere = activeCursor?.blockId === block.id;

    const before = annotations.filter(a => a.blockId === block.id && a.position === 'before');
    const after  = annotations.filter(a => a.blockId === block.id && a.position === 'after');

    const blockEl = (() => {
      switch (block.type) {
        case 'definition':   return <DefinitionBlock block={block} />;
        case 'theorem': case 'proposition': case 'lemma': case 'corollary':
          return <TheoremBlock block={block} />;
        case 'proof':        return <ProofBlock block={block} />;
        case 'example': case 'application': return <ExampleBlock block={block} />;
        case 'remark': case 'important': case 'warning': return <RemarkBlock block={block} />;
        case 'method':       return <MethodBlock block={block} />;
        case 'exercise':     return <ExerciseBlock block={block} />;
        case 'common_error': return <CommonErrorBlock block={block} />;
        case 'summary':      return <SummaryBlock block={block} />;
        case 'self_evaluation': return <SelfAssessmentBlock block={block} />;
        default: {
          const text = ('content' in block ? (block as any).content : null) || ('statement' in block ? (block as any).statement : null) || '';
          return <div className="my-4 text-foreground/90 font-serif text-base md:text-lg leading-relaxed"><MarkdownRenderer content={text} /></div>;
        }
      }
    })();

    return (
      <div
        ref={zoneRef}
        data-block-id={block.id}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={onMouseMove}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          position: 'relative',
          borderRadius: 6,
          transition: 'all 0.15s ease',
          outline: isAdmin && isCursorHere ? '2px solid #3b82f6' : 'none',
          outlineOffset: 3,
        }}
        title={isAdmin ? "Cliquez pour placer le curseur | Double-cliquez pour ajouter une image | Collez avec Ctrl+V" : undefined}
      >
        {/* Drop indicator: Before */}
        {isAdmin && dragOverHalf === 'before' && (
          <div style={{ height: 4, background: '#2563eb', borderRadius: 2, marginBottom: 6, boxShadow: '0 0 8px #2563eb' }} />
        )}

        {/* Cursor indicator: Before */}
        {isAdmin && isCursorHere && activeCursor?.position === 'before' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', background: '#eff6ff', borderRadius: 4, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>Curseur ici (Ctrl+V ou Glisser)</span>
          </div>
        )}

        {/* Annotations BEFORE */}
        {before.map(ann => (
          <AnnotationImage
            key={ann.id}
            annotation={ann}
            isAdmin={isAdmin}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        ))}

        {/* The block content itself */}
        <div style={{ overflow: 'hidden' }}>{blockEl}</div>

        {/* Annotations AFTER */}
        {after.map(ann => (
          <AnnotationImage
            key={ann.id}
            annotation={ann}
            isAdmin={isAdmin}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        ))}

        {/* Cursor indicator: After */}
        {isAdmin && isCursorHere && activeCursor?.position === 'after' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 8px', background: '#eff6ff', borderRadius: 4, marginTop: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>Curseur ici (Ctrl+V ou Glisser)</span>
          </div>
        )}

        {/* Drop indicator: After */}
        {isAdmin && dragOverHalf === 'after' && (
          <div style={{ height: 4, background: '#2563eb', borderRadius: 2, marginTop: 6, boxShadow: '0 0 8px #2563eb' }} />
        )}

        {/* Clearfix */}
        <div style={{ clear: 'both' }} />
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, isAdmin, activeCursor, handleUpdate, handleDelete, handleMoveUp, handleMoveDown, handleDropMoveAnnotation, createAnnotation]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${paperMode ? 'bg-[#FAF8F5] text-[#2C2825]' : 'bg-background text-foreground'}`}>
      <ReadingProgressBar />

      {/* Hidden file input for double-click uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Floating Action Controls */}
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

        {isAdmin && (
          <div
            title="Cliquez pour placer le curseur, puis Ctrl+V ou glissez une image. Double-cliquez pour choisir un fichier."
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-lg flex items-center gap-2 cursor-pointer transition-all"
            onClick={() => {
              toast.info("1. Cliquez sur n'importe quel paragraphe pour placer le curseur.\n2. Faites Ctrl+V ou glissez une image.\n3. Cliquez sur l'image pour la déplacer, la redimensionner ou la styler comme dans Word.");
            }}
          >
            <ImagePlus className="w-4 h-4" />
            <span>Mode Images Word actif (Ctrl+V / Glisser / Déplacer)</span>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <main className="lg:col-span-9 max-w-4xl mx-auto w-full">
            <TextbookHeader lesson={lesson} />

            {/* Objectives & Prerequisites Banner */}
            {((lesson.metadata.objectives?.length ?? 0) > 0 || (lesson.metadata.prerequisites?.length ?? 0) > 0) && (
              <div className="my-8 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-6 shadow-xs break-inside-avoid">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lesson.metadata.objectives && lesson.metadata.objectives.length > 0 && (
                    <div>
                      <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Objectifs d'apprentissage
                      </h3>
                      <ul className="space-y-1.5 text-sm text-foreground/90 font-serif list-disc pl-5">
                        {lesson.metadata.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
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
                        {lesson.metadata.prerequisites.map((p, i) => <li key={i}>{p}</li>)}
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
                    {section.blocks.map((block) => (
                      <BlockZone key={block.id} block={block} />
                    ))}
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

            {/* Navigation */}
            <div className="mt-14 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-4 print:hidden">
              <Link href="/lessons">
                <Button variant="outline" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /><span>Tous les cours</span>
                </Button>
              </Link>
              <Link href="/exercises">
                <Button className="flex items-center gap-2 bg-primary text-primary-foreground">
                  <span>Voir les séries d'exercices corrigés</span><ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </main>

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
