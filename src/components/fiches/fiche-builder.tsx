'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreateFicheInput, createFiche, updateFiche, FicheContentStep } from "@/actions/fiches"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetadataForm } from "./metadata-form"
import { ContentEntryForm } from "./content-entry-form"
import { FichePreview } from "./fiche-preview"
import { FicheJsonEditor } from "./fiche-json-editor"
import { toast } from "sonner"
import { ArrowLeft, Save, FileText, List, Eye, FileJson } from "lucide-react"
import Link from "next/link"
import type { PedagogicalSheet } from "@prisma/client"
import { EducationalLevel } from "@/lib/enums"

// Default example content for new fiches
const DEFAULT_EXAMPLE_CONTENT: FicheContentStep[] = [
  {
    "id": "526c7d14-b10c-43a9-8c47-512ae1f021ff",
    "type": "Activité",
    "duration": "20 min",
    "content": "<h3>Activité d'initiation : Introduction à l'ensemble \\(\\mathbb{N}\\)</h3><p>Parmi les nombres suivants : \\(0\\) ; \\(8\\) ; \\(\\sqrt{25}\\) ; \\(\\sqrt{34}\\) ; \\(12,5\\) ; \\(\\frac{12}{3}\\). Préciser ceux qui sont des entiers naturels.</p>",
    "observations": "Permettre aux élèves de manipuler les nombres et de différencier les entiers naturels des autres types de nombres."
  },
  {
    "id": "f6a4126d-3a7c-4124-893b-49e43544abba",
    "type": "Définition",
    "duration": "10 min",
    "content": "<h3>Définition 1 : Ensemble \\(\\mathbb{N}\\) et \\(\\mathbb{N}^*\\)</h3><p>• Les nombres entiers naturels forment un ensemble noté \\(\\mathbb{N}\\) : \\(\\mathbb{N} = \\{0, 1, 2, 3, 4, 5, \\dots\\}\\).<br>• Les nombres entiers naturels non nuls forment un ensemble noté \\(\\mathbb{N}^*\\) : \\(\\mathbb{N}^* = \\{1, 2, 3, 4, 5, \\dots\\}\\).<br><br><strong>Exemples :</strong><br>• \\(3 \\in \\mathbb{N}\\),<br>• \\(-5 \\notin \\mathbb{N}\\),<br>• \\(4 \\in \\mathbb{N}^*\\).</p>",
    "observations": "Insister sur les symboles \\(\\in\\) et \\(\\notin\\)."
  },
  {
    "id": "new-003",
    "type": "Propriété",
    "duration": "20 min",
    "content": "<h3>Propriété : Opérations sur les nombres pairs et impairs</h3><p>Soient \\(a, b \\in \\mathbb{N}\\).</p><p>$$\\begin{array}{|c|c|c|c|c|}\\hline a &amp; b &amp; a+b &amp; a-b \\; (a &gt; b) &amp; a \\times b \\\\\\hline\\hline \\text{Pair} &amp; \\text{Pair} &amp; \\text{Pair} &amp; \\text{Pair} &amp; \\text{Pair} \\\\\\hline \\text{Pair} &amp; \\text{Impair} &amp; \\text{Impair} &amp; \\text{Impair} &amp; \\text{Pair} \\\\\\hline \\text{Impair} &amp; \\text{Pair} &amp; \\text{Impair} &amp; \\text{Impair} &amp; \\text{Pair} \\\\\\hline \\text{Impair} &amp; \\text{Impair} &amp; \\text{Pair} &amp; \\text{Pair} &amp; \\text{Impair} \\\\\\hline \\end{array}$$</p>",
    "observations": "Encourager la démonstration pour quelques cas."
  }
]

import { VideoPlayerTrigger } from "@/components/content/video-player-trigger"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { Video } from "lucide-react"

interface FicheBuilderProps {
  initialData?: PedagogicalSheet
  isEditing?: boolean
  userRole?: string
  helpVideo?: any // PlatformVideo type
}

