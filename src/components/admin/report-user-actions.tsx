"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Ban, Clock, Trash2, UserX } from "lucide-react"
import { suspendUserFromReports, unsuspendUserFromReports, deleteUser } from "@/actions/reports"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ReportUserActionsProps {
  userId: string
  userName: string
  userEmail?: string
}

export function ReportUserActions({
  userId,
  userName,
  userEmail,
}: ReportUserActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const router = useRouter()

  const handleSuspendReports = async (duration: "1day" | "7days" | "permanent") => {
    const durationText =
      duration === "1day" ? "1 jour" :
        duration === "7days" ? "7 jours" :
          "permanente"

    if (!confirm(`Êtes-vous sûr de vouloir suspendre ${userName} de l'envoi de signalements pour ${durationText} ?`)) {
      return
    }

    setIsProcessing(true)
    try {
      const result = await suspendUserFromReports(userId, duration)
      if (result.success) {
        toast.success("Utilisateur suspendu", {
          description: `${userName} ne peut plus envoyer de signalements pour ${durationText}.`,
        })
        router.refresh()
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite lors de la suspension.",
        })
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur s'est produite lors de la suspension.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUnsuspendReports = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir lever la suspension de ${userName} pour l'envoi de signalements ?`)) {
      return
    }

    setIsProcessing(true)
    try {
      const result = await unsuspendUserFromReports(userId)
      if (result.success) {
        toast.success("Suspension levée", {
          description: `${userName} peut maintenant envoyer des signalements à nouveau.`,
        })
        router.refresh()
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite lors de la levée de la suspension.",
        })
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur s'est produite lors de la levée de la suspension.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!confirm(`⚠️ ATTENTION: Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT l'utilisateur ${userName} (${userEmail || userId}) ?\n\nCette action est irréversible et supprimera toutes les données associées à cet utilisateur.`)) {
      return
    }

    setIsProcessing(true)
    try {
      const result = await deleteUser(userId)
      if (result.success) {
        toast.success("Utilisateur supprimé", {
          description: `L'utilisateur ${userName} a été supprimé avec succès.`,
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
      setIsProcessing(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isProcessing}>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleSuspendReports("1day")}
          disabled={isProcessing}
        >
          <Clock className="w-4 h-4 mr-2" />
          Suspendre l'envoi de signalements (1 jour)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSuspendReports("7days")}
          disabled={isProcessing}
        >
          <Clock className="w-4 h-4 mr-2" />
          Suspendre l'envoi de signalements (7 jours)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSuspendReports("permanent")}
          disabled={isProcessing}
          className="text-orange-600 focus:text-orange-600"
        >
          <Ban className="w-4 h-4 mr-2" />
          Bloquer définitivement l'envoi de signalements
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleUnsuspendReports}
          disabled={isProcessing}
        >
          <UserX className="w-4 h-4 mr-2" />
          Lever la suspension
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDeleteUser}
          disabled={isProcessing}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer l'utilisateur
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
