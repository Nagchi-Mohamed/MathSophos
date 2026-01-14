"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Ban, Clock } from "lucide-react"
import { deleteForumReply, suspendUser } from "@/actions/reports"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CommentModerationActionsProps {
  replyId: string
  replyAuthorId: string
  replyAuthorName: string
  postId: string
}

export function CommentModerationActions({
  replyId,
  replyAuthorId,
  replyAuthorName,
  postId,
}: CommentModerationActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSuspending, setIsSuspending] = useState(false)

  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce commentaire de ${replyAuthorName} ?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteForumReply(replyId)
      if (result.success) {
        toast.success("Commentaire supprimé", {
          description: "Le commentaire a été supprimé avec succès.",
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
    }
  }

  const handleSuspend = async (duration: "1day" | "7days" | "permanent") => {
    const durationText =
      duration === "1day" ? "1 jour" :
        duration === "7days" ? "7 jours" :
          "permanente"

    if (!confirm(`Êtes-vous sûr de vouloir suspendre ${replyAuthorName} pour ${durationText} ?`)) {
      return
    }

    setIsSuspending(true)
    try {
      const result = await suspendUser(replyAuthorId, duration)
      if (result.success) {
        toast.success("Utilisateur suspendu", {
          description: `${replyAuthorName} a été suspendu pour ${durationText}.`,
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
      setIsSuspending(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isDeleting || isSuspending}>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer le commentaire
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSuspend("1day")}
          disabled={isSuspending}
        >
          <Clock className="w-4 h-4 mr-2" />
          Suspendre 1 jour
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSuspend("7days")}
          disabled={isSuspending}
        >
          <Clock className="w-4 h-4 mr-2" />
          Suspendre 7 jours
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSuspend("permanent")}
          disabled={isSuspending}
          className="text-red-600 focus:text-red-600"
        >
          <Ban className="w-4 h-4 mr-2" />
          Bloquer définitivement
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
