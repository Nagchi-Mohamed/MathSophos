"use client";

import { useState } from "react";
import { PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/ui/video-player";
import { toast } from "sonner";

interface SeriesHeaderVideoButtonProps {
  seriesId: string;
  seriesTitle: string;
}

export function SeriesHeaderVideoButton({ seriesId, seriesTitle }: SeriesHeaderVideoButtonProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [checkingVideo, setCheckingVideo] = useState(false);

  const checkVideo = async () => {
    if (!seriesId) return;

    if (videoUrl) {
      setIsVideoOpen(true);
      return;
    }

    try {
      setCheckingVideo(true);
      const res = await fetch(`/api/admin/videos/series/${seriesId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
          setVideoUrl(data.videos[0].url);
          setIsVideoOpen(true);
        } else {
          toast.info("Aucune vidéo n'a été ajoutée pour cette série.");
        }
      } else {
        toast.error("Impossible de vérifier la disponibilité de la vidéo.");
      }
    } catch (error) {
      console.error("Error checking video:", error);
      toast.error("Erreur lors de la vérification de la vidéo.");
    } finally {
      setCheckingVideo(false);
    }
  };

  return (
    <>
      <Button
        onClick={checkVideo}
        disabled={checkingVideo}
        className="bg-red-600 text-white hover:bg-red-700 shadow-lg shrink-0 print:hidden"
        size="lg"
      >
        {checkingVideo ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <PlayCircle className="w-5 h-5 mr-2" />
        )}
        Voir Vidéo
      </Button>

      {videoUrl && (
        <VideoPlayer
          src={videoUrl}
          title={seriesTitle}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </>
  );
}
