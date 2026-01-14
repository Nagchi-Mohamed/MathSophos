"use client"

import { GraduationCap, BookOpen } from "lucide-react"

interface PrintHeaderProps {
  title: string
  subtitle?: string
  professorName?: string
  level?: string
  stream?: string
  semester?: number | string
  module?: string
  category?: string
}

export function PrintHeader({
  title,
  subtitle,
  professorName = process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof:Mohamed Nagchi",
  level,
  stream,
  semester,
  module,
  category = "MATHEMATICS"
}: PrintHeaderProps) {
  return (
    <div className="mb-6 font-sans">
      {/* Top Row: Logo & Professor */}
      <div className="flex justify-between items-start mb-6">
        {/* Left: Branding */}
        <div className="flex gap-4 items-center">
          <div className="p-3 bg-primary rounded-xl text-primary-foreground print:bg-blue-600 print:text-white">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary print:text-blue-600 leading-none mb-1">MathSophos</h1>
            <p className="text-sm text-muted-foreground print:text-gray-600">Plateforme d'apprentissage des mathématiques</p>
          </div>
        </div>

        {/* Right: Professor Box */}
        <div className="flex items-center gap-3 bg-foreground text-background px-5 py-3 rounded-xl print:bg-black print:text-white border border-border profile-box">
          <GraduationCap className="w-6 h-6 text-primary" />
          <div className="text-right leading-tight">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-0.5">PROFESSEUR</p>
            <p className="font-bold text-base whitespace-nowrap">{professorName}</p>
          </div>
        </div>
      </div>

      {/* Middle Row: Metadata Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Left Box: Stream/Level */}
        <div className="bg-card rounded-xl p-4 border border-border print:bg-transparent print:border-black print:text-black text-foreground">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground print:text-gray-600 mb-1">FILIÈRE / NIVEAU</p>
          <p className="font-bold text-lg leading-none">
            {stream || level || "N/A"}
          </p>
        </div>

        {/* Right Box: Module/Semester */}
        <div className="bg-card rounded-xl p-4 border border-border print:bg-transparent print:border-black print:text-black text-foreground">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground print:text-gray-600 mb-1">MODULE / SEMESTRE</p>
          <p className="font-bold text-lg leading-none">
            {module || (semester ? `Semestre ${semester}` : "N/A")}
          </p>
        </div>
      </div>

      {/* Bottom Row: Title Banner */}
      <div className="bg-primary rounded-xl p-6 text-primary-foreground print:bg-blue-500 print:text-white print-color-exact">
        <p className="text-xs uppercase tracking-widest font-medium opacity-80 mb-2">{category}</p>
        <h2 className="text-3xl font-bold leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-primary-foreground/90 mt-2 text-lg font-medium">{subtitle}</p>
        )}
      </div>

      {/* CSS for print exactness */}
      <style jsx global>{`
        @media print {
          .print-color-exact {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ensure the black box prints black */
          .profile-box {
            background-color: black !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}
