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
import { renameModule } from "@/actions/modules"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface RenameModuleButtonProps {
  moduleId: string
  moduleName: string
}

export function RenameModuleButton({ moduleId, moduleName }: RenameModuleButtonProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState(moduleName)
  const router = useRouter()

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === moduleName) {
      setOpen(false)
      return
    }

    setIsRenaming(true)
    try {
      const result = await renameModule(moduleId, newName.trim())
      if (result.success) {
        toast.success("Module renommé avec succès")
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
            setNewName(moduleName)
          }}
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Renommer</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renommer le module</DialogTitle>
          <DialogDescription>
            Modifiez le nom du module "{moduleName}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nouveau nom</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du module"
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
            disabled={isRenaming || !newName.trim() || newName.trim() === moduleName}
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
