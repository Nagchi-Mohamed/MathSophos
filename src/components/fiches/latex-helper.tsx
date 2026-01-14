"use client"

import { useEffect, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import 'katex/dist/katex.min.css'

const symbols = {
  "Ensembles": [
    { code: "\\mathbb{N}" },
    { code: "\\mathbb{Z}" },
    { code: "\\mathbb{Q}" },
    { code: "\\mathbb{R}" },
    { code: "\\mathbb{C}" },
    { code: "\\mathbb{N}^*" },
    { code: "\\emptyset" },
    { code: "\\in" },
    { code: "\\notin" },
    { code: "\\subset" },
    { code: "\\subseteq" },
    { code: "\\supset" },
    { code: "\\cup" },
    { code: "\\cap" },
    { code: "\\setminus" },
  ],
  "Logique": [
    { code: "\\Rightarrow" },
    { code: "\\Leftarrow" },
    { code: "\\Leftrightarrow" },
    { code: "\\iff" },
    { code: "\\forall" },
    { code: "\\exists" },
    { code: "\\nexists" },
    { code: "\\land" },
    { code: "\\lor" },
    { code: "\\neg" },
    { code: "\\implies" },
  ],
  "Comparaisons": [
    { code: "=" },
    { code: "\\neq" },
    { code: "\\approx" },
    { code: "\\equiv" },
    { code: "\\sim" },
    { code: "<" },
    { code: ">" },
    { code: "\\leq" },
    { code: "\\geq" },
    { code: "\\ll" },
    { code: "\\gg" },
    { code: "\\propto" },
  ],
  "Opérations": [
    { code: "+" },
    { code: "-" },
    { code: "\\times" },
    { code: "\\div" },
    { code: "\\pm" },
    { code: "\\mp" },
    { code: "\\cdot" },
    { code: "\\ast" },
    { code: "\\star" },
    { code: "\\circ" },
    { code: "\\bullet" },
    { code: "\\oplus" },
    { code: "\\otimes" },
  ],
  "Fractions": [
    { code: "\\frac{a}{b}" },
    { code: "\\frac{1}{2}" },
    { code: "\\frac{x+1}{x-1}" },
    { code: "\\dfrac{a}{b}" },
    { code: "\\tfrac{a}{b}" },
  ],
  "Racines": [
    { code: "\\sqrt{x}" },
    { code: "\\sqrt{2}" },
    { code: "\\sqrt[3]{x}" },
    { code: "\\sqrt[n]{x}" },
  ],
  "Puissances": [
    { code: "x^2" },
    { code: "x^n" },
    { code: "x^{n+1}" },
    { code: "e^x" },
    { code: "10^{-3}" },
    { code: "2^{2^n}" },
  ],
  "Indices": [
    { code: "u_n" },
    { code: "u_{n+1}" },
    { code: "x_i" },
    { code: "a_{ij}" },
  ],
  "Fonctions": [
    { code: "\\sin(x)" },
    { code: "\\cos(x)" },
    { code: "\\tan(x)" },
    { code: "\\ln(x)" },
    { code: "\\log(x)" },
    { code: "\\exp(x)" },
    { code: "\\lim" },
    { code: "\\lim_{x \\to 0}" },
    { code: "\\lim_{x \\to +\\infty}" },
  ],
  "Calcul": [
    { code: "\\sum" },
    { code: "\\sum_{i=1}^{n}" },
    { code: "\\prod" },
    { code: "\\prod_{i=1}^{n}" },
    { code: "\\int" },
    { code: "\\int_{a}^{b}" },
    { code: "\\oint" },
    { code: "\\partial" },
    { code: "\\nabla" },
  ],
  "Flèches": [
    { code: "\\to" },
    { code: "\\rightarrow" },
    { code: "\\leftarrow" },
    { code: "\\leftrightarrow" },
    { code: "\\uparrow" },
    { code: "\\downarrow" },
    { code: "\\mapsto" },
    { code: "\\longrightarrow" },
  ],
  "Géométrie": [
    { code: "\\vec{AB}" },
    { code: "\\overrightarrow{AB}" },
    { code: "\\|\\vec{u}\\|" },
    { code: "\\widehat{ABC}" },
    { code: "\\angle" },
    { code: "\\perp" },
    { code: "\\parallel" },
    { code: "\\triangle" },
    { code: "\\square" },
    { code: "\\circ" },
    { code: "^\\circ" },
  ],
  "Lettres Grecques": [
    { code: "\\alpha" },
    { code: "\\beta" },
    { code: "\\gamma" },
    { code: "\\delta" },
    { code: "\\epsilon" },
    { code: "\\theta" },
    { code: "\\lambda" },
    { code: "\\mu" },
    { code: "\\pi" },
    { code: "\\sigma" },
    { code: "\\phi" },
    { code: "\\omega" },
    { code: "\\Gamma" },
    { code: "\\Delta" },
    { code: "\\Theta" },
    { code: "\\Lambda" },
    { code: "\\Sigma" },
    { code: "\\Phi" },
    { code: "\\Omega" },
  ],
  "Spéciaux": [
    { code: "\\infty" },
    { code: "\\aleph" },
    { code: "\\hbar" },
    { code: "\\ell" },
    { code: "\\Re" },
    { code: "\\Im" },
    { code: "\\wp" },
    { code: "\\partial" },
    { code: "\\nabla" },
    { code: "\\Box" },
    { code: "\\Diamond" },
  ],
  "Structures": [
    { code: '\<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin: 15px auto; text-align: center; width: 100%;"><thead><tr style="background-color: #f0f0f0;"><th>Col 1</th><th>Col 2</th></tr></thead><tbody><tr><td>$A$</td><td>$B$</td></tr></tbody></table>', type: "html", display: "Tableau 2×2" },
    { code: '$$\\begin{array}{|c|c|c|}\\hline A & B & C \\\\\\hline D & E & F \\\\\\hline\\end{array}$$', type: "display", display: "Array 3×2" },
    { code: '$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$', type: "display", display: "Matrice 2×2" },
    { code: '$$\\begin{cases} x & \\text{si } x > 0 \\\\ -x & \\text{si } x \\leq 0 \\end{cases}$$', type: "display", display: "Cas par cas" },
  ]
}

function RenderedSymbol({ code, type }: { code: string, type?: string }) {
  const spanRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!spanRef.current) return

    const render = async () => {
      try {
        const renderMathInElement = (await import('katex/dist/contrib/auto-render.min.js')).default
        renderMathInElement(spanRef.current!, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
          throwOnError: false,
          strict: false,
        })
      } catch (error) {
        console.error('KaTeX render error:', error)
      }
    }
    render()
  }, [code])

  if (type === "html") {
    return <span className="text-xs text-muted-foreground italic">Table HTML</span>
  }

  if (type === "display") {
    return <span ref={spanRef} className="text-sm">{code}</span>
  }

  return <span ref={spanRef} className="text-base">${code}$</span>
}

