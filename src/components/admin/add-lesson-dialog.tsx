"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createLesson } from "@/actions/content"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EducationalLevel } from "@prisma/client"

interface AddLessonDialogProps {
  moduleId: string
  moduleName: string
  educationalStreamId: string
}

export function AddLessonDialog({ moduleId, moduleName, educationalStreamId }: AddLessonDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lessonName, setLessonName] = useState("")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button className="bg-blue-600 hover:bg-blue-700">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter une leçon
      </Button>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!lessonName.trim()) {
      toast.error("Le nom de la leçon est requis")
      return
    }

    setLoading(true)

    try {
      const result = await createLesson({
        title: lessonName,
        content: "{}",
        level: EducationalLevel.UNIVERSITY,
        stream: "NONE" as any,
        subject: "Mathematics",
        status: "DRAFT",
        semester: 1, // Default value
        educationalStreamId: educationalStreamId,
        moduleId: moduleId,
      })

      if (result.success) {
        toast.success(`Leçon "${lessonName}" créée avec succès`)
        setOpen(false)
        setLessonName("")
        router.refresh()
      } else {
        toast.error("Erreur: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une leçon
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle Leçon</DialogTitle>
          <DialogDescription>
            Créez une nouvelle leçon pour le module "{moduleName}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lessonName">Nom de la leçon</Label>
            <Input
              id="lessonName"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              placeholder="Ex: Analyse 1, Algèbre..."
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
