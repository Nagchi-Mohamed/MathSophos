"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import MarkdownRenderer from "@/components/markdown-renderer"
import {
  Camera,
  Upload,
  FileText,
  Loader2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X,
  Download,
  FileDown,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { solveMathProblem } from "@/actions/math-solver"
import { SolverContentRenderer } from "@/components/solver/solver-content-renderer"


import { toast } from "sonner"

interface MathAISolverProps {
  context?: {
    pageType: string;
    entityTitle?: string;
  }
}

export function MathAISolver({ context }: MathAISolverProps = {}) {
  const [activeTab, setActiveTab] = useState("text")
  const [problemText, setProblemText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [solution, setSolution] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [pdfTitle, setPdfTitle] = useState("Solution Mathématique")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Trigger MathJax typesetting when solution changes
  // useMathJax([solution])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setError(null)
    setSolution(null)

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleSolveText = async () => {
    if (!problemText.trim()) {
      setError("Veuillez entrer un problème mathématique.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSolution(null)

    const result = await solveMathProblem({
      type: "text",
      content: problemText,
      context,
    })

    setIsLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSolution(result.solution || null)
    }
  }

  const handleSolveFile = async () => {
    if (!selectedFile) {
      setError("Veuillez sélectionner un fichier.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSolution(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        const base64Data = base64.split(",")[1] // Remove data:image/...;base64, prefix

        let result
        if (selectedFile.type === "application/pdf") {
          result = await solveMathProblem({
            type: "pdf",
            content: base64Data,
          })
        } else {
          result = await solveMathProblem({
            type: "image",
            content: base64Data,
            mimeType: selectedFile.type,
          })
        }

        setIsLoading(false)

        if (result.error) {
          setError(result.error)
        } else {
          setSolution(result.solution || null)
        }
      }

      reader.onerror = () => {
        setIsLoading(false)
        setError("Erreur lors de la lecture du fichier.")
      }

      reader.readAsDataURL(selectedFile)
    } catch (err) {
      setIsLoading(false)
      setError("Une erreur s'est produite lors du traitement du fichier.")
    }
  }

  const handleCopyToClipboard = () => {
    if (solution) {
      navigator.clipboard.writeText(solution)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = async () => {
    if (!solution) return

    try {
      setIsDownloading(true)
      toast.info("Génération du PDF en cours...")

      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: 'solver',
          content: solution,
          title: pdfTitle || "Solution Mathématique"
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.details || errorData.error || "Erreur lors de la génération du PDF")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      const sanitizedTitle = (pdfTitle || "solution-mathematique").replace(/[^a-z0-9]/gi, '_').toLowerCase()
      a.download = `${sanitizedTitle}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast.success("PDF téléchargé avec succès")
      setPdfDialogOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Impossible de générer le PDF")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleClear = () => {
    setProblemText("")
    setSelectedFile(null)
    setFilePreview(null)
    setSolution(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  const exampleProblems = [
    "Résoudre l'équation : 2x + 5 = 13",
    "Calculer la dérivée de f(x) = x³ + 2x² - 5x + 1",
    "Trouver l'aire d'un cercle de rayon 7 cm",
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl border-2">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          MathSophos AI
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          Résolvez vos problèmes mathématiques instantanément avec l'intelligence artificielle
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Texte
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Fichier
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo
            </TabsTrigger>
          </TabsList>

          {/* Text Input Tab */}
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problem-text">Entrez votre problème mathématique</Label>
              <Textarea
                id="problem-text"
                placeholder="Ex: Résoudre l'équation 3x + 7 = 16"
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                rows={6}
                className="resize-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Exemples rapides :</Label>
              <div className="flex flex-wrap gap-2">
                {exampleProblems.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setProblemText(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSolveText}
              disabled={isLoading || !problemText.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Résolution en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Résoudre le problème
                </>
              )}
            </Button>
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label>Télécharger une image ou un PDF</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formats supportés : JPG, PNG, WebP, PDF
                  </p>
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      setFilePreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {filePreview && (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain bg-muted"
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleSolveFile}
              disabled={isLoading || !selectedFile}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Analyser et résoudre
                </>
              )}
            </Button>
          </TabsContent>

          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-4">
            <div className="space-y-2">
              <Label>Prendre une photo du problème</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="camera-capture"
                />
                <label htmlFor="camera-capture" className="cursor-pointer">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Cliquez pour ouvrir l'appareil photo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prenez une photo claire du problème mathématique
                  </p>
                </label>
              </div>
            </div>

            {selectedFile && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Photo capturée</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      setFilePreview(null)
                      if (cameraInputRef.current) cameraInputRef.current.value = ""
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {filePreview && (
                  <div className="relative rounded-lg overflow-hidden border">
                    <img
                      src={filePreview}
                      alt="Captured"
                      className="w-full max-h-64 object-contain bg-muted"
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleSolveFile}
              disabled={isLoading || !selectedFile}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Analyser et résoudre
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">Erreur</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Solution Display */}
        {solution && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-lg">Solution</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copier
                    </>
                  )}
                </Button>
                <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Génération...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4" />
                          Télécharger PDF
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Télécharger la solution en PDF</DialogTitle>
                      <DialogDescription>
                        Personnalisez le titre du document PDF avant le téléchargement.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="pdf-title">Titre du document</Label>
                        <Input
                          id="pdf-title"
                          value={pdfTitle}
                          onChange={(e) => setPdfTitle(e.target.value)}
                          placeholder="Solution Mathématique"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleDownload}
                        disabled={isDownloading || !pdfTitle.trim()}
                        className="gap-2"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Génération...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Télécharger
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  <X className="h-4 w-4 mr-2" />
                  Effacer
                </Button>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border-2 border-blue-100 dark:border-blue-900">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <SolverContentRenderer content={solution} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
