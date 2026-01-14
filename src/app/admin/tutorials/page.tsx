"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VideoUploadManager } from "@/components/admin/video-upload-manager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Trash2, Eye, Play } from "lucide-react";
import { toast } from "sonner";

interface PlatformVideo {
  id: string;
  title: string | null;
  url: string | null;
  filename: string;
  originalFilename: string;
  createdAt: Date;
}

export default function AdminTutorialsPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<PlatformVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/admin/videos/tutorial/feed');
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette vidéo?")) return;

    try {
      const res = await fetch(`/api/admin/videos/delete/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setVideos(videos.filter(v => v.id !== id));
        toast.success("Vidéo supprimée");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Tutoriels</h1>
        <p className="text-muted-foreground">
          Gérez les vidéos courtes pour le flux "Tutoriels" (Shorts/TikTok style).
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une vidéo</CardTitle>
          <CardDescription>
            Téléchargez une nouvelle vidéo pour le fil d'actualité des tutoriels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VideoUploadManager
            entityType="tutorial"
            entityId="feed"
            onInsert={(url) => {
              console.log("Video uploaded:", url);
              fetchVideos(); // Refresh list
            }}
          />
        </CardContent>
      </Card>

      {/* Videos Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Vidéos du flux ({videos.length})
          </CardTitle>
          <CardDescription>
            Toutes les vidéos disponibles dans le fil des tutoriels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune vidéo pour le moment</p>
              <p className="text-sm mt-2">Téléchargez votre première vidéo ci-dessus!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="group relative aspect-[9/16] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border">
                  {/* Video Thumbnail */}
                  <video
                    src={video.url || ""}
                    className="w-full h-full object-cover"
                    muted
                  />

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/tutorials?v=${video.id}`)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(video.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-white text-xs text-center line-clamp-2">
                      {video.title || video.originalFilename}
                    </p>
                  </div>

                  {/* Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/40 rounded-full p-3">
                      <Play className="h-6 w-6 text-white" fill="white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
