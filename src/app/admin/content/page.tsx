import { prisma } from "@/lib/prisma"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      titleFr: true,
      slug: true,
      category: true,
      level: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text w-fit">Contenu</h1>
          <p className="text-muted-foreground">
            Gérez les leçons et exercices de la plateforme.
          </p>
        </div>
        <Link href="/admin/content/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Leçon
          </Button>
        </Link>
      </div>

      <DataTable columns={columns} data={lessons as any} searchKey="titleFr" />
    </div>
  )
}
