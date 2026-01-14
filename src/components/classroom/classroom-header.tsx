"use client";

import { Button } from "@/components/ui/button";
import { Settings, Info, Copy, Check } from "lucide-react";
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
    toast.success("Code de la classe copié dans le presse-papiers");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative h-48 md:h-64 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 text-white overflow-hidden shadow-xl animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight shadow-sm drop-shadow-md">
          {classroom.name}
        </h1>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div className="space-y-1">
            <p className="text-blue-100 text-xl font-medium">{classroom.section}</p>
            {classroom.subject && (
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-50 border border-white/10">
                  {classroom.subject}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-4 right-4 flex gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-black/20 text-white hover:bg-white hover:text-blue-600 border border-white/10 hover:border-white shadow-sm backdrop-blur-md transition-all hover:scale-110 rounded-full h-10 w-10 group">
              <Info className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="sr-only">Infos du cours</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Détails de la classe</DialogTitle>
              <DialogDescription>
                Informations sur cette classe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right text-muted-foreground">Matière</span>
                <span className="col-span-3 font-medium">{classroom.subject || "Non spécifié"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-right text-muted-foreground">Section</span>
                <span className="col-span-3 font-medium">{classroom.section || "Général"}</span>
              </div>
              {classroom.currentUserRole === "TEACHER" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium text-right text-muted-foreground">Code</span>
                  <div className="col-span-3 flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{classroom.code}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyCode}>
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {classroom.currentUserRole === "TEACHER" && (
          <Link href={`/classrooms/${classroom.id}/settings`}>
            <Button variant="ghost" size="icon" className="bg-black/20 text-white hover:bg-white hover:text-blue-600 border border-white/10 hover:border-white shadow-sm backdrop-blur-md transition-all hover:scale-110 rounded-full h-10 w-10 group">
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              <span className="sr-only">Paramètres</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