export function LatexHelper() {
  return (
    <Card className="h-full">
      <CardContent className="p-0">
        <Tabs defaultValue="Ensembles" className="w-full">
          <TabsList className="w-full grid grid-cols-7 rounded-none text-[10px] h-auto">
            {Object.keys(symbols).slice(0, 7).map(key => (
              <TabsTrigger key={key} value={key} className="text-[10px] px-1 py-1.5">{key}</TabsTrigger>
            ))}
          </TabsList>
          <TabsList className="w-full grid grid-cols-7 rounded-none text-[10px] h-auto border-t">
            {Object.keys(symbols).slice(7).map(key => (
              <TabsTrigger key={key} value={key} className="text-[10px] px-1 py-1.5">{key}</TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(symbols).map(([category, items]) => (
            <TabsContent key={category} value={category} className="m-0">
              <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Rendu</TableHead>
                      <TableHead>Code LaTeX</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any, idx) => (
                      <TableRow
                        key={idx}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          const textToCopy = item.type === 'html' || item.type === 'display' ? item.code : `$${item.code}$`;
                          navigator.clipboard.writeText(textToCopy);
                        }}
                      >
                        <TableCell className="font-medium text-center py-2">
                          {item.display ? (
                            <span className="text-xs text-muted-foreground">{item.display}</span>
                          ) : (
                            <RenderedSymbol code={item.code} type={item.type} />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-primary py-2">
                          {item.type === 'html' ? '<table>...</table>' :
                            item.type === 'display' ? item.code.replace(/\$\$/g, '') :
                              item.code}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
        <div className="p-2 text-xs text-center text-muted-foreground bg-muted/30 border-t">
          Cliquez sur une ligne pour copier le code
        </div>
      </CardContent>
    </Card>
  )
}
