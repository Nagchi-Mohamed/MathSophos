"use client"

import { useState } from "react"
import { PlayCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/ui/video-player"
import { toast } from "sonner"

interface ChapterHeaderVideoButtonProps {
  chapterId: string
  chapterTitle: string
  className?: string
}

export function ChapterHeaderVideoButton({ chapterId, chapterTitle, className }: ChapterHeaderVideoButtonProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenVideo = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch videos associated with this chapter
      const response = await fetch(`/api/admin/videos/chapter/${chapterId}`)

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de la vidéo")
      }

      const data = await response.json()

      if (data.videos && data.videos.length > 0) {
        // Take the most recent video
        const video = data.videos[0]
        setVideoUrl(video.url)
        setIsVideoOpen(true)
      } else {
        toast.info("Aucune vidéo disponible pour ce chapitre")
      }
    } catch (error) {
      console.error("Error fetching video:", error)
      toast.error("Impossible de charger la vidéo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleOpenVideo}
        disabled={isLoading}
        className={className || "bg-red-600 hover:bg-red-700 text-white gap-2 shadow-sm"}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <PlayCircle className="w-4 h-4" />
        )}
        Voir Vidéo
      </Button>

      {videoUrl && (
        <VideoPlayer
          src={videoUrl}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          title={`Vidéo - ${chapterTitle}`}
          autoPlay={true}
        />
      )}
    </>
  )
}
