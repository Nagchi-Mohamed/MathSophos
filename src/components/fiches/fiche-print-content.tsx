'use client'

import { useEffect, useState, useRef } from "react"
import { FicheContentRenderer } from "./fiche-content-renderer"
import 'katex/dist/katex.min.css'

interface FichePrintContentProps {
  fiche: any
}

// Component to render text with LaTeX math support
function LatexText({ content, className }: { content: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current && content) {
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

      setTimeout(renderMath, 50)
    }
  }, [content])

  if (!content) return null

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

function BulletList({ text }: { text: string }) {
  if (!text) return <span className="text-gray-400 italic">Non spécifié</span>
  const items = text.split('\n').map(item => item.trim()).filter(Boolean)

  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
      {items.map((item, idx) => (
        <li key={idx}>
          <LatexText content={item.replace(/^[•\-\*]\s*/, '')} className="inline" />
        </li>
      ))}
    </ul>
  )
}

export function FichePrintContent({ fiche }: FichePrintContentProps) {
  const [items, setItems] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      if (typeof fiche.content === 'string') {
        setItems(JSON.parse(fiche.content))
      } else if (Array.isArray(fiche.content)) {
        setItems(fiche.content)
      }
    } catch (e) {
      console.error("Error parsing fiche content", e)
    }
  }, [fiche.content])

  if (!mounted) return null

  // Check if items are 4-column sessions or legacy 3-column steps
  const isFourColumnFormat = items.length > 0 && ('demarche' in items[0] || 'traceEcrite' in items[0])

  return (
    <div className="bg-white text-gray-900 min-h-screen font-serif relative p-6 print:p-0 text-sm">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm 1.4cm 1.5cm 1.4cm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
        
        .pedabox-container {
          background-color: #F4F6F8;
          border: 1px solid #C9D2DC;
          border-radius: 6px;
          position: relative;
          padding: 16px 14px 12px 14px;
          margin-bottom: 16px;
        }

        .pedabox-title {
          position: absolute;
          top: -12px;
          left: 12px;
          background-color: #1B3A5C;
          color: white;
          font-family: sans-serif;
          font-weight: bold;
          font-size: 13px;
          padding: 2px 12px;
          border-radius: 4px;
        }
      `}</style>

      {/* Header rule matching LaTeX fancyhdr */}
      <div className="flex justify-between items-center text-xs font-sans text-[#1B3A5C] pb-1 mb-4 border-b-2 border-[#1B3A5C]">
        <div className="font-bold">
          {fiche.subject || "Mathématiques"} --- {fiche.stream || fiche.gradeLevel || "TCSF"}
        </div>
        <div>
          Fiche pédagogique --- {fiche.lessonTitle || "Arithmétique dans ℕ"}
        </div>
        <div>
          M. {fiche.teacherName || "Mohamed Nagchi"}
        </div>
      </div>

      {/* 1. BANNIÈRE DE TITRE */}
      <div className="bg-[#1B3A5C] text-white rounded-lg p-4 text-center mb-6 shadow-sm">
        <h1 className="text-xl font-bold tracking-wide uppercase font-sans mb-1">
          FICHE PÉDAGOGIQUE
        </h1>
        <div className="text-lg font-medium font-serif mb-2">
          <LatexText content={fiche.lessonTitle || "Titre du chapitre"} />
        </div>
        <div className="text-xs font-sans text-blue-100">
          {fiche.stream || fiche.gradeLevel || "Tronc Commun Scientifique et Technique (TCSF)"} &nbsp;•&nbsp; Durée globale : {fiche.duration || "7 heures"}
        </div>
      </div>

      {/* 2. FICHE TECHNIQUE */}
      <div className="pedabox-container">
        <div className="pedabox-title">Fiche technique</div>
        <table className="w-full text-xs font-sans border-collapse">
          <tbody>
            <tr className="border-b border-[#C9D2DC]">
              <td className="py-2 font-bold text-[#1B3A5C] w-1/4">Professeur</td>
              <td className="py-2 w-1/4">{fiche.teacherName || "Mohamed Nagchi"}</td>
              <td className="py-2 font-bold text-[#1B3A5C] w-1/4">Établissement</td>
              <td className="py-2 w-1/4">{fiche.schoolName || "Lycée Hassan I"}</td>
            </tr>
            <tr className="border-b border-[#C9D2DC]">
              <td className="py-2 font-bold text-[#1B3A5C]">Niveau</td>
              <td className="py-2">{fiche.stream || fiche.gradeLevel || "Tronc Commun"}</td>
              <td className="py-2 font-bold text-[#1B3A5C]">Durée globale</td>
              <td className="py-2">{fiche.duration || "7 heures"}</td>
            </tr>
            <tr className="border-b border-[#C9D2DC]">
              <td className="py-2 font-bold text-[#1B3A5C]">Matière</td>
              <td className="py-2">{fiche.subject || "Mathématiques"}</td>
              <td className="py-2 font-bold text-[#1B3A5C]">Année scolaire</td>
              <td className="py-2">{fiche.schoolYear || "2025 – 2026"}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-[#1B3A5C]">Chapitre</td>
              <td className="py-2"><LatexText content={fiche.lessonTitle || ""} /></td>
              <td className="py-2 font-bold text-[#1B3A5C]">Manuel</td>
              <td className="py-2">{fiche.textbook || "Najah"}</td>
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
              <td className="py-2 font-bold text-[#1B3A5C] w-1/4 align-top">Capacités attendues</td>
              <td className="py-2">
                <BulletList text={fiche.capacities} />
              </td>
            </tr>
            <tr className="border-b border-[#C9D2DC]">
              <td className="py-2 font-bold text-[#1B3A5C] align-top">Contenus du programme</td>
              <td className="py-2">
                <BulletList text={fiche.programContents} />
              </td>
            </tr>
            <tr className="border-b border-[#C9D2DC]">
              <td className="py-2 font-bold text-[#1B3A5C] align-top">Recommandations</td>
              <td className="py-2">
                <LatexText content={fiche.pedagogicalGuidelines || "Introduire progressivement les symboles mathématiques."} />
              </td>
            </tr>
            <tr className="border-b border-[#C9D2DC]">
              <td className="py-2 font-bold text-[#1B3A5C] align-top">Prérequis</td>
              <td className="py-2">
                <LatexText content={fiche.prerequisites || "Opérations élémentaires dans ℕ."} />
              </td>
            </tr>
            <tr>
              <td className="py-2 font-bold text-[#1B3A5C] align-top">Outils didactiques</td>
              <td className="py-2">
                <LatexText content={fiche.didacticTools || "Tableau, craie, manuel scolaire, fiches d'activités."} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. DÉROULEMENT ET PLAN DE LA SÉQUENCE */}
      <div className="my-6">
        <h2 className="text-center font-sans font-bold text-base text-[#1B3A5C] mb-3 uppercase tracking-wide">
          Déroulement et plan de la séquence
        </h2>

        {isFourColumnFormat ? (
          <table className="w-full border-collapse border border-[#C9D2DC] text-xs font-serif">
            <thead>
              <tr className="bg-[#1B3A5C] text-white font-sans font-bold text-center">
                <th className="p-2 border border-[#C9D2DC] w-[13%]">Séance & Durée</th>
                <th className="p-2 border border-[#C9D2DC] w-[27%]">Démarche & Activités</th>
                <th className="p-2 border border-[#C9D2DC] w-[45%]">Trace écrite (Contenu du cours)</th>
                <th className="p-2 border border-[#C9D2DC] w-[15%]">Évaluation</th>
              </tr>
            </thead>
            <tbody>
              {items.map((session: any, idx: number) => {
                const sessionNum = idx + 1
                const sessionTitle = session.title || session.type || `Séance ${sessionNum}`
                const sessionDur = session.duration || ""

                return (
                  <tr key={idx} className="break-inside-avoid">
                    {/* Full session header if specified */}
                    <td colSpan={4} className="p-0 border border-[#C9D2DC]">
                      <div className="bg-[#EEF3F7] text-[#1B3A5C] font-sans font-bold px-3 py-1.5 border-b border-[#C9D2DC] flex justify-between items-center">
                        <span>{sessionTitle}</span>
                        <span className="font-normal italic text-xs">{sessionDur}</span>
                      </div>
                      <div className="grid grid-cols-12 text-xs">
                        <div className="col-span-2 p-2 border-r border-[#C9D2DC] font-sans">
                          <strong className="text-[#1B3A5C]">Séance {sessionNum}</strong>
                          {sessionDur && <div className="italic text-gray-600 mt-1">{sessionDur}</div>}
                        </div>
                        <div className="col-span-3 p-2 border-r border-[#C9D2DC] align-top">
                          <FicheContentRenderer content={session.demarche || session.content || ""} />
                        </div>
                        <div className="col-span-5 p-2 border-r border-[#C9D2DC] align-top">
                          <FicheContentRenderer content={session.traceEcrite || session.content || ""} />
                        </div>
                        <div className="col-span-2 p-2 align-top">
                          <FicheContentRenderer content={session.evaluation || session.observations || ""} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          /* Legacy 3-column steps fallback */
          <table className="w-full border-collapse border border-[#C9D2DC] text-xs font-serif">
            <thead>
              <tr className="bg-[#1B3A5C] text-white font-sans font-bold uppercase text-center">
                <th className="p-2 border border-[#C9D2DC] w-[15%]">Étape</th>
                <th className="p-2 border border-[#C9D2DC] w-[65%]">Activités & Contenu</th>
                <th className="p-2 border border-[#C9D2DC] w-[20%]">Observations</th>
              </tr>
            </thead>
            <tbody>
              {items.map((step: any, idx: number) => (
                <tr key={idx} className="break-inside-avoid border-b border-[#C9D2DC]">
                  <td className="p-2 border-r border-[#C9D2DC] text-center font-sans font-medium align-top bg-gray-50/50">
                    <div className="text-[#1B3A5C] font-bold uppercase">{step.type} {idx + 1}</div>
                    {step.duration && <div className="text-[10px] text-gray-500 mt-1">{step.duration}</div>}
                  </td>
                  <td className="p-2 border-r border-[#C9D2DC] align-top">
                    <FicheContentRenderer content={step.content} />
                  </td>
                  <td className="p-2 italic text-gray-600 align-top text-xs">
                    {step.observations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. BILAN DE LA SÉQUENCE */}
      <div className="pedabox-container mt-6">
        <div className="pedabox-title">Bilan de la séquence</div>
        <table className="w-full text-xs font-sans border-collapse">
          <tbody>
            <tr className="border-b border-[#C9D2DC]">
              <td className="py-2.5 font-bold text-[#1B3A5C] w-1/4 align-top">Bilan de la séquence</td>
              <td className="py-2.5 min-h-[30px]">
                <LatexText content={fiche.bilanSequence || ""} />
              </td>
            </tr>
            <tr className="border-b border-[#C9D2DC]">
              <td className="py-2.5 font-bold text-[#1B3A5C] align-top">Difficultés constatées</td>
              <td className="py-2.5 min-h-[30px]">
                <LatexText content={fiche.difficultiesObserved || ""} />
              </td>
            </tr>
            <tr className="border-b border-[#C9D2DC]">
              <td className="py-2.5 font-bold text-[#1B3A5C] align-top">Remédiation proposée</td>
              <td className="py-2.5 min-h-[30px]">
                <LatexText content={fiche.remediationProposed || ""} />
              </td>
            </tr>
            <tr>
              <td className="py-2.5 font-bold text-[#1B3A5C] align-top">Observations</td>
              <td className="py-2.5 min-h-[30px]">
                <LatexText content={fiche.observations || ""} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Footer Rule */}
      <div className="mt-8 pt-2 border-t border-[#C9D2DC] flex justify-center text-xs font-sans text-[#1B3A5C]">
        <span>1 / 3</span>
      </div>
    </div>
  )
}
