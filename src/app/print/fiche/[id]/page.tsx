import { getFiche } from "@/actions/fiches"
import { notFound } from "next/navigation"
import { FichePrintContent } from "@/components/fiches/fiche-print-content"

export default async function FichePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const fiche = await getFiche(id)

  if (!fiche) {
    notFound()
  }

  return <FichePrintContent fiche={fiche} />
}
