"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  MoreVertical,
  Trash2,
  LogOut,
  Pencil,
  Video,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { deleteClassroom, leaveClassroom } from "@/actions/classroom";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClassroomCardProps {
  id: string;
  name: string;
  section?: string | null;
  subject?: string | null;
  owner: {
    name: string | null;
    image: string | null;
  };
  memberCount: number;
  role: string;
  createdAt: Date;
}

// Map subject/id to rich color gradients
const GRADIENT_PRESETS = [
  "from-indigo-600 via-blue-600 to-violet-700",
  "from-emerald-600 via-teal-600 to-cyan-700",
  "from-rose-600 via-pink-600 to-purple-700",
  "from-amber-600 via-orange-600 to-red-700",
  "from-blue-600 via-indigo-600 to-sky-700",
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PRESETS.length;
  return GRADIENT_PRESETS[index];
}

export function ClassroomCard({
  id,
  name,
  section,
  subject,
  owner,
  memberCount,
  role,
  createdAt,
}: ClassroomCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);

  const gradientClass = getGradient(id);

  const handleDelete = async () => {
    try {
      startTransition(async () => {
        await deleteClassroom(id);
        toast.success("Classe supprimée avec succès");
      });
    } catch (error) {
      toast.error("Impossible de supprimer la classe");
    }
  };

  const handleLeave = async () => {
    try {
      startTransition(async () => {
        await leaveClassroom(id);
        toast.success("Vous vous êtes désinscrit de la classe");
      });
    } catch (error) {
      toast.error("Impossible de se désinscrire");
    }
  };

  return (
    <>
      <Card className="group hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden rounded-2xl relative border">
        {/* Banner Header */}
        <div className={`h-32 bg-gradient-to-br ${gradientClass} p-5 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 origin-top`}>
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1 max-w-[80%]">
              <Link href={`/classrooms/${id}`}>
                <h3 className="text-2xl font-black text-white truncate leading-tight tracking-tight hover:underline">
                  {name}
                </h3>
              </Link>
              {section && (
                <p className="text-blue-100 text-xs font-semibold tracking-wide uppercase opacity-90">
                  {section}
                </p>
              )}
            </div>

            {/* Actions Menu */}
            <div className="relative z-20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 rounded-full backdrop-blur-md transition-transform active:scale-95"
                  >
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Options de classe</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={`/classrooms/${id}`} className="flex w-full items-center">
                      <BookOpen className="mr-2 h-4 w-4 text-blue-500" /> Accéder au Flux
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href={`/classrooms/${id}/live`} className="flex w-full items-center">
                      <Video className="mr-2 h-4 w-4 text-red-500" /> Direct Visioconférence
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {role === "TEACHER" ? (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href={`/classrooms/${id}/settings`} className="flex w-full items-center">
                          <Pencil className="mr-2 h-4 w-4" /> Paramètres
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                        onSelect={(e) => {
                          e.preventDefault();
                          setShowDeleteAlert(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer la classe
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowLeaveAlert(true);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Se désinscrire
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Owner Avatar Badge */}
          <div className="absolute -bottom-6 right-5 z-10 flex items-center">
            <Avatar className="h-13 w-13 border-4 border-white dark:border-zinc-900 shadow-lg group-hover:scale-105 transition-transform">
              <AvatarImage src={owner.image || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-base">
                {owner.name?.[0]?.toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Content Body */}
        <CardHeader className="pt-8 pb-3 px-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
              {subject || "Mathématiques"}
            </Badge>

            {role === "TEACHER" ? (
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-0.5 shadow-xs">
                PROFESSEUR
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground border-zinc-300 dark:border-zinc-700">
                ÉLÈVE
              </Badge>
            )}
          </div>

          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 pt-1">
            <span className="text-muted-foreground text-xs font-normal">Par:</span>
            <span className="truncate">{owner.name || "Enseignant MathSophos"}</span>
          </div>
        </CardHeader>

        <CardContent className="flex-grow px-5 py-2">
          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href={`/classrooms/${id}`}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>Voir le Flux</span>
            </Link>

            <Link
              href={`/classrooms/${id}/live`}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/40 transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Direct Live</span>
            </Link>
          </div>
        </CardContent>

        {/* Card Footer */}
        <CardFooter className="pt-3 pb-4 px-5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-muted-foreground bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            <span>{memberCount} membre{memberCount > 1 ? "s" : ""}</span>
          </div>

          <div className="text-[10px] text-zinc-400 font-medium">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: fr })}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              <span>Supprimer la classe ?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. La classe <strong className="text-foreground">{name}</strong> ainsi que l'ensemble des devoirs, notes et annonces seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
              {isPending ? "Suppression en cours..." : "Supprimer la classe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation Alert */}
      <AlertDialog open={showLeaveAlert} onOpenChange={setShowLeaveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Se désinscrire de la classe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir quitter <strong className="text-foreground">{name}</strong> ? Vous ne pourrez plus accéder aux annonces ni rendre de devoirs dans cette classe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900">
              {isPending ? "Désinscription..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
