"use client"

import { useState } from "react"
import { PlayCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/ui/video-player"
import { toast } from "sonner"

interface ExamHeaderVideoButtonProps {
  examId: string
  examTitle: string
}

export function ExamHeaderVideoButton({ examId, examTitle }: ExamHeaderVideoButtonProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenVideo = async () => {
    setIsLoading(true)
    try {
      // Fetch videos associated with this exam
      const response = await fetch(`/api/admin/videos/exam/${examId}`)

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
        toast.info("Aucune vidéo disponible pour cet examen")
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
        className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-sm"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <PlayCircle className="w-4 h-4" />
        )}
        Voir Correction
      </Button>

      {videoUrl && (
        <VideoPlayer
          src={videoUrl}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          title={`Correction Vidéo - ${examTitle}`}
          autoPlay={true}
        />
      )}
    </>
  )
}
