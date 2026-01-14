"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Trash2, Edit, Loader2 } from "lucide-react"
import { getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/actions/announcement-actions"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isActive, setIsActive] = useState(true)
  // Temp ID for new announcements to allow video attachment before creation
  const [tempId, setTempId] = useState<string>("")

  const loadData = async () => {
    setIsLoading(true)
    const result = await getAllAnnouncements()
    if (result.data) {
      setAnnouncements(result.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = () => {
    setEditingId(null)
    setTitle("")
    setContent("")
    setIsActive(true)
    // Generate a simple random ID for the session
    setTempId(`ann-${Math.random().toString(36).substr(2, 9)}`)
    setIsDialogOpen(true)
  }

  const handleEdit = (announcement: any) => {
    setEditingId(announcement.id)
    setTitle(announcement.title)
    setContent(announcement.content)
    setIsActive(announcement.isActive)
    setTempId("") // Not needed for edit
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingId) {
        await updateAnnouncement(editingId, { title, content, isActive })
        toast.success("Annonce mise à jour")
      } else {
        // Use tempId as the actual ID for the new record
        await createAnnouncement({ id: tempId, title, content, isActive })
        toast.success("Annonce créée")
      }
      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return

    try {
      await deleteAnnouncement(id)
      toast.success("Annonce supprimée")
      loadData()
    } catch (error) {
      toast.error("Impossible de supprimer")
    }
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des Annonces</h1>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Annonce
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des annonces</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Contenu (Aperçu)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucune annonce trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  announcements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{item.content}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.isActive ? 'Active' : 'Masquée'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.createdAt), "d MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier l'annonce" : "Nouvelle annonce"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de l'annonce"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="content">Contenu</Label>
                <VideoUploadManager
                  entityType="announcement"
                  entityId={editingId || tempId}
                  onInsert={(video) => {
                    // Insert markdown link at cursor or end
                    const markdown = `\n[Regarder la vidéo](${video.url})\n`;
                    setContent(prev => prev + markdown);
                    toast.success("Vidéo ajoutée au contenu");
                  }}
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Plus className="h-3 w-3" />
                      Ajouter une vidéo
                    </Button>
                  }
                />
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Message de l'annonce..."
                rows={5}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active">Annonce active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
