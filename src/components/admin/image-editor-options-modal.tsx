"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layout, Palette, Move, Sparkles, Check, Image as ImageIcon } from "lucide-react"

export interface ImageStyleOptions {
  layout: "inline" | "float-left" | "float-right" | "center" | "background" | "front"
  width: string // e.g. "100%", "50%", "300px"
  filterPreset: "none" | "invert" | "high-contrast" | "grayscale" | "sepia" | "theme-blend"
  brightness: number // 50 to 150
  contrast: number // 50 to 200
  opacity: number // 10 to 100
}

interface ImageEditorOptionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStyles?: Partial<ImageStyleOptions>
  onApply: (styles: ImageStyleOptions, styleString: string) => void
}

export function ImageEditorOptionsModal({
  open,
  onOpenChange,
  initialStyles,
  onApply,
}: ImageEditorOptionsModalProps) {
  const [layout, setLayout] = useState<ImageStyleOptions["layout"]>(initialStyles?.layout || "center")
  const [width, setWidth] = useState<string>(initialStyles?.width || "75%")
  const [filterPreset, setFilterPreset] = useState<ImageStyleOptions["filterPreset"]>(initialStyles?.filterPreset || "none")
  const [brightness, setBrightness] = useState<number>(initialStyles?.brightness ?? 100)
  const [contrast, setContrast] = useState<number>(initialStyles?.contrast ?? 100)
  const [opacity, setOpacity] = useState<number>(initialStyles?.opacity ?? 100)

  useEffect(() => {
    if (initialStyles) {
      if (initialStyles.layout) setLayout(initialStyles.layout)
      if (initialStyles.width) setWidth(initialStyles.width)
      if (initialStyles.filterPreset) setFilterPreset(initialStyles.filterPreset)
      if (initialStyles.brightness !== undefined) setBrightness(initialStyles.brightness)
      if (initialStyles.contrast !== undefined) setContrast(initialStyles.contrast)
      if (initialStyles.opacity !== undefined) setOpacity(initialStyles.opacity)
    }
  }, [initialStyles, open])

  // Compute CSS style string from options
  const generateStyleString = (): string => {
    const styles: string[] = []

    // Width & height
    styles.push(`width: ${width};`)
    styles.push(`height: auto;`)

    // Layout positioning
    if (layout === "float-left") {
      styles.push(`float: left;`)
      styles.push(`margin: 8px 16px 12px 0;`)
      styles.push(`display: inline-block;`)
    } else if (layout === "float-right") {
      styles.push(`float: right;`)
      styles.push(`margin: 8px 0 12px 16px;`)
      styles.push(`display: inline-block;`)
    } else if (layout === "center") {
      styles.push(`display: block;`)
      styles.push(`margin: 16px auto;`)
      styles.push(`clear: both;`)
    } else if (layout === "background") {
      styles.push(`display: block;`)
      styles.push(`margin: 12px auto;`)
      styles.push(`opacity: ${opacity < 50 ? opacity / 100 : 0.25};`)
      styles.push(`mix-blend-mode: multiply;`)
    } else if (layout === "inline") {
      styles.push(`display: inline;`)
      styles.push(`vertical-align: middle;`)
      styles.push(`margin: 0 4px;`)
    }

    // Filters
    const filterParts: string[] = []
    if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`)
    if (contrast !== 100) filterParts.push(`contrast(${contrast}%)`)

    if (filterPreset === "invert") filterParts.push(`invert(1) hue-rotate(180deg)`)
    if (filterPreset === "high-contrast") filterParts.push(`contrast(160%) brightness(110%)`)
    if (filterPreset === "grayscale") filterParts.push(`grayscale(100%)`)
    if (filterPreset === "sepia") filterParts.push(`sepia(80%)`)
    if (filterPreset === "theme-blend") filterParts.push(`contrast(115%) saturate(120%)`)

    if (filterParts.length > 0) {
      styles.push(`filter: ${filterParts.join(" ")};`)
    }

    if (opacity !== 100 && layout !== "background") {
      styles.push(`opacity: ${opacity / 100};`)
    }

    return styles.join(" ")
  }

  const handleSave = () => {
    const opts: ImageStyleOptions = {
      layout,
      width,
      filterPreset,
      brightness,
      contrast,
      opacity,
    }
    onApply(opts, generateStyleString())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Layout className="h-5 w-5 text-primary" />
            Formatage & Habillage de l'Image (Style MS Word)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choisissez la disposition du texte autour de l'image et ajustez les couleurs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <Tabs defaultValue="wrapping" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="wrapping" className="text-xs font-semibold gap-1.5">
                <Layout className="h-3.5 w-3.5" /> Habillage Texte
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs font-semibold gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Couleurs & Filtres
              </TabsTrigger>
              <TabsTrigger value="size" className="text-xs font-semibold gap-1.5">
                <Move className="h-3.5 w-3.5" /> Dimensions
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: TEXT WRAPPING OPTIONS WITH VISUAL FIGURES */}
            <TabsContent value="wrapping" className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Options de disposition du texte :
              </Label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* 1. Inline */}
                <button
                  type="button"
                  onClick={() => setLayout("inline")}
                  className={`p-3 border-2 rounded-xl text-left flex flex-col items-center justify-between transition-all ${
                    layout === "inline" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-muted hover:border-gray-300 bg-card"
                  }`}
                >
                  <div className="w-full h-16 bg-muted/50 rounded p-2 flex items-center gap-1.5 mb-2 relative overflow-hidden">
                    <div className="w-3 h-2 bg-foreground/40 rounded-sm"></div>
                    <div className="w-5 h-5 bg-primary/80 rounded flex items-center justify-center text-[9px] text-white font-bold shrink-0">IMG</div>
                    <div className="w-6 h-2 bg-foreground/40 rounded-sm"></div>
                  </div>
                  <span className="text-xs font-bold text-center block w-full">Dans le texte</span>
                  <span className="text-[10px] text-muted-foreground text-center">Aligné en ligne</span>
                </button>

                {/* 2. Float Left (Square) */}
                <button
                  type="button"
                  onClick={() => setLayout("float-left")}
                  className={`p-3 border-2 rounded-xl text-left flex flex-col items-center justify-between transition-all ${
                    layout === "float-left" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-muted hover:border-gray-300 bg-card"
                  }`}
                >
                  <div className="w-full h-16 bg-muted/50 rounded p-2 relative overflow-hidden space-y-1">
                    <div className="w-6 h-7 bg-primary/80 rounded float-left mr-1.5 mb-1 flex items-center justify-center text-[9px] text-white font-bold">IMG</div>
                    <div className="h-1.5 bg-foreground/40 rounded"></div>
                    <div className="h-1.5 bg-foreground/40 rounded"></div>
                    <div className="h-1.5 bg-foreground/40 rounded"></div>
                  </div>
                  <span className="text-xs font-bold text-center block w-full">Flottant Gauche</span>
                  <span className="text-[10px] text-muted-foreground text-center">Texte à droite</span>
                </button>

                {/* 3. Float Right (Square) */}
                <button
                  type="button"
                  onClick={() => setLayout("float-right")}
                  className={`p-3 border-2 rounded-xl text-left flex flex-col items-center justify-between transition-all ${
                    layout === "float-right" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-muted hover:border-gray-300 bg-card"
                  }`}
                >
                  <div className="w-full h-16 bg-muted/50 rounded p-2 relative overflow-hidden space-y-1">
                    <div className="w-6 h-7 bg-primary/80 rounded float-right ml-1.5 mb-1 flex items-center justify-center text-[9px] text-white font-bold">IMG</div>
                    <div className="h-1.5 bg-foreground/40 rounded"></div>
                    <div className="h-1.5 bg-foreground/40 rounded"></div>
                    <div className="h-1.5 bg-foreground/40 rounded"></div>
                  </div>
                  <span className="text-xs font-bold text-center block w-full">Flottant Droite</span>
                  <span className="text-[10px] text-muted-foreground text-center">Texte à gauche</span>
                </button>

                {/* 4. Center (Separate Block) */}
                <button
                  type="button"
                  onClick={() => setLayout("center")}
                  className={`p-3 border-2 rounded-xl text-left flex flex-col items-center justify-between transition-all ${
                    layout === "center" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-muted hover:border-gray-300 bg-card"
                  }`}
                >
                  <div className="w-full h-16 bg-muted/50 rounded p-1.5 flex flex-col items-center justify-between">
                    <div className="w-full h-1.5 bg-foreground/40 rounded"></div>
                    <div className="w-8 h-6 bg-primary/80 rounded flex items-center justify-center text-[9px] text-white font-bold">IMG</div>
                    <div className="w-full h-1.5 bg-foreground/40 rounded"></div>
                  </div>
                  <span className="text-xs font-bold text-center block w-full">Centré (Bloc)</span>
                  <span className="text-[10px] text-muted-foreground text-center">Ligne séparée</span>
                </button>

                {/* 5. Background Watermark */}
                <button
                  type="button"
                  onClick={() => setLayout("background")}
                  className={`p-3 border-2 rounded-xl text-left flex flex-col items-center justify-between transition-all ${
                    layout === "background" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-muted hover:border-gray-300 bg-card"
                  }`}
                >
                  <div className="w-full h-16 bg-muted/50 rounded p-2 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute inset-2 bg-primary/20 rounded border border-dashed border-primary flex items-center justify-center text-[9px] text-primary font-bold">FILIGRANE</div>
                    <div className="h-1.5 bg-foreground/80 rounded z-10"></div>
                    <div className="h-1.5 bg-foreground/80 rounded z-10"></div>
                    <div className="h-1.5 bg-foreground/80 rounded z-10"></div>
                  </div>
                  <span className="text-xs font-bold text-center block w-full">Arrière-Plan</span>
                  <span className="text-[10px] text-muted-foreground text-center">Derrière le texte</span>
                </button>
              </div>
            </TabsContent>

            {/* TAB 2: COLOR & THEME FILTERS */}
            <TabsContent value="colors" className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Filtres de couleur pré-définis :
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "none", label: "Original", desc: "Couleurs naturelles" },
                  { id: "invert", label: "Inversé (Mode Sombre)", desc: "Idéal pour schémas sombres" },
                  { id: "high-contrast", label: "Contraste Élevé", desc: "Clarté du texte / formules" },
                  { id: "grayscale", label: "Nuances de Gris", desc: "Monochrome pour impression" },
                  { id: "sepia", label: "Sépia / Chaud", desc: "Style document ancien" },
                  { id: "theme-blend", label: "Harmonie Thème", desc: "Saturé & contrasté" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setFilterPreset(preset.id as any)}
                    className={`p-2.5 border rounded-lg text-left transition-all ${
                      filterPreset === preset.id ? "border-primary bg-primary/10 font-bold" : "border-muted hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-xs flex items-center justify-between">
                      <span>{preset.label}</span>
                      {filterPreset === preset.id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">{preset.desc}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Luminosité :</span>
                    <span>{brightness}%</span>
                  </div>
                  <Slider value={[brightness]} min={50} max={150} step={5} onValueChange={(v) => setBrightness(v[0])} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Contraste :</span>
                    <span>{contrast}%</span>
                  </div>
                  <Slider value={[contrast]} min={50} max={200} step={5} onValueChange={(v) => setContrast(v[0])} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Opacité :</span>
                    <span>{opacity}%</span>
                  </div>
                  <Slider value={[opacity]} min={10} max={100} step={5} onValueChange={(v) => setOpacity(v[0])} />
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: SIZE & DIMENSIONS */}
            <TabsContent value="size" className="space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Largeur de l'image dans le document :
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {["100%", "75%", "50%", "35%", "25%"].map((presetWidth) => (
                  <Button
                    key={presetWidth}
                    type="button"
                    variant={width === presetWidth ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setWidth(presetWidth)}
                  >
                    {presetWidth}
                  </Button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/30">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave} className="bg-primary text-white">
            <Check className="mr-1.5 h-4 w-4" /> Appliquer à l'image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
