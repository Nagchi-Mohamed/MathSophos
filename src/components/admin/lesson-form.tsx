"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createLesson, updateLesson } from "@/actions/admin"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, FileText } from "lucide-react"
import Link from "next/link"
import { LESSON_EXAMPLE } from "@/lib/content-examples"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"

import { LessonStatus } from "@/lib/enums"

type LessonFormProps = {
  lesson?: {
    id: string
    titleFr: string
    slug: string
    contentFr: string | null
    category: string | null
    level: string
    status: LessonStatus
    semester: number
  }
}

export function LessonForm({ lesson }: LessonFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: lesson?.titleFr || "",
    slug: lesson?.slug || "",
    content: lesson?.contentFr || "",
    category: lesson?.category || "",
    level: lesson?.level || "COLLEGE_1",
    status: lesson?.status || "DRAFT" as "DRAFT" | "PUBLISHED",
    semester: lesson?.semester || 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = lesson
      ? await updateLesson(lesson.id, formData)
      : await createLesson(formData)

    if (result.success) {
      toast.success(result.message)
      router.push("/admin/content")
    } else {
      toast.error(result.message)
    }
    setLoading(false)
  }

  const loadExample = () => {
    setFormData({
      ...formData,
      title: "Les Suites Numériques",
      content: LESSON_EXAMPLE
    })
    toast.success("Exemple chargé avec succès")
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight gradient-text w-fit">
          {lesson ? "Modifier la Leçon" : "Nouvelle Leçon"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Algèbre, Géométrie..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Niveau</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLLEGE_1">1ère Année Collège</SelectItem>
                    <SelectItem value="COLLEGE_2">2ème Année Collège</SelectItem>
                    <SelectItem value="COLLEGE_3">3ème Année Collège</SelectItem>
                    <SelectItem value="LYCEE_TC">Tronc Commun</SelectItem>
                    <SelectItem value="LYCEE_1BAC">1ère Bac</SelectItem>
                    <SelectItem value="LYCEE_2BAC">2ème Bac</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semestre</Label>
                <Select
                  value={String(formData.semester)}
                  onValueChange={(v) => setFormData({ ...formData, semester: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semestre 1</SelectItem>
                    <SelectItem value="2">Semestre 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Brouillon</SelectItem>
                    <SelectItem value="PUBLISHED">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contenu (Markdown)</CardTitle>
            <div className="flex gap-2">
              <VideoUploadManager
                entityType="lesson"
                entityId={lesson?.id || ""}
                onInsert={(url) => {
                  setFormData(prev => ({ ...prev, content: prev.content + "\n" + url + "\n" }));
                  toast.success("Vidéo insérée");
                }}
              />
              <Button type="button" onClick={loadExample} variant="secondary" size="sm">
                <FileText className="mr-2 h-4 w-4" /> Charger un exemple
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={20}
              className="font-mono"
              placeholder="# Introduction&#10;&#10;Votre contenu en Markdown..."
              required
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  )
}
