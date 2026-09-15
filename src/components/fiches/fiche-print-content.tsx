'use client'

import { useEffect, useState, useRef } from "react"
import { FicheContentRenderer } from "./fiche-content-renderer"
import { latexPreprocessor } from "@/lib/latex-preprocessor"
import 'katex/dist/katex.min.css'
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FichePrintContentProps {
  fiche: any
  isPrintView?: boolean
}

// Component to render text with LaTeX math support
function LatexText({ content, className }: { content: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const clean = content
    ? content
        .replace(/\\'[Ee]/g, 'é')
        .replace(/\\`[Ee]/g, 'è')
        .replace(/\\'[Aa]/g, 'á')
        .replace(/\\`[Aa]/g, 'à')
        .replace(/\\\^[Ee]/g, 'ê')
        .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    : ""

  const normalized = clean ? latexPreprocessor.normalizeLatex(clean) : ""

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current && normalized) {
      const renderMath = async () => {
        try {
          const renderMathInElement = (await import('katex/dist/contrib/auto-render.min.js')).default
          if (containerRef.current) {
            renderMathInElement(containerRef.current, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\[', right: '\\]', display: true },
                { left: '\\(', right: '\\)', display: false }
              ],
              throwOnError: false,
              strict: false
            })
          }
        } catch (error) {
          console.error('Error rendering LaTeX math:', error)
        }
      }

      setTimeout(renderMath, 30)
    }
  }, [normalized])

  if (!content) return null

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: normalized }}
    />
  )
}

function BulletList({ text }: { text: string }) {
  if (!text) return <span className="text-gray-400 italic">Non spécifié</span>
  const items = text.split('\n').map(item => item.trim()).filter(Boolean)

  return (
    <ul className="list-disc list-inside space-y-1 text-xs text-gray-800">
      {items.map((item, idx) => (
        <li key={idx}>
          <LatexText content={item.replace(/^[•\-\*]\s*/, '')} className="inline" />
        </li>
      ))}
    </ul>
  )
}

