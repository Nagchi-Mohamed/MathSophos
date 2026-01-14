"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Copy, Image as ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

import { canManageContent } from "@/lib/roles";

interface PlatformImage {
  id: string;
  filename: string;
  filepath: string;
  originalFilename: string;
}

interface ImageUploadManagerProps {
  entityType: "lesson" | "series" | "exercise" | "exam" | "control" | "chapter" | "forum_post" | "forum_reply";
  entityId: string;
  onInsert?: (latex: string) => void;
  onSelectUrl?: (url: string) => void;
}

export function ImageUploadManager({ entityType, entityId, onInsert, onSelectUrl }: ImageUploadManagerProps) {
  const [images, setImages] = useState<PlatformImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const { data: session, status } = useSession();

  const fetchImages = useCallback(async () => {
    if (!entityId || !isOpen) return;

    try {
      setLoading(true);
      console.log(`[ImageManager] Fetching images for ${entityType}/${entityId}`);
      const res = await fetch(`/api/admin/images/${entityType}/${entityId}`);

      if (!res.ok) {
        if (res.status === 401) {
          console.error("[ImageManager] Unauthorized");
        }
        throw new Error(`Failed to fetch images: ${res.status}`);
      }

      const data = await res.json();
      console.log(`[ImageManager] Fetched ${data.images?.length || 0} images`);

      if (data.images) {
        setImages(data.images);
      }
    } catch (error) {
      console.error("[ImageManager] Error fetching images:", error);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [fetchImages, isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!entityId) {
      toast.error("Entity ID is required for image upload");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);

    try {
      const res = await fetch("/api/admin/images/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          toast.error("Unauthorized: Please log in with an account that has content management permissions.");
          throw new Error("Unauthorized");
        }
        throw new Error(errorData.error || `Upload failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      if (data.success && data.image) {
        setImages([data.image, ...images]);
        toast.success("Image uploaded successfully");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const confirmDelete = async () => {
    if (!imageToDelete) return;

    try {
      const res = await fetch(`/api/admin/images/delete/${imageToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Unauthorized: Please log in with an account that has content management permissions.");
          throw new Error("Unauthorized");
        }
        throw new Error("Delete failed");
      }

      setImages(images.filter((img) => img.id !== imageToDelete));
      toast.success("Image deleted");
    } catch (error) {
      toast.error("Failed to delete image");
    } finally {
      setImageToDelete(null);
    }
  };

  const copyLatex = (image: any) => {
    // Use the database image API route
    const imagePath = `/api/images/${image.id}`;

    // JSON needs double escaping for backslashes
    const prefix = isJsonMode ? "\\\\" : "\\";
    const code = `${prefix}includegraphics[width=0.8${prefix}linewidth]{${imagePath}}`;

    navigator.clipboard.writeText(code);
    toast.success(isJsonMode ? "JSON-escaped code copied" : "LaTeX code copied");

    if (onInsert) {
      onInsert(code);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Gérer les images
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestionnaire d'images</DialogTitle>
            <DialogDescription className="sr-only">
              Gérez et téléchargez des images pour ce contenu.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 py-4 border-b">
            <div className="flex-1">
              <Label htmlFor="image-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors">
                <Upload className="h-4 w-4" />
                Télécharger une image
              </Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </div>

            <div className="flex items-center gap-2 border px-3 py-2 rounded-md bg-muted/20">
              <input
                type="checkbox"
                id="json-mode"
                className="h-4 w-4 rounded border-gray-300"
                checked={isJsonMode}
                onChange={(e) => setIsJsonMode(e.target.checked)}
              />
              <Label htmlFor="json-mode" className="cursor-pointer text-sm font-medium">
                Format pour JSON (Échapper \)
              </Label>
            </div>

            {uploading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>

          <div className="flex-1 -mx-6 px-6 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucune image téléchargée.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                {images.map((image) => (
                  <div key={image.id} className="group relative border rounded-lg overflow-hidden bg-background">
                    <div className="aspect-video relative bg-muted/20">
                      <Image
                        src={`/api/images/${image.id}`}
                        alt={image.originalFilename}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs font-medium truncate" title={image.filename}>
                        {image.filename}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 h-7 text-xs gap-1"
                          onClick={() => {
                            if (onSelectUrl) {
                              onSelectUrl(`/api/images/${image.id}`);
                            } else {
                              copyLatex(image);
                            }
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          {onInsert || onSelectUrl ? "Insérer" : "Copier"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          className="h-7 w-7"
                          onClick={() => setImageToDelete(image.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
