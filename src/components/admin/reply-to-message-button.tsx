"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare } from "lucide-react"
import { replyToReport } from "@/actions/report-replies"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ReplyToMessageButtonProps {
  reportId: string
}

export function ReplyToMessageButton({ reportId }: ReplyToMessageButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!replyContent.trim()) {
      toast.error("Erreur", {
        description: "Veuillez saisir votre réponse.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await replyToReport(reportId, replyContent)
      if (result.success) {
        // Clear content immediately
        setReplyContent("")
        // Close dialog immediately
        setIsOpen(false)
        // Refresh the page to update the reports list
        router.refresh()
        // Show success toast after dialog closes
        setTimeout(() => {
          toast.success("Envoyé", {
            description: "Votre réponse a été envoyée avec succès.",
            duration: 3000,
          })
        }, 100)
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite lors de l'envoi de la réponse.",
        })
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error submitting reply:", error)
      toast.error("Erreur", {
        description: "Une erreur s'est produite lors de l'envoi de la réponse.",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="w-4 h-4 mr-2" />
          Répondre
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Répondre au message</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reply-content">Votre réponse</Label>
            <Textarea
              id="reply-content"
              placeholder="Tapez votre réponse ici..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="mt-2"
              rows={6}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !replyContent.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">⏳</span>
                  Envoi...
                </>
              ) : (
                "Envoyer la réponse"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
