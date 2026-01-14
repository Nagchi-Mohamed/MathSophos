"use client"

import { useEffect, useState } from "react"
import { VideoPlayerTrigger } from "@/components/content/video-player-trigger"
import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { Button } from "@/components/ui/button"
import { Video } from "lucide-react"
import { useSession } from "next-auth/react"
import { getHomeVideos } from "@/actions/video-actions"

interface PlatformVideo {
  id: string
  title: string
  url: string
  thumbnailUrl: string | null
  // add other fields if necessary from your prisma model
}

export function HomeVideoSection() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [videos, setVideos] = useState<PlatformVideo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const data = await getHomeVideos()
      setVideos(data as PlatformVideo[])
    } catch (error) {
      console.error("Failed to load home videos", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  // Show section only if there are videos or if user is admin
  if (!loading && videos.length === 0 && !isAdmin) {
    return null
  }

  // If loading and not admin, show nothing to avoid layout shift or show skeleton if preferred
  // For now, simpler is better
  if (loading && !isAdmin) return null

  return (
    <section className="py-12 bg-background border-t">
      <div className="container px-4 md:px-6">
        <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">Présentation Vidéo</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {videos.map((video) => (
            <div key={video.id} className="flex flex-col items-center space-y-2">
              <div className="w-full max-w-sm">
                <VideoPlayerTrigger src={video.url} title={video.title || "Vidéo de présentation"} />
              </div>
            </div>
          ))}

          {/* Fallback for admin if no videos */}
          {isAdmin && videos.length === 0 && !loading && (
            <div className="w-full max-w-sm h-48 flex flex-col items-center justify-center bg-muted/40 rounded-xl border border-dashed border-muted-foreground/25">
              <p className="text-muted-foreground mb-4">Aucune vidéo de présentation</p>
            </div>
          )}
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="flex justify-center mt-8">
            <VideoUploadManager
              entityType="home-explanation"
              entityId="main"
              trigger={
                <Button variant="outline" className="gap-2">
                  <Video className="h-4 w-4" />
                  Gérer les vidéos de présentation
                </Button>
              }
              onInsert={() => {
                // Refresh list locally
                fetchVideos()
              }}
            />
          </div>
        )}
      </div>
    </section>
  )
}
