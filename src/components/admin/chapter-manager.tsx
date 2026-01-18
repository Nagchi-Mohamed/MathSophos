"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Wand2, FileText, Loader2, Trash, Edit, BookOpen, Save, Pencil } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { getChaptersByLesson, createChapter, generateChapterWithAI, deleteChapter, renameChapter } from "@/actions/chapters"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ImageUploadManager } from "@/components/admin/image-upload-manager"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { insertAtCursor } from "@/lib/textarea-utils"
import dynamic from "next/dynamic"

const AIPromptGenerator = dynamic(
  () => import("@/components/exercises/ai-prompt-generator").then(mod => ({ default: mod.AIPromptGenerator })),
  { ssr: false }
)

interface ChapterManagerProps {
  lessonId: string
  lessonTitle: string
  showOnlyButton?: boolean
}

export function ChapterManager({ lessonId, lessonTitle, showOnlyButton = false }: ChapterManagerProps) {
  const { data: session } = useSession()
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [chapterToRename, setChapterToRename] = useState<any>(null)
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  const [mode, setMode] = useState<"ai" | "manual">("manual")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [modelProvider, setModelProvider] = useState<string>("google")
  const [modelId, setModelId] = useState<string>("gemini-2.5-flash")

  const [formData, setFormData] = useState({
    title: "",
    chapterNumber: 1,
    content: "",
    additionalInstructions: "",
  })

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Calculate next chapter number dynamically
  const nextChapterNumber = chapters.length > 0
    ? Math.max(...chapters.map(c => c.chapterNumber)) + 1
    : 1

  // Update formData when dialog opens to set default chapter number
  useEffect(() => {
    if (isDialogOpen) {
      setFormData(prev => ({ ...prev, chapterNumber: nextChapterNumber }))
    }
  }, [isDialogOpen, nextChapterNumber])

  useEffect(() => {
    loadChapters()
  }, [lessonId])

  const loadChapters = async () => {
    setLoading(true)
    try {
      const result = await getChaptersByLesson(lessonId)
      if (result.success) {
        setChapters(result.data || [])
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des chapitres")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateManual = async () => {
    if (!formData.title || !formData.chapterNumber) {
      toast.error("Le titre et le numéro du chapitre sont obligatoires")
      return
    }

    setIsCreating(true)
    try {
      const result = await createChapter({
        title: formData.title,
        lessonId,
        chapterNumber: formData.chapterNumber,
        content: formData.content || undefined,
        createdById: session?.user?.id,
      })

      if (result.success) {
        toast.success("Chapitre créé avec succès")
        setIsDialogOpen(false)
        setFormData({ title: "", chapterNumber: nextChapterNumber, content: "", additionalInstructions: "" })
        setMode("manual")
        loadChapters()
      } else {
        toast.error("Erreur: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsCreating(false)
    }
  }

  const handleGenerateAI = async () => {
    if (!formData.title || !formData.chapterNumber) {
      toast.error("Le titre et le numéro du chapitre sont obligatoires")
      return
    }
    // Instructions are optional - context will be provided automatically

    setIsGenerating(true)
    try {
      const result = await generateChapterWithAI({
        lessonId,
        chapterTitle: formData.title,
        chapterNumber: formData.chapterNumber,
        additionalInstructions: formData.additionalInstructions,
        modelConfig: {
          provider: modelProvider as 'google' | 'openai',
          modelId: modelId,
        },
        createdById: session?.user?.id,
      })

      if (result.success && result.data) {
        toast.success("Contenu généré avec succès ! Vous pouvez maintenant le modifier puis le sauvegarder.")
        // Charger le contenu généré dans le formulaire pour permettre l'édition
        setFormData(prev => ({
          ...prev,
          content: result.data?.contentFr || prev.content
        }))
        // Passer en mode manuel pour permettre l'édition avec Insert image
        setMode("manual")
      } else {
        toast.error("Erreur: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsGenerating(false)
    }
  }

  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null)

  const confirmDelete = async () => {
    if (!chapterToDelete) return

    try {
      const result = await deleteChapter(chapterToDelete)
      if (result.success) {
        toast.success("Chapitre supprimé")
        loadChapters()
      } else {
        toast.error("Erreur: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setChapterToDelete(null)
    }
  }

  const handleDelete = (chapterId: string) => {
    setChapterToDelete(chapterId)
  }


  const handleRename = (chapter: any) => {
    setChapterToRename(chapter)
    setNewChapterTitle(chapter.titleFr)
    setIsRenameDialogOpen(true)
  }

  const handleRenameSubmit = async () => {
    if (!chapterToRename || !newChapterTitle.trim()) {
      toast.error("Le titre ne peut pas être vide")
      return
    }

    setIsRenaming(true)
    try {
      const result = await renameChapter(chapterToRename.id, newChapterTitle.trim())
      if (result.success) {
        toast.success("Chapitre renommé avec succès")
        setIsRenameDialogOpen(false)
        setChapterToRename(null)
        setNewChapterTitle("")
        loadChapters()
      } else {
        toast.error("Erreur: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <div className="space-y-4">
      {!showOnlyButton && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Chapitres ({chapters.length})
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les chapitres de la leçon "{lessonTitle}"
            </p>
          </div>
        </div>
      )}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          {showOnlyButton ? (
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Créer un chapitre
            </Button>
          ) : (
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un chapitre
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau Chapitre</DialogTitle>
            <DialogDescription>
              Créez un nouveau chapitre pour cette leçon. Vous pouvez le créer manuellement ou utiliser l'IA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Numéro du chapitre */}
            <div className="space-y-2">
              <Label htmlFor="chapterNumber">Numéro du chapitre *</Label>
              <Input
                id="chapterNumber"
                type="number"
                min={1}
                value={formData.chapterNumber || nextChapterNumber}
                onChange={(e) => setFormData({ ...formData, chapterNumber: Number(e.target.value) })}
                required
              />
            </div>

            {/* Titre du chapitre */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre du chapitre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Les suites numériques"
                required
              />
            </div>

            {/* Choix du mode */}
            <div className="space-y-2">
              <Label>Créer avec *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "manual" ? "default" : "outline"}
                  onClick={() => setMode("manual")}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Manuel
                </Button>
                <Button
                  type="button"
                  variant={mode === "ai" ? "default" : "outline"}
                  onClick={() => setMode("ai")}
                  className="flex-1"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  IA
                </Button>
              </div>
            </div>

            {/* Mode Manuel : Contenu avec Insert Image en haut */}
            {mode === "manual" && (
              <div className="space-y-2">
                <div className="mb-4">
                  <AIPromptGenerator
                    contentType="chapter"
                    context={{
                      cycle: "LYCEE",
                      level: "UNKNOWN",
                      stream: null,
                      semester: "UNKNOWN"
                    }}
                    lesson={{
                      id: lessonId,
                      titleFr: lessonTitle,
                      contentFr: formData.content // Use current content as context if any
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="content">Contenu du chapitre</Label>
                  <div className="flex gap-2">
                    <VideoUploadManager
                      entityType="chapter"
                      entityId={lessonId}
                      onInsert={(url) => {
                        insertAtCursor(
                          contentTextareaRef.current,
                          "\n[Regarder la vidéo](" + url + ")\n",
                          formData.content,
                          (newValue) => setFormData(prev => ({ ...prev, content: newValue }))
                        );
                        toast.success("Vidéo insérée");
                      }}
                    />
                    <ImageUploadManager
                      entityType="chapter"
                      entityId={lessonId}
                      onInsert={(latex) => {
                        insertAtCursor(
                          contentTextareaRef.current,
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
                  ref={contentTextareaRef}
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Contenu du chapitre en Markdown/LaTeX..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Mode IA : Pas de gestion d'images, seulement modèle et instructions */}
            {mode === "ai" && (
              <div className="space-y-2">
                <Label htmlFor="modelProvider">Modèle IA</Label>
                <Select value={`${modelProvider}:${modelId}`} onValueChange={(value) => {
                  const [provider, id] = value.split(':')
                  setModelProvider(provider)
                  setModelId(id)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google:gemini-2.5-flash">Google Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="google:gemini-2.0-flash-exp">Google Gemini 2.0 Flash</SelectItem>
                    <SelectItem value="openai:gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>

                  </SelectContent>
                </Select>
                <div className="space-y-2 mt-2">
                  <Label htmlFor="additionalInstructions">Instructions supplémentaires (optionnel)</Label>
                  <Textarea
                    id="additionalInstructions"
                    value={formData.additionalInstructions}
                    onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                    placeholder="Décrivez les objectifs pédagogiques, les prérequis, ou toute instruction spécifique pour la génération de ce chapitre..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Les informations de la Filière, Module et Leçon seront automatiquement incluses. Ajoutez ici des instructions spécifiques si nécessaire.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setFormData({ title: "", chapterNumber: nextChapterNumber, content: "", additionalInstructions: "" })
                setMode("manual")
              }}
              disabled={isGenerating || isCreating}
            >
              Annuler
            </Button>
            {mode === "ai" ? (
              <>
                <Button
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !formData.title || !formData.chapterNumber}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Générer
                    </>
                  )}
                </Button>
                {formData.content && (
                  <Button
                    onClick={handleCreateManual}
                    disabled={isCreating || !formData.title || !formData.chapterNumber}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={handleCreateManual}
                disabled={isCreating || !formData.title || !formData.chapterNumber}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Créer
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer le chapitre</DialogTitle>
            <DialogDescription>
              Modifiez le titre du chapitre "{chapterToRename?.titleFr}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newTitle">Nouveau titre</Label>
              <Input
                id="newTitle"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Ex: Les suites numériques"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleRenameSubmit()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameDialogOpen(false)
                setChapterToRename(null)
                setNewChapterTitle("")
              }}
              disabled={isRenaming}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={isRenaming || !newChapterTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Renommage...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Renommer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!showOnlyButton && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">Aucun chapitre</h3>
              <p className="text-muted-foreground mb-4">Commencez par ajouter un chapitre à cette leçon.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                      {chapter.chapterNumber}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{chapter.titleFr}</h4>
                      <p className="text-sm text-muted-foreground">
                        {chapter.contentFr ? `${chapter.contentFr.substring(0, 100)}...` : "Aucun contenu"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/chapters/${chapter.id}/edit`}>
                      <Button variant="outline" size="sm" title="Modifier">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRename(chapter)}
                      title="Renommer"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(chapter.id)}
                      title="Supprimer"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <AlertDialog open={!!chapterToDelete} onOpenChange={(open) => !open && setChapterToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Voulez-vous vraiment supprimer ce chapitre ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
