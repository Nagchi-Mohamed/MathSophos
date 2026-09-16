"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { NodeViewWrapper } from "@tiptap/react"
import {
  AlignCenter, AlignLeft, AlignRight, Palette, Trash2
} from "lucide-react"

interface ImageNodeViewProps {
  node: any
  updateAttributes: (attrs: Record<string, any>) => void
  deleteNode: () => void
  selected: boolean
  editor: any
  getPos: () => number | undefined
  extension: any
}

// 8-point resize handles like Microsoft Word
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

export function ImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: ImageNodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [isSelected, setIsSelected] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [liveWidthPct, setLiveWidthPct] = useState<number | null>(null)

  const dragState = useRef<{
    handle: string
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  // Sync selection with editor selection
  useEffect(() => {
    setIsSelected(selected)
  }, [selected])

  // Parse current style for width
  const getWidth = useCallback((): number => {
    if (liveWidthPct !== null) return liveWidthPct
    const style = node.attrs.style || ""
    const match = style.match(/width:\s*([\d.]+)%/)
    if (match) return parseFloat(match[1])
    const pxMatch = style.match(/width:\s*([\d.]+)px/)
    if (pxMatch && imgRef.current?.parentElement) {
      const parentWidth = imgRef.current.parentElement.offsetWidth || 600
      return (parseFloat(pxMatch[1]) / parentWidth) * 100
    }
    return 75
  }, [node.attrs.style, liveWidthPct])

  const getLayout = useCallback((): string => {
    const style = node.attrs.style || ""
    if (style.includes("float: left")) return "float-left"
    if (style.includes("float: right")) return "float-right"
    return "center"
  }, [node.attrs.style])

  const buildStyle = (widthPct: number, layout: string): string => {
    const w = `width: ${Math.round(widthPct)}%;`
    const h = `height: auto;`
    if (layout === "float-left") return `${w} ${h} float: left; margin: 8px 16px 12px 0; display: inline-block;`
    if (layout === "float-right") return `${w} ${h} float: right; margin: 8px 0 12px 16px; display: inline-block;`
    return `${w} ${h} display: block; margin: 12px auto; clear: both;`
  }

  // ─── RESIZE DRAG LOGIC (MOUSE & TOUCH) ───────────────────────────────────────
  const startDrag = useCallback((clientX: number, clientY: number, handleId: string) => {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()

    dragState.current = {
      handle: handleId,
      startX: clientX,
      startY: clientY,
      startWidth: rect.width,
      startHeight: rect.height,
    }
    setIsDragging(true)

    const onMove = (moveX: number, moveY: number) => {
      if (!dragState.current || !wrapperRef.current) return
      const { handle, startX, startY, startWidth, startHeight } = dragState.current
      const dx = moveX - startX
      const dy = moveY - startY

      let newWidth = startWidth
      if (handle.includes("e")) newWidth = startWidth + dx
      if (handle.includes("w")) newWidth = startWidth - dx
      if (handle === "n" || handle === "s") {
        const ar = startWidth / (startHeight || 1)
        const newH = handle === "n" ? startHeight - dy : startHeight + dy
        newWidth = newH * ar
      }

      const parentW = wrapperRef.current.parentElement?.offsetWidth || wrapperRef.current.offsetWidth || 600
      let widthPct = (newWidth / parentW) * 100
      widthPct = Math.max(15, Math.min(100, Math.round(widthPct)))

      setLiveWidthPct(widthPct)
    }

    const onEnd = () => {
      if (dragState.current) {
        const finalW = liveWidthPct ?? getWidth()
        const layout = getLayout()
        updateAttributes({ style: buildStyle(finalW, layout) })
      }
      dragState.current = null
      setIsDragging(false)
      setLiveWidthPct(null)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }

    const handleMouseMove = (ev: MouseEvent) => onMove(ev.clientX, ev.clientY)
    const handleMouseUp = () => onEnd()
    const handleTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length > 0) onMove(ev.touches[0].clientX, ev.touches[0].clientY)
    }
    const handleTouchEnd = () => onEnd()

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchmove", handleTouchMove)
    window.addEventListener("touchend", handleTouchEnd)
  }, [getWidth, getLayout, liveWidthPct, updateAttributes])

  const onHandleMouseDown = (e: React.MouseEvent, handleId: string) => {
    e.preventDefault()
    e.stopPropagation()
    startDrag(e.clientX, e.clientY, handleId)
  }

  const onHandleTouchStart = (e: React.TouchEvent, handleId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.touches.length > 0) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY, handleId)
    }
  }

  // ─── ACTIONS ────────────────────────────────────────────────────────────────
  const setLayout = (layout: "float-left" | "center" | "float-right") => {
    const w = getWidth()
    updateAttributes({ style: buildStyle(w, layout) })
  }

  const setWidthPct = (pct: number) => {
    const layout = getLayout()
    updateAttributes({ style: buildStyle(pct, layout) })
  }

  const openStyleModal = () => {
    const img = imgRef.current
    if (!img) return
    const evt = new CustomEvent("tiptap-image-style", { detail: { img } })
    window.dispatchEvent(evt)
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    openStyleModal()
  }

  const onImgClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSelected(true)
  }

  // Close selection on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsSelected(false)
      }
    }
    window.addEventListener("mousedown", handleClickOutside)
    return () => window.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentLayout = getLayout()
  const currentWidth = getWidth()

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    display: currentLayout === "center" ? "block" : "inline-block",
    float: currentLayout === "float-left" ? "left" : currentLayout === "float-right" ? "right" : undefined,
    margin: currentLayout === "center" ? "12px auto" : currentLayout === "float-left" ? "8px 16px 12px 0" : "8px 0 12px 16px",
    maxWidth: "100%",
    width: `${currentWidth}%`,
    cursor: isDragging ? "nwse-resize" : "default",
    userSelect: "none",
    outline: isSelected ? "2px solid #2563eb" : "none",
    borderRadius: 3,
  }

  return (
    <NodeViewWrapper
      as="span"
      style={{ display: currentLayout === "center" ? "block" : "inline-block", lineHeight: 0 }}
      data-drag-handle=""
    >
      <div ref={wrapperRef} style={wrapperStyle} contentEditable={false}>
        {/* The actual image */}
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ""}
          style={{ width: "100%", height: "auto", display: "block", borderRadius: 2 }}
          onClick={onImgClick}
          onDoubleClick={onDoubleClick}
          draggable={false}
        />

        {/* Live size tooltip when dragging */}
        {isDragging && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              color: "white",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: "bold",
              fontFamily: "sans-serif",
              pointerEvents: "none",
              zIndex: 60,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
          >
            {Math.round(currentWidth)}%
          </div>
        )}

        {/* ── SELECTION UI (only shown when selected) ── */}
        {isSelected && (
          <>
            {/* 8 Resize Handles */}
            {HANDLES.map((h) => (
              <div
                key={h.id}
                onMouseDown={(e) => onHandleMouseDown(e, h.id)}
                onTouchStart={(e) => onHandleTouchStart(e, h.id)}
                style={{
                  position: "absolute",
                  width: 9,
                  height: 9,
                  backgroundColor: "#2563eb",
                  border: "2px solid #ffffff",
                  borderRadius: 2,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                  cursor: h.cursor,
                  zIndex: 20,
                  top: (h as any).top,
                  left: (h as any).left,
                  right: (h as any).right,
                  bottom: (h as any).bottom,
                  transform: (h as any).top === "50%" || (h as any).left === "50%"
                    ? "translate(-50%, -50%)"
                    : undefined,
                }}
              />
            ))}

            {/* ── FLOATING MINI TOOLBAR ── */}
            <div
              style={{
                position: "absolute",
                top: -42,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 3,
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: "3px 6px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                zIndex: 50,
                whiteSpace: "nowrap",
                color: "white",
                fontSize: 11,
                fontFamily: "sans-serif",
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Width presets */}
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setWidthPct(pct) }}
                  title={`Largeur ${pct}%`}
                  style={{
                    padding: "2px 7px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: Math.abs(currentWidth - pct) < 3 ? 700 : 400,
                    backgroundColor: Math.abs(currentWidth - pct) < 3 ? "#2563eb" : "transparent",
                    color: "white",
                  }}
                >
                  {pct}%
                </button>
              ))}

              <div style={{ width: 1, height: 16, backgroundColor: "#334155", margin: "0 2px" }} />

              {/* Alignment */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLayout("float-left") }}
                title="Flottant Gauche"
                style={{
                  padding: 4, borderRadius: 4, border: "none", cursor: "pointer",
                  backgroundColor: currentLayout === "float-left" ? "#2563eb" : "transparent",
                  color: "white", display: "flex"
                }}
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLayout("center") }}
                title="Centré"
                style={{
                  padding: 4, borderRadius: 4, border: "none", cursor: "pointer",
                  backgroundColor: currentLayout === "center" ? "#2563eb" : "transparent",
                  color: "white", display: "flex"
                }}
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLayout("float-right") }}
                title="Flottant Droite"
                style={{
                  padding: 4, borderRadius: 4, border: "none", cursor: "pointer",
                  backgroundColor: currentLayout === "float-right" ? "#2563eb" : "transparent",
                  color: "white", display: "flex"
                }}
              >
                <AlignRight size={13} />
              </button>

              <div style={{ width: 1, height: 16, backgroundColor: "#334155", margin: "0 2px" }} />

              {/* Styles modal */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openStyleModal() }}
                title="Styles avancés & Filtres (Double-clic)"
                style={{
                  padding: 4, borderRadius: 4, border: "none", cursor: "pointer",
                  backgroundColor: "transparent", color: "#60a5fa", display: "flex"
                }}
              >
                <Palette size={13} />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); deleteNode() }}
                title="Supprimer l'image"
                style={{
                  padding: 4, borderRadius: 4, border: "none", cursor: "pointer",
                  backgroundColor: "transparent", color: "#f87171", display: "flex"
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  )
}
