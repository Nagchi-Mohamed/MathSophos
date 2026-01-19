"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Upload, FileText, Trash, Book, Download, Plus, Check, Eye, Pencil, Sparkles, BookOpen } from "lucide-react"
import { getReferences, deleteReference, getLessonsForSelector, updateReference, extractReferenceContent } from "@/actions/references"
import { AuditPanel } from "./audit-panel"
import { useRouter } from "next/navigation"

// Constants
const LEVELS = [
  { value: "COLLEGE_1AC", label: "1ère Année Collège" },
  { value: "COLLEGE_2AC", label: "2ème Année Collège" },
  { value: "COLLEGE_3AC", label: "3ème Année Collège" },
  { value: "LYCEE_TC", label: "Tronc Commun" },
  { value: "LYCEE_1BAC", label: "1ère Bac" },
  { value: "LYCEE_2BAC", label: "2ème Bac" },
  { value: "UNIVERSITY", label: "Université" }
]

const STREAMS = [
  { value: "TC_SCIENCES", label: "TC Sciences" },
  { value: "TC_LETTRES", label: "TC Lettres" },
  { value: "SC_MATH_A", label: "Sc. Math A" },
  { value: "SC_MATH_B", label: "Sc. Math B" },
  { value: "SC_PHYSIQUE", label: "Sc. Physique" },
  { value: "SC_VIE_TERRE", label: "SVT" },
  { value: "SC_ECONOMIE", label: "Eco-Gestion" },
  { value: "LETTRES_HUMAINES", label: "Lettres" }
]

const TYPES = [
  { value: "ORIENTATION", label: "Orientation Pédagogique" },
  { value: "MANUEL", label: "Manuel Scolaire" },
  { value: "COURS", label: "Cours / Résumé" },
  { value: "EXERCICE", label: "Série d'Exercices" },
  { value: "EXAM", label: "Examen / Concours" }
]

const SEMESTERS = [
  { value: 1, label: "Semestre 1" },
  { value: 2, label: "Semestre 2" }
]

