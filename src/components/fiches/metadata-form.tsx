'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CreateFicheInput } from "@/actions/fiches"
import { EducationalLevel, Stream } from "@prisma/client"

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
    <Card>
      <CardHeader>
        <CardTitle>Informations Générales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom du Professeur *</Label>
            <Input
              value={data.teacherName}
              onChange={(e) => handleChange("teacherName", e.target.value)}
              placeholder="Ex: M. Alaoui"
            />
          </div>
          <div className="space-y-2">
            <Label>Etablissement (Lycée/Collège) *</Label>
            <Input
              value={data.schoolName}
              onChange={(e) => handleChange("schoolName", e.target.value)}
              placeholder="Ex: Lycée Ibn Sina"
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
            <Label>Semestre</Label>
            <Select
              value={data.semester?.toString() || "1"}
              onValueChange={(val) => handleChange("semester", parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semestre 1</SelectItem>
                <SelectItem value="2">Semestre 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Durée *</Label>
            <Input
              value={data.duration}
              onChange={(e) => handleChange("duration", e.target.value)}
              placeholder="Ex: 6 heures"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Titre de la Leçon</Label>
          <Input
            value={data.lessonTitle || ""}
            onChange={(e) => handleChange("lessonTitle", e.target.value)}
            placeholder="Ex: Les Suites Numériques"
          />
        </div>

        <div className="space-y-2">
          <Label>Orientations Pédagogiques</Label>
          <Textarea
            value={data.pedagogicalGuidelines || ""}
            onChange={(e) => handleChange("pedagogicalGuidelines", e.target.value)}
            placeholder="Directives officielles..."
            className="h-24"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pré-requis</Label>
            <Textarea
              value={data.prerequisites || ""}
              onChange={(e) => handleChange("prerequisites", e.target.value)}
              placeholder="Notions que l'élève doit déjà connaitre..."
              className="h-24"
            />
          </div>
          <div className="space-y-2">
            <Label>Extensions</Label>
            <Textarea
              value={data.extensions || ""}
              onChange={(e) => handleChange("extensions", e.target.value)}
              placeholder="Activités complémentaires, liens avec d'autres chapitres..."
              className="h-24"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Outils Didactiques</Label>
          <Textarea
            value={data.didacticTools || ""}
            onChange={(e) => handleChange("didacticTools", e.target.value)}
            placeholder="Tableau, Livre, Calculatrice..."
            className="h-20"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onNext}>Suivant: Contenu</Button>
        </div>
      </CardContent>
    </Card>
  )
}
