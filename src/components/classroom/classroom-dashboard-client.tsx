"use client";

import { useState, useMemo } from "react";
import { ClassroomCard } from "@/components/classroom/classroom-card";
import { CreateClassroomDialog } from "@/components/classroom/create-dialog";
import { JoinClassroomDialog } from "@/components/classroom/join-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  School,
  Search,
  Plus,
  Users,
  Video,
  BookOpen,
  Sparkles,
  LayoutGrid,
  List,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Tv,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ClassroomItem {
  id: string;
  name: string;
  section?: string | null;
  subject?: string | null;
  code: string;
  owner: {
    name: string | null;
    image: string | null;
  };
  _count: {
    members: number;
  };
  role: string;
  createdAt: Date;
}

interface ClassroomDashboardClientProps {
  classrooms: ClassroomItem[];
}

export function ClassroomDashboardClient({ classrooms }: ClassroomDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "teacher" | "student">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Metrics
  const teacherCount = useMemo(
    () => classrooms.filter((c) => c.role === "TEACHER").length,
    [classrooms]
  );
  const studentCount = useMemo(
    () => classrooms.filter((c) => c.role === "STUDENT").length,
    [classrooms]
  );

  // Filtered classrooms
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      // Role filter
      if (activeTab === "teacher" && c.role !== "TEACHER") return false;
      if (activeTab === "student" && c.role !== "STUDENT") return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = c.name.toLowerCase().includes(query);
        const subjectMatch = c.subject?.toLowerCase().includes(query) || false;
        const sectionMatch = c.section?.toLowerCase().includes(query) || false;
        const ownerMatch = c.owner.name?.toLowerCase().includes(query) || false;
        return nameMatch || subjectMatch || sectionMatch || ownerMatch;
      }

      return true;
    });
  }, [classrooms, activeTab, searchQuery]);

  return (
    <div className="space-y-8 pb-16">
      {/* 🚀 Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-6 md:p-10 border border-indigo-500/20 shadow-2xl">
        {/* Background ambient lighting glow */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10 mix-blend-overlay pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Plateforme Interactive MathSophos</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Espace Classes & <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300">
                Direct Visioconférence HD
              </span>
            </h1>

            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Gérez vos cours, partagez vos supports, collaborez sur tableau blanc interactif et participez aux sessions en direct avec assistance IA.
            </p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-md">
                <School className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-300 font-medium">Total:</span>
                <span className="text-sm font-bold text-white">{classrooms.length}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-md">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-300 font-medium">Enseignées:</span>
                <span className="text-sm font-bold text-white">{teacherCount}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-md">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-300 font-medium">Rejointes:</span>
                <span className="text-sm font-bold text-white">{studentCount}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <CreateClassroomDialog />
            <JoinClassroomDialog />
          </div>
        </div>
      </div>

      {/* 🔍 Search & Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une classe, matière ou enseignant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3">
          {/* Role Filter Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg text-xs font-semibold px-3 py-1.5">
                Toutes ({classrooms.length})
              </TabsTrigger>
              <TabsTrigger value="teacher" className="rounded-lg text-xs font-semibold px-3 py-1.5">
                Enseignant ({teacherCount})
              </TabsTrigger>
              <TabsTrigger value="student" className="rounded-lg text-xs font-semibold px-3 py-1.5">
                Élève ({studentCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* View Switcher */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-8 w-8 rounded-lg ${viewMode === "grid" ? "bg-white dark:bg-zinc-800 text-primary shadow-xs" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-8 w-8 rounded-lg ${viewMode === "list" ? "bg-white dark:bg-zinc-800 text-primary shadow-xs" : "text-muted-foreground"}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 📚 Classroom Cards Grid / List */}
      {filteredClassrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
            <School className="w-10 h-10" />
          </div>

          <h3 className="text-2xl font-bold text-foreground mb-2">
            {searchQuery ? "Aucune classe ne correspond à votre recherche" : "Aucune classe pour le moment"}
          </h3>

          <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
            {searchQuery
              ? "Essayez de modifier votre mot-clé ou de changer les filtres sélectionnés."
              : "Créez votre première classe si vous êtes enseignant, ou rejoignez une classe avec le code fourni par votre professeur."}
          </p>

          {!searchQuery && (
            <div className="flex flex-wrap justify-center gap-4">
              <JoinClassroomDialog />
              <CreateClassroomDialog />
            </div>
          )}

          {/* Interactive Guide for new users */}
          {!searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mt-12 text-left">
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-foreground">Pour les Enseignants</h4>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>Créez un espace de cours dédié en quelques secondes.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>Partagez le code à 7 caractères avec vos étudiants.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>Lancez des visioconférences en direct avec tableau blanc & quiz.</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-foreground">Pour les Élèves</h4>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Demandez le code unique à votre enseignant.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Rejoignez votre classe et accédez aux annonces et devoirs.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Participez aux cours vidéo interactifs et aux travaux de groupe.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {filteredClassrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              id={classroom.id}
              name={classroom.name}
              section={classroom.section}
              subject={classroom.subject}
              owner={classroom.owner}
              memberCount={classroom._count.members}
              role={classroom.role}
              createdAt={classroom.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
