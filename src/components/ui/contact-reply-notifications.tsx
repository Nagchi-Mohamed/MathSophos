"use client"

import { useState, useEffect } from "react"
import { Bell, X, Mail, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { getUserUnreadReplies, markReplyAsRead, deleteReply } from "@/actions/report-replies"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface ContactReplyNotificationsProps {
  userId?: string
}

export function ContactReplyNotifications({ userId }: ContactReplyNotificationsProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [replies, setReplies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)


  const currentUserId = userId || session?.user?.id

  const loadReplies = async () => {
    if (!currentUserId) return
    setIsLoading(true)
    try {
      const result = await getUserUnreadReplies(currentUserId)
      if (result.success) {
        setReplies(result.data || [])
      }
    } catch (error) {
      console.error("Error loading replies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && currentUserId) {
      loadReplies()
    }
  }, [isOpen, currentUserId])

  // Poll for new replies every 10 seconds (more frequent to catch new replies quickly)
  useEffect(() => {
    if (!currentUserId) return

    // Load immediately on mount
    loadReplies()

    // Then poll every 10 seconds
    const interval = setInterval(() => {
      loadReplies()
    }, 10000)

    return () => clearInterval(interval)
  }, [currentUserId])

  if (!currentUserId) return null

  const handleMarkAsRead = async (replyId: string) => {
    try {
      const result = await markReplyAsRead(replyId)
      if (result.success) {
        setReplies((prev) => prev.filter((r) => r.id !== replyId))
        toast.success("Notification marquée comme lue")
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur s'est produite.",
      })
    }
  }

  const handleDelete = async (replyId: string) => {
    try {
      const result = await deleteReply(replyId)
      if (result.success) {
        setReplies((prev) => prev.filter((r) => r.id !== replyId))
        toast.success("Notification supprimée")
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur s'est produite.",
        })
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur s'est produite.",
      })
    }
  }

  const unreadCount = replies.length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Réponses reçues</span>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : replies.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune nouvelle réponse
            </div>
          ) : (
            <div className="divide-y">
              {replies.map((reply) => (
                <div key={reply.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-sm">
                          {reply.repliedBy?.name || "Admin"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Réponse à: {reply.report.title}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(reply.id)}
                      className="h-7 text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Marquer comme lu
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reply.id)}
                      className="h-7 text-xs text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
