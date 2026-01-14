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
import { deleteForumPost, deleteForumReply } from "@/actions/forum"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DeleteButtonProps {
  type: "post" | "reply"
  id: string
  redirectTo?: string
}

export function DeleteButton({ type, id, redirectTo }: DeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const result = type === "post"
        ? await deleteForumPost(id)
        : await deleteForumReply(id)

      if (result.success) {
        toast.success(type === "post" ? "Sujet supprimé" : "Réponse supprimée")
        setIsOpen(false)
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.refresh()
        }
      } else {
        toast.error(result.error || "Erreur lors de la suppression")
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
        <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Confirmer la suppression
          </AlertDialogTitle>
          <div className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer {type === "post" ? "ce sujet" : "cette réponse"} ? Cette action est irréversible.
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isLoading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
