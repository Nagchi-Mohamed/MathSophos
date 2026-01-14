"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EDUCATION_SYSTEM, Cycle, SEMESTERS } from "@/lib/education-system";
import { EducationalLevel, Stream } from "@/lib/enums";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function ExerciseSearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [cycle, setCycle] = useState<Cycle | "all">(
    (searchParams.get("cycle") as Cycle) || "all"
  );
  const [level, setLevel] = useState<string>(searchParams.get("level") || "all");
  const [stream, setStream] = useState<string>(searchParams.get("stream") || "all");
  const [semester, setSemester] = useState<string>(
    searchParams.get("semester") || "all"
  );
  const [category, setCategory] = useState<string>(
    searchParams.get("category") || "all"
  );
  const [showFilters, setShowFilters] = useState(false);

  // Update state when URL changes
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCycle((searchParams.get("cycle") as Cycle) || "all");
    setLevel(searchParams.get("level") || "all");
    setStream(searchParams.get("stream") || "all");
    setSemester(searchParams.get("semester") || "all");
    setCategory(searchParams.get("category") || "all");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (cycle && cycle !== "all") params.set("cycle", cycle);
    if (level && level !== "all") params.set("level", level);
    if (stream && stream !== "all") params.set("stream", stream);
    if (semester && semester !== "all") params.set("semester", semester);
    if (category && category !== "all") params.set("category", category);

    router.push(`/exercises?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    setCycle("all");
    setLevel("all");
    setStream("all");
    setSemester("all");
    setCategory("all");
    router.push("/exercises");
  };

  // Get available levels based on cycle
  const availableLevels =
    cycle !== "all" && cycle !== "SUPERIEUR"
      ? EDUCATION_SYSTEM[cycle].levels
      : [];

  // Get available streams based on level (only for Lycee)
  const availableStreams =
    cycle === "LYCEE" && level !== "all"
      ? EDUCATION_SYSTEM.LYCEE.levels.find((l) => l.value === level)?.streams ||
      []
      : [];

  // Get available categories (only for Superior)
  const availableCategories =
    cycle === "SUPERIEUR" ? EDUCATION_SYSTEM.SUPERIEUR.categories : [];

  const activeFiltersCount = [
    cycle !== "all",
    level !== "all",
    stream !== "all",
    semester !== "all",
    category !== "all",
  ].filter(Boolean).length;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b dark:border-gray-800 mb-8 sticky top-16 z-10 shadow-sm">
      <div className="container py-4">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un exercice, un problème..."
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Button type="submit">Rechercher</Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg border animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cycle</label>
                <Select
                  value={cycle}
                  onValueChange={(val) => {
                    setCycle(val as Cycle | "all");
                    setLevel("all");
                    setStream("all");
                    setCategory("all");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les cycles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les cycles</SelectItem>
                    <SelectItem value="COLLEGE">Collège</SelectItem>
                    <SelectItem value="LYCEE">Lycée</SelectItem>
                    <SelectItem value="SUPERIEUR">Supérieur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {cycle !== "all" && cycle !== "SUPERIEUR" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Niveau</label>
                  <Select
                    value={level}
                    onValueChange={(val) => {
                      setLevel(val);
                      setStream("all");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les niveaux</SelectItem>
                      {availableLevels.map((lvl) => (
                        <SelectItem key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {cycle === "LYCEE" && level !== "all" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filière</label>
                  <Select value={stream} onValueChange={setStream}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les filières" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les filières</SelectItem>
                      {availableStreams.map((st) => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {cycle !== "SUPERIEUR" && cycle !== "all" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Semestre</label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les semestres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les semestres</SelectItem>
                      {SEMESTERS.map((sem) => (
                        <SelectItem key={sem.value} value={sem.value.toString()}>
                          {sem.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {cycle === "SUPERIEUR" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Matière</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les matières" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les matières</SelectItem>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="col-span-full flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
