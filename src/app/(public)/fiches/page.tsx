import { getPublicFiches } from "@/actions/fiches"
import { FichesList } from "@/components/fiches/fiches-list"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function PublicFichesPage() {
  const session = await auth()

  // Only TEACHER, EDITOR, and ADMIN can access Fiches Pédagogiques
  if (!session?.user?.role || !['TEACHER', 'EDITOR', 'ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  const fiches = await getPublicFiches()

  return (
    <div className="container mx-auto py-12 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Fiches Pédagogiques</h1>
          <p className="text-xl text-muted-foreground">
            Ressources pédagogiques partagées par la communauté.
          </p>
        </div>

        <Link href="/teacher/fiches/create">
          <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
            <Plus className="mr-2 h-5 w-5" />
            Nouvelle Fiche
          </Button>
        </Link>
      </div>

      <FichesList initialFiches={fiches} isPublicView={true} />
    </div>
  )
}
