"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { AlignLeft, AlignCenter, AlignRight, Palette, Trash2, X } from "lucide-react"
import { toast } from "sonner"

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface LessonAnnotation {
  id: string
  lessonId: string
  blockId: string
  imageUrl: string
  imageId?: string | null
  float: string        // 'left' | 'right' | 'center'
  widthPct: number     // 15–100
  filter: string       // 'none' | 'grayscale' | 'sepia' | 'invert' | 'blue-theme' | 'green-theme' | 'warm-theme'
  opacity: number      // 0.1–1.0
  caption?: string | null
  position: string     // 'before' | 'after'
}

// ─── FILTER PRESETS ───────────────────────────────────────────────────────────

const FILTER_MAP: Record<string, string> = {
  none:        "",
  grayscale:   "grayscale(100%)",
  sepia:       "sepia(80%)",
  invert:      "invert(85%) hue-rotate(180deg)",
  "blue-theme":  "sepia(60%) hue-rotate(185deg) saturate(1.5)",
  "green-theme": "sepia(50%) hue-rotate(100deg) saturate(1.4)",
  "warm-theme":  "sepia(40%) saturate(1.3) brightness(1.05)",
}

const FILTER_LABELS: { id: string; label: string; color: string }[] = [
  { id: "none",        label: "Original",       color: "#64748b" },
  { id: "blue-theme",  label: "Thème Bleu",      color: "#2563eb" },
  { id: "green-theme", label: "Thème Vert",      color: "#16a34a" },
  { id: "warm-theme",  label: "Thème Chaud",     color: "#ea580c" },
  { id: "grayscale",   label: "Noir & Blanc",    color: "#374151" },
  { id: "sepia",       label: "Sépia",           color: "#92400e" },
  { id: "invert",      label: "Inversé",         color: "#6d28d9" },
]

// ─── RESIZE HANDLES ──────────────────────────────────────────────────────────

const HANDLES = [
  { id: "nw", cursor: "nwse-resize", top: -5, left: -5 },
  { id: "n",  cursor: "ns-resize",   top: -5, left: "50%" },
  { id: "ne", cursor: "nesw-resize", top: -5, right: -5 },
  { id: "e",  cursor: "ew-resize",   top: "50%", right: -5 },
  { id: "se", cursor: "nwse-resize", bottom: -5, right: -5 },
  { id: "s",  cursor: "ns-resize",   bottom: -5, left: "50%" },
  { id: "sw", cursor: "nesw-resize", bottom: -5, left: -5 },
  { id: "w",  cursor: "ew-resize",   top: "50%", left: -5 },
]

// ─── ANNOTATION IMAGE COMPONENT ──────────────────────────────────────────────

interface AnnotationImageProps {
  annotation: LessonAnnotation
  isAdmin: boolean
  onUpdate: (id: string, patch: Partial<LessonAnnotation>) => void
  onDelete: (id: string) => void
}

