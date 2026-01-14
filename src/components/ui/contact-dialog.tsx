"use client"

import { useState } from "react"
import { Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitReport } from "@/actions/reports"
import { toast } from "sonner"

interface ContactDialogProps {
  trigger?: React.ReactNode
  children?: React.ReactNode
}

export function ContactDialog({ trigger, children }: ContactDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content || !content.trim()) {
      toast.error("Erreur", {
        description: "Veuillez saisir votre message.",
      })
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)
    const messageToSend = content.trim()

    try {
      const result = await submitReport({
        type: "CONTACT",
        content: messageToSend,
        pageType: "general",
        entityId: undefined,
        entityTitle: undefined,
        url: typeof window !== "undefined" ? window.location.href : "",
        path: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
      })

      if (result.success) {
        setContent("")
        toast.success("Message envoyé avec succès !", {
          description: "Nous vous répondrons dans les plus brefs délais.",
        })
        setIsOpen(false)
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite lors de l'envoi du message.",
        })
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur s'est produite lors de l'envoi du message.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setContent("")
      }
    }}>
      <DialogTrigger asChild>
        {trigger || children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
        if (isSubmitting) {
          e.preventDefault()
        }
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            Contacter nous
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="contact-content">Votre message</Label>
            <Textarea
              id="contact-content"
              placeholder="Comment pouvons-nous vous aider ?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2"
              rows={4}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                setContent("")
              }}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
