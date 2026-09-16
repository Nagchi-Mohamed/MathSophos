"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { insertAtCursor } from "./textarea-utils"

interface UseImagePasteDropOptions {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  content: string
  setContent: (val: string) => void
  entityType?: "lesson" | "series" | "exercise" | "exam" | "control" | "chapter"
  entityId?: string
}

export function useImagePasteDrop({
  textareaRef,
  content,
  setContent,
  entityType = "lesson",
  entityId,
}: UseImagePasteDropOptions) {
  const [isUploading, setIsUploading] = useState(false)

  // Core upload routine
  const uploadAndInsert = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner un fichier image valide.")
        return
      }

      if (file.size > 8 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (Max 8 Mo).")
        return
      }

      setIsUploading(true)
      const toastId = toast.loading("Téléchargement de l'image...")
      const finalEntityId = entityId && entityId !== "temp" ? entityId : crypto.randomUUID()

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("entityType", entityType)
        formData.append("entityId", finalEntityId)

        const res = await fetch("/api/admin/images/upload", {
          method: "POST",
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          if (data.image?.id) {
            const imageUrl = `/api/images/${data.image.id}`
            const latexTag = `\n\\includegraphics[width=0.75\\linewidth]{${imageUrl}}\n`
            insertAtCursor(textareaRef.current, latexTag, content, setContent)
            toast.success("Image insérée avec succès !", { id: toastId })
            return
          }
        }

        // Base64 fallback if server upload fails
        const reader = new FileReader()
        reader.onload = () => {
          const base64Url = reader.result as string
          const latexTag = `\n\\includegraphics[width=0.75\\linewidth]{${base64Url}}\n`
          insertAtCursor(textareaRef.current, latexTag, content, setContent)
          toast.success("Image insérée (locale) !", { id: toastId })
        }
        reader.readAsDataURL(file)
      } catch (err) {
        console.error("Image upload failed:", err)
        toast.error("Erreur lors de l'envoi de l'image.", { id: toastId })
      } finally {
        setIsUploading(false)
      }
    },
    [textareaRef, content, setContent, entityType, entityId]
  )

  // Paste handler (Ctrl+V)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0]
        if (file.type.startsWith("image/")) {
          e.preventDefault()
          uploadAndInsert(file)
        }
      }
    },
    [uploadAndInsert]
  )

  // Drag & drop handler
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        if (file.type.startsWith("image/")) {
          e.preventDefault()
          uploadAndInsert(file)
        }
      }
    },
    [uploadAndInsert]
  )

  // Drag over handler to allow drop
  const handleDragOver = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault()
    }
  }, [])

  // Double click handler on textarea to open file picker
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current
      if (!textarea) return

      // Check if cursor is on an empty line or at end of text
      const cursor = textarea.selectionStart
      const text = textarea.value
      const lineStart = text.lastIndexOf("\n", cursor - 1) + 1
      const lineEnd = text.indexOf("\n", cursor)
      const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd).trim()

      if (currentLine === "" || text.trim() === "") {
        e.preventDefault()
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.onchange = (ev: any) => {
          const file = ev.target?.files?.[0]
          if (file) uploadAndInsert(file)
        }
        input.click()
      }
    },
    [textareaRef, uploadAndInsert]
  )

  return {
    isUploading,
    handlePaste,
    handleDrop,
    handleDragOver,
    handleDoubleClick,
    uploadAndInsert,
  }
}
