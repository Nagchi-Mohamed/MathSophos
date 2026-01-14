"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface ForumImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImageUrl?: string
  onImageRemoved?: () => void
}

export function ForumImageUpload({ onImageUploaded, currentImageUrl, onImageRemoved }: ForumImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 MB")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "forum")

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload")
      }

      setPreviewUrl(data.url)
      onImageUploaded(data.url)
      toast.success("Image uploadée avec succès")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Erreur lors de l'upload de l'image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }, [])

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          await uploadFile(file)
          break
        }
      }
    }
  }, [])

  // Add paste event listener
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("paste", handlePaste as any)
      return () => container.removeEventListener("paste", handlePaste as any)
    }
  }, [handlePaste])

  const handleRemove = () => {
    setPreviewUrl(null)
    onImageRemoved?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative border rounded-lg p-2 bg-muted/30">
          <div className="relative w-full max-w-md">
            <Image
              src={previewUrl}
              alt="Preview"
              width={400}
              height={300}
              className="rounded-lg object-cover w-full h-auto"
              unoptimized
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-4 right-4"
            onClick={handleRemove}
          >
            <X className="h-4 w-4 mr-1" />
            Supprimer
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ajouter une image</p>
                <p className="text-xs text-muted-foreground">
                  Glissez-déposez, collez (Ctrl+V), ou cliquez pour sélectionner
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Choisir un fichier
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF jusqu'à 5MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
