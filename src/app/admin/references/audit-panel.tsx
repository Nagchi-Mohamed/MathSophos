"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Loader2, Play, CheckCircle, AlertCircle, Sparkles, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { getReviewCandidates, reviewLessonWithAI } from "@/actions/audit"
import { getReferences, extractReferenceContent } from "@/actions/references"

// Constants (Duplicated for availability)
// Constants removed - hardcoded in JSX

export function AuditPanel() {
  const abortRef = useRef(false)

  const stopAudit = () => {
    abortRef.current = true
    setIsProcessing(false)
    toast.info("Arrêt de l'audit demandé...")
  }

  // Filters
  const [level, setLevel] = useState<string>("COLLEGE_1AC")
  const [stream, setStream] = useState<string>("NONE")
  const [semester, setSemester] = useState<string>("ALL")

  // References
  const [allReferences, setAllReferences] = useState<any[]>([])
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([])
  const [useManualReferences, setUseManualReferences] = useState(false)

  // Candidates
  const [candidates, setCandidates] = useState<any[]>([])
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)

  // Process
  const [instructions, setInstructions] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processLogs, setProcessLogs] = useState<any[]>([])
  const [extractingId, setExtractingId] = useState<string | null>(null)

  useEffect(() => {
    loadRefs()
  }, [])

  const loadRefs = async () => {
    const res = await getReferences()
    if (res.success) setAllReferences(res.data || [])
  }

  const handleExtract = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setExtractingId(id)
    toast.info("Analyse du document en cours (IA)... Cela peut prendre une minute.")
    try {
      const res = await extractReferenceContent(id)
      if (res.success) {
        toast.success("Extraction terminée avec succès !")
        await loadRefs()
      } else {
        toast.error("Erreur: " + res.error)
      }
    } catch (err) {
      toast.error("Erreur inattendue")
    }
    setExtractingId(null)
  }

  const findCandidates = async () => {
    if (!level) return toast.error("Veuillez sélectionner un niveau")

    setLoadingCandidates(true)
    const res = await getReviewCandidates({
      level,
      stream: stream === "NONE" ? undefined : stream,
      semester: (semester && semester !== "ALL") ? parseInt(semester) : undefined
    })

    if (res.success) {
      setCandidates(res.lessons || [])
      setSelectedLessonIds(res.lessons?.map((l: any) => l.id) || [])
      toast.success(`${res.count} leçons trouvées pour l'audit`)
    } else {
      toast.error("Erreur lors de la recherche")
    }
    setLoadingCandidates(false)
  }

  const startReviewProcess = async () => {
    // Filter selected lessons
    const lessonsToProcess = candidates.filter(c => selectedLessonIds.includes(c.id));

    if (lessonsToProcess.length === 0) {
      return toast.error("Veuillez sélectionner au moins une leçon.")
    }

    abortRef.current = false

    setIsProcessing(true)
    setProcessLogs([])
    setProgress(0)

    // Manual references filtering
    let refsToUse = selectedReferenceIds
    if (!useManualReferences) {
      // Use existing logic: backend will try to find relevant references or we assume "All matching level"
      // Logic: Pass Filtered References matching the Level?
      // Backend search is better. But user wants controll.
      // Let's default to passing NO IDs (Auto) if manual is false.
      refsToUse = []
    } else {
      if (selectedReferenceIds.length === 0) {
        toast.error("Veuillez sélectionner au moins une référence ou désactiver la sélection manuelle")
        setIsProcessing(false) // Correction: ensure setIsProcessing is set to false
        return
      }
    }

    // Process Loop
    for (let i = 0; i < lessonsToProcess.length; i++) {
      if (abortRef.current) break;
      const lesson = lessonsToProcess[i]

      // Add Pending Log
      setProcessLogs(prev => [...prev, { lessonId: lesson.id, title: lesson.titleFr, status: 'pending', message: 'Démarrage...' }])

      // Execute Review
      let result;
      let attempts = 0;
      const MAX_RETRIES = 5;

      while (attempts < MAX_RETRIES) {
        result = await reviewLessonWithAI(lesson.id, refsToUse, instructions)

        if (result.success) break;

        const isRateLimit = result.error && (
          result.error.toLowerCase().includes("quota") ||
          result.error.toLowerCase().includes("rate limit") ||
          result.error.toLowerCase().includes("429") ||
          result.error.toLowerCase().includes("billed")
        );

        if (isRateLimit && attempts < MAX_RETRIES - 1) {
          // Extract wait time from error message
          let waitTime = 20000; // Default 20s
          const match = result.error.match(/retry in (\d+(\.\d+)?)s/);
          if (match && match[1]) {
            waitTime = Math.ceil(parseFloat(match[1])) * 1000 + 5000; // Wait suggested time + 5s buffer
          }

          // Update Log to show waiting
          setProcessLogs(prev => {
            const newLogs = [...prev]
            const index = newLogs.findIndex(l => l.lessonId === lesson.id)
            if (index !== -1) {
              newLogs[index] = {
                ...newLogs[index],
                message: `Quota dépassé (${Math.round(waitTime / 1000)}s)... (Essai ${attempts + 1}/${MAX_RETRIES})`
              }
            }
            return newLogs
          })

          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempts++;
        } else {
          break; // Other error or max retries reached
        }
      }

      // Update Log Final Status
      if (result) {
        setProcessLogs(prev => {
          const newLogs = [...prev]
          const index = newLogs.findIndex(l => l.lessonId === lesson.id)
          if (index !== -1) {
            newLogs[index] = {
              ...newLogs[index],
              status: result.success ? 'success' : 'error',
              message: result.success ? (result.message || 'Mis à jour') : (result.error || 'Erreur')
            }
          }
          return newLogs
        })
      }

      setProgress(((i + 1) / lessonsToProcess.length) * 100)

      // Artificial delay between lessons to stay under free tier limits (usually 15 RPM)
      if (i < lessonsToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    setIsProcessing(false)
    toast.success("Processus de révision terminé !")
  }

  // Filter references for display if manual
  const availableReferences = allReferences.filter(r => !level || r.levels.includes(level) || r.levels.length === 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Configuration de l'Audit IA
          </CardTitle>
          <CardDescription>
            L'IA va scanner le contenu de chaque leçon et le mettre à jour selon les références sélectionnées.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Niveau *</Label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="COLLEGE_1AC" className="bg-background text-foreground">1ère Année Collège</option>
                <option value="COLLEGE_2AC" className="bg-background text-foreground">2ème Année Collège</option>
                <option value="COLLEGE_3AC" className="bg-background text-foreground">3ème Année Collège</option>
                <option value="LYCEE_TC" className="bg-background text-foreground">Tronc Commun</option>
                <option value="LYCEE_1BAC" className="bg-background text-foreground">1ère Bac</option>
                <option value="LYCEE_2BAC" className="bg-background text-foreground">2ème Bac</option>
                <option value="UNIVERSITY" className="bg-background text-foreground">Université</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Filière</Label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="NONE" className="bg-background text-foreground">Indifférent</option>
                <option value="TC_SCIENCES" className="bg-background text-foreground">TC Sciences</option>
                <option value="TC_LETTRES" className="bg-background text-foreground">TC Lettres</option>
                <option value="SC_MATH_A" className="bg-background text-foreground">Sc. Math A</option>
                <option value="SC_MATH_B" className="bg-background text-foreground">Sc. Math B</option>
                <option value="SC_PHYSIQUE" className="bg-background text-foreground">Sc. Physique</option>
                <option value="SC_VIE_TERRE" className="bg-background text-foreground">SVT</option>
                <option value="SC_ECONOMIE" className="bg-background text-foreground">Eco-Gestion</option>
                <option value="LETTRES_HUMAINES" className="bg-background text-foreground">Lettres</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Semestre</Label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ALL" className="bg-background text-foreground">Tous</option>
                <option value="1" className="bg-background text-foreground">Semestre 1</option>
                <option value="2" className="bg-background text-foreground">Semestre 2</option>
              </select>
            </div>
          </div>

          <Button onClick={findCandidates} disabled={loadingCandidates || !level} className="w-full">
            {loadingCandidates ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Trouver les leçons cibles
          </Button>

          {candidates.length > 0 && (
            <div className="bg-muted p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {candidates.length} Leçons trouvées
                </h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-lessons"
                    checked={selectedLessonIds.length === candidates.length && candidates.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedLessonIds(candidates.map(c => c.id));
                      else setSelectedLessonIds([]);
                    }}
                  />
                  <label htmlFor="select-all-lessons" className="text-sm cursor-pointer hover:underline">Tout ({selectedLessonIds.length})</label>
                </div>
              </div>

              <ScrollArea className="h-48 border rounded-md bg-background p-2">
                {candidates.map(c => (
                  <div key={c.id} className="flex items-center space-x-2 py-1.5 px-1 hover:bg-muted/50 rounded">
                    <Checkbox
                      id={`lesson-${c.id}`}
                      checked={selectedLessonIds.includes(c.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedLessonIds(prev => [...prev, c.id]);
                        else setSelectedLessonIds(prev => prev.filter(id => id !== c.id));
                      }}
                    />
                    <Label htmlFor={`lesson-${c.id}`} className="text-sm cursor-pointer flex-1 flex justify-between items-center">
                      <span>{c.titleFr}</span>
                      <span className="text-xs text-muted-foreground mr-2">{c.stream || 'Commun'}</span>
                    </Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox id="manual-refs" checked={useManualReferences} onCheckedChange={(c) => setUseManualReferences(!!c)} />
              <Label htmlFor="manual-refs">Sélectionner manuellement les références (Recommandé)</Label>
            </div>

            {useManualReferences && (
              <ScrollArea className="h-48 border rounded-md p-2">
                {availableReferences.length === 0 ? <p className="text-sm text-muted">Aucune référence trouvée pour ce niveau.</p> :
                  availableReferences.map(ref => (
                    <div key={ref.id} className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={ref.id}
                        checked={selectedReferenceIds.includes(ref.id)}
                        onCheckedChange={(c) => {
                          if (c) setSelectedReferenceIds([...selectedReferenceIds, ref.id])
                          else setSelectedReferenceIds(selectedReferenceIds.filter(id => id !== ref.id))
                        }}
                      />
                      <Label htmlFor={ref.id} className="cursor-pointer text-sm flex-1">
                        <span className="font-semibold">{ref.title}</span>
                        <Badge variant="outline" className="ml-2 text-[10px]">{ref.types.join(',')}</Badge>
                      </Label>
                      <div className="ml-2">
                        {ref.extractedData ? (
                          <Badge variant="secondary" className="text-green-600 text-xs gap-1">
                            <CheckCircle className="w-3 h-3" /> Structuré
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-50"
                            onClick={(e) => handleExtract(e, ref.id)}
                            disabled={extractingId !== null}
                            title="Extraire le contenu par IA (Smart Audit)"
                          >
                            {extractingId === ref.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                            Analyser
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                }
              </ScrollArea>
            )}

            <div className="space-y-2">
              <Label>Instructions contextuelles (Optionnel)</Label>
              <Textarea
                placeholder="Ex: Concentre-toi sur les définitions formelles. Vérifie que le théorème de Thalès est bien énoncé."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </div>

          {isProcessing ? (
            <Button
              variant="destructive"
              onClick={stopAudit}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6"
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              Arrêter l'Audit (En cours {Math.round(progress)}%)
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={selectedLessonIds.length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-6"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Lancer l'Audit et la Mise à jour IA
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer l'audit</AlertDialogTitle>
                  <AlertDialogDescription>
                    Vous allez lancer la révision de {selectedLessonIds.length} leçons par l'IA. Cette opération peut prendre du temps (+30 secondes par leçon).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={startReviewProcess}>Continuer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {isProcessing && <Progress value={progress} className="h-2" />}

          {processLogs.length > 0 && (
            <div className="space-y-2">
              <Label>Journal d'exécution</Label>
              <ScrollArea className="h-64 border rounded-md p-4 bg-black/5 dark:bg-black/40 font-mono text-xs">
                {processLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-1">
                    {log.status === 'pending' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {log.status === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
                    {log.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                    <span className={log.status === 'error' ? 'text-red-600' : ''}>
                      [{log.title}] : {log.message}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div >
  )
}