export function FicheBuilder({ initialData, isEditing = false, userRole, helpVideo }: FicheBuilderProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("metadata")
  const [isSaving, setIsSaving] = useState(false)
  const [isJsonValid, setIsJsonValid] = useState(true)

  // Parse initial content safely - use example for new fiches
  const initialSteps = initialData?.content
    ? (typeof initialData.content === 'string' ? JSON.parse(initialData.content) : initialData.content) as FicheContentStep[]
    : DEFAULT_EXAMPLE_CONTENT

  // Track if we're showing example content (only for new fiches)
  const [isExampleContent, setIsExampleContent] = useState(!initialData)

  // State
  const [metadata, setMetadata] = useState<Omit<CreateFicheInput, "content">>({
    teacherName: initialData?.teacherName || "",
    schoolName: initialData?.schoolName || "",
    gradeLevel: initialData?.gradeLevel || "LYCEE_2BAC" as EducationalLevel,
    stream: initialData?.stream || "",
    semester: initialData?.semester || 1,
    lessonTitle: initialData?.lessonTitle || "",
    duration: initialData?.duration || "2 heures",
    pedagogicalGuidelines: initialData?.pedagogicalGuidelines || "",
    prerequisites: initialData?.prerequisites || "",
    extensions: initialData?.extensions || "",
    didacticTools: initialData?.didacticTools || "",
  })

  const [steps, setSteps] = useState<FicheContentStep[]>(initialSteps)

  // Auto-clear example content on first edit
  const handleStepsChange = (newSteps: FicheContentStep[]) => {
    if (isExampleContent) {
      setIsExampleContent(false)
      // Clear to empty array on first edit
      setSteps([])
    } else {
      setSteps(newSteps)
    }
  }

  const handleSave = async () => {
    if (activeTab === 'json' && !isJsonValid) {
      toast.error("Le JSON est invalide. Veuillez corriger les erreurs avant d'enregistrer.")
      return
    }

    if (!metadata.teacherName || !metadata.schoolName) {
      toast.error("Veuillez remplir les informations obligatoires (Nom, Ecole)")
      return
    }

    setIsSaving(true)
    try {
      const data = {
        ...metadata,
        content: steps,
      }

      if (isEditing && initialData?.id) {
        await updateFiche(initialData.id, data)
        toast.success("Fiche mise à jour avec succès")
      } else {
        await createFiche(data)
        toast.success("Fiche créée avec succès")
      }

      router.push("/teacher/fiches")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      {/* Help Video Section - Centered and Prominent */}
      {(helpVideo || userRole === 'ADMIN') && (
        <div className="flex flex-col items-center justify-center w-full space-y-4">
          {/* Helper Text */}
          <div className="text-center space-y-1">
            <h3 className="text-sm font-medium text-primary flex items-center justify-center gap-2">
              <Video className="h-4 w-4" />
              Tutoriel Vidéo
            </h3>
            <p className="text-xs text-muted-foreground">
              Regardez cette vidéo pour comprendre comment remplir correctement cette fiche.
            </p>
          </div>

          {helpVideo ? (
            <VideoPlayerTrigger src={helpVideo.url} title={helpVideo.title} />
          ) : userRole === 'ADMIN' ? (
            <div className="w-full max-w-[280px] h-32 flex flex-col items-center justify-center bg-muted/40 rounded-xl border border-dashed border-muted-foreground/25">
              <p className="text-muted-foreground text-xs mb-2">Aucune vidéo d'aide</p>
            </div>
          ) : null}

          {/* Admin Controls for Video */}
          {userRole === 'ADMIN' && (
            <VideoUploadManager
              entityType="system-help"
              entityId="fiche-creation-help"
              trigger={
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-8">
                  <Video className="mr-2 h-3 w-3" />
                  {helpVideo ? "Modifier la vidéo d'aide" : "Ajouter une vidéo d'aide"}
                </Button>
              }
              onInsert={() => {
                // Refresh page to show new video
                router.refresh()
                toast.success("Vidéo d'aide mise à jour")
              }}
            />
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/teacher/fiches">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{isEditing ? "Modifier la Fiche" : "Créer une Fiche Pédagogique"}</h1>
            <p className="text-muted-foreground">
              {isEditing ? "Modifiez les informations et le scénario." : "Remplissez les informations et construisez votre scénario."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving || (activeTab === 'json' && !isJsonValid)}>
            {isSaving ? "Sauvegarde..." : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Mettre à jour" : "Enregistrer"}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metadata"><FileText className="mr-2 h-4 w-4" /> Fiche Technique</TabsTrigger>
          <TabsTrigger value="content"><List className="mr-2 h-4 w-4" /> Scénario / Déroulement</TabsTrigger>
          <TabsTrigger value="json"><FileJson className="mr-2 h-4 w-4" /> Mode JSON</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="mr-2 h-4 w-4" /> Aperçu PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="mt-6">
          <MetadataForm data={metadata} onChange={setMetadata} onNext={() => setActiveTab("content")} />
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <ContentEntryForm
            steps={steps}
            setSteps={handleStepsChange}
            metadata={metadata}
          />
        </TabsContent>

        <TabsContent value="json" className="mt-6">
          <FicheJsonEditor
            steps={steps}
            onStepsChange={handleStepsChange}
            onValidityChange={setIsJsonValid}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <FichePreview metadata={metadata} steps={steps} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
