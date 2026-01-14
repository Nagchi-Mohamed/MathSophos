"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { clearInbox } from "@/actions/report-replies"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ClearInboxButton() {
  const [isClearing, setIsClearing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const router = useRouter()

  const handleClear = async () => {
    setIsClearing(true)
    try {
      const result = await clearInbox()
      if (result.success) {
        toast.success("Inbox nettoyée", {
          description: result.count ? `Tous les messages (${result.count}) ont été supprimés.` : "Tous les messages ont été supprimés.",
        })
        router.refresh()
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite lors du nettoyage.",
        })
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur s'est produite lors du nettoyage.",
      })
    } finally {
      setIsClearing(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isClearing}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {isClearing ? "Nettoyage..." : "Nettoyer l'inbox"}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Attention !</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer TOUS les messages de l'inbox (résolus et non résolus) ?
              Cette action est irréversible et supprimera tout le contenu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-red-600 hover:bg-red-700">
              {isClearing ? "Nettoyage..." : "Tout supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
