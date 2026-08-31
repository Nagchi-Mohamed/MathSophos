"use client";

import { Button } from "@/components/ui/button";
import { Settings, Info, Copy, Check, Video, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ClassroomHeaderProps {
  classroom: {
    id: string;
    name: string;
    section?: string | null;
    subject?: string | null;
    code: string;
    currentUserRole?: "TEACHER" | "STUDENT" | "ADMIN" | string | null;
  };
}

export function ClassroomHeader({ classroom }: ClassroomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(classroom.code);
    setCopied(true);
    toast.success("Code de la classe copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/classrooms/${classroom.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien de la classe copié !");
  };

  return (
    <div className="relative h-56 md:h-72 rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-purple-800 text-white overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700 border border-white/10">
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-15 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

      {/* Top Action Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Quick Code Badge for Teachers */}
        {classroom.currentUserRole === "TEACHER" && (
          <button
            onClick={copyCode}
            className="hidden sm:flex items-center gap-2 bg-black/40 hover:bg-black/60 text-white px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md text-xs font-mono font-bold transition-all"
            title="Cliquer pour copier le code"
          >
            <span>Code: {classroom.code}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/70" />}
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={copyShareLink}
          className="bg-black/30 text-white hover:bg-white hover:text-blue-600 border border-white/15 backdrop-blur-md rounded-full h-10 w-10 transition-all"
          title="Partager la classe"
        >
          <Share2 className="w-4 h-4" />
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/30 text-white hover:bg-white hover:text-blue-600 border border-white/15 backdrop-blur-md rounded-full h-10 w-10 transition-all"
              title="Détails"
            >
              <Info className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Détails de la classe</DialogTitle>
              <DialogDescription>Informations et accès rapide.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right text-muted-foreground">Classe</span>
                <span className="col-span-3 font-semibold">{classroom.name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right text-muted-foreground">Matière</span>
                <span className="col-span-3 font-medium">{classroom.subject || "Mathématiques"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right text-muted-foreground">Section</span>
                <span className="col-span-3 font-medium">{classroom.section || "Général"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right text-muted-foreground">Code</span>
                <div className="col-span-3 flex items-center gap-2">
                  <code className="bg-muted px-2.5 py-1 rounded-lg font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {classroom.code}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyCode} className="h-8 gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>Copier</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {classroom.currentUserRole === "TEACHER" && (
          <Link href={`/classrooms/${classroom.id}/settings`}>
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/30 text-white hover:bg-white hover:text-blue-600 border border-white/15 backdrop-blur-md rounded-full h-10 w-10 transition-all"
              title="Paramètres"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Main Bottom Banner Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-blue-100 border border-white/15">
              {classroom.subject || "Mathématiques"}
            </span>
            {classroom.section && (
              <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-slate-200 border border-white/10">
                {classroom.section}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg">
            {classroom.name}
          </h1>
        </div>

        {/* 🎥 Direct Live Shortcut Button */}
        <Link href={`/classrooms/${classroom.id}/live`}>
          <Button
            size="lg"
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-red-950/40 border border-red-400/30 rounded-2xl gap-2 hover:scale-105 transition-all"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <Video className="w-5 h-5" />
            <span>Lancer / Rejoindre le Direct HD</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
