"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
import { CustomImageNode } from './tiptap-image-extension'
import { ImageEditorOptionsModal, ImageStyleOptions } from './image-editor-options-modal'

import { Button } from "@/components/ui/button"
import {
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Undo, Redo,
  Image as ImageIcon, Sigma, Table as TableIcon, CaseUpper, Layout,
  Palette, Trash2, Upload, Clipboard, Maximize2
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ImageUploadManager } from './image-upload-manager'
import { toast } from "sonner"

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  uploaderContext?: {
    entityId: string
    entityType: "lesson" | "series" | "exercise" | "exam" | "control" | "chapter"
  }
}

const LATEX_FORMS = [
  { label: "Tableau", icon: TableIcon, code: "$$ \\begin{array}{|c|c|} \\hline A & B \\\\ \\hline C & D \\\\ \\hline \\end{array} $$" },
  { label: "Matrice", icon: TableIcon, code: "$$ \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} $$" },
  { label: "Cas", icon: CaseUpper, code: "$$ f(x) = \\begin{cases} x & \\text{si } x > 0 \\\\ -x & \\text{si } x \\le 0 \\end{cases} $$" },
  { label: "Fraction", icon: Sigma, code: "$ \\frac{a}{b} $" },
  { label: "Racine", icon: Sigma, code: "$ \\sqrt{x} $" },
  { label: "Somme", icon: Sigma, code: "$$ \\sum_{i=0}^{n} i^2 $$" },
  { label: "Intégrale", icon: Sigma, code: "$$ \\int_{a}^{b} f(x) dx $$" },
  { label: "Limite", icon: Sigma, code: "$$ \\lim_{x \\to \\infty} f(x) $$" },
]