export function FichePrintContent({ fiche, isPrintView = false }: FichePrintContentProps) {
  const [sessions, setSessions] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      let parsed: any[] = []
      if (typeof fiche.content === 'string') {
        parsed = JSON.parse(fiche.content)
      } else if (Array.isArray(fiche.content)) {
        parsed = fiche.content
      }

      // Normalize all items to 4-column structured sessions
      const normalized = parsed.map((item: any, idx: number) => {
        return {
          id: item.id || `session-${idx + 1}`,
          title: item.title || item.type || `Séance ${idx + 1}`,
          duration: item.duration || "",
          demarche: item.demarche || item.content || "",
          traceEcrite: item.traceEcrite || item.content || "",
          evaluation: item.evaluation || item.observations || ""
        }
      })

      setSessions(normalized)
    } catch (e) {
      console.error("Error parsing fiche content", e)
    }
  }, [fiche.content])

  if (!mounted) return null

  const teacherNameClean = fiche.teacherName || "Mohamed Nagchi"

  // Chunk sessions into pages (2 sessions per page)
  const sessionChunks: any[][] = []
  if (sessions.length === 0) {
    sessionChunks.push([])
  } else {
    for (let i = 0; i < sessions.length; i += 2) {
      sessionChunks.push(sessions.slice(i, i + 2))
    }
  }

  // Total pages = Page 1 (Admin/Pedagogical) + Session Pages
  // If the last session page already has 2 sessions, we could have Bilan with it or on its own page
  const totalPages = 1 + sessionChunks.length

  const renderHeader = (pageNumber: number) => (
    <div className="flex justify-between items-center text-[10px] font-sans text-[#1B3A5C] pb-1.5 mb-3 border-b-2 border-[#1B3A5C]">
      <div className="font-bold">
        {fiche.subject || "Mathématiques"} --- {fiche.stream || fiche.gradeLevel || "TCSF"}
      </div>
      <div>
        Fiche pédagogique --- <LatexText content={fiche.lessonTitle || "Arithmétique dans ℕ"} className="inline" />
      </div>
      <div className="font-semibold">
        {teacherNameClean}
      </div>
    </div>
  )

  const renderFooter = (pageNumber: number) => (
    <div className="mt-auto pt-2 border-t border-[#C9D2DC] flex justify-between items-center text-[10px] font-sans text-[#1B3A5C]">
      <span className="text-gray-500 font-normal">MathSophos — Plateforme Éducative</span>
      <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200">
        Page {pageNumber} / {totalPages}
      </span>
      <span className="text-gray-500 font-normal">{teacherNameClean}</span>
    </div>
  )

  return (
    <div className="fiche-document-root text-gray-900 font-serif text-xs leading-relaxed">
      <style>{`
        /* Hide exam layout borders */
        #pdf-border-red, #pdf-border-black {
          display: none !important;
        }

        /* Screen Preview A4 Sheet */
        .a4-page-sheet {
          width: 210mm;
          min-height: 297mm;
          background-color: #ffffff;
          margin: 18px auto;
          padding: 12mm 12mm 10mm 12mm;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08);
          border: 1px solid #cbd5e1;
          border-radius: 3px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }

        /* Print & PDF Generation rules */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          
          html, body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .a4-page-sheet {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm 12mm 10mm 12mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }

          .a4-page-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
        
        .pedabox-container {
          background-color: #F4F6F8;
          border: 1px solid #C9D2DC;
          border-radius: 6px;
          position: relative;
          padding: 14px 12px 10px 12px;
          margin-bottom: 12px;
        }

        .pedabox-title {
          position: absolute;
          top: -11px;
          left: 12px;
          background-color: #1B3A5C;
          color: white;
          font-family: sans-serif;
          font-weight: bold;
          font-size: 11px;
          padding: 2px 10px;
          border-radius: 4px;
        }
      `}</style>

      {/* Optional Print Action Header for /print/fiche/[id] */}
      {isPrintView && (
        <div className="print:hidden bg-slate-900 text-white px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-lg mb-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm">Fiche Pédagogique</span>
            <span className="text-xs text-slate-400">Format A4 ({totalPages} pages)</span>
          </div>
          <Button
            size="sm"
            onClick={() => window.print()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimer / Enregistrer en PDF (A4)
          </Button>
        </div>
      )}

      {/* =========================================================================
          PAGE 1 : CADRE ADMINISTRATIF & PÉDAGOGIQUE
      ========================================================================= */}
      <div className="a4-page-sheet">
        <div>
          {renderHeader(1)}

          {/* 1. BANNIÈRE DE TITRE */}
          <div className="bg-[#1B3A5C] text-white rounded-lg p-3 text-center mb-4 shadow-sm">
            <h1 className="text-base font-bold tracking-wide uppercase font-sans mb-0.5">
              FICHE PÉDAGOGIQUE
            </h1>
            <div className="text-sm font-semibold font-serif mb-0.5 text-blue-50">
              <LatexText content={fiche.lessonTitle || "Titre du chapitre"} />
            </div>
            <div className="text-[11px] font-sans text-blue-200">
              {fiche.stream || fiche.gradeLevel || "Tronc Commun Scientifique et Technique (TCSF)"} &nbsp;•&nbsp; Durée globale : {fiche.duration || "7 heures"}
            </div>
          </div>

          {/* 2. FICHE TECHNIQUE */}
          <div className="pedabox-container">
            <div className="pedabox-title">Fiche technique</div>
            <table className="w-full text-xs font-sans border-collapse">
              <tbody>
                <tr className="border-b border-[#C9D2DC]">
                  <td className="py-1.5 font-bold text-[#1B3A5C] w-1/4">Professeur</td>
                  <td className="py-1.5 w-1/4 font-medium">{teacherNameClean}</td>
                  <td className="py-1.5 font-bold text-[#1B3A5C] w-1/4">Établissement</td>
                  <td className="py-1.5 w-1/4">{fiche.schoolName || "Lycée Hassan I"}</td>
                </tr>
                <tr className="border-b border-[#C9D2DC]">
                  <td className="py-1.5 font-bold text-[#1B3A5C]">Niveau</td>
                  <td className="py-1.5">{fiche.stream || fiche.gradeLevel || "Tronc Commun"}</td>
                  <td className="py-1.5 font-bold text-[#1B3A5C]">Durée globale</td>
                  <td className="py-1.5">{fiche.duration || "7 heures"}</td>
                </tr>
                <tr className="border-b border-[#C9D2DC]">
                  <td className="py-1.5 font-bold text-[#1B3A5C]">Matière</td>
                  <td className="py-1.5">{fiche.subject || "Mathématiques"}</td>
                  <td className="py-1.5 font-bold text-[#1B3A5C]">Année scolaire</td>
                  <td className="py-1.5">{fiche.schoolYear || "2025 – 2026"}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold text-[#1B3A5C]">Chapitre</td>
                  <td className="py-1.5 font-medium"><LatexText content={fiche.lessonTitle || ""} /></td>
                  <td className="py-1.5 font-bold text-[#1B3A5C]">Manuel</td>
                  <td className="py-1.5">{fiche.textbook || "Najah"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. CADRE PÉDAGOGIQUE */}
          <div className="pedabox-container">
            <div className="pedabox-title">Cadre pédagogique</div>
            <table className="w-full text-xs font-sans border-collapse">
              <tbody>
                <tr className="border-b border-[#C9D2DC]">
                  <td className="py-1.5 font-bold text-[#1B3A5C] w-1/4 align-top">Capacités attendues</td>
                  <td className="py-1.5">
                    <BulletList text={fiche.capacities} />
                  </td>
                </tr>
                <tr className="border-b border-[#C9D2DC]">
                  <td className="py-1.5 font-bold text-[#1B3A5C] align-top">Contenus du programme</td>
                  <td className="py-1.5">
                    <BulletList text={fiche.programContents} />
                  </td>
                </tr>
                <tr className="border-b border-[#C9D2DC]">
                  <td className="py-1.5 font-bold text-[#1B3A5C] align-top">Recommandations</td>
                  <td className="py-1.5">
                    <LatexText content={fiche.pedagogicalGuidelines || "Introduire progressivement les symboles mathématiques."} />
                  </td>
                </tr>
                <tr className="border-b border-[#C9D2DC]">
                  <td className="py-1.5 font-bold text-[#1B3A5C] align-top">Prérequis</td>
                  <td className="py-1.5">
                    <LatexText content={fiche.prerequisites || "Opérations dans ℕ ; notion élémentaire de divisibilité."} />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold text-[#1B3A5C] align-top">Outils didactiques</td>
                  <td className="py-1.5">
                    <LatexText content={fiche.didacticTools || "Tableau, craie, manuel scolaire, fiches d'activités."} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {renderFooter(1)}
      </div>

      {/* =========================================================================
          PAGES 2 À N : SCÉNARIO PÉDAGOGIQUE (4 COLONNES) & BILAN
      ========================================================================= */}
      {sessionChunks.map((chunk, chunkIdx) => {
        const pageNumber = 2 + chunkIdx
        const isLastPage = pageNumber === totalPages

        return (
          <div key={`page-${pageNumber}`} className="a4-page-sheet">
            <div>
              {renderHeader(pageNumber)}

              {/* 4. DÉROULEMENT DU PLAN DE SÉQUENCE */}
              {chunk.length > 0 && (
                <div className="mb-4">
                  <div className="bg-[#1B3A5C] text-white px-3 py-1.5 rounded-t-md font-sans font-bold text-xs flex justify-between items-center">
                    <span>DÉROULEMENT DU PLAN DE SÉQUENCE (SCÉNARIO PÉDAGOGIQUE)</span>
                    <span className="text-[10px] text-blue-200 font-normal">Partie {chunkIdx + 1} / {sessionChunks.length}</span>
                  </div>
                  <table className="w-full text-xs border-collapse border border-[#C9D2DC]">
                    <thead>
                      <tr className="bg-[#1B3A5C] text-white font-sans text-xs">
                        <th className="border border-white/20 p-2 text-center w-[12%]">Séance</th>
                        <th className="border border-white/20 p-2 text-left w-[28%]">Démarche & Activités</th>
                        <th className="border border-white/20 p-2 text-left w-[38%]">Trace écrite (Contenu du cours)</th>
                        <th className="border border-white/20 p-2 text-left w-[22%]">Évaluation & Applications</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((session, sIdx) => {
                        const isEven = sIdx % 2 === 1
                        return (
                          <tr key={session.id || sIdx} className={isEven ? "bg-[#F8FAFC]" : "bg-white"}>
                            <td className="border border-[#C9D2DC] p-2.5 align-top text-center font-sans">
                              <div className="font-bold text-[#1B3A5C] text-xs leading-tight mb-1">
                                {session.title || `Séance ${sIdx + 1}`}
                              </div>
                              {session.duration && (
                                <div className="text-[10px] text-gray-500 italic bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                                  {session.duration}
                                </div>
                              )}
                            </td>
                            <td className="border border-[#C9D2DC] p-2.5 align-top leading-relaxed font-serif text-[11px]">
                              <FicheContentRenderer content={session.demarche} />
                            </td>
                            <td className="border border-[#C9D2DC] p-2.5 align-top leading-relaxed font-serif text-[11px]">
                              <FicheContentRenderer content={session.traceEcrite} />
                            </td>
                            <td className="border border-[#C9D2DC] p-2.5 align-top leading-relaxed font-serif text-[11px]">
                              <FicheContentRenderer content={session.evaluation} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. BILAN DE LA SÉQUENCE (SUR LA DERNIÈRE PAGE) */}
              {isLastPage && (
                <div className="pedabox-container mt-3">
                  <div className="pedabox-title">Bilan de la séquence</div>
                  <table className="w-full text-xs font-sans border-collapse">
                    <tbody>
                      <tr className="border-b border-[#C9D2DC]">
                        <td className="py-1.5 font-bold text-[#1B3A5C] w-1/4 align-top">Bilan de la séquence</td>
                        <td className="py-1.5 min-h-[20px]">
                          <LatexText content={fiche.bilanSequence || "Séquence réalisée conformément aux objectifs pédagogiques prévus."} />
                        </td>
                      </tr>
                      <tr className="border-b border-[#C9D2DC]">
                        <td className="py-1.5 font-bold text-[#1B3A5C] align-top">Difficultés constatées</td>
                        <td className="py-1.5 min-h-[20px]">
                          <LatexText content={fiche.difficultiesObserved || "Difficultés d'assimilation sur certaines démonstrations formelles."} />
                        </td>
                      </tr>
                      <tr className="border-b border-[#C9D2DC]">
                        <td className="py-1.5 font-bold text-[#1B3A5C] align-top">Remédiation proposée</td>
                        <td className="py-1.5 min-h-[20px]">
                          <LatexText content={fiche.remediationProposed || "Exercices d'application guidés et fiches de soutien ciblées."} />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-[#1B3A5C] align-top">Observations</td>
                        <td className="py-1.5 min-h-[20px]">
                          <LatexText content={fiche.observations || "Participation active et bon engagement des élèves."} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {renderFooter(pageNumber)}
          </div>
        )
      })}
    </div>
  )
}
