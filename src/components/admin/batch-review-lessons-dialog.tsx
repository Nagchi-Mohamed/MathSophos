"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Filter,
  Search,
  Play,
  RotateCcw,
  BookOpen,
  Layers,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { getLessonsListForSelector, BatchReviewFilterParams } from "@/actions/ai-reviewer";
import { EDUCATION_SYSTEM } from "@/lib/education-system";
import { EducationalLevel } from "@/lib/enums";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BatchReviewLessonsDialogProps {
  filters?: BatchReviewFilterParams;
}

interface LiveResult {
  id: string;
  title: string;
  type: "lesson" | "chapter" | "series";
  level: string | null;
  stream: string | null;
  semester: string | null;
  success: boolean;
  changesCount: number;
  error?: string;
  keyUsedIndex?: number;
  index: number;
  total: number;
}

interface ProcessingItem {
  id: string;
  title: string;
  type: string;
  level: string | null;
  stream: string | null;
  semester: string | null;
  index: number;
  total: number;
}

interface SavedProgress {
  processedIds: string[];
  results: LiveResult[];
  filterHash: string;
}

function hashFilters(f: Record<string, string>): string {
  return Object.entries(f)
    .filter(([, v]) => v && v !== "ALL")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

export function BatchReviewLessonsDialog({
  filters = {},
}: BatchReviewLessonsDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Selector state
  const [cycle, setCycle] = useState<string>(filters.cycle || "ALL");
  const [level, setLevel] = useState<string>(filters.level || "ALL");
  const [stream, setStream] = useState<string>(filters.stream || "ALL");
  const [semester, setSemester] = useState<string>(
    filters.semester ? String(filters.semester) : "ALL"
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    filters.lessonId || "ALL"
  );
  const [titleQuery, setTitleQuery] = useState<string>("");
  const [availableLessons, setAvailableLessons] = useState<
    { id: string; titleFr: string }[]
  >([]);

  // SSE / processing state
  const [phase, setPhase] = useState<
    "idle" | "processing" | "done" | "error" | "interrupted"
  >("idle");
  const [currentItem, setCurrentItem] = useState<ProcessingItem | null>(null);
  const [results, setResults] = useState<LiveResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ index: number; total: number }>({
    index: 0,
    total: 0,
  });

  // Resume state
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const filterHashRef = useRef<string>("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load lessons for selector
  useEffect(() => {
    async function loadLessons() {
      const res = await getLessonsListForSelector({ cycle, level, stream });
      if (res.success && res.lessons) {
        setAvailableLessons(res.lessons);
      }
    }
    loadLessons();
  }, [cycle, level, stream]);

  // Compute filter hash for resume storage
  useEffect(() => {
    const hash = hashFilters({ cycle, level, stream, semester, lessonId: selectedLessonId, titleQuery });
    filterHashRef.current = hash;

    // Check if there's saved progress for this exact filter combination
    if (typeof window !== "undefined") {
      const key = `batchReview_${hash}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as SavedProgress;
          if (parsed.processedIds.length > 0) {
            setSavedProgress(parsed);
          } else {
            setSavedProgress(null);
          }
        } catch {
          setSavedProgress(null);
        }
      } else {
        setSavedProgress(null);
      }
    }
  }, [cycle, level, stream, semester, selectedLessonId, titleQuery]);

  // Auto-scroll results
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [results, currentItem]);

  const handleCycleChange = (val: string) => {
    setCycle(val);
    setLevel("ALL");
    setStream("ALL");
    setSelectedLessonId("ALL");
  };

  const handleLevelChange = (val: string) => {
    setLevel(val);
    setStream("ALL");
    setSelectedLessonId("ALL");
  };

  const getStreamOptions = () => {
    if (level === "LYCEE_TC") return EDUCATION_SYSTEM.LYCEE.levels[0].streams;
    if (level === "LYCEE_1BAC") return EDUCATION_SYSTEM.LYCEE.levels[1].streams;
    if (level === "LYCEE_2BAC") return EDUCATION_SYSTEM.LYCEE.levels[2].streams;
    return [
      ...EDUCATION_SYSTEM.LYCEE.levels[0].streams,
      ...EDUCATION_SYSTEM.LYCEE.levels[1].streams,
      ...EDUCATION_SYSTEM.LYCEE.levels[2].streams,
    ];
  };

  const getScopeSummaryLabel = () => {
    const parts: string[] = [];
    if (cycle === "ALL") return "Toutes les leçons & chapitres de la plateforme (Global)";
    parts.push(
      cycle === "COLLEGE" ? "Collège" : cycle === "LYCEE" ? "Lycée" : "Supérieur"
    );
    if (level !== "ALL") {
      const lvlLabel =
        EDUCATION_SYSTEM.COLLEGE.levels.find((l) => l.value === level)?.label ||
        EDUCATION_SYSTEM.LYCEE.levels.find((l) => l.value === level)?.label ||
        level;
      parts.push(lvlLabel);
    }
    if (stream !== "ALL") {
      const stLabel =
        getStreamOptions()?.find((s) => s.value === stream)?.label || stream;
      parts.push(stLabel);
    }
    if (semester !== "ALL") {
      parts.push(`Semestre ${semester}`);
    }
    if (selectedLessonId !== "ALL") {
      const sel = availableLessons.find((l) => l.id === selectedLessonId);
      if (sel) parts.push(`"${sel.titleFr}"`);
    } else if (titleQuery) {
      parts.push(`Recherche: "${titleQuery}"`);
    }
    return parts.join(" › ");
  };

  const saveProgressToStorage = useCallback(
    (newResults: LiveResult[], processedIds: string[]) => {
      if (typeof window === "undefined") return;
      const key = `batchReview_${filterHashRef.current}`;
      const data: SavedProgress = {
        processedIds,
        results: newResults,
        filterHash: filterHashRef.current,
      };
      localStorage.setItem(key, JSON.stringify(data));
    },
    []
  );

  const clearSavedProgress = useCallback(() => {
    if (typeof window === "undefined") return;
    const key = `batchReview_${filterHashRef.current}`;
    localStorage.removeItem(key);
    setSavedProgress(null);
  }, []);

  const startReview = useCallback(
    (resumeFrom?: SavedProgress) => {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const initialResults: LiveResult[] = resumeFrom?.results || [];
      const skipIds = resumeFrom?.processedIds || [];

      setPhase("processing");
      setResults(initialResults);
      setCurrentItem(null);
      setErrorMsg(null);
      setSummary(null);
      setProgress({
        index: skipIds.length,
        total: 0,
      });

      // Build query params
      const params = new URLSearchParams();
      if (cycle !== "ALL") params.set("cycle", cycle);
      if (level !== "ALL") params.set("level", level);
      if (stream !== "ALL") params.set("stream", stream);
      if (semester !== "ALL") params.set("semester", semester);
      if (selectedLessonId !== "ALL") params.set("lessonId", selectedLessonId);
      if (titleQuery.trim()) params.set("titleQuery", titleQuery.trim());
      if (skipIds.length > 0) params.set("skip", skipIds.join(","));

      const url = `/api/admin/batch-review?${params.toString()}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      let localResults: LiveResult[] = [...initialResults];
      let processedIds: string[] = [...skipIds];

      es.addEventListener("start", (e) => {
        const data = JSON.parse(e.data);
        setProgress((p) => ({
          ...p,
          total: data.total,
          index: data.alreadyDone || 0,
        }));
      });

      es.addEventListener("processing", (e) => {
        const data = JSON.parse(e.data) as ProcessingItem;
        setCurrentItem(data);
        setProgress({ index: data.index - 1, total: data.total });
      });

      es.addEventListener("progress", (e) => {
        const data = JSON.parse(e.data) as LiveResult;
        localResults = [...localResults, data];
        processedIds = [...processedIds, data.id];
        setResults([...localResults]);
        setCurrentItem(null);
        setProgress({ index: data.index, total: data.total });

        // Persist to localStorage for resume
        saveProgressToStorage(localResults, processedIds);
      });

      es.addEventListener("done", (e) => {
        const data = JSON.parse(e.data);
        setSummary({
          total: data.total,
          successful: data.successful,
          failed: data.failed,
        });
        setPhase("done");
        setCurrentItem(null);
        clearSavedProgress();
        es.close();
        router.refresh();
        toast.success(
          `Révision terminée : ${data.successful}/${data.total} éléments mis à jour !`
        );
      });

      es.addEventListener("error", (e: any) => {
        let msg = "Erreur de connexion avec le serveur.";
        try {
          const data = JSON.parse(e.data);
          msg = data.message || msg;
        } catch {}
        setErrorMsg(msg);
        setPhase("interrupted");
        setCurrentItem(null);
        es.close();

        // Save progress so far
        saveProgressToStorage(localResults, processedIds);
        // Update savedProgress state so resume button shows
        setSavedProgress({
          processedIds,
          results: localResults,
          filterHash: filterHashRef.current,
        });
      });

      // Handle unexpected connection close
      es.onerror = () => {
        if (phase === "processing") {
          setPhase("interrupted");
          setCurrentItem(null);
          es.close();

          saveProgressToStorage(localResults, processedIds);
          setSavedProgress({
            processedIds,
            results: localResults,
            filterHash: filterHashRef.current,
          });
        }
      };
    },
    [cycle, level, stream, semester, selectedLessonId, titleQuery, saveProgressToStorage, clearSavedProgress, router, phase]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const handleDialogClose = (open: boolean) => {
    if (!open && phase === "processing") {
      // User closed dialog while processing — interrupt
      eventSourceRef.current?.close();
      setPhase("interrupted");
    }
    if (!open) {
      // Reset to idle if done or error (not interrupted — preserve resume state)
      if (phase === "done" || phase === "error") {
        setPhase("idle");
        setResults([]);
        setSummary(null);
        setCurrentItem(null);
      }
    }
    setIsOpen(open);
  };

  const progressPercent =
    progress.total > 0 ? Math.round((progress.index / progress.total) * 100) : 0;

  const isRunning = phase === "processing";
  const showSelector = phase === "idle" || phase === "interrupted";
  const showLiveLog = phase === "processing" || phase === "done" || phase === "interrupted";

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 border-purple-200 dark:border-purple-800 shadow-xs font-semibold gap-2 transition-transform hover:scale-105"
        >
          <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
          <span>Revoir toutes les leçons (IA)</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-purple-700 dark:text-purple-400">
            <Wand2 className="w-6 h-6" />
            Révision IA Globale & Sélective des Leçons
          </DialogTitle>
          <DialogDescription className="text-sm">
            Choisissez la portée exacte à réviser (par Cycle, Niveau, Filière, Semestre ou
            Leçon spécifique) : l'IA appliquera le prompt strict de formatage des encadrés
            (
            <code className="text-[10px] bg-muted px-1 rounded">### Définition</code>,{" "}
            <code className="text-[10px] bg-muted px-1 rounded">### Théorème</code>,{" "}
            <code className="text-[10px] bg-muted px-1 rounded">### Exemple</code>,{" "}
            <code className="text-[10px] bg-muted px-1 rounded">Problème:</code>,{" "}
            <code className="text-[10px] bg-muted px-1 rounded">Solution:</code>), les
            notations marocaines adaptées au niveau et la correction LaTeX avec failover
            automatique sur clé API suivante.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* ── Scope Selector ── */}
          {showSelector && (
            <div className="p-4 rounded-xl bg-muted/40 border space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Filter className="w-4 h-4 text-purple-600" />
                <span>Sélectionner la portée de la révision</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Cycle */}
                <div className="space-y-1.5">
                  <Label className="text-xs">1. Cycle</Label>
                  <Select value={cycle} onValueChange={handleCycleChange}>
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder="Tous les cycles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous les cycles</SelectItem>
                      <SelectItem value="COLLEGE">Collège</SelectItem>
                      <SelectItem value="LYCEE">Lycée</SelectItem>
                      <SelectItem value="SUPERIEUR">Supérieur / Université</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Level */}
                <div className="space-y-1.5">
                  <Label className="text-xs">2. Niveau / Classe</Label>
                  <Select
                    value={level}
                    onValueChange={handleLevelChange}
                    disabled={cycle === "SUPERIEUR"}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous les niveaux</SelectItem>
                      {cycle !== "LYCEE" && (
                        <>
                          <SelectItem value={EducationalLevel.COLLEGE_1AC}>
                            1AC (1ère Collège)
                          </SelectItem>
                          <SelectItem value={EducationalLevel.COLLEGE_2AC}>
                            2AC (2ème Collège)
                          </SelectItem>
                          <SelectItem value={EducationalLevel.COLLEGE_3AC}>
                            3AC (3ème Collège)
                          </SelectItem>
                        </>
                      )}
                      {cycle !== "COLLEGE" && (
                        <>
                          <SelectItem value={EducationalLevel.LYCEE_TC}>
                            Tronc Commun
                          </SelectItem>
                          <SelectItem value={EducationalLevel.LYCEE_1BAC}>
                            1ère Bac (1BAC)
                          </SelectItem>
                          <SelectItem value={EducationalLevel.LYCEE_2BAC}>
                            2ème Bac (2BAC)
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stream */}
                <div className="space-y-1.5">
                  <Label className="text-xs">3. Filière</Label>
                  <Select
                    value={stream}
                    onValueChange={setStream}
                    disabled={cycle === "COLLEGE" || cycle === "SUPERIEUR"}
                  >
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder="Toutes les filières" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Toutes les filières</SelectItem>
                      {getStreamOptions()?.map((st) => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Semester */}
                <div className="space-y-1.5">
                  <Label className="text-xs">4. Semestre</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder="Tous les semestres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous les semestres</SelectItem>
                      <SelectItem value="1">Semestre 1</SelectItem>
                      <SelectItem value="2">Semestre 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Specific Lesson / Title Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div className="space-y-1.5">
                  <Label className="text-xs">Leçon spécifique (Optionnel)</Label>
                  <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder="Toutes les leçons de la sélection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Toutes les leçons de la sélection</SelectItem>
                      {availableLessons.map((les) => (
                        <SelectItem key={les.id} value={les.id}>
                          {les.titleFr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Recherche par titre (Optionnel)</Label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Ex: Les suites numériques, Limites..."
                      value={titleQuery}
                      onChange={(e) => setTitleQuery(e.target.value)}
                      className="text-xs h-9 pl-8 bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Active Scope Badge */}
              <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-xs font-mono py-1 px-3 bg-purple-100/80 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                >
                  🎯 Portée active : {getScopeSummaryLabel()}
                </Badge>
              </div>

              {/* Resume banner */}
              {savedProgress && savedProgress.processedIds.length > 0 && phase === "idle" && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      Révision interrompue détectée
                    </p>
                    <p className="text-amber-700 dark:text-amber-400">
                      {savedProgress.processedIds.length} élément
                      {savedProgress.processedIds.length > 1 ? "s" : ""} déjà traité
                      {savedProgress.processedIds.length > 1 ? "s" : ""}. Vous pouvez
                      reprendre depuis où vous vous êtes arrêté.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 text-xs gap-1 shrink-0"
                    onClick={() => {
                      clearSavedProgress();
                    }}
                  >
                    Ignorer
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Interrupted Banner ── */}
          {phase === "interrupted" && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                  Révision interrompue
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  {results.length} élément{results.length > 1 ? "s" : ""} traité
                  {results.length > 1 ? "s" : ""} sur {progress.total}.{" "}
                  {errorMsg && <span className="italic">{errorMsg}</span>}
                </p>
              </div>
            </div>
          )}

          {/* ── Live Processing Log ── */}
          {showLiveLog && (
            <div className="space-y-3">
              {/* Progress bar */}
              {progress.total > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {phase === "processing" && currentItem
                        ? `Traitement en cours : ${currentItem.title}`
                        : phase === "done"
                        ? "Révision terminée !"
                        : "En pause"}
                    </span>
                    <span className="font-mono font-semibold">
                      {progress.index}/{progress.total} ({progressPercent}%)
                    </span>
                  </div>
                  <Progress
                    value={progressPercent}
                    className="h-2"
                  />
                </div>
              )}

              {/* Summary stats (shown when done) */}
              {summary && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">
                      Total
                    </p>
                    <p className="text-2xl font-extrabold">{summary.total}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 uppercase font-semibold">
                      Succès
                    </p>
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {summary.successful}
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900">
                    <p className="text-xs text-rose-700 dark:text-rose-400 uppercase font-semibold">
                      Échecs
                    </p>
                    <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                      {summary.failed}
                    </p>
                  </div>
                </div>
              )}

              {/* Live log */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Rapport en temps réel
                </p>
                <div
                  ref={scrollRef}
                  className="h-64 overflow-y-auto rounded-lg border bg-muted/20 p-2 space-y-1.5 scroll-smooth"
                >
                  {/* Already-done items from resume */}
                  {savedProgress && savedProgress.processedIds.length > 0 && phase === "processing" && results.length === 0 && (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-muted/40 border border-dashed text-xs text-muted-foreground italic">
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {savedProgress.processedIds.length} élément
                        {savedProgress.processedIds.length > 1 ? "s" : ""} déjà traité
                        {savedProgress.processedIds.length > 1 ? "s" : ""} (reprise)
                      </span>
                    </div>
                  )}

                  {results.length === 0 && !currentItem && (
                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                      En attente du début du traitement...
                    </div>
                  )}

                  {results.map((res) => (
                    <ResultRow key={`${res.id}-${res.index}`} result={res} />
                  ))}

                  {/* Currently processing item (live indicator) */}
                  {currentItem && phase === "processing" && (
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs animate-pulse">
                      <Loader2 className="w-4 h-4 text-purple-500 animate-spin shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold truncate block">{currentItem.title}</span>
                        <span className="text-muted-foreground">
                          {[currentItem.level, currentItem.stream, currentItem.semester]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      </div>
                      <span className="text-purple-600 dark:text-purple-400 font-mono shrink-0">
                        IA en cours...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <DialogFooter className="gap-2 sm:gap-2 shrink-0 pt-2 border-t flex-wrap">
          {/* Launch (fresh start) */}
          {(phase === "idle" || phase === "interrupted") && (
            <Button
              onClick={() => startReview()}
              disabled={isRunning}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md gap-2"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>
                {phase === "interrupted"
                  ? "Recommencer depuis le début"
                  : `Lancer la révision (${getScopeSummaryLabel().substring(0, 28)}${getScopeSummaryLabel().length > 28 ? "…" : ""})`}
              </span>
            </Button>
          )}

          {/* Resume button */}
          {(phase === "idle" || phase === "interrupted") &&
            savedProgress &&
            savedProgress.processedIds.length > 0 && (
              <Button
                onClick={() => startReview(savedProgress)}
                disabled={isRunning}
                variant="outline"
                className="border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30 font-semibold gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  Reprendre ({savedProgress.processedIds.length}/{progress.total || "?"}{" "}
                  traités)
                </span>
              </Button>
            )}

          {/* Stop processing */}
          {phase === "processing" && (
            <Button
              onClick={() => {
                eventSourceRef.current?.close();
                setPhase("interrupted");
                setCurrentItem(null);
              }}
              variant="outline"
              className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 gap-2"
            >
              <XCircle className="w-4 h-4" />
              Arrêter
            </Button>
          )}

          {/* Done — close */}
          {phase === "done" && (
            <Button onClick={() => handleDialogClose(false)} variant="default" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Fermer et Actualiser
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({ result }: { result: LiveResult }) {
  const meta = [result.level, result.stream, result.semester]
    .filter(Boolean)
    .join(" • ");

  const typeIcon =
    result.type === "chapter" ? (
      <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
    ) : (
      <BookOpen className="w-3.5 h-3.5 text-violet-400 shrink-0" />
    );

  return (
    <div
      className={`flex items-start gap-2.5 px-2.5 py-2 rounded-md border text-xs transition-all ${
        result.success
          ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
          : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
      }`}
    >
      {result.success ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {typeIcon}
          <span className="font-semibold truncate">{result.title}</span>
        </div>
        {meta && (
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5 flex-wrap">
            {meta.split(" • ").map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-2.5 h-2.5 opacity-40" />}
                {part}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {result.keyUsedIndex !== undefined && result.keyUsedIndex > 0 && (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-[10px] bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded">
            <Key className="w-3 h-3" /> Clé #{result.keyUsedIndex + 1}
          </span>
        )}
        {result.success ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {result.changesCount} correction{result.changesCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span
            className="text-rose-500 max-w-[120px] truncate"
            title={result.error}
          >
            {result.error}
          </span>
        )}
      </div>
    </div>
  );
}
