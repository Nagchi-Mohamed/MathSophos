"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { deleteLesson } from "@/actions/admin"
import Link from "next/link"
import { LessonStatus } from "@/lib/enums"

export type Lesson = {
  id: string
  titleFr: string
  slug: string
  category: string | null
  level: string
  status: LessonStatus
  createdAt: Date
}

export const columns: ColumnDef<Lesson>[] = [
  {
    accessorKey: "titleFr",
    header: "Titre",
    cell: ({ row }) => {
      return <span className="font-medium">{row.getValue("titleFr")}</span>
    },
  },
  {
    accessorKey: "category",
    header: "Catégorie",
  },
  {
    accessorKey: "level",
    header: "Niveau",
    cell: ({ row }) => {
      return <Badge variant="outline">{row.getValue("level")}</Badge>
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>
          {status === "PUBLISHED" ? "Publié" : "Brouillon"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Créé le",
    cell: ({ row }) => {
      return new Date(row.getValue("createdAt")).toLocaleDateString("fr-FR")
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lesson = row.original

      const handleDelete = async () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cette leçon ?")) {
          const result = await deleteLesson(lesson.id)
          if (result.success) {
            toast.success(result.message)
            window.location.reload()
          } else {
            toast.error(result.message)
          }
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/content/${lesson.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
