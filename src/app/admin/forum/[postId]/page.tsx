"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { generateAIReply } from "@/actions/ai-generate"
import { Sparkles, Loader2, Send, User, Calendar } from "lucide-react"
import { getForumPost, createForumReply } from "@/actions/forum"
import { DeleteReplyButton } from "@/components/admin/forum/forum-actions"
import { UserModerationMenu } from "@/components/admin/forum/user-moderation-menu"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function AdminForumPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params)
  const [post, setPost] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reply, setReply] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const result = await getForumPost(postId)
        if (result.success) {
          setPost(result.data)
        }
      } catch (error) {
        console.error("Error fetching post:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPost()
  }, [postId])

  const handleGenerateAiReply = async () => {
    if (!post) return
    setIsGenerating(true)
    try {
      const result = await generateAIReply(post.content)
      if (result.data) {
        setReply(result.data)
      } else {
        toast.error("Erreur de génération")
      }
    } catch (e) {
      toast.error("Erreur")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendReply = async () => {
    if (!reply.trim()) return
    setIsSending(true)
    try {
      const result = await createForumReply({
        postId: postId,
        content: reply
      })

      if (result.success) {
        toast.success("Réponse envoyée")
        setReply("")
        // Refresh post data
        const refresh = await getForumPost(postId)
        if (refresh.success) {
          setPost(refresh.data)
        }
        router.refresh()
      } else {
        toast.error(result.error || "Erreur lors de l'envoi")
      }
    } catch (error) {
      toast.error("Erreur inattendue")
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!post) {
    return <div>Sujet introuvable</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <div className="text-sm text-muted-foreground text-right flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span>{post.user?.name || "Anonyme"}</span>
            {post.user && (
              <UserModerationMenu userId={post.user.id} userName={post.user.name || "Utilisateur"} />
            )}
          </div>
          <div>{new Date(post.createdAt).toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 whitespace-pre-wrap">
          {post.content}
        </CardContent>
      </Card>

      <div className="space-y-4 pt-8 border-t">
        <h2 className="text-xl font-semibold">Réponses ({post.replies?.length || 0})</h2>

        <div className="space-y-4">
          {post.replies && post.replies.map((reply: any) => (
            <Card key={reply.id}>
              <CardHeader className="py-3 flex flex-row items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="font-medium text-black">{reply.user?.name || "Anonyme"}</span>
                  <span>•</span>
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(reply.createdAt).toLocaleDateString("fr-FR", {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {reply.user && (
                    <UserModerationMenu userId={reply.user.id} userName={reply.user.name || "Utilisateur"} />
                  )}
                </div>
                <DeleteReplyButton id={reply.id} />
              </CardHeader>
              <CardContent className="pt-4 whitespace-pre-wrap">
                {reply.content}
              </CardContent>
            </Card>
          ))}

          {(!post.replies || post.replies.length === 0) && (
            <p className="text-muted-foreground italic">Aucune réponse pour le moment.</p>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-8 border-t">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Réponse du Professeur</h2>
          <Button
            variant="outline"
            onClick={handleGenerateAiReply}
            disabled={isGenerating}
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Générer une réponse IA
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="min-h-[200px] mb-4"
              placeholder="Écrivez votre réponse ou générez-en une avec l'IA..."
            />
            <div className="flex justify-end">
              <Button onClick={handleSendReply} disabled={isSending}>
                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Publier la réponse
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
