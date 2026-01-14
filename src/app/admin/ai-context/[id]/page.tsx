import { AiContextForm } from "@/components/admin/ai-context-form"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditAiContextPage({ params }: { params: { id: string } }) {
  const context = await prisma.aiContext.findUnique({
    where: { id: params.id }
  })

  if (!context) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/ai-context">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Modifier le Contexte</h1>
      </div>

      <AiContextForm context={context} />
    </div>
  )
}
