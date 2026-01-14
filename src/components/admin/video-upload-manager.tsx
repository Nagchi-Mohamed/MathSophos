"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Copy, Video as VideoIcon, Upload, Play } from "lucide-react";
import { toast } from "sonner";
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

// ... existing code ...

interface PlatformVideo {
  id: string;
  filename: string;
  url: string;
  originalFilename: string;
  thumbnailUrl: string | null;
}

interface VideoUploadManagerProps {
  entityType: "lesson" | "series" | "exercise" | "exam" | "control" | "chapter" | "tutorial" | "announcement" | "system-help" | "home-explanation" | "forum_post" | "forum_reply";
  entityId: string;
  onInsert?: (video: PlatformVideo) => void;
  trigger?: React.ReactNode;
}

export function VideoUploadManager({ entityType, entityId, onInsert, trigger }: VideoUploadManagerProps) {
  const [videos, setVideos] = useState<PlatformVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchVideos = useCallback(async () => {
    if (!entityId || !isOpen) return;

    try {
      setLoading(true);
      console.log(`[VideoManager] Fetching videos for ${entityType}/${entityId}`);
      const res = await fetch(`/api/admin/videos/${entityType}/${entityId}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch videos: ${res.status}`);
      }

      const data = await res.json();
      console.log(`[VideoManager] Fetched ${data.videos?.length || 0} videos`);

      if (data.videos) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error("[VideoManager] Error fetching videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchVideos();
    }
  }, [fetchVideos, isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!entityId) {
      toast.error("Entity ID is required for video upload");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);

    try {
      const res = await fetch("/api/admin/videos/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          toast.error("Unauthorized");
          throw new Error("Unauthorized");
        }
        throw new Error(errorData.error || `Upload failed: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.video) {
        setVideos([data.video, ...videos]);
        toast.success("Video uploaded successfully");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload video");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    try {
      const res = await fetch(`/api/admin/videos/delete/${videoToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setVideos(videos.filter((v) => v.id !== videoToDelete));
      toast.success("Video deleted");
    } catch (error) {
      toast.error("Failed to delete video");
    } finally {
      setVideoToDelete(null);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Video URL copied to clipboard");
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* ... Dialog Content ... */}
        <DialogTrigger asChild>
          {trigger ? trigger : (
            <Button variant="outline" size="sm" className="gap-2">
              <VideoIcon className="h-4 w-4" />
              Gérer les vidéos
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestionnaire de vidéos</DialogTitle>
            <DialogDescription className="sr-only">
              Gérez et téléchargez des vidéos pour ce contenu.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 py-4 border-b">
            <div className="flex-1">
              <Label htmlFor="video-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors">
                <Upload className="h-4 w-4" />
                Télécharger une vidéo
              </Label>
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </div>

            {uploading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>

          <div className="flex-1 -mx-6 px-6 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucune vidéo trouvée.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {videos.map((video) => (
                  <div key={video.id} className="group relative border rounded-lg overflow-hidden bg-background">
                    <div className="aspect-video relative bg-black/10 flex items-center justify-center">
                      <video
                        src={video.url}
                        className="w-full h-full object-cover"
                        controls={false} // Disable controls in preview, just show static or use thumb
                        muted // Mute for preview
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                        <Play className="w-8 h-8 text-white opacity-80" />
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs font-medium truncate" title={video.originalFilename}>
                        {video.originalFilename}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 h-7 text-xs gap-1"
                          onClick={() => {
                            if (onInsert) {
                              onInsert(video);
                              setIsOpen(false);
                            } else {
                              copyLink(video.url);
                            }
                          }}
                        >
                          {onInsert ? (
                            <>
                              <VideoIcon className="h-3 w-3" />
                              Ajouter
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copier le lien
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          className="h-7 w-7"
                          onClick={() => setVideoToDelete(video.id)}
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

      <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this video.
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
