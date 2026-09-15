'use client'

import { useState, useEffect } from "react"
import { CreateFicheInput, FicheSession } from "@/actions/fiches"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TiptapEditor } from "@/components/admin/tiptap-editor"
import { LatexHelper } from "./latex-helper"
import { MathSophosIcon } from "@/components/ui/math-sophos-logo"
import { Trash2, MoveUp, MoveDown, Plus, Edit, Save, FileSpreadsheet } from "lucide-react"
import { AiGeneratorModal } from "./ai-generator-modal"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { FicheContentRenderer } from "./fiche-content-renderer"

interface ContentEntryFormProps {
  steps: any[]
  setSteps: (steps: any[]) => void
  metadata: Omit<CreateFicheInput, "content">
}

export function ContentEntryForm({ steps, setSteps, metadata }: ContentEntryFormProps) {
  // Current 4-column session state being edited
  const [currentTitle, setCurrentTitle] = useState("")
  const [currentDuration, setCurrentDuration] = useState("")
  const [currentDemarche, setCurrentDemarche] = useState("")
  const [currentTraceEcrite, setCurrentTraceEcrite] = useState("")
  const [currentEvaluation, setCurrentEvaluation] = useState("")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [tempId, setTempId] = useState("")

  useEffect(() => {
    setTempId(crypto.randomUUID())
  }, [])

  // Normalize step into 4-column format
  const normalizeSession = (item: any, idx: number): FicheSession => {
    return {
      id: item.id || `session-${idx + 1}`,
      title: item.title || item.type || `Séance ${idx + 1}`,
      duration: item.duration || "",
      demarche: item.demarche || item.content || "",
      traceEcrite: item.traceEcrite || item.content || "",
      evaluation: item.evaluation || item.observations || ""
    }
  }

  const normalizedSteps: FicheSession[] = steps.map((s, idx) => normalizeSession(s, idx))

  const handleAddSession = () => {
    if (!currentTitle.trim() && !currentTraceEcrite.trim() && !currentDemarche.trim()) {
      toast.warning("Veuillez remplir au moins le titre ou le contenu de la séance")
      return
    }

    const sessionNum = steps.length + 1
    const newSession: FicheSession = {
      id: editingId || tempId || crypto.randomUUID(),
      title: currentTitle.trim() || `Séance ${sessionNum}`,
      duration: currentDuration.trim(),
      demarche: currentDemarche,
      traceEcrite: currentTraceEcrite,
      evaluation: currentEvaluation
    }

    if (editingId) {
      setSteps(normalizedSteps.map(s => s.id === editingId ? newSession : s))
      toast.success("Séance mise à jour")
      setEditingId(null)
    } else {
      setSteps([...normalizedSteps, newSession])
      toast.success("Séance ajoutée au scénario")
    }

    // Reset editor inputs
    setCurrentTitle("")
    setCurrentDuration("")
    setCurrentDemarche("")
    setCurrentTraceEcrite("")
    setCurrentEvaluation("")
    setTempId(crypto.randomUUID())
  }

  const handleEditSession = (session: FicheSession) => {
    setCurrentTitle(session.title)
    setCurrentDuration(session.duration || "")
    setCurrentDemarche(session.demarche || "")
    setCurrentTraceEcrite(session.traceEcrite || "")
    setCurrentEvaluation(session.evaluation || "")
    setEditingId(session.id)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setCurrentTitle("")
    setCurrentDuration("")
    setCurrentDemarche("")
    setCurrentTraceEcrite("")
    setCurrentEvaluation("")
  }

  const handleDeleteSession = (id: string) => {
    setSteps(normalizedSteps.filter(s => s.id !== id))
    if (editingId === id) handleCancelEdit()
  }

  const handleMoveSession = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...normalizedSteps]
    if (direction === 'up' && index > 0) {
      [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]]
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]]
    }
    setSteps(newSteps)
  }

  const handleAiGenerated = (result: { metadata: Partial<Omit<CreateFicheInput, "content">>; sessions: any[] }) => {
    if (result.sessions && result.sessions.length > 0) {
      setSteps([...normalizedSteps, ...result.sessions])
    }
    setShowAiModal(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left Column: 4-Column Session Editor */}
      <div className="lg:col-span-2 space-y-6">
        <Card className={`border-2 ${editingId ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-primary/20'}`}>
          <CardHeader className={`${editingId ? 'bg-amber-500/10' : 'bg-primary/5'} pb-3 transition-colors`}>
            <CardTitle className="flex justify-between items-center text-lg">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                {editingId ? (
                  <span className="text-amber-700">Modification de la séance</span>
                ) : (
                  <span>Nouvelle Séance (Scénario à 4 colonnes)</span>
                )}
              </span>
              <Button variant="outline" size="sm" onClick={() => setShowAiModal(true)} className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                <MathSophosIcon size={16} />
                Générer avec IA
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            
            {/* Header / Session Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="font-semibold text-primary">1. Titre de la Séance *</Label>
                <Input
                  value={currentTitle}
                  onChange={e => setCurrentTitle(e.target.value)}
                  placeholder="Ex: Séance 1 --- Ensemble ℕ et Parité"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-primary">2. Durée de la Séance</Label>
                <Input
                  value={currentDuration}
                  onChange={e => setCurrentDuration(e.target.value)}
                  placeholder="Ex: 2 h ou 1 h 30"
                />
              </div>
            </div>

            {/* Column 2: Démarche & Activités */}
            <div className="space-y-2">
              <Label className="font-semibold text-[#1B3A5C] flex items-center justify-between">
                <span>Colonne 2 : Démarche & Activités (Activités d'initiation, questions guidées)</span>
              </Label>
              <TiptapEditor
                content={currentDemarche}
                onChange={setCurrentDemarche}
                uploaderContext={{
                  entityId: editingId || tempId || "temp",
                  entityType: "lesson"
                }}
              />
            </div>

            {/* Column 3: Trace écrite */}
            <div className="space-y-2">
              <Label className="font-semibold text-[#1B3A5C] flex items-center justify-between">
                <span>Colonne 3 : Trace écrite (Contenu du cours, Définitions, Théorèmes, Formules LaTeX)</span>
              </Label>
              <TiptapEditor
                content={currentTraceEcrite}
                onChange={setCurrentTraceEcrite}
                uploaderContext={{
                  entityId: editingId || tempId || "temp",
                  entityType: "lesson"
                }}
              />
              <p className="text-xs text-muted-foreground">Formules mathématiques: utilisez $...$ pour l'inline et $$...$$ pour les blocs.</p>
            </div>

            {/* Column 4: Évaluation / Applications */}
            <div className="space-y-2">
              <Label className="font-semibold text-[#1B3A5C]">Colonne 4 : Évaluation / Applications (Exercices d'application directe)</Label>
              <Textarea
                value={currentEvaluation}
                onChange={e => setCurrentEvaluation(e.target.value)}
                placeholder="Ex: Application 1 --- Étudier la parité de : 1359 + 59321 ; 978² - 65²..."
                className="h-24 font-mono text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {editingId && (
                <Button variant="outline" onClick={handleCancelEdit} size="lg" className="flex-1 border-amber-500/20 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Annuler
                </Button>
              )}
              <Button
                onClick={handleAddSession}
                className={`flex-[2] ${editingId ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                size="lg"
              >
                {editingId ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Mettre à jour la séance
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter cette séance au plan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List of Added Sessions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Séances de la séquence <Badge variant="secondary">{normalizedSteps.length}</Badge>
          </h3>
          {normalizedSteps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Aucune séance enregistrée. Remplissez le formulaire ci-dessus pour ajouter votre première séance.
            </div>
          )}
          <div className="space-y-4">
            {normalizedSteps.map((session, idx) => (
              <Card
                key={session.id}
                className={`group hover:border-primary/50 transition-all ${editingId === session.id ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-500/20' : ''}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#1B3A5C] text-white">Séance {idx + 1}</Badge>
                      <h4 className="font-bold text-base text-[#1B3A5C]">
                        <FicheContentRenderer content={session.title} />
                      </h4>
                      {session.duration && <span className="text-xs text-muted-foreground font-medium">({session.duration})</span>}
                    </div>
                    <div className="flex bg-card border rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleMoveSession(idx, 'up')} disabled={idx === 0}>
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleMoveSession(idx, 'down')} disabled={idx === normalizedSteps.length - 1}>
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <div className="w-px bg-gray-200 mx-1 my-2"></div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-amber-600" onClick={() => handleEditSession(session)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteSession(session.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 4 Columns Preview Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-muted/30 p-3 rounded-md border">
                    <div>
                      <span className="font-bold text-[#1B3A5C] block mb-1">Démarche & Activités :</span>
                      <FicheContentRenderer content={session.demarche || "<span class='text-gray-400 italic'>Vide</span>"} />
                    </div>
                    <div>
                      <span className="font-bold text-[#1B3A5C] block mb-1">Trace écrite (Cours) :</span>
                      <FicheContentRenderer content={session.traceEcrite || "<span class='text-gray-400 italic'>Vide</span>"} />
                    </div>
                    <div>
                      <span className="font-bold text-[#1B3A5C] block mb-1">Évaluation :</span>
                      <FicheContentRenderer content={session.evaluation || "<span class='text-gray-400 italic'>Vide</span>"} />
                    </div>
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
