"use client";

import React, { useState } from 'react';
import { TextbookLesson } from '@/types/textbook';
import { formatLevel, formatStream } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/ui/video-player';
import { GraduationCap, Clock, Award, PlayCircle, Loader2 } from 'lucide-react';
import { MathSophosIcon } from '@/components/ui/math-sophos-logo';

interface TextbookHeaderProps {
  lesson: TextbookLesson;
}

export function TextbookHeader({ lesson }: TextbookHeaderProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [checkingVideo, setCheckingVideo] = useState(false);

  const checkVideo = async () => {
    if (lesson.videoUrl) {
      setVideoUrl(lesson.videoUrl);
      setIsVideoOpen(true);
      return;
    }
    setCheckingVideo(true);
    try {
      const res = await fetch(`/api/video?lessonId=${lesson.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setVideoUrl(data.url);
          setIsVideoOpen(true);
        }
      }
    } catch {
      // Ignore fallback
    } finally {
      setCheckingVideo(false);
    }
  };

  return (
    <>
      <div className="mb-10 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-8 md:p-10 shadow-xl relative overflow-hidden break-inside-avoid">
        {/* Subtle Watermark Logo */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <MathSophosIcon size={240} className="text-white" />
        </div>

        {/* Academic Meta Top Bar & Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-slate-300 font-medium">
            <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1 uppercase tracking-wider">
              {formatLevel(lesson.level as any)}
            </Badge>

            {lesson.stream && (
              <Badge variant="outline" className="border-slate-600 text-slate-200 px-3 py-1">
                {formatStream(lesson.stream as any)}
              </Badge>
            )}

            <span className="text-slate-400">•</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Semestre {lesson.semester}</span>

            {lesson.metadata?.difficulty && (
              <>
                <span className="text-slate-400">•</span>
                <span className="flex items-center gap-1.5 text-amber-300"><Award className="w-3.5 h-3.5" /> {lesson.metadata.difficulty}</span>
              </>
            )}
          </div>

          <Button
            onClick={checkVideo}
            disabled={checkingVideo}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg transition-transform hover:scale-105 shrink-0"
            size="sm"
          >
            {checkingVideo ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            Voir Explications Vidéo
          </Button>
        </div>

        {/* Chapter Title & Subtitle */}
        <div className="relative z-10 space-y-3 max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white font-serif">
            {lesson.title}
          </h1>

          {lesson.category && (
            <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">
              Domaine : {lesson.category}
            </p>
          )}

          {lesson.metadata?.professorName && (
            <p className="text-xs text-slate-400 italic pt-2">
              Auteur / Adaptateur : {lesson.metadata.professorName}
            </p>
          )}
        </div>
      </div>

      {videoUrl && (
        <VideoPlayer
          src={videoUrl}
          title={lesson.title}
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
        />
      )}
    </>
  );
}
