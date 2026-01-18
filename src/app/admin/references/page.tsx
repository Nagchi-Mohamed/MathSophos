"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Upload, FileText, Trash, Book, Download, Search, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getReferences, deleteReference } from "@/actions/references"
import { useRouter } from "next/navigation"

export default function ReferencesPage() {
  const router = useRouter()
  const [references, setReferences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Upload Form State
  const [title, setTitle] = useState("")
  const [type, setType] = useState("GUIDELINE")
  const [level, setLevel] = useState("LYCEE_2BAC")
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadReferences()
  }, [])

  const loadReferences = async () => {
    setLoading(true)
    const result = await getReferences()
    if (result.success) {
      setReferences(result.data || [])
    } else {
      toast.error("Erreur lors du chargement des références")
    }
    setLoading(false)
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("title", title)
    formData.append("type", type)
    formData.append("level", level)
    formData.append("subject", "MATH")

    try {
      const response = await fetch("/api/admin/references/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success("Document ajouté avec succès")
        setIsDialogOpen(false)
        setTitle("")
        setFile(null)
        loadReferences()
      } else {
        toast.error(result.error || "Erreur lors de l'upload")
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      const result = await deleteReference(id)
      if (result.success) {
        toast.success("Document supprimé")
        loadReferences()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    }
  }

  const getLevelLabel = (lvl: string) => {
    const map: Record<string, string> = {
      "COLLEGE_1AC": "1ère Année Collège",
      "COLLEGE_2AC": "2ème Année Collège",
      "COLLEGE_3AC": "3ème Année Collège",
      "LYCEE_TC": "Tronc Commun",
      "LYCEE_1BAC": "1ère Bac",
      "LYCEE_2BAC": "2ème Bac",
    }
    return map[lvl] || lvl
  }

  const getTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      "GUIDELINE": "Orientation Pédagogique",
      "TEXTBOOK": "Manuel Scolaire",
      "OTHER": "Autre",
    }
    return map[t] || t
  }

  const getTypeColor = (t: string) => {
    if (t === "GUIDELINE") return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    if (t === "TEXTBOOK") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bibliothèque de Référence</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les documents officiels (OP, Manuels) utilisés par l'IA pour générer du contenu conforme.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" /> Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter un document de référence</DialogTitle>
              <DialogDescription>
                Téléversez un PDF (ex: Orientation Pédagogique). Le texte sera extrait pour l'IA.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Orientations Pédagogiques 2BAC"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GUIDELINE">Orientation Pédagogique</SelectItem>
                      <SelectItem value="TEXTBOOK">Manuel Scolaire</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Niveau</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COLLEGE_1AC">1ère Année Collège</SelectItem>
                      <SelectItem value="COLLEGE_2AC">2ème Année Collège</SelectItem>
                      <SelectItem value="COLLEGE_3AC">3ème Année Collège</SelectItem>
                      <SelectItem value="LYCEE_TC">Tronc Commun</SelectItem>
                      <SelectItem value="LYCEE_1BAC">1ère Bac</SelectItem>
                      <SelectItem value="LYCEE_2BAC">2ème Bac</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Fichier PDF</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    required
                  />
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
                      Ajouter
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : references.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
          <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Aucun document</h3>
          <p className="text-muted-foreground">Ajoutez des documents de référence pour améliorer la génération IA.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {references.map((ref) => (
            <Card key={ref.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="outline" className={getTypeColor(ref.type)}>
                    {getTypeLabel(ref.type)}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(ref.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="line-clamp-2 mt-2" title={ref.title}>
                  {ref.title}
                </CardTitle>
                <CardDescription>
                  {getLevelLabel(ref.level)} • {ref.subject}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span>{(ref.textContent?.length || 0).toLocaleString()} caractères extraits</span>
                  </div>
                  <div className="text-xs">
                    Ajouté le {new Date(ref.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 border-t">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={ref.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger PDF
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
