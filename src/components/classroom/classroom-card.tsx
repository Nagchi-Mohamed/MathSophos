"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
  ShieldAlert,
  GraduationCap,
  Clock,
  UserCheck
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

// Rich gradient themes
const GRADIENT_PRESETS = [
  "from-indigo-600 via-blue-600 to-purple-700",
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
      <Card className="group hover:shadow-2xl hover:border-indigo-500/40 transition-all duration-300 flex flex-col h-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md overflow-hidden rounded-3xl relative">
        {/* Banner Header */}
        <div className={`h-36 bg-gradient-to-br ${gradientClass} p-5 relative overflow-hidden group-hover:scale-[1.01] transition-transform duration-500 origin-top flex flex-col justify-between`}>
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

          {/* Top Bar: Subject Badge + Role Badge + Menu */}
          <div className="relative z-10 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white border border-white/20 shadow-xs">
                {subject || "Mathématiques"}
              </span>
              {section && (
                <span className="bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-medium text-blue-100 border border-white/10 hidden sm:inline">
                  {section}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {role === "TEACHER" ? (
                <span className="bg-emerald-500/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wide">
                  PROFESSEUR
                </span>
              ) : (
                <span className="bg-black/40 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/15 uppercase tracking-wide">
                  ÉLÈVE
                </span>
              )}

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/25 rounded-full backdrop-blur-md transition-all active:scale-95 border border-white/10"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl p-1.5">
                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">Menu classe</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                    <Link href={`/classrooms/${id}`} className="flex w-full items-center px-2 py-2">
                      <BookOpen className="mr-2.5 h-4 w-4 text-blue-500" /> Flux & Devoirs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                    <Link href={`/classrooms/${id}/live`} className="flex w-full items-center px-2 py-2">
                      <Video className="mr-2.5 h-4 w-4 text-rose-500" /> Visioconférence HD
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {role === "TEACHER" ? (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                        <Link href={`/classrooms/${id}/settings`} className="flex w-full items-center px-2 py-2">
                          <Pencil className="mr-2.5 h-4 w-4" /> Paramètres
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 rounded-xl px-2 py-2"
                        onSelect={(e) => {
                          e.preventDefault();
                          setShowDeleteAlert(true);
                        }}
                      >
                        <Trash2 className="mr-2.5 h-4 w-4" />
                        Supprimer la classe
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40 rounded-xl px-2 py-2"
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowLeaveAlert(true);
                      }}
                    >
                      <LogOut className="mr-2.5 h-4 w-4" />
                      Se désinscrire
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Class Name */}
          <div className="relative z-10 pt-2">
            <Link href={`/classrooms/${id}`}>
              <h3 className="text-2xl md:text-3xl font-black text-white truncate leading-tight tracking-tight hover:underline drop-shadow-md">
                {name}
              </h3>
            </Link>
          </div>
        </div>

        {/* Card Body */}
        <CardContent className="flex-grow p-5 space-y-4">
          {/* Teacher Info Pill */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
            <Avatar className="h-10 w-10 border-2 border-indigo-500/40 shadow-sm shrink-0">
              <AvatarImage src={owner.image || ""} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-sm">
                {owner.name?.[0]?.toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Enseignant
              </p>
              <p className="text-sm font-bold text-foreground truncate">
                {owner.name || "Professeur MathSophos"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Link href={`/classrooms/${id}`} className="block">
              <Button
                variant="default"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-blue-500/10 rounded-xl h-10 text-xs gap-1.5 group/btn"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Voir le Flux</span>
                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </Button>
            </Link>

            <Link href={`/classrooms/${id}/live`} className="block">
              <Button
                variant="secondary"
                className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-md shadow-red-500/10 rounded-xl h-10 text-xs gap-1.5 group/btn border-0"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <Video className="w-3.5 h-3.5" />
                <span>Direct Live</span>
              </Button>
            </Link>
          </div>
        </CardContent>

        {/* Card Footer */}
        <CardFooter className="py-3.5 px-5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-muted-foreground bg-zinc-50/50 dark:bg-zinc-900/60">
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-semibold">
            <Users className="h-4 w-4 text-blue-500" />
            <span>{memberCount} membre{memberCount > 1 ? "s" : ""}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
            <Clock className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: fr })}</span>
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
              {isPending ? "Suppression..." : "Supprimer la classe"}
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
