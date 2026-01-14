"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ExamActions } from "@/components/admin/exam-actions"

export type Exam = {
  id: string
  title: string
  type: string
  cycle: string
  level: string
  stream: string
  createdBy: {
    name: string | null
  }
  createdAt: Date
}

export const columns: ColumnDef<Exam>[] = [
  {
    accessorKey: "title",
    header: "Titre",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="font-medium">{row.original.title}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.type === "EXAM" ? "default" : "secondary"}>
        {row.original.type === "EXAM" ? "Examen" : "Contrôle"}
      </Badge>
    ),
  },
  {
    accessorKey: "cycle",
    header: "Cycle",
    cell: ({ row }) => <span>{row.original.cycle}</span>,
  },
  {
    accessorKey: "level",
    header: "Niveau",
    cell: ({ row }) => <span>{row.original.level}</span>,
  },
  {
    accessorKey: "stream",
    header: "Filière",
    cell: ({ row }) => <span>{row.original.stream}</span>,
  },
  {
    accessorKey: "createdBy.name",
    header: "Créé par",
    cell: ({ row }) => <span>{row.original.createdBy.name || "Inconnu"}</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Date de création",
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {format(new Date(row.original.createdAt), "dd/MM/yyyy", { locale: fr })}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <ExamActions exam={{ id: row.original.id }} />
    ),
  },
]
