"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { deleteSeries } from "@/actions/series";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteSeriesButtonProps {
  seriesId: string;
  seriesTitle: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function DeleteSeriesButton({ seriesId, seriesTitle, size = "icon" }: DeleteSeriesButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteSeries(seriesId);
      if (result.success) {
        toast.success("Série supprimée avec succès");
        router.push("/admin/exercises/series");
        router.refresh();
      } else {
        toast.error("Erreur lors de la suppression : " + result.error);
      }
    } catch (e) {
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={size} disabled={loading}>
          <Trash className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes‑vous sûr de vouloir supprimer la série <strong>{" "}{seriesTitle}{" "}</strong> ? Cette action est irréversible et supprimera tous les exercices associés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