export default function ReferencesPage() {
  const router = useRouter()
  const [references, setReferences] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedStreams, setSelectedStreams] = useState<string[]>([])
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([])

  const [targetsAll, setTargetsAll] = useState(true)
  const [targetLessonIds, setTargetLessonIds] = useState<string[]>([])

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [extractingId, setExtractingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [refsRes, lessonsRes] = await Promise.all([
      getReferences(),
      getLessonsForSelector()
    ])

    if (refsRes.success) setReferences(refsRes.data || [])
    if (lessonsRes.success) setLessons(lessonsRes.data || [])

    setLoading(false)
  }

  const handleExtract = async (id: string) => {
    setExtractingId(id)
    toast.info("Analyse du document en cours (IA)...")
    try {
      const res = await extractReferenceContent(id)
      if (res.success) {
        toast.success("Extraction terminée avec succès !")
        loadData()
      } else {
        toast.error("Erreur: " + res.error)
      }
    } catch (err) {
      toast.error("Erreur inattendue")
    }
    setExtractingId(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/pdf") {
        toast.error("Seuls les fichiers PDF sont acceptés")
        return
      }
      setFile(selectedFile)
    }
  }

  const toggleSelection = (list: any[], setList: any, value: any) => {
    if (list.includes(value)) {
      setList(list.filter((item: any) => item !== value))
    } else {
      setList([...list, value])
    }
  }

  const filteredLessons = lessons.filter(l =>
    (selectedLevels.length === 0 || selectedLevels.includes(l.level)) &&
    (selectedStreams.length === 0 || !l.stream || l.stream === "NONE" || selectedStreams.includes(l.stream))
  )

  const startEdit = (ref: any) => {
    setTitle(ref.title)
    setSelectedTypes(ref.types)
    setSelectedLevels(ref.levels)
    setSelectedStreams(ref.streams)
    setSelectedSemesters(ref.semesters)
    setTargetLessonIds(ref.targetLessonIds)
    setTargetsAll(ref.targetsAllLessons)
    setEditingId(ref.id)
    setFile(null)
    setIsDialogOpen(true)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!file && !editingId) || !title) {
      toast.error("Veuillez remplir le titre et le fichier (si nouveau)")
      return
    }

    setUploading(true)

    try {
      if (editingId) {
        const result = await updateReference(editingId, {
          title,
          types: selectedTypes,
          levels: selectedLevels,
          streams: selectedStreams,
          semesters: selectedSemesters,
          targetLessonIds,
          targetsAllLessons: targetsAll
        })

        if (result.success) {
          toast.success("Document mis à jour")
          setIsDialogOpen(false)
          resetForm()
          loadData()
        } else {
          toast.error(result.error || "Erreur lors de la mise à jour")
        }
      } else {
        const formData = new FormData()
        formData.append("file", file!)
        formData.append("title", title)
        formData.append("subject", "MATH")

        formData.append("types", JSON.stringify(selectedTypes))
        formData.append("levels", JSON.stringify(selectedLevels))
        formData.append("streams", JSON.stringify(selectedStreams))
        formData.append("semesters", JSON.stringify(selectedSemesters))
        formData.append("targetLessonIds", JSON.stringify(targetLessonIds))
        formData.append("targetsAllLessons", targetsAll.toString())

        const response = await fetch("/api/admin/references/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (response.ok && result.success) {
          toast.success("Document ajouté avec succès")
          setIsDialogOpen(false)
          resetForm()
          loadData()
        } else {
          toast.error(result.error || "Erreur lors de l'upload")
        }
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setFile(null)
    setSelectedTypes([])
    setSelectedLevels([])
    setSelectedStreams([])
    setSelectedSemesters([])
    setTargetsAll(true)
    setTargetLessonIds([])
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      const result = await deleteReference(id)
      if (result.success) {
        toast.success("Document supprimé")
        loadData()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Bibliothèque de Référence</h1>
        <p className="text-muted-foreground">
          Gérez les documents officiels ou utilisez l'IA pour auditer vos leçons.
        </p>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="documents" className="flex gap-2"><BookOpen className="w-4 h-4" /> Documents</TabsTrigger>
          <TabsTrigger value="audit" className="flex gap-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20"><Sparkles className="w-4 h-4 text-purple-600" /> Audit & Mise à jour IA</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="mr-2 h-4 w-4" /> Ajouter un document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Modifier le document" : "Ajouter un document de référence"}</DialogTitle>
                  <DialogDescription>
                    Configurez les métadonnées (Niveau, Filière, Type) pour que l'IA trouve ce document au bon moment.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Titre du document *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Ex: Orientations Pédagogiques 2BAC"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="file">Fichier PDF {editingId ? "(Optionnel)" : "*"}</Label>
                        <Input
                          id="file"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                          required={!editingId}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Type de contenu</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {TYPES.map(t => (
                            <div key={t.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`type-${t.value}`}
                                checked={selectedTypes.includes(t.value)}
                                onCheckedChange={() => toggleSelection(selectedTypes, setSelectedTypes, t.value)}
                              />
                              <Label htmlFor={`type-${t.value}`} className="cursor-pointer">{t.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Niveaux concernés</Label>
                        <ScrollArea className="h-32 border rounded-md p-2">
                          <div className="space-y-2">
                            {LEVELS.map(l => (
                              <div key={l.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`level-${l.value}`}
                                  checked={selectedLevels.includes(l.value)}
                                  onCheckedChange={() => toggleSelection(selectedLevels, setSelectedLevels, l.value)}
                                />
                                <Label htmlFor={`level-${l.value}`} className="cursor-pointer">{l.label}</Label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="space-y-2">
                        <Label>Filières (Optionnel)</Label>
                        <ScrollArea className="h-32 border rounded-md p-2">
                          <div className="space-y-2">
                            {STREAMS.map(s => (
                              <div key={s.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`stream-${s.value}`}
                                  checked={selectedStreams.includes(s.value)}
                                  onCheckedChange={() => toggleSelection(selectedStreams, setSelectedStreams, s.value)}
                                />
                                <Label htmlFor={`stream-${s.value}`} className="cursor-pointer">{s.label}</Label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="space-y-2">
                        <Label>Semestre</Label>
                        <div className="flex gap-4">
                          {SEMESTERS.map(s => (
                            <div key={s.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`sem-${s.value}`}
                                checked={selectedSemesters.includes(s.value)}
                                onCheckedChange={() => toggleSelection(selectedSemesters, setSelectedSemesters, s.value)}
                              />
                              <Label htmlFor={`sem-${s.value}`} className="cursor-pointer">{s.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-lg font-semibold mb-2 block">Ciblage Leçons</Label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="targetsAll"
                          checked={targetsAll}
                          onCheckedChange={(c) => {
                            setTargetsAll(!!c)
                            if (c) setTargetLessonIds([])
                          }}
                        />
                        <Label htmlFor="targetsAll" className="cursor-pointer font-medium">
                          Ce document s'applique à toutes les leçons des niveaux sélectionnés (Ex: Orientation Pédagogique)
                        </Label>
                      </div>

                      {!targetsAll && (
                        <div className="pl-6 border-l-2 border-muted ml-1">
                          <Label className="mb-2 block">Sélectionner les leçons spécifiques :</Label>
                          <ScrollArea className="h-48 border rounded-md p-2 bg-muted/20">
                            {filteredLessons.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-2">Sélectionnez d'abord un niveau pour voir les leçons disponibles.</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {filteredLessons.map(lesson => (
                                  <div key={lesson.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`lesson-${lesson.id}`}
                                      checked={targetLessonIds.includes(lesson.id)}
                                      onCheckedChange={() => toggleSelection(targetLessonIds, setTargetLessonIds, lesson.id)}
                                    />
                                    <Label htmlFor={`lesson-${lesson.id}`} className="cursor-pointer text-sm truncate" title={lesson.titleFr}>
                                      {lesson.titleFr}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Extraction & Upload...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {editingId ? "Modifier" : "Ajouter"}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {references.map((ref) => (
              <Card key={ref.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-wrap gap-1">
                      {ref.types.map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => startEdit(ref)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(ref.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="line-clamp-2 mt-2 leading-tight" title={ref.title}>
                    {ref.title}
                  </CardTitle>
                  <CardDescription className="text-xs space-y-1 mt-2">
                    <div>
                      {ref.levels.length > 0 ? ref.levels.join(", ") : "Tous niveaux"}
                    </div>
                    {ref.streams.length > 0 && (
                      <div>{ref.streams.length} filières</div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      <span>{(ref.textContent?.length || 0).toLocaleString()} chars</span>
                    </div>
                    {ref.targetsAllLessons ? (
                      <Badge variant="outline" className="text-[10px]">Global (Toutes leçons)</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">{ref.targetLessonIds.length} leçons ciblées</Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewUrl(ref.fileUrl)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir
                  </Button>

                  {ref.extractedData ? (
                    <Button variant="secondary" size="icon" title="Contenu Structuré prêt (IA)" className="text-green-600 bg-green-50 hover:bg-green-100">
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="text-purple-600 bg-purple-50 hover:bg-purple-100"
                      title="Analyser avec l'IA"
                      onClick={() => handleExtract(ref.id)}
                      disabled={extractingId === ref.id}
                    >
                      {extractingId === ref.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  )}

                  <Button variant="secondary" size="icon" asChild title="Télécharger">
                    <a href={ref.fileUrl} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-4 border-b">
                <DialogTitle>Aperçu du document</DialogTitle>
              </DialogHeader>
              <div className="flex-1 w-full bg-gray-100 overflow-hidden">
                {previewUrl && (
                  <iframe
                    src={`${previewUrl}#toolbar=0`}
                    className="w-full h-full border-none"
                    title="PDF Preview"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="audit">
          <AuditPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
