"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"
import { cleanupOldForumPosts } from "@/actions/forum"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CleanupForumButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleCleanup = async () => {
    setIsLoading(true)
    try {
      const result = await cleanupOldForumPosts()

      if (result.success) {
        const { postsDeleted, filesDeleted, filesFailed } = result.data || {}
        toast.success(
          `Nettoyage terminé: ${postsDeleted} posts supprimés, ${filesDeleted} fichiers supprimés${filesFailed ? ` (${filesFailed} échecs)` : ""
          }`
        )
        setIsOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Erreur lors du nettoyage")
      }
    } catch (error) {
      toast.error("Erreur inattendue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Nettoyer le forum
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nettoyer les anciens posts du forum</AlertDialogTitle>
          <div className="text-sm text-muted-foreground space-y-2">
            <div>
              Cette action va <strong>supprimer définitivement</strong> tous les posts et réponses
              créés il y a <strong>plus d'un mois (30 jours)</strong>.
            </div>
            <div className="text-destructive font-semibold">
              ⚠️ Cela inclut:
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Tous les posts et leurs réponses</li>
              <li>Toutes les réactions associées</li>
              <li>Tous les fichiers images uploadés</li>
            </ul>
            <div className="font-semibold mt-4">
              Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleCleanup()
            }}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Nettoyage...
              </>
            ) : (
              "Confirmer le nettoyage"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
