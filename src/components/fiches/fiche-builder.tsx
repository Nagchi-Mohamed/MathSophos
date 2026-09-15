'use client'

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { CreateFicheInput, createFiche, updateFiche, FicheSession } from "@/actions/fiches"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetadataForm } from "./metadata-form"
import { ContentEntryForm } from "./content-entry-form"
import { FichePreview } from "./fiche-preview"
import { FicheJsonEditor } from "./fiche-json-editor"
import { toast } from "sonner"
import { MathSophosIcon } from "@/components/ui/math-sophos-logo"
import { ArrowLeft, Save, FileText, List, Eye, FileJson } from "lucide-react"
import Link from "next/link"
import type { PedagogicalSheet } from "@prisma/client"
import { EducationalLevel } from "@/lib/enums"
import { AiGeneratorModal } from "./ai-generator-modal"
import { VideoPlayerTrigger } from "@/components/content/video-player-trigger"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { Video } from "lucide-react"

// Default example 4-column sessions matching the LaTeX specimen
const DEFAULT_EXAMPLE_SESSIONS: FicheSession[] = [
  {
    "id": "session-1",
    "title": "Séance 1 --- Ensemble ℕ et Parité",
    "duration": "2 h",
    "demarche": "<strong>Activité 1</strong> --- Parmi les nombres : 0 ; 8 ; $\\sqrt{25}$ ; $\\sqrt{34}$ ; 12.5 ; $\\frac{12}{3}$, préciser ceux qui sont des entiers naturels.<br><br><strong>Activité 2</strong> --- Soit $a \\in \\mathbb{N}$. Écrire sa forme générale s'il est pair, puis s'il est impair.<br><br><strong>Démonstration guidée</strong> --- Montrer que si $a$ et $b$ sont pairs alors $a+b$ est pair.",
    "traceEcrite": "<strong>Définition.</strong> Les entiers naturels forment l'ensemble $\\mathbb{N} = \\{0, 1, 2, 3, \\dots\\}$. On note $\\mathbb{N}^* = \\{1, 2, 3, \\dots\\}$ l'ensemble des entiers naturels non nuls.<br><br><strong>Définition (parité).</strong> Soit $a \\in \\mathbb{N}$.<br>• $a$ est <strong>pair</strong> s'il existe $k \\in \\mathbb{N}$ tel que $a = 2k$.<br>• $a$ est <strong>impair</strong> s'il existe $k \\in \\mathbb{N}$ tel que $a = 2k+1$.<br><br><strong>Théorème.</strong> Le produit de deux entiers naturels consécutifs est toujours pair.",
    "evaluation": "<strong>Application 1</strong> --- Étudier la parité de : 1359 + 59321 ; $978^2 - 65^2$ ; $732 \\times 753$<br><br><strong>Application 2</strong> --- Soit $n \\in \\mathbb{N}$. Étudier la parité de $2n + 3$ et $4n^2 + 2n + 5$."
  },
  {
    "id": "session-2",
    "title": "Séance 2 --- Multiples, Diviseurs et Critères de divisibilité",
    "duration": "1 h 30",
    "demarche": "<strong>Activité</strong> --- Déterminer les diviseurs de 36 et de 82 ; puis les multiples de 3 inférieurs ou égaux à 50.<br><br><strong>Investigation</strong> --- Chercher des règles rapides pour reconnaître un multiple de 2, 3, 4, 5 ou 9.",
    "traceEcrite": "<strong>Définition.</strong> Soient $a, b \\in \\mathbb{N}$. S'il existe $k \\in \\mathbb{N}$ tel que $a = kb$, alors :<br>• $a$ est un <strong>multiple</strong> de $b$ ;<br>• $b$ est un <strong>diviseur</strong> de $a$.<br><br><strong>Critères de divisibilité.</strong> Soit $n \\in \\mathbb{N}$.<br>• par 2 : chiffre des unités $\\in \\{0, 2, 4, 6, 8\\}$ ;<br>• par 5 : chiffre des unités $\\in \\{0, 5\\}$ ;<br>• par 3 (resp. 9) : somme des chiffres multiple de 3 (resp. 9).",
    "evaluation": "<strong>Application</strong> --- Étudier la divisibilité de 3611790 par 2, 3, 4, 5 et 9."
  },
  {
    "id": "session-3",
    "title": "Séance 3 --- Nombres Premiers et Décomposition",
    "duration": "2 h",
    "demarche": "<strong>Activité</strong> --- Déterminer les diviseurs de 2, 3, 5 et 17. Que remarque-t-on ?<br><br><strong>Méthode</strong> --- Comment tester la primalité d'un entier $n$ ? Critère $p \\le \\sqrt{n}$.",
    "traceEcrite": "<strong>Définition.</strong> Un entier $n \\ge 2$ est <strong>premier</strong> s'il admet exactement deux diviseurs : 1 et lui-même.<br><br><strong>Théorème.</strong> Tout entier $n \\ge 2$ admet une décomposition en produit de facteurs premiers.",
    "evaluation": "<strong>Application 1</strong> --- Étudier la primalité de 101, 137 et 1563.<br><br><strong>Application 2</strong> --- Décomposer en produit de facteurs premiers : 48, 612, 1530."
  }
]

