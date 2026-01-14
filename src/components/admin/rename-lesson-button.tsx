"use client"

import { useState } from "react"
import { Edit2, Loader2 } from "lucide-react"
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
import { renameLesson } from "@/actions/content"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface RenameLessonButtonProps {
  lessonId: string
  lessonTitle: string
}

export function RenameLessonButton({ lessonId, lessonTitle }: RenameLessonButtonProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [open, setOpen] = useState(false)
  const [newTitle, setNewTitle] = useState(lessonTitle)
  const router = useRouter()

  const handleRename = async () => {
    if (!newTitle.trim() || newTitle.trim() === lessonTitle) {
      setOpen(false)
      return
    }

    setIsRenaming(true)
    try {
      const result = await renameLesson(lessonId, newTitle.trim())
      if (result.success) {
        toast.success("Leçon renommée avec succès")
        setOpen(false)
        router.refresh()
      } else {
        toast.error("Erreur lors du renommage: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur inattendue s'est produite")
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            setNewTitle(lessonTitle)
          }}
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Renommer</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renommer la leçon</DialogTitle>
          <DialogDescription>
            Modifiez le titre de la leçon "{lessonTitle}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nouveau titre</Label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titre de la leçon"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isRenaming}
          >
            Annuler
          </Button>
          <Button
            onClick={handleRename}
            disabled={isRenaming || !newTitle.trim() || newTitle.trim() === lessonTitle}
          >
            {isRenaming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Renommage...
              </>
            ) : (
              "Renommer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
