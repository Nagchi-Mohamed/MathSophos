"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteReport } from "@/actions/report-replies"
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

interface DeleteReportButtonProps {
  reportId: string
}

export function DeleteReportButton({ reportId }: DeleteReportButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteReport(reportId)
      if (result.success) {
        toast.success("Message supprimé", {
          description: "Le message a été supprimé avec succès.",
        })
        router.refresh()
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite lors de la suppression.",
        })
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur s'est produite lors de la suppression.",
      })
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Voulez-vous vraiment supprimer ce message ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
