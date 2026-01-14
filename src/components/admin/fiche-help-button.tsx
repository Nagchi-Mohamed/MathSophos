"use client"

import { VideoUploadManager } from "@/components/admin/video-upload-manager"
import { Button } from "@/components/ui/button"
import { Video } from "lucide-react"
import { toast } from "sonner"

export function FicheHelpButton() {
  return (
    <VideoUploadManager
      entityType="system-help"
      entityId="fiche-creation-help"
      trigger={
        <Button variant="outline" size="sm" className="gap-2">
          <Video className="h-4 w-4" />
          Gérer Vidéo Aide Création
        </Button>
      }
      onInsert={() => {
        toast.success("Vidéo d'aide mise à jour")
      }}
    />
  )
}