interface FicheBuilderProps {
  initialData?: PedagogicalSheet
  isEditing?: boolean
  userRole?: string
  helpVideo?: any
}

export function FicheBuilder({ initialData, isEditing = false, userRole, helpVideo }: FicheBuilderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("metadata")
  const [isSaving, setIsSaving] = useState(false)
  const [isJsonValid, setIsJsonValid] = useState(true)
  const [showAiModal, setShowAiModal] = useState(false)
  const [, startTransition] = useTransition()

  // Parse and normalize initial content
  const getInitialSteps = () => {
    if (!initialData?.content) return DEFAULT_EXAMPLE_SESSIONS
    try {
      const parsed = typeof initialData.content === 'string' ? JSON.parse(initialData.content) : initialData.content
      if (!Array.isArray(parsed)) return DEFAULT_EXAMPLE_SESSIONS
      return parsed.map((item: any, idx: number) => ({
        id: item.id || `session-${idx + 1}`,
        title: item.title || item.type || `Séance ${idx + 1}`,
        duration: item.duration || "",
        demarche: item.demarche || item.content || "",
        traceEcrite: item.traceEcrite || item.content || "",
        evaluation: item.evaluation || item.observations || ""
      }))
    } catch {
      return DEFAULT_EXAMPLE_SESSIONS
    }
  }

  const [isExampleContent, setIsExampleContent] = useState(!initialData)

  const [metadata, setMetadata] = useState<Omit<CreateFicheInput, "content">>({
    teacherName: initialData?.teacherName || (session?.user?.name || "Mohamed Nagchi"),
    schoolName: initialData?.schoolName || "Lycée Hassan I",
    gradeLevel: initialData?.gradeLevel || ("LYCEE_TC" as EducationalLevel),
    stream: initialData?.stream || "Tronc Commun Scientifique et Technique (TCSF)",
    subject: (initialData as any)?.subject || "Mathématiques",
    schoolYear: (initialData as any)?.schoolYear || "2025 – 2026",
    textbook: (initialData as any)?.textbook || "Najah",
    semester: initialData?.semester || 1,
    lessonTitle: initialData?.lessonTitle || "Arithmétique dans ℕ",
    duration: initialData?.duration || "7 heures",
    capacities: (initialData as any)?.capacities || "• Utiliser la parité et la décomposition en produit de facteurs premiers pour résoudre des problèmes simples portant sur les entiers naturels.\n• Maîtriser les notions de multiple, diviseur, PGCD et PPMC.\n• Initier l'élève à la démonstration mathématique (disjonction des cas).",
    programContents: (initialData as any)?.programContents || "• Les nombres pairs et les nombres impairs.\n• Multiples d'un nombre, le plus petit multiple commun de deux nombres (PPMC).\n• Diviseurs d'un nombre, le plus grand diviseur commun de deux nombres (PGCD).\n• Nombres premiers, décomposition d'un nombre en produit de facteurs premiers.",
    pedagogicalGuidelines: initialData?.pedagogicalGuidelines || "Introduire progressivement les symboles ∈, ∉, ⊂, ∩, ∪ ; privilégier l'initiation à la démonstration à travers la parité, sans excès de technicité.",
    prerequisites: initialData?.prerequisites || "Opérations dans ℕ ; notion élémentaire de divisibilité ; carré parfait.",
    extensions: initialData?.extensions || "",
    didacticTools: initialData?.didacticTools || "Tableau, craie, manuel scolaire (Najah), fiches d'activités, sites électroniques.",
    bilanSequence: (initialData as any)?.bilanSequence || "",
    difficultiesObserved: (initialData as any)?.difficultiesObserved || "",
    remediationProposed: (initialData as any)?.remediationProposed || "",
    observations: (initialData as any)?.observations || ""
  })

  useEffect(() => {
    if (!initialData && session?.user?.name && !metadata.teacherName) {
      setMetadata(prev => ({ ...prev, teacherName: session.user.name || prev.teacherName }))
    }
  }, [session, initialData, metadata.teacherName])

  const [steps, setSteps] = useState<any[]>(getInitialSteps())

  const handleStepsChange = (newSteps: any[]) => {
    if (isExampleContent) {
      setIsExampleContent(false)
      setSteps(newSteps)
    } else {
      setSteps(newSteps)
    }
  }

  const handleAiGenerated = (result: { metadata: Partial<Omit<CreateFicheInput, "content">>; sessions: any[] }) => {
    setMetadata(prev => ({ ...prev, ...result.metadata }))
    if (result.sessions && result.sessions.length > 0) {
      setSteps(result.sessions)
      setIsExampleContent(false)
    }
    toast.success("Fiche Pédagogique générée et chargée dans l'éditeur !")
  }

  const handleSave = async () => {
    if (activeTab === 'json' && !isJsonValid) {
      toast.error("Le JSON est invalide. Veuillez corriger les erreurs avant d'enregistrer.")
      return
    }

    if (!metadata.teacherName || !metadata.schoolName) {
      toast.error("Veuillez remplir les informations obligatoires (Nom, École)")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        ...metadata,
        content: steps,
        ...(isEditing && initialData?.id ? { id: initialData.id } : {})
      }

      const response = await fetch('/api/fiches', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const res = await response.json().catch(() => null)

      if (!response.ok || !res || !res.success) {
        toast.error(res?.error || `Erreur (${response.status}) lors de la sauvegarde`)
        return
      }

      toast.success(isEditing ? "Fiche mise à jour avec succès" : "Fiche créée avec succès")
      router.push("/teacher/fiches")
      router.refresh()
    } catch (error: any) {
      console.error("[handleSave Error]:", error)
      toast.error(error?.message || "Erreur de connexion lors de la sauvegarde")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      {/* Help Video Section */}
      {(helpVideo || userRole === 'ADMIN') && (
        <div className="flex flex-col items-center justify-center w-full space-y-4">
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
                router.refresh()
                toast.success("Vidéo d'aide mise à jour")
              }}
            />
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/teacher/fiches">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{isEditing ? "Modifier la Fiche" : "Créer une Fiche Pédagogique"}</h1>
            <p className="text-muted-foreground">
              {isEditing ? "Modifiez les informations et le scénario." : "Saisissez les informations ou utilisez le générateur IA pour transformer votre document."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => startTransition(() => setShowAiModal(true))}
            variant="outline"
            className="border-primary/40 text-primary hover:bg-primary/5"
          >
            <MathSophosIcon size={18} className="mr-2" />
            Générer avec IA / Document
          </Button>
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
          <TabsTrigger value="content"><List className="mr-2 h-4 w-4" /> Scénario (4 Colonnes)</TabsTrigger>
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

      <AiGeneratorModal
        open={showAiModal}
        onOpenChange={setShowAiModal}
        onGenerated={handleAiGenerated}
        metadata={metadata}
      />
    </div>
  )
}
