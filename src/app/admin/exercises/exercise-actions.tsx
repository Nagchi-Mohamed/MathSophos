"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Eye, Edit, Trash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteExercise } from "@/actions/content"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ExerciseActionsProps {
  exercise: {
    id: string
  }
}

export function ExerciseActions({ exercise }: ExerciseActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet exercice ?")) return

    setIsDeleting(true)
    try {
      const result = await deleteExercise(exercise.id)
      if (result.success) {
        toast.success("Exercice supprimé avec succès")
        router.refresh()
      } else {
        toast.error("Erreur lors de la suppression: " + result.error)
      }
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/exercises`} target="_blank">
            <Eye className="mr-2 h-4 w-4" /> Voir
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/exercises/${exercise.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Modifier
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600 cursor-pointer"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
