"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Maximize2,
  Square,
  Sparkles,
  Type,
  BoxSelect
} from "lucide-react"

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface LessonAnnotation {
  id: string
  lessonId: string
  blockId: string
  imageUrl: string
  imageId?: string | null
  float: string        // 'left' | 'right' | 'center' | 'full'
  widthPct: number     // 15–100
  filter: string       // filter + frame preset string
  opacity: number      // 0.1–1.0
  caption?: string | null
  position: string     // 'before' | 'after' | 'inside' | 'inside-p0' | 'inside-p1' etc.
}

// ─── FILTER & FRAME PRESETS ───────────────────────────────────────────────────

const FILTER_MAP: Record<string, string> = {
  none:          "",
  grayscale:     "grayscale(100%)",
  sepia:         "sepia(80%)",
  invert:        "invert(85%) hue-rotate(180deg)",
  "blue-theme":  "sepia(50%) hue-rotate(185deg) saturate(1.6)",
  "green-theme": "sepia(45%) hue-rotate(100deg) saturate(1.5)",
  "warm-theme":  "sepia(40%) saturate(1.35) brightness(1.05)",
}

const FILTER_LABELS: { id: string; label: string; color: string }[] = [
  { id: "none",        label: "Original",       color: "#64748b" },
  { id: "blue-theme",  label: "Thème Définition (Bleu)", color: "#2563eb" },
  { id: "green-theme", label: "Thème Théorème (Vert)", color: "#16a34a" },
  { id: "warm-theme",  label: "Thème Exemple (Ambre)", color: "#ea580c" },
  { id: "grayscale",   label: "Noir & Blanc",    color: "#374151" },
  { id: "sepia",       label: "Sépia",           color: "#92400e" },
  { id: "invert",      label: "Inversé",         color: "#6d28d9" },
]

const FRAME_PRESETS: { id: string; label: string; desc: string }[] = [
  { id: "none", label: "Simple", desc: "Sans cadre" },
  { id: "academic", label: "Photo / Livre", desc: "Cadre blanc + ombre douce" },
  { id: "subtle", label: "Bordure fine", desc: "Ligne grise épurée" },
  { id: "rounded", label: "Arrondi", desc: "Coins très arrondis" },
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
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onToggleInside?: (id: string) => void
}

