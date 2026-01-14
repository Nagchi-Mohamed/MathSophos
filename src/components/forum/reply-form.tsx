"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { createForumReply } from "@/actions/forum"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ForumImageUpload } from "@/components/forum/forum-image-upload"
import { ImageUploadManager } from "@/components/admin/image-upload-manager"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { insertAtCursor } from "@/lib/textarea-utils"

import { useSession } from "next-auth/react"
import Link from "next/link"

interface ReplyFormProps {
  postId: string
}

export function ReplyForm({ postId }: ReplyFormProps) {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploadSessionId] = useState(() => typeof crypto !== 'undefined' ? crypto.randomUUID() : `temp-${Date.now()}`)
  const router = useRouter()
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== "authenticated") {
      toast.error("Vous devez être connecté pour répondre")
      return
    }
    setLoading(true)

    try {
      const result = await createForumReply({ postId, content, imageUrl: imageUrl || undefined })

      if (result.success) {
        toast.success("Réponse publiée avec succès")
        setContent("")
        setImageUrl("")
        router.refresh()
      } else {
        toast.error(result.error || "Erreur lors de la publication")
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-4 border rounded-lg bg-muted/50">
        <p className="text-center text-muted-foreground">
          Vous devez être connecté pour répondre à ce sujet.
        </p>
        <Button asChild variant="outline">
          <Link href="/auth/login">Se connecter</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="reply-content">Votre réponse</Label>
          <div className="flex gap-2">
            <VideoUploadManager
              entityType="forum_reply"
              entityId={uploadSessionId}
              onInsert={(video) => insertAtCursor(
                contentTextareaRef.current,
                "\n[Regarder la vidéo](" + video.url + ")\n",
                content,
                setContent
              )}
            />
            <ImageUploadManager
              entityType="forum_reply"
              entityId={uploadSessionId}
              onInsert={(latex) => insertAtCursor(
                contentTextareaRef.current,
                "\n" + latex + "\n",
                content,
                setContent
              )}
            />
          </div>
        </div>
        <Textarea
          ref={contentTextareaRef}
          id="reply-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez votre réponse..."
          rows={6}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Image (optionnelle)</Label>
        <ForumImageUpload
          onImageUploaded={(url) => setImageUrl(url)}
          currentImageUrl={imageUrl}
          onImageRemoved={() => setImageUrl("")}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publication...
          </>
        ) : (
          "Publier la réponse"
        )}
      </Button>
    </form>
  )
}