export function TiptapEditor({ content, onChange, uploaderContext }: TiptapEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    targetImg: HTMLImageElement | null
  } | null>(null)

  // Image Options Modal State
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const [selectedImgElement, setSelectedImgElement] = useState<HTMLImageElement | null>(null)
  const [selectedImgStyles, setSelectedImgStyles] = useState<Partial<ImageStyleOptions>>({})

  // File Upload State
  const [isUploading, setIsUploading] = useState(false)

  // Helper to upload image file and insert HTML img into editor
  const uploadAndInsertFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide")
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (Max 8MB)")
      return
    }

    setIsUploading(true)
    const entityType = uploaderContext?.entityType || "lesson"
    const entityId = uploaderContext?.entityId && uploaderContext.entityId !== "temp"
      ? uploaderContext.entityId
      : crypto.randomUUID()

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("entityType", entityType)
      formData.append("entityId", entityId)

      const res = await fetch("/api/admin/images/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.image?.id) {
          const imageUrl = `/api/images/${data.image.id}`
          if (editor) {
            editor.chain().focus().insertContent(`<img src="${imageUrl}" alt="${file.name}" style="width: 75%; height: auto; display: block; margin: 16px auto;" />`).run()
            toast.success("Image insérée avec succès !")
          }
          return
        }
      }

      // Base64 Fallback if upload route fails
      const reader = new FileReader()
      reader.onload = () => {
        const base64Url = reader.result as string
        if (editor) {
          editor.chain().focus().insertContent(`<img src="${base64Url}" alt="${file.name}" style="width: 75%; height: auto; display: block; margin: 16px auto;" />`).run()
          toast.success("Image insérée avec succès !")
        }
      }
      reader.readAsDataURL(file)
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de l'envoi de l'image")
    } finally {
      setIsUploading(false)
    }
  }, [uploaderContext])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      CustomImageNode,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[320px] max-h-[600px] overflow-y-auto p-4 border rounded-md font-sans leading-relaxed',
      },
      // DRAG & DROP IMAGE HANDLER
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith("image/")) {
            event.preventDefault()
            uploadAndInsertFile(file)
            return true
          }
        }
        return false
      },
      // CLIPBOARD PASTE IMAGE HANDLER (Ctrl+V)
      handlePaste: (view, event, slice) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          const file = event.clipboardData.files[0]
          if (file.type.startsWith("image/")) {
            event.preventDefault()
            uploadAndInsertFile(file)
            return true
          }
        }
        return false
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  // Sync content prop
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      if (editor.getText() === "") {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

  // RIGHT CLICK CONTEXT MENU HANDLER
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()

      let targetImg: HTMLImageElement | null = null
      if (e.target instanceof HTMLImageElement) {
        targetImg = e.target
      } else if (e.target instanceof HTMLElement) {
        targetImg = e.target.querySelector('img')
      }

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetImg,
      })
    }

    const handleClickOutside = () => setContextMenu(null)

    container.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('click', handleClickOutside)

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('click', handleClickOutside)
    }
  }, [])

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!editor || !isMounted) {
    return null
  }

  const insertLatex = (code: string) => {
    editor.chain().focus().insertContent(code).run()
  }

  // Open Options Modal for Selected Image
  const handleOpenImageOptions = (img: HTMLImageElement) => {
    setSelectedImgElement(img)

    // Parse current styles
    const styleAttr = img.getAttribute("style") || ""
    const widthMatch = styleAttr.match(/width:\s*([^;]+)/)
    const floatMatch = styleAttr.match(/float:\s*([^;]+)/)
    const displayMatch = styleAttr.match(/display:\s*([^;]+)/)
    const opacityMatch = styleAttr.match(/opacity:\s*([\d.]+)/)

    let layout: ImageStyleOptions["layout"] = "center"
    if (floatMatch?.[1].includes("left")) layout = "float-left"
    else if (floatMatch?.[1].includes("right")) layout = "float-right"
    else if (displayMatch?.[1].includes("inline")) layout = "inline"
    else if (opacityMatch && parseFloat(opacityMatch[1]) <= 0.3) layout = "background"

    setSelectedImgStyles({
      layout,
      width: widthMatch?.[1] || "75%",
      opacity: opacityMatch ? Math.round(parseFloat(opacityMatch[1]) * 100) : 100
    })

    setIsOptionsModalOpen(true)
  }

  // Apply Options from Modal
  const handleApplyImageOptions = (options: ImageStyleOptions, styleString: string) => {
    if (selectedImgElement) {
      selectedImgElement.setAttribute("style", styleString)
      selectedImgElement.setAttribute("data-layout", options.layout)
      onChange(editor.getHTML())
      toast.success("Style et habillage de l'image mis à jour !")
    }
  }

  // Delete Image
  const handleDeleteImage = (img: HTMLImageElement) => {
    img.remove()
    onChange(editor.getHTML())
    toast.success("Image supprimée")
  }

  // File Picker Trigger
  const triggerImagePicker = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0]
      if (file) uploadAndInsertFile(file)
    }
    input.click()
  }

  // Clipboard Paste Trigger
  const triggerClipboardPaste = async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const file = new File([blob], "pasted-image.png", { type })
            uploadAndInsertFile(file)
            return
          }
        }
      }
      toast.info("Aucune image trouvée dans le presse-papier. Utilisez Ctrl+V.")
    } catch {
      toast.info("Appuyez sur Ctrl+V dans l'éditeur pour coller l'image.")
    }
  }

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50 items-center text-xs">
        {/* Formatting */}
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-muted font-bold' : ''}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-muted italic' : ''}>
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border mx-1"></div>

        {/* Headings */}
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}>
          <Heading2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border mx-1"></div>

        {/* Lists */}
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-muted' : ''}>
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-muted' : ''}>
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-border mx-1"></div>

        {/* LaTeX Helper */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/20 bg-primary/5">
              <Sigma className="h-4 w-4" />
              LaTeX Rapide
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-2 grid grid-cols-2 gap-1.5">
              {LATEX_FORMS.map((form, idx) => (
                <Button key={idx} variant="ghost" className="justify-start h-auto py-1.5 px-2 hover:bg-muted" onClick={() => insertLatex(form.code)}>
                  <form.icon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span className="truncate text-xs font-mono">{form.label}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick Image Buttons */}
        <Button variant="outline" size="sm" onClick={triggerImagePicker} className="gap-1.5 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50">
          <Upload className="h-3.5 w-3.5" />
          Ajouter Image
        </Button>

        {/* Image Upload Manager (Full Library) */}
        {uploaderContext && (
          <ImageUploadManager
            entityId={uploaderContext.entityId}
            entityType={uploaderContext.entityType}
            onInsert={(code) => editor.chain().focus().insertContent(code).run()}
          />
        )}

        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}>
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Main Content Area */}
      <EditorContent editor={editor} />

      {/* RIGHT-CLICK CONTEXT MENU POPUP */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-popover text-popover-foreground border rounded-lg shadow-xl py-1.5 min-w-[200px] text-xs animate-in fade-in-50 zoom-in-95"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          {contextMenu.targetImg ? (
            <>
              <div className="px-3 py-1 font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-b pb-1 mb-1">
                Options d'image
              </div>
              <button
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 font-medium"
                onClick={() => handleOpenImageOptions(contextMenu.targetImg!)}
              >
                <Layout className="h-4 w-4 text-primary" />
                Habillage texte & Disposition (Word)...
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 font-medium"
                onClick={() => handleOpenImageOptions(contextMenu.targetImg!)}
              >
                <Palette className="h-4 w-4 text-blue-600" />
                Filtre de couleurs & Thème...
              </button>
              <div className="my-1 border-t"></div>
              <button
                className="w-full px-3 py-2 text-left hover:bg-destructive/10 text-destructive flex items-center gap-2 font-medium"
                onClick={() => handleDeleteImage(contextMenu.targetImg!)}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer l'image
              </button>
            </>
          ) : (
            <>
              <button
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 font-medium"
                onClick={triggerImagePicker}
              >
                <Upload className="h-4 w-4 text-primary" />
                Insérer une image...
              </button>
              <button
                className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 font-medium"
                onClick={triggerClipboardPaste}
              >
                <Clipboard className="h-4 w-4 text-blue-600" />
                Coller une image (Ctrl+V)
              </button>
            </>
          )}
        </div>
      )}

      {/* WORD-STYLE IMAGE OPTIONS MODAL */}
      <ImageEditorOptionsModal
        open={isOptionsModalOpen}
        onOpenChange={setIsOptionsModalOpen}
        initialStyles={selectedImgStyles}
        onApply={handleApplyImageOptions}
      />
    </div>
  )
}
