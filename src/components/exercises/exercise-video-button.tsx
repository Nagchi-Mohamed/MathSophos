"use client";

import { useState } from "react";
import { PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/ui/video-player";
import { toast } from "sonner";

interface ExerciseVideoButtonProps {
  exerciseId: string;
  exerciseIndex: number;
}

export function ExerciseVideoButton({ exerciseId, exerciseIndex }: ExerciseVideoButtonProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [checkingVideo, setCheckingVideo] = useState(false);

  const checkVideo = async () => {
    if (!exerciseId) return;

    if (videoUrl) {
      setIsVideoOpen(true);
      return;
    }

    try {
      setCheckingVideo(true);
      const res = await fetch(`/api/admin/videos/exercise/${exerciseId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
          setVideoUrl(data.videos[0].url);
          setIsVideoOpen(true);
        } else {
          toast.info("Aucune vidéo n'a été ajoutée pour cet exercice. Comming Soon!");
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
        variant="default"
        size="sm"
        className="gap-2 bg-red-600 text-white hover:bg-red-700 shadow-sm border-transparent"
      >
        {checkingVideo ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <PlayCircle className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Correction Vidéo</span>
        <span className="sm:hidden">Vidéo</span>
      </Button>

      {videoUrl && (
        <VideoPlayer
          src={videoUrl}
          title={`Correction Exercice ${exerciseIndex}`}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </>
  );
}
