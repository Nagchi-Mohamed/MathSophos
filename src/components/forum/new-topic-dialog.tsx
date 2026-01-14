"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { createForumPost } from "@/actions/forum"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ForumImageUpload } from "@/components/forum/forum-image-upload"

import { ImageUploadManager } from "@/components/admin/image-upload-manager"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { insertAtCursor } from "@/lib/textarea-utils"

export function NewTopicDialog() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploadSessionId] = useState(() => typeof crypto !== 'undefined' ? crypto.randomUUID() : `temp-${Date.now()}`)
  const router = useRouter()
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== "authenticated") {
      toast.error("Vous devez être connecté pour créer un sujet")
      return
    }
    setLoading(true)

    try {
      const result = await createForumPost({ title, content, imageUrl: imageUrl || undefined })

      if (result.success) {
        toast.success("Sujet créé avec succès")
        setOpen(false)
        setTitle("")
        setContent("")
        setImageUrl("")
        router.refresh()
      } else {
        toast.error(result.error || "Erreur lors de la création du sujet")
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Sujet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau sujet</DialogTitle>
          <DialogDescription>
            Posez votre question à la communauté MathSophos
          </DialogDescription>
        </DialogHeader>

        {status === "authenticated" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Comment résoudre une équation du second degré ?"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Description</Label>
                <div className="flex gap-2">
                  <VideoUploadManager
                    entityType="forum_post"
                    entityId={uploadSessionId}
                    onInsert={(video) => insertAtCursor(
                      contentTextareaRef.current,
                      "\n[Regarder la vidéo](" + video.url + ")\n",
                      content,
                      setContent
                    )}
                  />
                  <ImageUploadManager
                    entityType="forum_post"
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
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Décrivez votre problème en détail..."
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer le sujet"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <p className="text-center text-muted-foreground">
              Vous devez être connecté pour créer un nouveau sujet sur le forum.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button asChild>
                <Link href="/auth/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
