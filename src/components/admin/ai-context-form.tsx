"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createAiContext, updateAiContext } from "@/actions/ai-context"

interface AiContextFormProps {
  context?: {
    id: string
    name: string
    description: string | null
    systemPrompt: string
    structureTemplate: string | null
  }
}

import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function AiContextForm({ context }: AiContextFormProps) {
  const router = useRouter()
  const baseAction = context
    ? updateAiContext.bind(null, context.id)
    : createAiContext

  const handleSubmit = async (formData: FormData) => {
    const result = await baseAction(formData)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(context ? "Contexte mis à jour" : "Contexte créé")
      router.refresh()
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{context ? "Modifier le Contexte" : "Nouveau Contexte IA"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du Contexte</Label>
            <Input
              id="name"
              name="name"
              placeholder="ex: Leçon Mathématiques Collège"
              defaultValue={context?.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Description courte..."
              defaultValue={context?.description || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <p className="text-xs text-muted-foreground">
              C'est l'instruction principale donnée à l'IA. Soyez précis sur le ton, le format et la structure.
            </p>
            <Textarea
              id="systemPrompt"
              name="systemPrompt"
              className="min-h-[200px] font-mono text-sm"
              placeholder="You are an expert math tutor..."
              defaultValue={context?.systemPrompt}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="structureTemplate">Template de Structure (JSON/Markdown)</Label>
            <p className="text-xs text-muted-foreground">Optionnel : Définissez une structure attendue.</p>
            <Textarea
              id="structureTemplate"
              name="structureTemplate"
              className="font-mono text-sm"
              defaultValue={context?.structureTemplate || ""}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="submit">
              {context ? "Mettre à jour" : "Créer le contexte"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
