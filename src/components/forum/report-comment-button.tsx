"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { reportForumComment } from "@/actions/reports"

interface ReportCommentButtonProps {
  replyId: string
  replyContent: string
  replyAuthorId: string
  replyAuthorName: string
  postId: string
}

export function ReportCommentButton({
  replyId,
  replyContent,
  replyAuthorId,
  replyAuthorName,
  postId
}: ReportCommentButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)


  const handleSubmit = async () => {
    if (!reportReason.trim()) {
      toast.error("Erreur", {
        description: "Veuillez indiquer la raison du signalement.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await reportForumComment({
        replyId,
        replyContent,
        replyAuthorId,
        replyAuthorName,
        postId,
        reason: reportReason.trim(),
      })

      if (result.success) {
        toast.success("Signalement envoyé", {
          description: "Votre signalement a été envoyé avec succès. Merci pour votre contribution !",
        })
        setReportReason("")
        setIsOpen(false)
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite lors de l'envoi du signalement.",
        })
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur s'est produite lors de l'envoi du signalement.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          Signaler
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Signaler ce commentaire
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="report-reason">Raison du signalement</Label>
            <Textarea
              id="report-reason"
              placeholder="Décrivez pourquoi vous signalez ce commentaire..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
