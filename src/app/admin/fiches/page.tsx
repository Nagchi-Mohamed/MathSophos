import { getAllFiches } from "@/actions/fiches"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { FichesList } from "@/components/fiches/fiches-list"
import { FicheHelpButton } from "@/components/admin/fiche-help-button"

export default async function AdminFichesPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/")

  const fiches = await getAllFiches()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Gestion des Fiches Pédagogiques</h1>
          <FicheHelpButton />
        </div>
      </div>

      <FichesList initialFiches={fiches} isAdmin={true} />
    </div>
  )
}
