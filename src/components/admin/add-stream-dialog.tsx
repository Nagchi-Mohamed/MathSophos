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
import { createStream } from "@/actions/streams"
import { toast } from "sonner"

// Avoid importing from @prisma/client in "use client" components
enum EducationalLevel {
  COLLEGE_1AC = 'COLLEGE_1AC',
  COLLEGE_2AC = 'COLLEGE_2AC',
  COLLEGE_3AC = 'COLLEGE_3AC',
  LYCEE_TC = 'LYCEE_TC',
  LYCEE_1BAC = 'LYCEE_1BAC',
  LYCEE_2BAC = 'LYCEE_2BAC',
  UNIVERSITY = 'UNIVERSITY'
}

export function AddStreamDialog({ level }: { level: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [semesterCount, setSemesterCount] = useState(level === EducationalLevel.UNIVERSITY ? 0 : 2)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button className="bg-blue-600 hover:bg-blue-700">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter une filière
      </Button>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createStream({
        name,
        level: level as any, // Cast to any to satisfy server action type
        semesterCount: level === EducationalLevel.UNIVERSITY ? 0 : Number(semesterCount),
      })

      if (result.success) {
        toast.success("Filière créée avec succès")
        setOpen(false)
        setName("")
        setSemesterCount(2)
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
          Ajouter une filière
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle Filière</DialogTitle>
          <DialogDescription>
            Créez une nouvelle filière pour organiser les cours.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la filière</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Génie Informatique"
              required
            />
          </div>
          {level !== EducationalLevel.UNIVERSITY && (
            <div className="space-y-2">
              <Label htmlFor="semesters">Nombre de semestres</Label>
              <Input
                id="semesters"
                type="number"
                min={1}
                max={12}
                value={semesterCount}
                onChange={(e) => setSemesterCount(Number(e.target.value))}
                required
              />
            </div>
          )}
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
