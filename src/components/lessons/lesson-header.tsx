"use client";

import { useState, useEffect } from "react";
import { GraduationCap, BookOpen, PlayCircle, Loader2 } from "lucide-react";
import { formatLevel } from "@/utils/formatters";
import { useLanguage } from "@/contexts/language-context";
import type { EducationalLevel, Stream } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/ui/video-player";
import { toast } from "sonner";

interface LessonHeaderProps {
  title: string;
  titleEn?: string | null;
  level: EducationalLevel;
  stream?: Stream;
  semester: number;
  category?: string;
  professorName?: string;
  isPrintView?: boolean;
  lessonId?: string;
}

export function LessonHeader({
  title,
  titleEn,
  level,
  stream,
  semester,
  category,
  professorName = process.env.NEXT_PUBLIC_PROFESSOR_NAME || "Prof:Mohamed Nagchi",
  isPrintView = false,
  lessonId
}: LessonHeaderProps) {
  const { language } = useLanguage();
  const displayTitle = (language === 'en' && titleEn) ? titleEn : title;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [checkingVideo, setCheckingVideo] = useState(false);

  const checkVideo = async () => {
    if (!lessonId) return;

    // If we already have the URL, just open it
    if (videoUrl) {
      setIsVideoOpen(true);
      return;
    }

    try {
      setCheckingVideo(true);
      const res = await fetch(`/api/admin/videos/lesson/${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
          // Use the first video
          setVideoUrl(data.videos[0].url);
          setIsVideoOpen(true);
        } else {
          toast.info("Aucune vidéo n'a été ajoutée pour cette leçon.");
        }
      } else {
        toast.error("Impossible de vérifier la disponibilité de la vidéo.");
      }
    } catch (error) {
      console.error("Error checking video:", error);
      toast.error("Erreur lors de la vérification de la vidéo.");
    } finally {
      setCheckingVideo(false);
    }
  };

  const formatStream = (stream?: Stream) => {
    if (!stream || stream === "NONE") return null;

    const streamMap: Record<string, string> = {
      TC_LETTRES: "TC Lettres",
      TC_SCIENCES: "TC Sciences",
      TC_TECHNOLOGIE: "TC Technologie",
      SC_MATH_A: "Sciences Math A",
      SC_MATH_B: "Sciences Math B",
      SC_EXPERIMENTAL: "Sciences Expérimentales",
      SC_PHYSIQUE: "Sciences Physiques",
      SC_VIE_TERRE: "Sciences de la Vie et de la Terre",
      SC_ECONOMIE: "Sciences Économiques",
      LETTRES_HUMAINES: "Lettres et Sciences Humaines",
    };

    return streamMap[stream] || stream;
  };

  // Base classes that are always applied
  const containerClasses = "bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-8 mb-8 shadow-lg";
  // Print-specific overrides (ink saving) - only applied if NOT in print view (high fidelity PDF mode)
  const printOverrides = isPrintView ? "" : "print:shadow-none print:border-b-2 print:border-x-0 print:border-t-0 print:rounded-none print:bg-none print:mb-4 print:pb-4";

  return (
    <>
      <div className={`${containerClasses} ${printOverrides}`}>
        {/* Top Section - Branding & Professor */}
        <div className={`flex items-center justify-between mb-6 pb-6 border-b-2 border-primary/20 ${isPrintView ? '' : 'print:mb-4 print:pb-4'}`}>
          <div className="flex items-center gap-4">
            <div className={`bg-primary text-primary-foreground p-3 rounded-lg shadow-md ${isPrintView ? '' : 'print:bg-transparent print:text-black print:p-0 print:shadow-none print:border print:border-black'}`}>
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className={`text-2xl font-bold text-primary ${isPrintView ? '' : 'print:text-black'}`}>MathSophos</h3>
              <p className={`text-sm text-muted-foreground ${isPrintView ? '' : 'print:text-gray-600'}`}>Plateforme d'apprentissage des mathématiques</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 bg-background/80 px-6 py-3 rounded-lg border border-primary/30 shadow-sm ${isPrintView ? '' : 'print:shadow-none print:border-none print:bg-transparent print:p-0'}`}>
            <GraduationCap className={`w-6 h-6 text-primary ${isPrintView ? '' : 'print:text-black'}`} />
            <div className="text-right">
              <p className={`text-xs text-muted-foreground uppercase tracking-wide ${isPrintView ? '' : 'print:text-gray-500'}`}>Professeur</p>
              <p className={`font-bold text-lg text-foreground ${isPrintView ? '' : 'print:text-black'}`}>{professorName}</p>
            </div>
          </div>
        </div>

        {/* Lesson Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background/60 p-4 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Niveau</p>
            <p className="font-semibold text-base">{formatLevel(level)}</p>
          </div>

          {formatStream(stream) && (
            <div className="bg-background/60 p-4 rounded-lg border border-primary/20">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Filière</p>
              <p className="font-semibold text-base">{formatStream(stream)}</p>
            </div>
          )}

          <div className="bg-background/60 p-4 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Semestre</p>
            <p className="font-semibold text-base">Semestre {semester}</p>
          </div>
        </div>

        {/* Lesson Title */}
        <div className={`bg-primary text-primary-foreground p-6 rounded-lg shadow-md ${isPrintView ? '' : 'print:bg-transparent print:text-black print:shadow-none print:p-0 print:mt-4'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
          <div>
            {category && (
              <p className="text-sm opacity-90 mb-2 uppercase tracking-wider font-medium">{category}</p>
            )}
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{displayTitle}</h1>
          </div>

          {!isPrintView && lessonId && (
            <Button
              onClick={checkVideo}
              disabled={checkingVideo}
              className="bg-red-600 text-white hover:bg-red-700 shadow-lg shrink-0 print:hidden"
              size="lg"
            >
              {checkingVideo ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="w-5 h-5 mr-2" />
              )}
              Voir Vidéo
            </Button>
          )}
        </div>
      </div>

      {videoUrl && (
        <VideoPlayer
          src={videoUrl}
          title={displayTitle}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </>
  );
}
