"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { GeneratedExam, GeneratedExercise } from "@/actions/exams"
import { ArrowLeft, Download, Printer, RefreshCw, Save, Loader2, Edit2, Check } from "lucide-react"
import { LatexRenderer } from "@/components/latex-renderer"
import { toast } from "sonner"
import MarkdownRenderer from "@/components/markdown-renderer"

interface ExamPreviewProps {
  exam: GeneratedExam
  onBack: () => void
  onSave?: (exam: GeneratedExam) => void
  isSaving?: boolean
  metadata?: {
    streamName?: string
    moduleName?: string
    lessonName?: string
  }
  includeAnswerSpace?: boolean
}

export function ExamPreview({ exam: initialExam, onBack, onSave, isSaving = false, metadata, includeAnswerSpace = true }: ExamPreviewProps) {
  const [exam, setExam] = useState(initialExam)
  const [isEditing, setIsEditing] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Trigger MathJax typesetting when exam content changes (including header)
  // useMathJax([exam.exercises, isEditing, exam.title, exam.subtitle])

  const handlePrint = () => {
    window.print()
  }

  const handleExerciseChange = (index: number, field: keyof GeneratedExercise, value: any) => {
    const newExercises = [...exam.exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setExam({ ...exam, exercises: newExercises })
  }

  const handleTitleChange = (field: keyof GeneratedExam, value: string) => {
    setExam({ ...exam, [field]: value })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Action Bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b shadow-sm no-print">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div className="flex gap-2">
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                {isEditing ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                {isEditing ? "Terminer" : "Éditer"}
              </Button>
              {onSave && (
                <Button onClick={() => onSave(exam)} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Sauvegarder
                </Button>
              )}
              <Button onClick={handlePrint} className="gap-2" variant="secondary">
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
              <Button onClick={async () => {
                try {
                  toast.info("Génération du PDF...");
                  const response = await fetch("/api/pdf/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: 'exam_payload', exam })
                  });
                  if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error || "Erreur PDF");
                  }
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `examen-${exam.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success("PDF téléchargé");
                } catch (e) {
                  console.error(e);
                  toast.error(e instanceof Error ? e.message : "Erreur téléchargement PDF");
                }
              }} className="gap-2" variant="default">
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview */}
      <div className="container py-8">
        <div
          className="bg-card shadow-2xl max-w-[210mm] mx-auto min-h-[297mm] print:shadow-none print:max-w-none print:mx-0"
          ref={printRef}
        >
          {/* Document Content with Padding */}
          <div className="p-12 print:p-[20mm]">
            {/* Header Section */}
            <div className="border-b-4 border-double border-foreground/20 pb-6 mb-8">
              {/* Platform and Professor Info */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">MathSophos</div>
                    <div className="text-sm text-muted-foreground">
                      {process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof:Mohamed Nagchi"}
                    </div>
                  </div>
                </div>
                <div className="text-right text-muted-foreground">
                  <p className="font-semibold">Année Scolaire</p>
                  <p>{new Date().getFullYear()}/{new Date().getFullYear() + 1}</p>
                </div>
              </div>

              {/* Exam Title - Format Marocain */}
              <div className="text-center mb-6">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={exam.title}
                      onChange={(e) => handleTitleChange("title", e.target.value)}
                      className="text-2xl font-bold text-center"
                      placeholder="Titre de l'examen"
                    />
                    <Input
                      value={exam.subtitle}
                      onChange={(e) => handleTitleChange("subtitle", e.target.value)}
                      className="text-lg text-center"
                      placeholder="Sous-titre"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
                      {exam.title}
                    </h1>
                    {exam.subtitle && (
                      <p className="text-xl text-muted-foreground font-semibold">
                        {exam.subtitle}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Metadata (Filière, Module, Lesson, Duration) */}
              <div className="flex flex-wrap justify-center gap-3 mb-4">
                {metadata?.streamName && (
                  <Badge variant="outline" className="px-3 py-1 text-sm">
                    Filière: {metadata.streamName}
                  </Badge>
                )}
                {metadata?.moduleName && (
                  <Badge variant="outline" className="px-3 py-1 text-sm">
                    Module: {metadata.moduleName}
                  </Badge>
                )}
                {metadata?.lessonName && (
                  <Badge variant="outline" className="px-3 py-1 text-sm">
                    Leçon: {metadata.lessonName}
                  </Badge>
                )}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="duration-edit" className="text-sm">Durée:</Label>
                    <Input
                      id="duration-edit"
                      value={exam.duration}
                      onChange={(e) => handleTitleChange("duration", e.target.value)}
                      placeholder="Ex: 1h30min, 2h20min, 1h, 55min"
                      className="h-9 px-3 w-40 text-sm"
                    />
                  </div>
                ) : (
                  <Badge variant="outline" className="px-3 py-1 text-sm">
                    Durée: {exam.duration}
                  </Badge>
                )}
              </div>

            </div>

            {/* Instructions Section - Format Marocain */}
            {exam.instructions && (
              <div className="mb-8 p-4 bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Instructions Générales
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none mb-4 bg-muted/30 p-4 rounded-lg">
                  <LatexRenderer formula={exam.instructions} />
                </div>
              </div>
            )}

            {/* Barème Section - Format Marocain */}
            <div className="mb-6 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Barème : {exam.totalPoints} points
                </p>
                <p className="text-sm text-muted-foreground">
                  Durée : {exam.duration}
                </p>
              </div>
            </div>

            {/* Student Info Section - Only show if answer space is included */}
            {includeAnswerSpace && (
              <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-muted/20 rounded-lg border-2 border-border print:bg-transparent">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Nom et Prénom:</p>
                  <div className="border-b-2 border-dotted border-foreground/30 h-6"></div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Classe:</p>
                  <div className="border-b-2 border-dotted border-foreground/30 h-6"></div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">N°:</p>
                  <div className="border-b-2 border-dotted border-foreground/30 h-6"></div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Note:</p>
                  <div className="border-b-2 border-dotted border-foreground/30 h-6"></div>
                </div>
              </div>
            )}

            {/* Exercises */}
            <div className="space-y-8">
              {exam.exercises.map((exercise, index) => {
                return (
                  <div key={index} className="border-l-4 border-border pl-6 py-4 rounded-r-lg bg-muted/10 print:break-inside-avoid">
                    <div className="flex justify-between items-baseline mb-4 flex-wrap gap-2">
                      {isEditing ? (
                        <Input
                          value={exercise.title}
                          onChange={(e) => handleExerciseChange(index, "title", e.target.value)}
                          className="flex-1 font-bold text-lg min-w-[200px]"
                        />
                      ) : (
                        <h2 className="text-xl font-bold text-foreground">{exercise.title}</h2>
                      )}
                      <div className="flex gap-2 items-center">
                        <Badge className="bg-blue-600 hover:bg-blue-700">
                          {exercise.points} pts
                        </Badge>
                      </div>
                    </div>

                    {isEditing ? (
                      <Textarea
                        value={exercise.problem}
                        onChange={(e) => handleExerciseChange(index, "problem", e.target.value)}
                        className="min-h-[150px] font-mono text-sm"
                      />
                    ) : (
                      <div className="prose prose-slate dark:prose-invert max-w-none text-foreground">
                        <MarkdownRenderer content={exercise.problem} />
                      </div>
                    )}

                    {/* Answer Space */}
                    {exercise.spaceLines && exercise.spaceLines > 0 && !isEditing && (
                      <div className="mt-6 space-y-3">
                        <p className="text-sm text-muted-foreground italic mb-2 font-semibold">Espace pour la réponse :</p>
                        {Array.from({ length: Math.min(exercise.spaceLines, 25) }).map((_, i) => (
                          <div key={i} className="border-b border-dotted border-border h-6"></div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t-2 border-border text-center text-sm text-muted-foreground">
              <p>Bonne chance!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4 portrait;
          }
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print\\:p-8 {
            padding: 2rem !important;
          }
          .print\\:bg-transparent {
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  )
}
