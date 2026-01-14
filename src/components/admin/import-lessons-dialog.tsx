"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Loader2, BookOpen, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  getAvailableStreams,
  getStreamLessons,
  importLessonsToStream,
  type StreamInfo,
  type LessonImportCandidate
} from "@/actions/lesson-import"
import { Badge } from "@/components/ui/badge"

interface ImportLessonsDialogProps {
  targetStreamId: string
  targetModuleId?: string
  targetStreamName?: string
}

export function ImportLessonsDialog({
  targetStreamId,
  targetModuleId,
  targetStreamName
}: ImportLessonsDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Data
  const [availableStreams, setAvailableStreams] = useState<StreamInfo[]>([])
  const [sourceLessons, setSourceLessons] = useState<LessonImportCandidate[]>([])

  // Selection
  const [selectedStreamId, setSelectedStreamId] = useState<string>("")
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([])

  // State
  const [isLoadingStreams, setIsLoadingStreams] = useState(false)
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number, failed: number } | null>(null)

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setStep(1)
      setSelectedStreamId("")
      setSelectedLessonIds([])
      setImportResult(null)
      fetchStreams()
    }
  }, [open])

  const fetchStreams = async () => {
    setIsLoadingStreams(true)
    try {
      const result = await getAvailableStreams()
      if (result.success && result.data) {
        // Filter out current stream to prevent importing from self
        setAvailableStreams(result.data.filter(s => s.id !== targetStreamId))
      } else {
        toast.error("Impossible de charger les filières")
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des filières")
    } finally {
      setIsLoadingStreams(false)
    }
  }

  const handleStreamSelect = async (streamId: string) => {
    setSelectedStreamId(streamId)
    setIsLoadingLessons(true)
    try {
      const result = await getStreamLessons(streamId)
      if (result.success && result.data) {
        setSourceLessons(result.data)
        setStep(2)
      } else {
        toast.error("Impossible de charger les leçons")
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des leçons")
    } finally {
      setIsLoadingLessons(false)
    }
  }

  const toggleLesson = (lessonId: string) => {
    setSelectedLessonIds(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    )
  }

  const toggleAll = () => {
    if (selectedLessonIds.length === sourceLessons.length) {
      setSelectedLessonIds([])
    } else {
      setSelectedLessonIds(sourceLessons.map(l => l.id))
    }
  }

  const handleImport = async () => {
    if (selectedLessonIds.length === 0) return

    setIsImporting(true)
    try {
      const result = await importLessonsToStream({
        sourceStreamId: selectedStreamId,
        targetStreamId: targetStreamId,
        lessonIds: selectedLessonIds,
        targetModuleId
      })

      if (result.success && result.data) {
        setImportResult({
          imported: result.data.imported,
          failed: result.data.failed
        })
        setStep(3)
        toast.success(`${result.data.imported} leçons importées avec succès`)
      } else {
        toast.error(result.error || "Erreur lors de l'importation")
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Importer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importer des leçons</DialogTitle>
          <DialogDescription>
            Copiez des leçons d'une autre filière vers {targetStreamName || "la filière actuelle"}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {/* STEP 1: SELECT STREAM */}
          {step === 1 && (
            <div className="space-y-4">
              <Label>Sélectionnez la filière source</Label>
              {isLoadingStreams ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid gap-2">
                  {availableStreams.map((stream) => (
                    <Button
                      key={stream.id}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4 text-left"
                      onClick={() => handleStreamSelect(stream.id)}
                    >
                      <div>
                        <div className="font-medium">{stream.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[400px]">
                          {stream.description || "Aucune description"}
                        </div>
                      </div>
                    </Button>
                  ))}
                  {availableStreams.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune autre filière disponible
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SELECT LESSONS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  ← Retour
                </Button>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedLessonIds.length === sourceLessons.length && sourceLessons.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer">Tout sélectionner</Label>
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-md p-4">
                <div className="space-y-3">
                  {sourceLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-start gap-3 p-3 rounded-md border hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`lesson-${lesson.id}`}
                        checked={selectedLessonIds.includes(lesson.id)}
                        onCheckedChange={() => toggleLesson(lesson.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={`lesson-${lesson.id}`}
                          className="font-medium cursor-pointer block text-base"
                        >
                          {lesson.titleFr}
                        </Label>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="secondary" className="gap-1 font-normal">
                            <BookOpen className="h-3 w-3" />
                            {lesson.chaptersCount} chapitres
                          </Badge>
                          <Badge variant="secondary" className="gap-1 font-normal">
                            <FileText className="h-3 w-3" />
                            {lesson.seriesCount} séries
                          </Badge>
                          <Badge variant="secondary" className="gap-1 font-normal">
                            <CheckCircle2 className="h-3 w-3" />
                            {lesson.exercisesCount} exercices
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sourceLessons.length === 0 && (
                    <p className="text-center text-muted-foreground py-10">
                      Aucune leçon trouvée dans cette filière
                    </p>
                  )}
                </div>
              </ScrollArea>

              <div className="text-sm text-muted-foreground text-center">
                {selectedLessonIds.length} leçons sélectionnées
              </div>
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === 3 && importResult && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
              <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Importation terminée !</h3>
                <p className="text-muted-foreground mt-2">
                  <span className="font-medium text-foreground">{importResult.imported}</span> leçons ont été importées avec succès.
                  {importResult.failed > 0 && (
                    <span className="block text-red-500 mt-1">
                      {importResult.failed} échecs rencontrés.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          {step === 1 && (
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          )}
          {step === 2 && (
            <Button
              onClick={handleImport}
              disabled={selectedLessonIds.length === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importation...
                </>
              ) : (
                `Importer ${selectedLessonIds.length > 0 ? `(${selectedLessonIds.length})` : ''}`
              )}
            </Button>
          )}
          {step === 3 && (
            <Button onClick={() => setOpen(false)}>Terminer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