export function AnnotationImage({ annotation, isAdmin, onUpdate, onDelete }: AnnotationImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [selected, setSelected] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [liveWidth, setLiveWidth] = useState<number | null>(null)
  const dragState = useRef<{ handle: string; startX: number; startY: number; startW: number; startH: number } | null>(null)

  const currentWidth = liveWidth ?? annotation.widthPct
  const filterCss = FILTER_MAP[annotation.filter] || ""

  const buildStyle = (w: number, float: string): React.CSSProperties => {
    const base: React.CSSProperties = { width: `${w}%`, height: "auto" }
    if (float === "left")   return { ...base, float: "left",  margin: "6px 16px 12px 0", display: "inline-block" }
    if (float === "right")  return { ...base, float: "right", margin: "6px 0 12px 16px", display: "inline-block" }
    return { ...base, display: "block", margin: "12px auto", clear: "both" }
  }

  // ── Drag-to-resize ───────────────────────────────────────────────────────
  const startDrag = useCallback((e: React.MouseEvent, handleId: string) => {
    e.preventDefault(); e.stopPropagation()
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    dragState.current = { handle: handleId, startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height }
    setIsDragging(true)

    const onMove = (ev: MouseEvent) => {
      if (!dragState.current || !wrapRef.current) return
      const { handle, startX, startY, startW, startH } = dragState.current
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let newW = startW
      if (handle.includes("e")) newW = startW + dx
      if (handle.includes("w")) newW = startW - dx
      if (handle === "n" || handle === "s") {
        const ar = startW / (startH || 1)
        newW = (handle === "n" ? startH - dy : startH + dy) * ar
      }
      const parentW = wrapRef.current.parentElement?.offsetWidth || 600
      setLiveWidth(Math.max(15, Math.min(100, Math.round((newW / parentW) * 100))))
    }

    const onUp = () => {
      if (dragState.current && liveWidth !== null) {
        onUpdate(annotation.id, { widthPct: liveWidth })
      } else if (dragState.current) {
        const finalW = liveWidth ?? annotation.widthPct
        onUpdate(annotation.id, { widthPct: finalW })
      }
      dragState.current = null
      setIsDragging(false)
      setLiveWidth(null)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [annotation.id, annotation.widthPct, liveWidth, onUpdate])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSelected(false)
        setShowFilterPanel(false)
      }
    }
    window.addEventListener("mousedown", handler)
    return () => window.removeEventListener("mousedown", handler)
  }, [])

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "auto",
    display: "block",
    borderRadius: 3,
    filter: filterCss || undefined,
    opacity: annotation.opacity,
    transition: isDragging ? "none" : "filter 0.3s ease",
  }

  const wrapStyle: React.CSSProperties = {
    ...buildStyle(currentWidth, annotation.float),
    position: "relative",
    userSelect: "none",
    outline: selected && isAdmin ? "2px solid #2563eb" : "none",
    borderRadius: 4,
    boxSizing: "border-box",
    cursor: isAdmin ? "pointer" : "default",
  }

  return (
    <div ref={wrapRef} style={wrapStyle} onClick={() => isAdmin && setSelected(true)}>
      <img
        ref={imgRef}
        src={annotation.imageUrl}
        alt={annotation.caption || "image"}
        style={imgStyle}
        draggable={false}
      />

      {/* Caption */}
      {annotation.caption && (
        <p style={{ textAlign: "center", fontSize: 11, color: "#64748b", marginTop: 4, fontStyle: "italic" }}>
          {annotation.caption}
        </p>
      )}

      {/* Live size badge */}
      {isDragging && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "rgba(15,23,42,0.85)", color: "white",
          padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: "bold",
          pointerEvents: "none", zIndex: 60
        }}>
          {currentWidth}%
        </div>
      )}

      {/* Selection UI – only for admin */}
      {isAdmin && selected && (
        <>
          {/* 8 resize handles */}
          {HANDLES.map((h) => (
            <div
              key={h.id}
              onMouseDown={(e) => startDrag(e, h.id)}
              style={{
                position: "absolute",
                width: 10, height: 10,
                backgroundColor: "#2563eb",
                border: "2px solid white",
                borderRadius: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                cursor: h.cursor,
                zIndex: 30,
                top: (h as any).top,
                left: (h as any).left,
                right: (h as any).right,
                bottom: (h as any).bottom,
                transform: (h as any).top === "50%" || (h as any).left === "50%" ? "translate(-50%,-50%)" : undefined,
              }}
            />
          ))}

          {/* Floating mini-toolbar */}
          <div
            style={{
              position: "absolute", top: -44, left: "50%",
              transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 2,
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8, padding: "4px 6px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              zIndex: 50, whiteSpace: "nowrap",
              color: "white", fontSize: 11, fontFamily: "sans-serif",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Width presets */}
            {[25, 40, 60, 80].map(pct => (
              <button key={pct} type="button"
                onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { widthPct: pct }) }}
                style={{
                  padding: "2px 7px", borderRadius: 4, border: "none", cursor: "pointer",
                  fontSize: 11,
                  fontWeight: Math.abs(currentWidth - pct) < 5 ? 700 : 400,
                  background: Math.abs(currentWidth - pct) < 5 ? "#2563eb" : "transparent",
                  color: "white",
                }}
              >
                {pct}%
              </button>
            ))}

            <div style={{ width: 1, height: 16, background: "#334155", margin: "0 3px" }} />

            {/* Float alignment */}
            <button type="button" onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { float: "left" }) }}
              title="Flottant Gauche" style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: annotation.float === "left" ? "#2563eb" : "transparent", color: "white" }}>
              <AlignLeft size={13} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { float: "center" }) }}
              title="Centré" style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: annotation.float === "center" ? "#2563eb" : "transparent", color: "white" }}>
              <AlignCenter size={13} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { float: "right" }) }}
              title="Flottant Droite" style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: annotation.float === "right" ? "#2563eb" : "transparent", color: "white" }}>
              <AlignRight size={13} />
            </button>

            <div style={{ width: 1, height: 16, background: "#334155", margin: "0 3px" }} />

            {/* Filter toggle */}
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowFilterPanel(p => !p) }}
              title="Filtres de couleur" style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: showFilterPanel ? "#7c3aed" : "transparent", color: "#60a5fa" }}>
              <Palette size={13} />
            </button>

            {/* Delete */}
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(annotation.id) }}
              title="Supprimer l'image" style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: "transparent", color: "#f87171" }}>
              <Trash2 size={13} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div
              style={{
                position: "absolute", top: -130, left: "50%",
                transform: "translateX(-50%)",
                background: "#1e293b", border: "1px solid #334155",
                borderRadius: 10, padding: "10px 12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                zIndex: 51, color: "white", fontSize: 11,
                minWidth: 240,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Intégration & Thème
                <button type="button" onClick={() => setShowFilterPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                  <X size={12} />
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {FILTER_LABELS.map(fl => (
                  <button key={fl.id} type="button"
                    onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { filter: fl.id }); setShowFilterPanel(false) }}
                    style={{
                      padding: "4px 10px", borderRadius: 20,
                      border: `2px solid ${annotation.filter === fl.id ? fl.color : "#334155"}`,
                      background: annotation.filter === fl.id ? fl.color + "33" : "transparent",
                      color: annotation.filter === fl.id ? fl.color : "#94a3b8",
                      cursor: "pointer", fontSize: 11, fontWeight: annotation.filter === fl.id ? 700 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {fl.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 50 }}>Opacité</span>
                <input
                  type="range" min="10" max="100" step="5"
                  value={Math.round(annotation.opacity * 100)}
                  onChange={(e) => onUpdate(annotation.id, { opacity: parseInt(e.target.value) / 100 })}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 30 }}>{Math.round(annotation.opacity * 100)}%</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── DROP ZONE (for inserting new annotation) ─────────────────────────────────

interface AnnotationDropZoneProps {
  blockId: string
  position: "before" | "after"
  lessonId: string
  onAnnotationCreated: (ann: LessonAnnotation) => void
}

export function AnnotationDropZone({ blockId, position, lessonId, onAnnotationCreated }: AnnotationDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const uploadAndCreate = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return
    if (file.size > 8 * 1024 * 1024) { toast.error("Image trop volumineuse (max 8 Mo)"); return }
    setIsUploading(true)
    const toastId = toast.loading("Ajout de l'image...")
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("entityType", "lesson")
      fd.append("entityId", lessonId)
      const upRes = await fetch("/api/admin/images/upload", { method: "POST", body: fd })
      let imageUrl = ""
      let imageId: string | undefined
      if (upRes.ok) {
        const upData = await upRes.json()
        if (upData.image?.id) { imageUrl = `/api/images/${upData.image.id}`; imageId = upData.image.id }
      }
      if (!imageUrl) {
        // base64 fallback
        imageUrl = await new Promise<string>((res) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      // Save annotation to DB
      const annRes = await fetch("/api/lesson-annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, blockId, imageUrl, imageId, position, float: "left", widthPct: 40 }),
      })
      if (annRes.ok) {
        const ann = await annRes.json()
        onAnnotationCreated(ann)
        toast.success("Image ajoutée !", { id: toastId })
      } else {
        toast.error("Erreur lors de l'enregistrement", { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors de l'ajout de l'image", { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }, [lessonId, blockId, position, onAnnotationCreated])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadAndCreate(file)
  }

  const handleClick = () => {
    const input = document.createElement("input")
    input.type = "file"; input.accept = "image/*"
    input.onchange = (e: any) => { const f = e.target?.files?.[0]; if (f) uploadAndCreate(f) }
    input.click()
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onClick={handleClick}
      title={`Cliquer ou glisser une image ${position === "before" ? "avant" : "après"} ce bloc`}
      style={{
        width: "100%",
        height: isDragOver ? 48 : 6,
        border: isDragOver ? "2px dashed #2563eb" : "2px dashed transparent",
        borderRadius: 6,
        background: isDragOver ? "#eff6ff" : "transparent",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#2563eb", fontSize: 12, fontWeight: 600,
        overflow: "hidden",
        opacity: isUploading ? 0.6 : 1,
        position: "relative",
        zIndex: 5,
      }}
    >
      {isDragOver && <span>📎 Déposer l'image ici</span>}
      {isUploading && <span style={{ color: "#64748b", fontStyle: "italic" }}>Envoi en cours...</span>}
      {/* Hover hint strip */}
      <div className="annotation-drop-hint" style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: 0, transition: "opacity 0.2s",
        color: "#2563eb", fontSize: 11,
      }}>
        + Image
      </div>
      <style>{`.annotation-drop-hint:hover { opacity: 1 !important; }`}</style>
    </div>
  )
}
