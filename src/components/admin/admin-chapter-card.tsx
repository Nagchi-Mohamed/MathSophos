"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Eye, Edit, Trash, Loader2, MoreVertical, Pencil } from 'lucide-react';
import { deleteChapter, renameChapter } from '@/actions/chapters';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AdminChapterCardProps {
  chapter: {
    id: string;
    titleFr: string;
    slug?: string;
    chapterNumber: number;
    contentFr?: string | null;
    status?: string;
    order?: number;
  };
}

export function AdminChapterCard({ chapter }: AdminChapterCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState(chapter.titleFr);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le chapitre "${chapter.titleFr}" ?`)) return;

    setIsDeleting(true);
    try {
      const result = await deleteChapter(chapter.id);
      if (result.success) {
        toast.success("Chapitre supprimé avec succès");
        router.refresh();
      } else {
        toast.error("Erreur lors de la suppression: " + result.error);
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = () => {
    setNewChapterTitle(chapter.titleFr);
    setIsRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!newChapterTitle.trim()) {
      toast.error("Le titre ne peut pas être vide");
      return;
    }

    setIsRenaming(true);
    try {
      const result = await renameChapter(chapter.id, newChapterTitle.trim());
      if (result.success) {
        toast.success("Chapitre renommé avec succès");
        setIsRenameDialogOpen(false);
        router.refresh();
      } else {
        toast.error("Erreur lors du renommage: " + result.error);
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsRenaming(false);
    }
  };

  const getStatusBadge = () => {
    switch (chapter.status) {
      case 'PUBLISHED':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Publié</Badge>;
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Brouillon</Badge>;
      case 'AI_GENERATED':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">IA</Badge>;
      default:
        return chapter.status ? <Badge variant="secondary">{chapter.status}</Badge> : null;
    }
  };

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted overflow-hidden group relative">
      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />

      {/* Actions Menu */}
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {chapter.slug && (
              <DropdownMenuItem asChild>
                <Link href={`/chapters/${chapter.slug}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" /> Voir
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href={`/admin/chapters/${chapter.id}/edit`} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" /> Modifier
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleRename}
              disabled={isRenaming}
            >
              <Pencil className="mr-2 h-4 w-4" /> Renommer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash className="mr-2 h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CardHeader className="pb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Chapitre {chapter.chapterNumber || 'N/A'}
          </Badge>
          {getStatusBadge()}
        </div>
        <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors pr-8">
          {chapter.titleFr || 'Sans titre'}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2">
          <BookOpen className="w-4 h-4" />
          Chapitre {chapter.chapterNumber || 'N/A'} • #{chapter.order || chapter.chapterNumber || 'N/A'}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto pt-0 grid grid-cols-2 gap-2">
        {chapter.slug ? (
          <Link href={`/chapters/${chapter.slug}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-3 h-3 mr-1" />
              Voir
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" className="w-full" disabled>
            <Eye className="w-3 h-3 mr-1" />
            Voir
          </Button>
        )}
        <Link href={`/admin/chapters/${chapter.id}/edit`} className="w-full">
          <Button variant="default" size="sm" className="w-full">
            <Edit className="w-3 h-3 mr-1" />
            Modifier
          </Button>
        </Link>
      </CardContent>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer le chapitre</DialogTitle>
            <DialogDescription>
              Modifiez le titre du chapitre "{chapter.titleFr}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newChapterTitle">Nouveau titre</Label>
              <Input
                id="newChapterTitle"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Ex: Les suites numériques"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleRenameSubmit()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameDialogOpen(false)
                setNewChapterTitle(chapter.titleFr)
              }}
              disabled={isRenaming}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={isRenaming || !newChapterTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Renommage...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Renommer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
