'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CreateFicheInput } from "@/actions/fiches"
import { EducationalLevel, Stream } from "@/lib/enums"

interface MetadataFormProps {
  data: Omit<CreateFicheInput, "content">
  onChange: (data: Omit<CreateFicheInput, "content">) => void
  onNext: () => void
}

export function MetadataForm({ data, onChange, onNext }: MetadataFormProps) {
  const handleChange = (field: keyof typeof data, value: any) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* 1. FICHE TECHNIQUE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            1. Fiche technique & Informations Générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom du Professeur *</Label>
              <Input
                value={data.teacherName}
                onChange={(e) => handleChange("teacherName", e.target.value)}
                placeholder="Ex: Mohamed Nagchi"
              />
            </div>
            <div className="space-y-2">
              <Label>Établissement (Lycée / Collège) *</Label>
              <Input
                value={data.schoolName}
                onChange={(e) => handleChange("schoolName", e.target.value)}
                placeholder="Ex: Lycée Hassan I"
              />
            </div>

            <div className="space-y-2">
              <Label>Matière</Label>
              <Input
                value={data.subject || "Mathématiques"}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder="Ex: Mathématiques"
              />
            </div>

            <div className="space-y-2">
              <Label>Année Scolaire</Label>
              <Input
                value={data.schoolYear || "2025 – 2026"}
                onChange={(e) => handleChange("schoolYear", e.target.value)}
                placeholder="Ex: 2025 – 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Niveau *</Label>
              <Select
                value={data.gradeLevel}
                onValueChange={(val) => handleChange("gradeLevel", val as EducationalLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le niveau" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EducationalLevel).map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filière</Label>
              <Select
                value={data.stream || "NONE"}
                onValueChange={(val) => handleChange("stream", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la filière" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Stream).map((stream) => (
                    <SelectItem key={stream} value={stream}>{stream}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Manuel Scolaire</Label>
              <Input
                value={data.textbook || "Najah"}
                onChange={(e) => handleChange("textbook", e.target.value)}
                placeholder="Ex: Najah"
              />
            </div>

            <div className="space-y-2">
              <Label>Durée Globale *</Label>
              <Input
                value={data.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                placeholder="Ex: 7 heures"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Titre du Chapitre / Leçon *</Label>
            <Input
              value={data.lessonTitle || ""}
              onChange={(e) => handleChange("lessonTitle", e.target.value)}
              placeholder="Ex: Arithmétique dans ℕ"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. CADRE PÉDAGOGIQUE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            2. Cadre Pédagogique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Capacités Attendues (liste à puces)</Label>
            <Textarea
              value={data.capacities || ""}
              onChange={(e) => handleChange("capacities", e.target.value)}
              placeholder="• Utiliser la parité et la décomposition en produit de facteurs premiers&#10;• Maîtriser les notions de multiple, diviseur, PGCD et PPMC"
              className="h-28"
            />
          </div>

          <div className="space-y-2">
            <Label>Contenus du Programme (liste à puces)</Label>
            <Textarea
              value={data.programContents || ""}
              onChange={(e) => handleChange("programContents", e.target.value)}
              placeholder="• Les nombres pairs et les nombres impairs&#10;• Multiples, PPMC, diviseurs, PGCD&#10;• Nombres premiers"
              className="h-28"
            />
          </div>

          <div className="space-y-2">
            <Label>Recommandations / Orientations Pédagogiques</Label>
            <Textarea
              value={data.pedagogicalGuidelines || ""}
              onChange={(e) => handleChange("pedagogicalGuidelines", e.target.value)}
              placeholder="Introduire progressivement les symboles ∈, ∉, ⊂, ∩, ∪..."
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pré-requis</Label>
              <Textarea
                value={data.prerequisites || ""}
                onChange={(e) => handleChange("prerequisites", e.target.value)}
                placeholder="Opérations dans ℕ ; notion élémentaire de divisibilité..."
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Outils Didactiques</Label>
              <Textarea
                value={data.didacticTools || ""}
                onChange={(e) => handleChange("didacticTools", e.target.value)}
                placeholder="Tableau, craie, manuel scolaire (Najah), fiches d'activités, GeoGebra..."
                className="h-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. BILAN DE LA SÉQUENCE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            3. Bilan de la Séquence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bilan de la Séquence</Label>
              <Textarea
                value={data.bilanSequence || ""}
                onChange={(e) => handleChange("bilanSequence", e.target.value)}
                placeholder="Appréciation globale de la séquence..."
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>Difficultés Constatées</Label>
              <Textarea
                value={data.difficultiesObserved || ""}
                onChange={(e) => handleChange("difficultiesObserved", e.target.value)}
                placeholder="Difficultés rencontrées par les élèves..."
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>Remédiation Proposée</Label>
              <Textarea
                value={data.remediationProposed || ""}
                onChange={(e) => handleChange("remediationProposed", e.target.value)}
                placeholder="Actions correctives et exercices de soutien..."
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>Observations</Label>
              <Textarea
                value={data.observations || ""}
                onChange={(e) => handleChange("observations", e.target.value)}
                placeholder="Remarques complémentaires..."
                className="h-20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onNext} size="lg">Suivant: Scénario / Déroulement</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
