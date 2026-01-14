"use client"

import { useState } from "react"
import Link from "next/link"
import type { PedagogicalSheet } from "@prisma/client"
import { EducationalLevel, Stream, LessonStatus } from "@/lib/enums"
import { deleteFiche, updateFiche, toggleFichePublish, duplicateFiche } from "@/actions/fiches"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Calendar, School, Trash2, Filter, Eye, Edit, Download, Printer, BookOpen, Loader2, Globe, Lock, Copy } from "lucide-react"
import { toast } from "sonner"
import { InlineLatex } from "@/components/inline-latex"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { formatLevel, formatStream } from "@/utils/formatters"
import { useRouter } from "next/navigation"

import { useSession } from "next-auth/react"

interface FichesListProps {
  initialFiches: PedagogicalSheet[]
  isAdmin?: boolean
  isPublicView?: boolean
}

export function FichesList({ initialFiches, isAdmin = false, isPublicView = false }: FichesListProps) {
  const [fiches, setFiches] = useState<PedagogicalSheet[]>(initialFiches)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPdfFiche, setSelectedPdfFiche] = useState<PedagogicalSheet | null>(null)
  const { data: session } = useSession()

  // Helper to check if user can edit a fiche
  const canEdit = (fiche: PedagogicalSheet) => {
    if (isAdmin) return true // Admin can edit everything
    if (isPublicView) return false // Public view is read-only
    return session?.user?.id === fiche.userId // Access ownership via userId
  }

  // Helper to check if user can delete
  const canDelete = (fiche: PedagogicalSheet) => {
    if (isPublicView) return false
    if (isAdmin) return true
    return session?.user?.id === fiche.userId
  }

  // Filters

  const [isDuplicating, setIsDuplicating] = useState<string | null>(null)

  const handleDuplicate = async (id: string) => {
    if (!session?.user) {
      toast.error("Veuillez vous connecter pour personnaliser cette fiche")
      return
    }

    setIsDuplicating(id)
    try {
      const newId = await duplicateFiche(id)
      toast.success("Fiche copiée dans votre espace")
      router.push(`/teacher/fiches/${newId}/edit`)
    } catch (error) {
      toast.error("Erreur lors de la duplication")
      console.error(error)
      setIsDuplicating(null)
    }
  }

  // Filters
  const [level, setLevel] = useState<string>("ALL")
  const [stream, setStream] = useState<string>("ALL")
  const [semester, setSemester] = useState<string>("ALL")
  const router = useRouter()

  const filteredFiches = fiches.filter(fiche => {
    if (level !== "ALL" && fiche.gradeLevel !== level) return false
    if (stream !== "ALL" && fiche.stream !== stream) return false
    if (semester !== "ALL" && fiche.semester.toString() !== semester) return false
    return true
  })

  // Formatters if utils not imported correctly
  const fmtLevel = (l: string) => formatLevel ? formatLevel(l) : l
  const fmtStream = (s: string | null) => s && formatStream ? formatStream(s) : (s || "")

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      await deleteFiche(id)
      setFiches(fiches.filter(f => f.id !== id))
      toast.success("Fiche supprimée")
    } catch (error) {
      toast.error("Erreur lors de la suppression")
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleTogglePublish = async (id: string) => {
    try {
      await toggleFichePublish(id)
      setFiches(fiches.map(f => f.id === id ? { ...f, isPublic: !f.isPublic } : f))
      toast.success("Statut mis à jour")
      router.refresh()
    } catch (e) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-muted-foreground mr-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtrer par :</span>
        </div>

        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les niveaux</SelectItem>
            {Object.values(EducationalLevel).map(l => (
              <SelectItem key={l} value={l}>{fmtLevel(l)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stream} onValueChange={setStream}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filière" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes les filières</SelectItem>
            {Object.values(Stream).map(s => (
              <SelectItem key={s} value={s}>{fmtStream(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Semestre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            <SelectItem value="1">Semestre 1</SelectItem>
            <SelectItem value="2">Semestre 2</SelectItem>
          </SelectContent>
        </Select>

        {(level !== "ALL" || stream !== "ALL" || semester !== "ALL") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setLevel("ALL"); setStream("ALL"); setSemester("ALL"); }}
            className="ml-auto"
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFiches.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">Aucune fiche trouvée</h3>
            <p className="text-muted-foreground mb-4">Essayez de modifier les filtres ou créez une nouvelle fiche.</p>
          </div>
        ) : (
          filteredFiches.map(fiche => (
            <Card key={fiche.id} className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted overflow-hidden group relative">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-green-500" />

              <CardHeader className="pb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {fmtLevel(fiche.gradeLevel)}
                  </Badge>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-600 dark:text-purple-400">
                    S{fiche.semester}
                  </Badge>

                  {/* Ownership/Status Badges */}
                  {session?.user?.id === fiche.userId ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">Ma Fiche</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground">Public</Badge>
                  )}

                  {isAdmin && (
                    <Badge className={`${fiche.isPublic ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                      {fiche.isPublic ? 'Publié' : 'Brouillon'}
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors pr-8">
                  <InlineLatex content={fiche.lessonTitle || "Fiche sans titre"} />
                </CardTitle>
                <CardDescription className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(fiche.createdAt).toLocaleDateString()}
                    {fiche.stream && <span className="ml-auto font-medium text-foreground/80">{fmtStream(fiche.stream)}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <School className="w-3 h-3" /> {fiche.schoolName}
                  </div>
                  <div className="font-semibold text-xs text-foreground/70">
                    {fiche.teacherName}
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="mt-auto pt-0 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedPdfFiche(fiche)}
                >
                  <FileText className="w-4 h-4 mr-2" /> PDF
                </Button>

                {/* Admin Publish Toggle */}
                {isAdmin && (
                  <Button
                    variant={fiche.isPublic ? "default" : "secondary"}
                    size="icon"
                    onClick={() => handleTogglePublish(fiche.id)}
                    className={fiche.isPublic ? "bg-green-600 hover:bg-green-700" : ""}
                    title={fiche.isPublic ? "Publié (Cliquer pour dépublier)" : "Privé (Cliquer pour publier)"}
                  >
                    {fiche.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </Button>
                )}

                {/* Edit Button - Checks Ownership */}
                {canEdit(fiche) ? (
                  <Link href={`/teacher/fiches/${fiche.id}/edit`} className="flex-1">
                    <Button variant="secondary" className="w-full">
                      <Edit className="w-4 h-4 mr-2" /> Editer
                    </Button>
                  </Link>
                ) : (
                  // Allow duplication for non-owners (if logged in)
                  session?.user && (
                    <Button
                      variant="secondary"
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      onClick={() => handleDuplicate(fiche.id)}
                      disabled={isDuplicating === fiche.id}
                    >
                      {isDuplicating === fiche.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      Personnaliser
                    </Button>
                  )
                )}

                {/* Delete Button - Checks Ownership */}
                {canDelete(fiche) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la fiche ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(fiche.id)} className="bg-destructive">
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* PDF View/Download Modal */}
      <Dialog open={!!selectedPdfFiche} onOpenChange={(open) => !open && setSelectedPdfFiche(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <div className="p-4 pr-10 border-b flex justify-between items-center bg-muted/30">
            <DialogTitle className="font-semibold text-lg flex items-center gap-2 m-0">
              <FileText className="w-5 h-5 text-primary" />
              <InlineLatex content={selectedPdfFiche?.lessonTitle || ""} />
            </DialogTitle>
            <div className="flex gap-2">
              {/* Direct Download Button approach: Link to print view with download hint? 
                        Or just use window.print() on the iframe context? 
                        The user asked for "Download as PDF". 
                        Reliable client-side download usually requires generating a Blob or using the browser's print-to-pdf.
                        We'll offer a button that opens the print view in a new tab which triggers printing, the most robust way without backend PDF gen.
                    */}
              <Button variant="outline" size="sm" onClick={() => {
                const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
                iframe?.contentWindow?.print();
              }}>
                <Printer className="w-4 h-4 mr-2" /> Imprimer / PDF
              </Button>
              <Link href={`/print/fiche/${selectedPdfFiche?.id}`} target="_blank" download>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-2" /> Ouvrir / Télécharger
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 bg-muted relative">
            {selectedPdfFiche && (
              <iframe
                id="pdf-preview-iframe"
                src={`/print/fiche/${selectedPdfFiche.id}`}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
