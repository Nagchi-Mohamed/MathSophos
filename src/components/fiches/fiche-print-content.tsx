'use client'

import { useEffect, useState, useRef } from "react"
import { FicheContentRenderer } from "./fiche-content-renderer"
import 'katex/dist/katex.min.css'

interface FichePrintContentProps {
  fiche: any
}

// Component to render title with LaTeX support
function TitleWithLatex({ title }: { title: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && titleRef.current && title) {
      const renderMath = async () => {
        try {
          const renderMathInElement = (await import('katex/dist/contrib/auto-render.min.js')).default
          if (titleRef.current) {
            renderMathInElement(titleRef.current, {
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
          console.error('Error rendering title LaTeX:', error)
        }
      }

      setTimeout(renderMath, 100)
    }
  }, [title])

  return (
    <h1
      ref={titleRef}
      className="text-4xl font-bold uppercase text-gray-900 tracking-tight leading-tight"
      dangerouslySetInnerHTML={{ __html: title || '' }}
    />
  )
}

export function FichePrintContent({ fiche }: FichePrintContentProps) {
  const [steps, setSteps] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Parse content if it's stringified JSON
    try {
      if (typeof fiche.content === 'string') {
        setSteps(JSON.parse(fiche.content))
      } else if (Array.isArray(fiche.content)) {
        setSteps(fiche.content)
      }
    } catch (e) {
      console.error("Error parsing content", e)
    }
  }, [fiche.content])

  if (!mounted) return null

  return (
    <div className="bg-white text-black min-h-screen font-serif relative">
      {/* Global borders are handled by PrintLayout (red @ 2.5mm, black @ 5mm) which wraps this page. */}
      {/* Global layout.tsx already sets body padding: 7.5mm for page 1 */}

      <style>{`
        @media print {
          /* Add spacing at top of each page fragment when table breaks */
          .scenario-table-wrapper {
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
            padding-top: 7.5mm;
          }
        }
        
        /* Show borders on screen preview to match PDF */
        @media screen {
          .preview-border-red {
            position: fixed;
            top: 2.5mm;
            left: 2.5mm;
            right: 2.5mm;
            bottom: 2.5mm;
            border: 1px solid red;
            pointer-events: none;
            z-index: 9999;
          }
          
          .preview-border-black {
            position: fixed;
            top: 5mm;
            left: 5mm;
            right: 5mm;
            bottom: 5mm;
            border: 1px solid black;
            pointer-events: none;
            z-index: 9998;
          }
        }

        /* Override markdown renderer dark theme for print */
        .fiche-step-content .markdown-content {
          color: black !important;
        }
        
        .fiche-step-content section {
          background: transparent !important;
          border-color: #333 !important;
        }
        
        .fiche-step-content h2,
        .fiche-step-content p,
        .fiche-step-content li,
        .fiche-step-content td,
        .fiche-step-content th,
        .fiche-step-content strong {
          color: black !important;
        }
      `}</style>

      {/* Border overlays for screen preview */}
      <div className="preview-border-red hidden md:block"></div>
      <div className="preview-border-black hidden md:block"></div>



      {/* Container matches screen preview structure */}
      <div className="bg-white min-h-screen relative">

        {/* --- PAGE 1: Fiche Technique --- */}
        <div className="break-after-page-always print-page-one-header p-8 print:p-0">

          {/* Ministry / Header Placeholder */}
          <div className="flex justify-between items-start text-xs text-gray-600 uppercase mb-8 border-b-2 border-primary/20 pb-4">
            <div className="text-left">
              <div>Royaume du Maroc</div>
              <div>Ministère de l'Éducation Nationale</div>
              <div>{fiche.schoolName}</div>
            </div>
            <div className="text-right">
              <div>Année Scolaire: {new Date().getFullYear()}-{new Date().getFullYear() + 1}</div>
              <div>Professeur: {fiche.teacherName}</div>
            </div>
          </div>

          {/* Main Title Area */}
          <div className="text-center mb-10">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Fiche Pédagogique</h2>
            <div className="inline-block border-y-4 border-double border-gray-800 py-3 px-12">
              <TitleWithLatex title={fiche.lessonTitle || "Titre de la leçon"} />
            </div>
            <div className="mt-4 flex justify-center gap-4 text-sm font-semibold text-gray-700">
              <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{fiche.gradeLevel}</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{fiche.stream || "Tronc Commun"} {fiche.semester ? `- S${fiche.semester}` : ''}</span>
              <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{fiche.duration}</span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <section>
              <h3 className="text-sm font-black uppercase text-gray-800 border-b border-gray-400 mb-3 pb-1">1. Orientations Pédagogiques</h3>
              <div className="bg-gray-50 p-4 border border-gray-200 rounded text-sm leading-relaxed text-justify whitespace-pre-wrap shadow-sm">
                {fiche.pedagogicalGuidelines || "Aucune directive spécifiée."}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-6">
              <section>
                <h3 className="text-sm font-black uppercase text-gray-800 border-b border-gray-400 mb-3 pb-1">2. Pré-requis</h3>
                <div className="bg-white p-4 border border-gray-300 rounded text-sm shadow-sm h-full">
                  <ul className="list-disc list-inside space-y-1">
                    {fiche.prerequisites?.split('\n').map((item: string, i: number) => item && <li key={i}>{item}</li>)}
                    {!fiche.prerequisites && <li className="text-gray-400 italic">Aucun pré-requis</li>}
                  </ul>
                </div>
              </section>
              <section>
                <h3 className="text-sm font-black uppercase text-gray-800 border-b border-gray-400 mb-3 pb-1">3. Extensions</h3>
                <div className="bg-white p-4 border border-gray-300 rounded text-sm shadow-sm h-full">
                  <ul className="list-disc list-inside space-y-1">
                    {fiche.extensions?.split('\n').map((item: string, i: number) => item && <li key={i}>{item}</li>)}
                    {!fiche.extensions && <li className="text-gray-400 italic">Aucune extension</li>}
                  </ul>
                </div>
              </section>
            </div>

            <section>
              <h3 className="text-sm font-black uppercase text-gray-800 border-b border-gray-400 mb-3 pb-1">4. Outils Didactiques</h3>
              <div className="bg-gray-50/50 p-3 border border-gray-200 rounded text-sm font-medium text-gray-700 italic">
                {fiche.didacticTools || "Tableau, Manuel scolaire, Calculatrice..."}
              </div>
            </section>
          </div>
        </div>

        {/* --- PAGE 2+: Scénario / Déroulement --- */}
        <div className="scenario-table-wrapper">
          <div className="flex items-center gap-4 mb-[14mm]">
            <div className="flex-1 h-px bg-gray-300"></div>
            <h2 className="text-xl font-bold uppercase text-gray-800 tracking-wider">Scénario Didactique</h2>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <table className="w-full border-collapse mb-8 table-fixed text-sm">
            <thead>
              <tr>
                <th className="border border-black p-2 w-[15%] text-center bg-gray-100 font-bold uppercase">Étape</th>
                <th className="border border-black p-2 w-[65%] bg-gray-100 font-bold uppercase">Activités & Contenu</th>
                <th className="border border-black p-2 w-[20%] bg-gray-100 font-bold uppercase">Observations / Rôle du prof</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, idx) => {
                // Count occurrences of each type up to current index for numbering
                const typeCount = steps.slice(0, idx + 1).filter(s => s.type === step.type).length;
                const displayLabel = `${step.type} ${typeCount}`;

                return (
                  <tr key={idx} className="break-inside-avoid">
                    <td className="border border-black p-2 text-center bg-gray-50/30 font-medium align-top">
                      <div className="text-purple-900 font-bold uppercase text-xs mb-1">{displayLabel}</div>
                      {step.duration && <div className="text-[10px] text-gray-500 font-mono py-1 px-2 rounded bg-gray-100 inline-block border">{step.duration}</div>}
                    </td>
                    <td className="border border-black p-2 align-top">
                      <FicheContentRenderer content={step.content} />
                    </td>
                    <td className="border border-black p-2 italic text-gray-600 bg-gray-50/20 text-xs leading-relaxed align-top">
                      {step.observations}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  )
}
