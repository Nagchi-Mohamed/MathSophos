'use client'

import { useState, useEffect } from "react"
import { CreateFicheInput, FicheContentStep } from "@/actions/fiches"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TiptapEditor } from "@/components/admin/tiptap-editor"
import { LatexHelper } from "./latex-helper"
import { Trash2, MoveUp, MoveDown, Plus, Wand2, Edit, Save } from "lucide-react"
import { AiGeneratorModal } from "./ai-generator-modal"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface ContentEntryFormProps {
  steps: FicheContentStep[]
  setSteps: (steps: FicheContentStep[]) => void
  metadata: Omit<CreateFicheInput, "content">
}

const STEP_TYPES = [
  "Activité d'initiation",
  "Définition",
  "Théorème",
  "Propriété",
  "Exemple",
  "Remarque",
  "Application",
  "Exercice",
  "Preuve / Démonstration",
  "Lemme",
  "Corollaire",
  "Résumé du cours",
  "Evaluation"
]

export function ContentEntryForm({ steps, setSteps, metadata }: ContentEntryFormProps) {
  // Current step state being edited
  const [currentType, setCurrentType] = useState(STEP_TYPES[0])
  const [currentDuration, setCurrentDuration] = useState("")
  const [currentContent, setCurrentContent] = useState("")
  const [currentObservations, setCurrentObservations] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  // Temporary ID for new steps to allow image uploads before saving
  // Initialize with null/empty and set on mount to avoid hydration mismatch
  const [tempId, setTempId] = useState("")

  useEffect(() => {
    setTempId(crypto.randomUUID())
  }, [])

  const handleAddStep = () => {
    if (!currentContent.trim()) {
      toast.warning("Le contenu de l'étape ne peut pas être vide")
      return
    }

    if (editingId) {
      // Update existing step
      setSteps(steps.map(s => s.id === editingId ? {
        ...s,
        type: currentType,
        duration: currentDuration,
        content: currentContent,
        observations: currentObservations
      } : s))
      toast.success("Étape mise à jour")
      setEditingId(null)
    } else {
      // Add new step using the tempId that was used for uploads
      const newStepId = tempId || crypto.randomUUID()
      const newStep: FicheContentStep = {
        id: newStepId,
        type: currentType,
        duration: currentDuration,
        content: currentContent,
        observations: currentObservations
      }
      setSteps([...steps, newStep])
      toast.success("Étape ajoutée")
    }

    // Reset form and generate new tempId for next step
    setCurrentContent("")
    setCurrentObservations("")
    // Keep type/duration as they might be repetitive or sequential
    // But specific duration usually resets if not editing
    if (editingId) setCurrentDuration("")

    // Generate new temp ID for the next step's uploads
    setTempId(crypto.randomUUID())
  }

  const handleEditStep = (step: FicheContentStep) => {
    setCurrentType(step.type)
    setCurrentDuration(step.duration || "")
    setCurrentContent(step.content)
    setCurrentObservations(step.observations || "")
    setEditingId(step.id)

    // Scroll to top of editor
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setCurrentContent("")
    setCurrentObservations("")
    setCurrentDuration("")
  }

  const handleDeleteStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id))
    if (editingId === id) handleCancelEdit()
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    if (direction === 'up' && index > 0) {
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]]
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
    }
    setSteps(newSteps)
  }

  const handleAiGenerated = (newSteps: FicheContentStep[]) => {
    setSteps([...steps, ...newSteps])
    setShowAiModal(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left Column: Editor */}
      <div className="lg:col-span-2 space-y-6">
        <Card className={`border-2 ${editingId ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-primary/20'}`}>
          <CardHeader className={`${editingId ? 'bg-amber-500/10' : 'bg-primary/5'} pb-3 transition-colors`}>
            <CardTitle className="flex justify-between items-center text-lg">
              <span className="flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-700">Modification de l'étape</span>
                  </>
                ) : (
                  <span>Nouvelle Etape</span>
                )}
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowAiModal(true)} className="gap-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0 hover:from-purple-600 hover:to-blue-700">
                <Wand2 className="h-4 w-4" />
                Générer avec IA
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type d'étape</Label>
                <Select value={currentType} onValueChange={setCurrentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STEP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durée (Optionnel)</Label>
                <Input
                  value={currentDuration}
                  onChange={e => setCurrentDuration(e.target.value)}
                  placeholder="Ex: 15 min"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contenu</Label>
              <TiptapEditor
                content={currentContent}
                onChange={setCurrentContent}
                uploaderContext={{
                  // Use editingId if available, otherwise use the tempId for the new step
                  entityId: editingId || tempId || "temp",
                  entityType: "lesson"
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">Utilisez $...$ pour les maths en ligne et $$...$$ pour les blocs.</p>
            </div>

            <div className="space-y-2">
              <Label>Observations (Optionnel)</Label>
              <Textarea
                value={currentObservations}
                onChange={e => setCurrentObservations(e.target.value)}
                placeholder="Notes pour l'enseignant..."
                className="h-20"
              />
            </div>

            <div className="flex gap-2">
              {editingId && (
                <Button variant="outline" onClick={handleCancelEdit} size="lg" className="flex-1 border-amber-500/20 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Annuler
                </Button>
              )}
              <Button
                onClick={handleAddStep}
                className={`flex-[2] ${editingId ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                size="lg"
              >
                {editingId ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Mettre à jour
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter à la Fiche
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List of Added Steps */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Étapes ajoutées <Badge variant="secondary">{steps.length}</Badge>
          </h3>
          {steps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Aucune étape pour le moment. Commencez par en ajouter une.
            </div>
          )}
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <Card
                key={step.id}
                className={`group hover:border-primary/50 transition-all ${editingId === step.id ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-500/20' : ''}`}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`text-center min-w-[3rem] p-2 rounded text-sm font-bold ${editingId === step.id ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-primary">{step.type}</span>
                        {step.duration && <span className="text-xs ml-2 text-muted-foreground">({step.duration})</span>}
                      </div>
                      <div className="flex bg-card border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleMoveStep(idx, 'up')} disabled={idx === 0}>
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleMoveStep(idx, 'down')} disabled={idx === steps.length - 1}>
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <div className="w-px bg-gray-200 mx-1 my-2"></div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-amber-600" onClick={() => handleEditStep(step)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteStep(step.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-foreground/80 line-clamp-2" dangerouslySetInnerHTML={{ __html: step.content }} />
                    {step.observations && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 italic bg-amber-500/10 p-1 rounded inline-block mt-1">
                        Obs: {step.observations}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: LaTeX Helper */}
      <div className="hidden lg:block space-y-4">
        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Aide LaTeX</h4>
        <div className="sticky top-6">
          <LatexHelper />
        </div>
      </div>

      <AiGeneratorModal
        open={showAiModal}
        onOpenChange={setShowAiModal}
        onGenerated={handleAiGenerated}
        metadata={metadata}
      />
    </div>
  )
}