export function AnnotationImage({
  annotation,
  isAdmin,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleInside
}: AnnotationImageProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [selected, setSelected] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showCaptionInput, setShowCaptionInput] = useState(false)
  const [captionText, setCaptionText] = useState(annotation.caption || "")
  const [isResizing, setIsResizing] = useState(false)
  const [liveWidth, setLiveWidth] = useState<number | null>(null)
  const dragState = useRef<{ handle: string; startX: number; startY: number; startW: number; startH: number } | null>(null)

  const currentWidth = liveWidth ?? annotation.widthPct

  // Parse filter & frame
  const filterParts = (annotation.filter || "none").split("|")
  const colorFilter = filterParts[0] || "none"
  const frameStyle = filterParts[1] || "none"

  const filterCss = FILTER_MAP[colorFilter] || ""

  // Build frame styling
  const getFrameCss = (frame: string): React.CSSProperties => {
    switch (frame) {
      case "academic":
        return {
          backgroundColor: "#ffffff",
          padding: "5px",
          borderRadius: "6px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0"
        }
      case "subtle":
        return {
          borderRadius: "6px",
          border: "1px solid #cbd5e1",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }
      case "rounded":
        return {
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 3px 10px rgba(0,0,0,0.08)"
        }
      default:
        return {
          borderRadius: "4px"
        }
    }
  }

  // Build wrapping layout style
  const buildLayout = (w: number, float: string): React.CSSProperties => {
    if (float === "full") {
      return { width: "100%", display: "block", margin: "16px 0", clear: "both" }
    }
    const base: React.CSSProperties = { width: `${w}%`, height: "auto" }
    if (float === "left") {
      return { ...base, float: "left", margin: "8px 18px 12px 0", display: "inline-block" }
    }
    if (float === "right") {
      return { ...base, float: "right", margin: "8px 0 12px 18px", display: "inline-block" }
    }
    // center / top-bottom
    return { ...base, display: "block", margin: "16px auto", clear: "both" }
  }

  // ── Drag-to-resize ───────────────────────────────────────────────────────
  const startDrag = useCallback((e: React.MouseEvent, handleId: string) => {
    e.preventDefault(); e.stopPropagation()
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    dragState.current = { handle: handleId, startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height }
    setIsResizing(true)

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
      setIsResizing(false)
      setLiveWidth(null)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [annotation.id, annotation.widthPct, liveWidth, onUpdate])

  // Close selection on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSelected(false)
        setShowFilterPanel(false)
        setShowCaptionInput(false)
      }
    }
    window.addEventListener("mousedown", handler)
    return () => window.removeEventListener("mousedown", handler)
  }, [])

  // Drag-and-drop to move the image
  const handleDragStart = (e: React.DragEvent) => {
    if (!isAdmin || isResizing) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData("text/annotation-id", annotation.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const isInside = annotation.position.startsWith("inside")

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "auto",
    display: "block",
    borderRadius: frameStyle === "rounded" ? "12px" : "3px",
    filter: filterCss || undefined,
    opacity: annotation.opacity,
    transition: isResizing ? "none" : "filter 0.3s ease",
  }

  const wrapStyle: React.CSSProperties = {
    ...buildLayout(currentWidth, annotation.float),
    ...getFrameCss(frameStyle),
    position: "relative",
    userSelect: "none",
    outline: selected && isAdmin ? "2px solid #2563eb" : "none",
    outlineOffset: 2,
    boxSizing: "border-box",
    cursor: isAdmin ? "grab" : "default",
  }

  const handleSetFrame = (frameId: string) => {
    const newFilter = `${colorFilter}|${frameId}`
    onUpdate(annotation.id, { filter: newFilter })
  }

  const handleSetColor = (colorId: string) => {
    const newFilter = `${colorId}|${frameStyle}`
    onUpdate(annotation.id, { filter: newFilter })
  }

  const handleSaveCaption = () => {
    onUpdate(annotation.id, { caption: captionText.trim() || null })
    setShowCaptionInput(false)
  }

  return (
    <div
      ref={wrapRef}
      style={wrapStyle}
      draggable={isAdmin && !isResizing}
      onDragStart={handleDragStart}
      onClick={(e) => {
        if (isAdmin) {
          e.stopPropagation()
          setSelected(true)
        }
      }}
    >
      <img
        ref={imgRef}
        src={annotation.imageUrl}
        alt={annotation.caption || "image"}
        style={imgStyle}
        draggable={false}
      />

      {/* Caption Display */}
      {annotation.caption && (
        <p style={{ textAlign: "center", fontSize: 11, color: "#64748b", marginTop: 5, fontStyle: "italic", lineHeight: 1.3 }}>
          {annotation.caption}
        </p>
      )}

      {/* Live size badge */}
      {isResizing && (
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

          {/* Floating mini-toolbar (Word style) */}
          <div
            style={{
              position: "absolute", top: -48, left: "50%",
              transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 3,
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 8, padding: "4px 8px",
              boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
              zIndex: 50, whiteSpace: "nowrap",
              color: "white", fontSize: 11, fontFamily: "sans-serif",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div
              title="Glisser-déposer pour déplacer l'image"
              style={{ display: "flex", alignItems: "center", cursor: "grab", color: "#94a3b8", paddingRight: 2 }}
            >
              <GripVertical size={13} />
            </div>

            {/* In-box vs outside toggle */}
            {onToggleInside && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleInside(annotation.id) }}
                title={isInside ? "Actuellement dans la boîte du texte (Cliquer pour mettre au-dessus)" : "Actuellement en dehors (Cliquer pour intégrer dans la boîte du texte)"}
                style={{
                  padding: "3px 7px", borderRadius: 4, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600,
                  background: isInside ? "#16a34a" : "#334155", color: "white",
                }}
              >
                <BoxSelect size={12} />
                <span>{isInside ? "Dans la boîte" : "Hors boîte"}</span>
              </button>
            )}

            {/* Move Up / Down */}
            {onMoveUp && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveUp(annotation.id) }}
                title="Déplacer vers le haut"
                style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: "transparent", color: "white" }}
              >
                <ArrowUp size={13} />
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveDown(annotation.id) }}
                title="Déplacer vers le bas"
                style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: "transparent", color: "white" }}
              >
                <ArrowDown size={13} />
              </button>
            )}

            <div style={{ width: 1, height: 16, background: "#334155", margin: "0 2px" }} />

            {/* Width presets */}
            {[25, 40, 60, 80].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { widthPct: pct, float: annotation.float === "full" ? "center" : annotation.float }) }}
                style={{
                  padding: "2px 6px", borderRadius: 4, border: "none", cursor: "pointer",
                  fontSize: 11,
                  fontWeight: Math.abs(currentWidth - pct) < 5 && annotation.float !== "full" ? 700 : 400,
                  background: Math.abs(currentWidth - pct) < 5 && annotation.float !== "full" ? "#2563eb" : "transparent",
                  color: "white",
                }}
              >
                {pct}%
              </button>
            ))}

            <div style={{ width: 1, height: 16, background: "#334155", margin: "0 2px" }} />

            {/* Float alignment / Text Wrapping */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { float: "left" }) }}
              title="Flottant Gauche (le texte s'enroule à droite)"
              style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: annotation.float === "left" ? "#2563eb" : "transparent", color: "white" }}
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { float: "center" }) }}
              title="Centré / Haut et Bas (coupe la ligne de texte)"
              style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: annotation.float === "center" ? "#2563eb" : "transparent", color: "white" }}
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { float: "right" }) }}
              title="Flottant Droite (le texte s'enroule à gauche)"
              style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: annotation.float === "right" ? "#2563eb" : "transparent", color: "white" }}
            >
              <AlignRight size={13} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpdate(annotation.id, { float: "full", widthPct: 100 }) }}
              title="Pleine Largeur (100%)"
              style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: annotation.float === "full" ? "#2563eb" : "transparent", color: "white" }}
            >
              <Maximize2 size={13} />
            </button>

            <div style={{ width: 1, height: 16, background: "#334155", margin: "0 2px" }} />

            {/* Caption button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowCaptionInput(p => !p); setShowFilterPanel(false) }}
              title="Ajouter / Modifier la légende"
              style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: showCaptionInput || annotation.caption ? "#3b82f6" : "transparent", color: "white" }}
            >
              <Type size={13} />
            </button>

            {/* Style & Filter toggle */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowFilterPanel(p => !p); setShowCaptionInput(false) }}
              title="Filtres de couleur, cadres & styles"
              style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: showFilterPanel ? "#7c3aed" : "transparent", color: "#60a5fa" }}
            >
              <Palette size={13} />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(annotation.id) }}
              title="Supprimer l'image"
              style={{ padding: 4, borderRadius: 4, border: "none", cursor: "pointer", display: "flex", background: "transparent", color: "#f87171" }}
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Caption Input Popover */}
          {showCaptionInput && (
            <div
              style={{
                position: "absolute", top: -96, left: "50%",
                transform: "translateX(-50%)",
                background: "#1e293b", border: "1px solid #334155",
                borderRadius: 8, padding: "8px 10px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                zIndex: 52, color: "white", fontSize: 11,
                display: "flex", gap: 6, alignItems: "center",
                width: 280,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Ex: Figure 1 : Courbe de Gauss..."
                style={{
                  flex: 1, background: "#0f172a", border: "1px solid #475569",
                  color: "white", borderRadius: 4, padding: "4px 8px", fontSize: 11
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSaveCaption()}
              />
              <button
                type="button"
                onClick={handleSaveCaption}
                style={{
                  background: "#2563eb", color: "white", border: "none",
                  borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontWeight: 600, fontSize: 11
                }}
              >
                OK
              </button>
            </div>
          )}

          {/* Filter & Frame Panel */}
          {showFilterPanel && (
            <div
              style={{
                position: "absolute", top: -190, left: "50%",
                transform: "translateX(-50%)",
                background: "#1e293b", border: "1px solid #334155",
                borderRadius: 10, padding: "10px 14px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                zIndex: 51, color: "white", fontSize: 11,
                minWidth: 300,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Cadres & Couleurs Word
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* Frames */}
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Style de Cadre
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {FRAME_PRESETS.map(fp => (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSetFrame(fp.id) }}
                    style={{
                      flex: 1, padding: "4px 6px", borderRadius: 6,
                      border: `1px solid ${frameStyle === fp.id ? "#3b82f6" : "#475569"}`,
                      background: frameStyle === fp.id ? "#1d4ed8" : "#0f172a",
                      color: "white", cursor: "pointer", fontSize: 10,
                      fontWeight: frameStyle === fp.id ? 700 : 400
                    }}
                  >
                    {fp.label}
                  </button>
                ))}
              </div>

              {/* Color themes */}
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Couleur & Teinte
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {FILTER_LABELS.map(fl => (
                  <button
                    key={fl.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSetColor(fl.id) }}
                    style={{
                      padding: "3px 8px", borderRadius: 16,
                      border: `1.5px solid ${colorFilter === fl.id ? fl.color : "#334155"}`,
                      background: colorFilter === fl.id ? fl.color + "33" : "transparent",
                      color: colorFilter === fl.id ? fl.color : "#94a3b8",
                      cursor: "pointer", fontSize: 10, fontWeight: colorFilter === fl.id ? 700 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {fl.label}
                  </button>
                ))}
              </div>

              {/* Opacity slider */}
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 45 }}>Opacité</span>
                <input
                  type="range" min="10" max="100" step="5"
                  value={Math.round(annotation.opacity * 100)}
                  onChange={(e) => onUpdate(annotation.id, { opacity: parseInt(e.target.value) / 100 })}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 28 }}>{Math.round(annotation.opacity * 100)}%</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
