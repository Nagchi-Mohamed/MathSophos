import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { deleteAiContext } from "@/actions/ai-context"

export const dynamic = 'force-dynamic'

export default async function AiContextsPage() {
  const contexts = await prisma.aiContext.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contextes IA</h1>
          <p className="text-muted-foreground">
            Gérez les prompts système utilisés pour générer du contenu.
          </p>
        </div>
        <Link href="/admin/ai-context/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Contexte
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contexts.map((context) => (
          <Card key={context.id}>
            <CardHeader>
              <CardTitle>{context.name}</CardTitle>
              <CardDescription className="line-clamp-2">{context.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2">
                <Link href={`/admin/ai-context/${context.id}`}>
                  <Button variant="outline" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <form action={deleteAiContext.bind(null, context.id)}>
                  <Button variant="destructive" size="icon" type="submit">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
        {contexts.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            Aucun contexte IA trouvé. Créez-en un pour commencer.
          </div>
        )}
      </div>
    </div>
  )
}
