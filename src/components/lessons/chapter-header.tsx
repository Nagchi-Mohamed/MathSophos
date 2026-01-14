"use client";

import { GraduationCap, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface ChapterHeaderProps {
  lessonTitle: string;
  lessonTitleEn?: string | null;
  chapterNumber: number;
  chapterTitle: string;
  chapterTitleEn?: string | null;
  filiere?: string;
  module?: string;
  category?: string;
  professorName?: string;
  children?: React.ReactNode;
}

export function ChapterHeader({
  lessonTitle,
  lessonTitleEn,
  chapterNumber,
  chapterTitle,
  chapterTitleEn,
  filiere,
  module,
  category,
  professorName = process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof:Mohamed Nagchi",
  children
}: ChapterHeaderProps) {
  const { language } = useLanguage();
  const displayLessonTitle = (language === 'en' && lessonTitleEn) ? lessonTitleEn : lessonTitle;
  const displayChapterTitle = (language === 'en' && chapterTitleEn) ? chapterTitleEn : chapterTitle;
  return (
    <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-8 mb-8 shadow-lg">
      {/* Top Section - Branding & Professor */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground p-3 rounded-lg shadow-md">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary">MathSophos</h3>
            <p className="text-sm text-muted-foreground">Plateforme d'apprentissage des mathématiques</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-background/80 px-6 py-3 rounded-lg border border-primary/30 shadow-sm">
          <GraduationCap className="w-6 h-6 text-primary" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Professeur</p>
            <p className="font-bold text-lg text-foreground">{professorName}</p>
          </div>
        </div>
      </div>

      {/* Chapter Metadata - Filière & Module */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {filiere && (
          <div className="bg-background/60 p-4 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Filière</p>
            <p className="font-semibold text-base">{filiere}</p>
          </div>
        )}

        {module && (
          <div className="bg-background/60 p-4 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Module</p>
            <p className="font-semibold text-base">{module}</p>
          </div>
        )}
      </div>

      {/* Chapter Title */}
      <div className="bg-primary text-primary-foreground p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {category && (
            <p className="text-sm opacity-90 mb-2 uppercase tracking-wider font-medium">{category}</p>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            {displayLessonTitle} {language === 'en' ? 'Chapter' : 'Chapitre'} {chapterNumber}: {displayChapterTitle}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}

