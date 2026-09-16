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

// ─── HELPER: SPLIT TEXT INTO RESPONSIVE LINES / SEGMENTS ─────────────────────
export function splitTextIntoSegments(rawText: string): string[] {
  if (!rawText) return [];
  // 1. If multiple paragraphs exist (\n\n)
  const paragraphs = rawText.split(/\n\s*\n/).filter(s => s.trim().length > 0);
  if (paragraphs.length > 1) {
    return paragraphs;
  }
  // 2. If multiple newlines exist (\n)
  const lines = rawText.split(/\n+/).filter(s => s.trim().length > 0);
  if (lines.length > 1) {
    return lines;
  }
  // 3. Split by sentence endings (". ") outside of math ($...$)
  const sentences: string[] = [];
  let current = '';
  let inMath = false;

  for (let i = 0; i < rawText.length; i++) {
    const char = rawText[i];
    if (char === '$') {
      inMath = !inMath;
    }
    current += char;
    if (!inMath && char === '.' && rawText[i + 1] === ' ' && /[A-ZÀ-ÖØ-ß]/.test(rawText[i + 2] || '')) {
      sentences.push(current.trim());
      current = '';
      i++; // skip space
    }
  }
  if (current.trim()) {
    sentences.push(current.trim());
  }

  return sentences.length > 1 ? sentences : [rawText];
}

interface TextbookReaderProps {
  lesson: TextbookLesson;
  isAdmin?: boolean;
}

