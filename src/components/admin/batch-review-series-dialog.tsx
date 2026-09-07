"use client";

import { useState, useEffect } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Wand2, Loader2, CheckCircle2, XCircle, RefreshCw, Key, Dumbbell, Filter, Search } from "lucide-react";
import { batchReviewSeries, BatchReviewFilterParams, BatchItemResult, getLessonsListForSelector } from "@/actions/ai-reviewer";
import { EDUCATION_SYSTEM } from "@/lib/education-system";
import { EducationalLevel } from "@/lib/enums";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BatchReviewSeriesDialogProps {
  filters?: BatchReviewFilterParams;
}

export function BatchReviewSeriesDialog({ filters = {} }: BatchReviewSeriesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchItemResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; successful: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Selector state
  const [cycle, setCycle] = useState<string>(filters.cycle || "ALL");
  const [level, setLevel] = useState<string>(filters.level || "ALL");
  const [stream, setStream] = useState<string>(filters.stream || "ALL");
  const [semester, setSemester] = useState<string>(filters.semester ? String(filters.semester) : "ALL");
  const [selectedLessonId, setSelectedLessonId] = useState<string>(filters.lessonId || "ALL");
  const [titleQuery, setTitleQuery] = useState<string>("");

  const [availableLessons, setAvailableLessons] = useState<{ id: string; titleFr: string }[]>([]);

  // Fetch available lessons when scope changes
  useEffect(() => {
    async function loadLessons() {
      const res = await getLessonsListForSelector({ cycle, level, stream });
      if (res.success && res.lessons) {
        setAvailableLessons(res.lessons);
      }
    }
    loadLessons();
  }, [cycle, level, stream]);

  // Reset dependent filters when parent cycle changes
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

  const handleStartBatchReview = async () => {
    setIsProcessing(true);
    setError(null);
    setResults(null);
    setSummary(null);

    const activeFilters: BatchReviewFilterParams = {
      cycle: cycle !== "ALL" ? cycle : undefined,
      level: level !== "ALL" ? level : undefined,
      stream: stream !== "ALL" ? stream : undefined,
      semester: semester !== "ALL" ? semester : undefined,
      lessonId: selectedLessonId !== "ALL" ? selectedLessonId : undefined,
      titleQuery: titleQuery.trim() ? titleQuery.trim() : undefined,
    };

    try {
      toast.info("Lancement de la révision IA des séries d'exercices...");
      const res = await batchReviewSeries(activeFilters);

      if (res.success) {
        setResults(res.results);
        setSummary({ total: res.totalItems, successful: res.successful, failed: res.failed });
        toast.success(`Révision des séries terminée : ${res.successful}/${res.totalItems} séries corrigées !`);
        router.refresh();
      } else {
        setError(res.error || "Échec lors de la révision IA des séries.");
        toast.error("Erreur lors de la révision des séries");
      }
    } catch (e: any) {
      setError(e.message || "Erreur de connexion avec le serveur.");
      toast.error("Erreur inattendue");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper stream options based on selected level
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

  // Construct label for current selected scope
  const getScopeSummaryLabel = () => {
    const parts: string[] = [];
    if (cycle === "ALL") return "Toutes les séries d'exercices de la plateforme (Global)";
    parts.push(cycle === "COLLEGE" ? "Collège" : cycle === "LYCEE" ? "Lycée" : "Supérieur");

    if (level !== "ALL") {
      const lvlLabel =
        EDUCATION_SYSTEM.COLLEGE.levels.find(l => l.value === level)?.label ||
        EDUCATION_SYSTEM.LYCEE.levels.find(l => l.value === level)?.label ||
        level;
      parts.push(lvlLabel);
    }

    if (stream !== "ALL") {
      const stOpts = getStreamOptions();
      const stLabel = stOpts?.find(s => s.value === stream)?.label || stream;
      parts.push(stLabel);
    }

    if (semester !== "ALL") {
      parts.push(`Semestre ${semester}`);
    }

    if (selectedLessonId !== "ALL") {
      const selectedL = availableLessons.find(l => l.id === selectedLessonId);
      if (selectedL) parts.push(`"${selectedL.titleFr}"`);
    } else if (titleQuery) {
      parts.push(`Recherche: "${titleQuery}"`);
    }

    return parts.join(" > ");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-xs font-semibold gap-2 transition-transform hover:scale-105"
        >
          <Dumbbell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Revoir toutes les séries (IA)</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">
            <Wand2 className="w-6 h-6" />
            Révision IA Globale & Sélective des Séries d'Exercices
          </DialogTitle>
          <DialogDescription className="text-sm">
            Fait relire et vérifier par l'IA les séries d'exercices selon la portée choisie :
            rigueur mathématique des énoncés et solutions, alignement au programme marocain, correction du LaTeX et basculement automatique sur la clé API suivante en cas de quota dépassé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Scope Selector Controls */}
          {!isProcessing && !results && (
            <div className="p-4 rounded-xl bg-muted/40 border space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Sélectionner la portée de la révision des séries</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Cycle Selector */}
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

                {/* 2. Level Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs">2. Niveau / Classe</Label>
                  <Select value={level} onValueChange={handleLevelChange} disabled={cycle === "SUPERIEUR"}>
                    <SelectTrigger className="text-xs h-9 bg-background">
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous les niveaux</SelectItem>
                      {cycle !== "LYCEE" && (
                        <>
                          <SelectItem value={EducationalLevel.COLLEGE_1AC}>1AC (1ère Collège)</SelectItem>
                          <SelectItem value={EducationalLevel.COLLEGE_2AC}>2AC (2ème Collège)</SelectItem>
                          <SelectItem value={EducationalLevel.COLLEGE_3AC}>3AC (3ème Collège)</SelectItem>
                        </>
                      )}
                      {cycle !== "COLLEGE" && (
                        <>
                          <SelectItem value={EducationalLevel.LYCEE_TC}>Tronc Commun</SelectItem>
                          <SelectItem value={EducationalLevel.LYCEE_1BAC}>1ère Bac (1BAC)</SelectItem>
                          <SelectItem value={EducationalLevel.LYCEE_2BAC}>2ème Bac (2BAC)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Stream Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs">3. Filière</Label>
                  <Select value={stream} onValueChange={setStream} disabled={cycle === "COLLEGE" || cycle === "SUPERIEUR"}>
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

                {/* 4. Semester Selector */}
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

              {/* 5. Specific Lesson / Title Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div className="space-y-1.5">
                  <Label className="text-xs">Leçon associée (Optionnel)</Label>
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
                      placeholder="Ex: Séries d'exercices sur les suites..."
                      value={titleQuery}
                      onChange={(e) => setTitleQuery(e.target.value)}
                      className="text-xs h-9 pl-8 bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Active Scope Summary Badge */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <Badge variant="secondary" className="text-xs font-mono py-1 px-3 bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                  🎯 Portée active : {getScopeSummaryLabel()}
                </Badge>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="w-5 h-5" />
              <AlertTitle>Erreur de révision</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="p-8 text-center space-y-4 bg-muted/40 rounded-xl border border-dashed">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
              <div>
                <h4 className="font-bold text-base">Révision des séries d'exercices par l'IA en cours...</h4>
                <p className="text-xs text-muted-foreground mt-1">Audit des énoncés, vérification des solutions mathématiques et correction LaTeX pour :</p>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1">{getScopeSummaryLabel()}</p>
              </div>
              <Progress value={50} className="h-2 w-full max-w-md mx-auto" />
            </div>
          )}

          {summary && results && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Traité</p>
                  <p className="text-2xl font-extrabold text-foreground">{summary.total}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 uppercase font-semibold">Succès</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{summary.successful}</p>
                </div>
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900">
                  <p className="text-xs text-rose-700 dark:text-rose-400 uppercase font-semibold">Échecs</p>
                  <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{summary.failed}</p>
                </div>
              </div>

              <h4 className="text-sm font-bold pt-2">Détail des séries révisées :</h4>
              <ScrollArea className="h-60 rounded-md border p-3">
                <div className="space-y-2">
                  {results.map((res) => (
                    <div key={res.id} className="flex items-center justify-between p-2.5 rounded-lg bg-card border text-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {res.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className="font-semibold truncate">{res.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                        {res.keyUsedIndex !== undefined && res.keyUsedIndex > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-[10px] bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                            <Key className="w-3 h-3" /> Key #{res.keyUsedIndex + 1}
                          </span>
                        )}
                        <span>{res.success ? `${res.changesCount} exercices vérifiés` : res.error}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!results && (
            <Button
              onClick={handleStartBatchReview}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md gap-2"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Lancer la révision de la sélection ({getScopeSummaryLabel().substring(0, 30)}...)</span>
            </Button>
          )}

          {results && (
            <Button onClick={() => setIsOpen(false)} variant="default">
              Fermer et Actualiser
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
