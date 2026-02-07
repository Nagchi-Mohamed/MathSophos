"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Typography from '@tiptap/extension-typography'
// Removed ImageExtension since it is not available in the environment
// import ImageExtension from '@tiptap/extension-image'

import { Button } from "@/components/ui/button"
import {
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo,
  Image as ImageIcon, Sigma, Table as TableIcon, CaseUpper, Copy
} from "lucide-react"
import { useEffect, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageUploadManager } from './image-upload-manager'

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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      // ImageExtension removed fallback
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto p-4 border rounded-md',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  // Update editor content if prop changes
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      if (editor.getText() === "") {
        editor.commands.setContent(content)
      }
    }
  }, [content, editor])

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

  const handleImageInsert = (latex: string) => {
    // Insert LaTeX code directly into the editor
    editor.chain().focus().insertContent(latex).run()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50 items-center">
        {/* Basic Formatting */}
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active bg-muted' : ''}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active bg-muted' : ''}>
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1"></div>

        {/* Headings */}
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active bg-muted' : ''}>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active bg-muted' : ''}>
          <Heading2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Lists */}
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active bg-muted' : ''}>
          <List className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active bg-muted' : ''}>
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* LaTeX Tools */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-primary border-primary/20 bg-primary/5">
              <Sigma className="h-4 w-4" />
              LaTeX Rapide
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-2 grid grid-cols-2 gap-2">
              {LATEX_FORMS.map((form, idx) => (
                <Button key={idx} variant="ghost" className="justify-start h-auto py-2 px-3 hover:bg-muted" onClick={() => insertLatex(form.code)}>
                  <form.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate text-xs font-mono">{form.label}</span>
                </Button>
              ))}
            </div>
            <div className="bg-muted/30 p-2 text-xs text-center border-t text-muted-foreground">
              Cliquez pour insérer au curseur
            </div>
          </PopoverContent>
        </Popover>

        {/* Image Tool */}
        {uploaderContext && (
          <ImageUploadManager
            entityId={uploaderContext.entityId}
            entityType={uploaderContext.entityType}
            onInsert={handleImageInsert}
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
      <EditorContent editor={editor} />
    </div>
  )
}