export function TextbookReader({ lesson, isAdmin = false }: TextbookReaderProps) {
  const [paperMode, setPaperMode] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<LessonAnnotation[]>([]);

  // Currently active cursor / selection spot
  const [activeCursor, setActiveCursor] = useState<{ blockId: string; position: string } | null>(null);

  // Active hover and drag-over slots
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const hoveredTargetRef = useRef<{ blockId: string; position: string } | null>(null);

  // Hidden file input for double-click to upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputTargetRef = useRef<{ blockId: string; position: string } | null>(null);

  // Flat list of all block IDs in order
  const orderedBlockIds = useMemo(() => {
    const list: string[] = [];
    lesson.sections.forEach(sec => {
      list.push(`intro-${sec.id}`);
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
    position: string
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

      // Default float: if inserted between lines, center it; otherwise float left
      const isBetweenLines = position.startsWith('line-') && position !== 'line-0';
      const defaultFloat = isBetweenLines ? 'center' : position.startsWith('inside') ? 'right' : 'left';

      const annRes = await fetch("/api/lesson-annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          blockId,
          imageUrl,
          imageId,
          position,
          float: defaultFloat,
          widthPct: isBetweenLines ? 60 : 45
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

      const target = activeCursor || hoveredTargetRef.current;
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
          createAnnotation(file, fallbackId, 'line-0');
        } else {
          toast.info("Cliquez sur le texte ou entre deux lignes où vous souhaitez coller l'image.");
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
      handleUpdate(annotationId, { position: 'line-1' });
      return;
    }
    if (ann.position.startsWith('line-')) {
      const lineNum = parseInt(ann.position.replace('line-', '')) || 0;
      if (lineNum > 0) {
        handleUpdate(annotationId, { position: `line-${lineNum - 1}` });
        return;
      }
      handleUpdate(annotationId, { position: 'before' });
      return;
    }
    if (ann.position.startsWith('inside')) {
      handleUpdate(annotationId, { position: 'before' });
      return;
    }

    // Move to previous block
    const currentIndex = orderedBlockIds.indexOf(ann.blockId);
    if (currentIndex > 0) {
      const prevBlockId = orderedBlockIds[currentIndex - 1];
      handleUpdate(annotationId, { blockId: prevBlockId, position: 'inside' });
      toast.info("Image déplacée vers le bloc précédent");
    }
  }, [annotations, orderedBlockIds, handleUpdate]);

  const handleMoveDown = useCallback((annotationId: string) => {
    const ann = annotations.find(a => a.id === annotationId);
    if (!ann) return;

    if (ann.position === 'before') {
      handleUpdate(annotationId, { position: 'line-0' });
      return;
    }
    if (ann.position.startsWith('line-')) {
      const lineNum = parseInt(ann.position.replace('line-', '')) || 0;
      handleUpdate(annotationId, { position: `line-${lineNum + 1}` });
      return;
    }
    if (ann.position.startsWith('inside')) {
      handleUpdate(annotationId, { position: 'after' });
      return;
    }

    // Move to next block
    const currentIndex = orderedBlockIds.indexOf(ann.blockId);
    if (currentIndex >= 0 && currentIndex < orderedBlockIds.length - 1) {
      const nextBlockId = orderedBlockIds[currentIndex + 1];
      handleUpdate(annotationId, { blockId: nextBlockId, position: 'line-0' });
      toast.info("Image déplacée vers le bloc suivant");
    }
  }, [annotations, orderedBlockIds, handleUpdate]);

  // ── Toggle Inside / Outside ────────────────────────────────────────────────
  const handleToggleInside = useCallback((annotationId: string) => {
    const ann = annotations.find(a => a.id === annotationId);
    if (!ann) return;

    const isInside = ann.position.startsWith('inside') || ann.position.startsWith('line-');
    const newPos = isInside ? 'before' : 'line-0';
    handleUpdate(annotationId, { position: newPos });
    toast.info(newPos.startsWith('line') ? "Image intégrée dans le texte !" : "Image placée au-dessus du texte !");
  }, [annotations, handleUpdate]);

  // ── Move Annotation to another Block or Line (Drag & Drop) ─────────────────
  const handleDropMoveAnnotation = useCallback((annotationId: string, newBlockId: string, newPos: string) => {
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

  // ── Render an individual AnnotationImage ───────────────────────────────────
  const renderAnnotationItem = useCallback((ann: LessonAnnotation) => (
    <AnnotationImage
      key={ann.id}
      annotation={ann}
      isAdmin={isAdmin}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
      onToggleInside={handleToggleInside}
    />
  ), [isAdmin, handleUpdate, handleDelete, handleMoveUp, handleMoveDown, handleToggleInside]);

  // ── Interactive Segmented Text Component (Enables Insertion Between Lines) ─
  const SegmentedText = useCallback(({
    text,
    blockId
  }: {
    text: string;
    blockId: string;
  }) => {
    const segments = useMemo(() => splitTextIntoSegments(text), [text]);

    const handleSlotDrop = (e: React.DragEvent, slotPosition: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverSlot(null);

      const existingAnnotationId = e.dataTransfer.getData("text/annotation-id");
      if (existingAnnotationId) {
        handleDropMoveAnnotation(existingAnnotationId, blockId, slotPosition);
        return;
      }

      const file = e.dataTransfer.files?.[0];
      if (file) {
        createAnnotation(file, blockId, slotPosition);
      }
    };

    return (
      <div className="relative clearfix">
        {segments.map((segment, idx) => {
          const slotPos = `line-${idx}`;
          // Annotations belonging to this slot
          const slotAnnotations = annotations.filter(
            a => a.blockId === blockId && (a.position === slotPos || (idx === 0 && a.position === 'inside'))
          );
          const isCursorHere = activeCursor?.blockId === blockId && (activeCursor.position === slotPos || (idx === 0 && activeCursor.position === 'inside'));
          const isDragOver = dragOverSlot === `${blockId}:${slotPos}`;

          return (
            <React.Fragment key={idx}>
              {/* Slot between lines / before segment */}
              {idx > 0 && isAdmin && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCursor({ blockId, position: slotPos });
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    fileInputTargetRef.current = { blockId, position: slotPos };
                    fileInputRef.current?.click();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverSlot(`${blockId}:${slotPos}`);
                  }}
                  onDragLeave={() => setDragOverSlot(null)}
                  onDrop={(e) => handleSlotDrop(e, slotPos)}
                  className="group my-2.5 py-1.5 cursor-pointer transition-all flex items-center justify-center rounded-md"
                  style={{
                    minHeight: isDragOver ? 28 : 10,
                    border: isDragOver ? '2px dashed #16a34a' : isCursorHere ? '2px solid #16a34a' : '1px dashed transparent',
                    background: isDragOver ? '#f0fdf4' : isCursorHere ? '#f0fdf4' : 'transparent',
                  }}
                  title="Cliquer pour placer le curseur entre ces deux lignes | Ctrl+V pour coller | Glisser une image ici"
                >
                  {(isDragOver || isCursorHere) ? (
                    <span className="text-xs text-green-700 dark:text-green-300 font-semibold px-2.5 py-0.5 bg-green-100 dark:bg-green-950/60 rounded border border-green-300 dark:border-green-800">
                      📍 {isDragOver ? "Déposer l'image entre ces deux lignes" : "Curseur entre ces deux lignes (Ctrl+V pour insérer)"}
                    </span>
                  ) : (
                    <div className="h-0.5 w-full bg-slate-300 dark:bg-slate-700 opacity-0 group-hover:opacity-80 transition-opacity" />
                  )}
                </div>
              )}

              {/* Annotations targeting this line slot */}
              {slotAnnotations.map(renderAnnotationItem)}

              {/* Text of this line / sentence / paragraph */}
              <div
                onClick={(e) => {
                  if (isAdmin) {
                    e.stopPropagation();
                    setActiveCursor({ blockId, position: slotPos });
                  }
                }}
                onDoubleClick={(e) => {
                  if (isAdmin) {
                    e.stopPropagation();
                    fileInputTargetRef.current = { blockId, position: slotPos };
                    fileInputRef.current?.click();
                  }
                }}
                className="relative my-2 leading-relaxed text-foreground/90 font-serif"
              >
                <MarkdownRenderer content={segment} />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }, [annotations, isAdmin, activeCursor, dragOverSlot, renderAnnotationItem, handleDropMoveAnnotation, createAnnotation]);

  // ── Block Zone Component ──────────────────────────────────────────────────
  const BlockZone = useCallback(({ block }: { block: ContentBlock }) => {
    const zoneRef = useRef<HTMLDivElement>(null);
    const [dragOverZone, setDragOverZone] = useState<'before' | 'after' | 'inside' | null>(null);

    const getZone = (e: React.MouseEvent | React.DragEvent): 'before' | 'after' | 'inside' => {
      const el = zoneRef.current;
      if (!el) return 'inside';
      const rect = el.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const height = rect.height;

      if (relativeY < Math.min(32, height * 0.16)) return 'before';
      if (relativeY > Math.max(height - 32, height * 0.84)) return 'after';
      return 'inside';
    };

    const handleClick = (e: React.MouseEvent) => {
      if (!isAdmin) return;
      e.stopPropagation();
      const zone = getZone(e);
      setActiveCursor({ blockId: block.id, position: zone === 'inside' ? 'line-0' : zone });
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      if (!isAdmin) return;
      e.stopPropagation();
      const zone = getZone(e);
      fileInputTargetRef.current = { blockId: block.id, position: zone === 'inside' ? 'line-0' : zone };
      fileInputRef.current?.click();
    };

    const onMouseMove = (e: React.MouseEvent) => {
      if (!isAdmin) return;
      const zone = getZone(e);
      hoveredTargetRef.current = { blockId: block.id, position: zone === 'inside' ? 'line-0' : zone };
    };

    const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!isAdmin) return;
      setDragOverZone(getZone(e));
    };

    const onDragLeave = () => {
      setDragOverZone(null);
    };

    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (!isAdmin) return;
      const zone = getZone(e);
      setDragOverZone(null);
      const pos = zone === 'inside' ? 'line-0' : zone;

      const existingAnnotationId = e.dataTransfer.getData("text/annotation-id");
      if (existingAnnotationId) {
        handleDropMoveAnnotation(existingAnnotationId, block.id, pos);
        return;
      }

      const file = e.dataTransfer.files?.[0];
      if (file) {
        createAnnotation(file, block.id, pos);
      }
    };

    const isCursorHere = activeCursor?.blockId === block.id;

    const beforeAnnotations = annotations.filter(a => a.blockId === block.id && a.position === 'before');
    const afterAnnotations  = annotations.filter(a => a.blockId === block.id && a.position === 'after');

    // Inside segmented body
    const renderBlockContent = () => {
      switch (block.type) {
        case 'definition':
          return (
            <DefinitionBlock block={block}>
              <SegmentedText text={block.statement} blockId={block.id} />
            </DefinitionBlock>
          );
        case 'theorem': case 'proposition': case 'lemma': case 'corollary':
          return (
            <TheoremBlock block={block}>
              <SegmentedText text={block.statement} blockId={block.id} />
            </TheoremBlock>
          );
        case 'proof':
          return (
            <ProofBlock block={block}>
              <SegmentedText text={block.content} blockId={block.id} />
            </ProofBlock>
          );
        case 'example': case 'application':
          return (
            <ExampleBlock block={block}>
              <SegmentedText text={block.problem} blockId={block.id} />
            </ExampleBlock>
          );
        case 'remark': case 'important': case 'warning':
          return (
            <RemarkBlock block={block}>
              <SegmentedText text={block.content} blockId={block.id} />
            </RemarkBlock>
          );
        case 'exercise':
          return (
            <ExerciseBlock block={block}>
              <SegmentedText text={block.statement} blockId={block.id} />
            </ExerciseBlock>
          );
        default: {
          const text = ('content' in block ? (block as any).content : null) || ('statement' in block ? (block as any).statement : null) || '';
          return (
            <div className="my-4 text-foreground/90 font-serif text-base md:text-lg leading-relaxed relative clearfix">
              <SegmentedText text={text} blockId={block.id} />
            </div>
          );
        }
      }
    };

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
          borderRadius: 8,
          transition: 'all 0.15s ease',
          outline: isAdmin && isCursorHere ? '2px solid #3b82f6' : 'none',
          outlineOffset: 3,
        }}
      >
        {/* Drop indicator: Before */}
        {isAdmin && dragOverZone === 'before' && (
          <div style={{ height: 4, background: '#2563eb', borderRadius: 2, marginBottom: 6, boxShadow: '0 0 8px #2563eb' }} />
        )}

        {/* Cursor indicator: Before */}
        {isAdmin && isCursorHere && activeCursor?.position === 'before' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: '#eff6ff', borderRadius: 4, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>↑ Curseur AU-DESSUS de la boîte (Ctrl+V ou Glisser)</span>
          </div>
        )}

        {/* Annotations BEFORE */}
        {beforeAnnotations.map(renderAnnotationItem)}

        {/* The block content itself */}
        <div style={{ overflow: 'hidden' }}>{renderBlockContent()}</div>

        {/* Annotations AFTER */}
        {afterAnnotations.map(renderAnnotationItem)}

        {/* Cursor indicator: After */}
        {isAdmin && isCursorHere && activeCursor?.position === 'after' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: '#eff6ff', borderRadius: 4, marginTop: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>↓ Curseur EN-DESSOUS de la boîte (Ctrl+V ou Glisser)</span>
          </div>
        )}

        {/* Drop indicator: After */}
        {isAdmin && dragOverZone === 'after' && (
          <div style={{ height: 4, background: '#2563eb', borderRadius: 2, marginTop: 6, boxShadow: '0 0 8px #2563eb' }} />
        )}

        {/* Clearfix */}
        <div style={{ clear: 'both' }} />
      </div>
    );
  }, [annotations, isAdmin, activeCursor, renderAnnotationItem, SegmentedText, handleDropMoveAnnotation, createAnnotation]);

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
            title="Cliquez entre deux lignes ou dans une boîte pour insérer une image. Ctrl+V pour coller."
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-lg flex items-center gap-2 cursor-pointer transition-all"
            onClick={() => {
              toast.info("1. Cliquez entre deux lignes de texte ou dans une boîte pour placer le curseur.\n2. Faites Ctrl+V ou glissez une image.\n3. Redimensionnez librement avec les poignées aux bords (la taille reste fixée).\n4. Déplacez l'image d'un paragraphe à un autre en la glissant avec la souris.");
            }}
          >
            <ImagePlus className="w-4 h-4" />
            <span>Mode Images Word Actif (Entre les lignes & Dans les boîtes)</span>
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

                  {/* Section introduction with segmented text support */}
                  {section.introduction && (
                    <div className="mb-6 italic text-muted-foreground font-serif text-base md:text-lg pl-4 border-l-2 border-primary/40 relative">
                      <SegmentedText text={section.introduction} blockId={`intro-${section.id}`} />
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
