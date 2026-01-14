"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MoreVertical, Trash2, LogOut, Pencil } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { deleteClassroom, leaveClassroom } from "@/actions/classroom";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
import { useState } from "react";

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

  const handleDelete = async () => {
    try {
      startTransition(async () => {
        await deleteClassroom(id);
        toast.success("Classroom deleted successfully");
      });
    } catch (error) {
      toast.error("Failed to delete classroom");
    }
  };

  const handleLeave = async () => {
    try {
      startTransition(async () => {
        await leaveClassroom(id);
        toast.success("Left classroom successfully");
      });
    } catch (error) {
      toast.error("Failed to leave classroom");
    }
  };

  return (
    <>
      <Card className="group hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden rounded-xl relative">
        <Link href={`/classrooms/${id}`} className="absolute inset-0 z-0" aria-label={`Go to ${name}`} />

        <div className="h-28 bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-600 p-5 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 origin-top">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1 max-w-[85%]">
              <h3 className="text-2xl font-bold text-white truncate leading-tight tracking-tight">
                {name}
              </h3>
              {section && <p className="text-blue-100 text-sm font-medium opacity-90">{section}</p>}
            </div>

            <div className="relative z-20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full focus:ring-0">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Ouvrir le menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                  <DropdownMenuLabel>Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {role === "TEACHER" ? (
                    <>
                      <DropdownMenuItem className="cursor-pointer">
                        <Link href={`/classrooms/${id}/settings`} className="flex w-full items-center">
                          <Pencil className="mr-2 h-4 w-4" /> Modifier la classe
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                        onSelect={(e) => { e.preventDefault(); setShowDeleteAlert(true); }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer la classe
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                      onSelect={(e) => { e.preventDefault(); setShowLeaveAlert(true); }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Se désinscrire
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="absolute -bottom-6 right-6 z-10">
            <Avatar className="h-14 w-14 border-4 border-white dark:border-zinc-900 shadow-md">
              <AvatarImage src={owner.image || ""} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-lg">
                {owner.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <CardHeader className="pt-10 pb-4 px-5">
          <div className="min-h-[3rem]">
            <CardDescription className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
              {subject || "Classification générale"}
            </CardDescription>
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 line-clamp-1">
              {owner.name}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow pb-4 px-5">
        </CardContent>

        <CardFooter className="pt-3 pb-5 px-5 border-t border-zinc-100 dark:border-zinc-800/50 flex justify-end gap-2 text-muted-foreground text-xs bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center text-zinc-500" title="Créé">
              <span className="text-[10px]">{formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: fr })}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400" title="Membres">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium">{memberCount}</span>
              </div>

              {role === "TEACHER" && (
                <Badge variant="secondary" className="text-[10px] px-2 h-5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800">
                  ENSEIGNANT
                </Badge>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement la classe
              <span className="font-bold text-foreground"> {name} </span>
              et toutes les données associées, y compris les devoirs et les notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {isPending ? "Suppression..." : "Supprimer la classe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showLeaveAlert} onOpenChange={setShowLeaveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Se désinscrire de la classe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir vous désinscrire de
              <span className="font-bold text-foreground"> {name}</span>?
              Vous perdrez l'accès à tous les devoirs et supports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave}>
              {isPending ? "Désinscription..." : "Se désinscrire"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
