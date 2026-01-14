"use client"

import { use, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Download, Image as ImageIcon, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getChapterById, updateChapter, deleteChapter } from "@/actions/chapters"
import { ImageUploadManager } from "@/components/admin/image-upload-manager"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { DownloadPdfButton } from "@/components/print/download-pdf-button"
import MarkdownRenderer from "@/components/markdown-renderer"
import { LessonPreview } from "@/components/admin/lesson-preview"
import { insertAtCursor } from "@/lib/textarea-utils"

export default function EditChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const [formData, setFormData] = useState({
    content: "",
  })

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleLineSelected = (lineNumber: number) => {
    if (!textareaRef.current) return;

    // Find character index
    const lines = formData.content.split('\n');
    // Ensure lineNumber is within bounds
    const targetLineIndex = Math.min(Math.max(0, lineNumber - 1), lines.length - 1);

    let charIndex = 0;
    for (let i = 0; i < targetLineIndex; i++) {
      charIndex += lines[i].length + 1; // +1 for newline
    }

    // Focus and set selection
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(charIndex, charIndex);

    // Center the line in the view
    const lineHeight = 20; // ~20px for text-sm
    const textareaHeight = textarea.clientHeight;
    textarea.scrollTop = (targetLineIndex * lineHeight) - (textareaHeight / 2);
  }

  const [chapter, setChapter] = useState<any>(null)

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const result = await getChapterById(id)
        if (result.success && result.data) {
          const chapterData = result.data
          setChapter(chapterData)
          setFormData({
            content: chapterData.contentFr || "",
          })
        } else {
          toast.error("Erreur lors du chargement du chapitre")
          router.push("/admin/lessons")
        }
      } catch (error) {
        toast.error("Erreur lors du chargement du chapitre")
      } finally {
        setIsLoading(false)
      }
    }

    fetchChapter()
  }, [id, router])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateChapter({
        id,
        content: formData.content,
      })

      if (result.success) {
        toast.success("Chapitre mis à jour avec succès")
        // Reload chapter data
        const reloadResult = await getChapterById(id)
        if (reloadResult.success && reloadResult.data) {
          setChapter(reloadResult.data)
          setFormData({ content: reloadResult.data.contentFr || "" })
        }
      } else {
        toast.error("Erreur lors de la mise à jour: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le chapitre "${chapter?.titleFr}" ?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteChapter(id)
      if (result.success) {
        toast.success("Chapitre supprimé avec succès")
        const lesson = chapter?.lesson
        const module = lesson?.module
        const filiere = module?.educationalStream
        router.push(`/admin/lessons?cycle=SUPERIEUR&streamId=${filiere?.id}&moduleId=${module?.id}&lessonId=${lesson?.id}`)
      } else {
        toast.error("Erreur: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-red-500">Chapitre introuvable</p>
        <Link href="/admin/lessons">
          <Button variant="outline" className="mt-4">
            Retour
          </Button>
        </Link>
      </div>
    )
  }

  const lesson = chapter.lesson
  const module = lesson?.module
  const filiere = module?.educationalStream

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href={`/admin/lessons?cycle=SUPERIEUR&streamId=${filiere?.id}&moduleId=${module?.id}&lessonId=${lesson?.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Chapitre {chapter?.chapterNumber}: {chapter?.titleFr}</h1>
            <p className="text-muted-foreground mt-1">
              Cycle: Supérieur • Filière: {filiere?.name} • Module: {module?.name} • Leçon: {lesson?.titleFr}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Masquer l'aperçu
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Afficher l'aperçu
              </>
            )}
          </Button>
          <DownloadPdfButton
            url={`/print/chapter/${chapter.slug}`}
            filename={`${chapter.slug}.pdf`}
            label="Télécharger PDF"
          />
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="bg-card border rounded-lg flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <span className="font-medium text-sm text-gray-500">Contenu du chapitre (Markdown / LaTeX)</span>
              <div className="flex gap-2">
                <VideoUploadManager
                  entityType="chapter"
                  entityId={id}
                  onInsert={(url) => {
                    insertAtCursor(
                      textareaRef.current,
                      "\n[Regarder la vidéo](" + url + ")\n",
                      formData.content,
                      (newValue) => setFormData(prev => ({ ...prev, content: newValue }))
                    );
                    toast.success("Vidéo insérée");
                  }}
                />
                <ImageUploadManager
                  entityType="chapter"
                  entityId={id}
                  onInsert={(latex) => {
                    insertAtCursor(
                      textareaRef.current,
                      "\n" + latex + "\n",
                      formData.content,
                      (newValue) => setFormData(prev => ({ ...prev, content: newValue }))
                    );
                    toast.success("Image insérée");
                  }}
                />
              </div>
            </div>
            <Textarea
              ref={textareaRef}
              className="flex-1 p-6 resize-none border-0 focus-visible:ring-0 font-mono text-sm bg-transparent"
              placeholder="# Contenu du chapitre..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-card border rounded-lg p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
            <h2 className="text-2xl font-bold mb-4">Chapitre {chapter?.chapterNumber}: {chapter?.titleFr}</h2>
            <div className="h-full">
              <LessonPreview content={formData.content} onLineSelected={handleLineSelected} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
