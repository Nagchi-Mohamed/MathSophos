import { getUserFiches } from "@/actions/fiches"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { FichesList } from "@/components/fiches/fiches-list"

export default async function TeacherFichesPage() {
  const session = await auth()

  // Require authentication
  if (!session) redirect("/auth/login")

  // Only TEACHER, EDITOR, and ADMIN can access
  if (!['TEACHER', 'EDITOR', 'ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  const fiches = await getUserFiches()

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mes Fiches Pédagogiques</h1>
          <p className="text-muted-foreground">Gérez vos plans de cours.</p>
        </div>
        <Link href="/teacher/fiches/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Fiche
          </Button>
        </Link>
      </div>

      <FichesList initialFiches={fiches} isAdmin={session.user.role === 'ADMIN'} />
    </div>
  )
}
