import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLevel, formatStream } from '@/utils/formatters';
import { BookOpen, Layers, Edit, ArrowRight, Calendar } from 'lucide-react';
import { DeleteSeriesButton } from '@/components/exercises/delete-series-button';
import { LessonContentRenderer } from '@/components/lessons/lesson-content-renderer';

export interface SeriesCardProps {
  series: {
    id: string;
    title: string;
    description: string | null;
    cycle: string;
    level: string;
    stream?: string | null;
    semester: number;
    exercises?: { id: string }[];
    _count?: {
      exercises: number;
    };
    lesson?: {
      titleFr: string;
      slug: string;
    } | null;
  };
  showAdminActions?: boolean;
}

const LEVEL_GRADIENTS: Record<string, string> = {
  COLLEGE_1AC: 'from-green-400 to-emerald-500',
  COLLEGE_2AC: 'from-emerald-400 to-teal-500',
  COLLEGE_3AC: 'from-teal-400 to-cyan-500',
  LYCEE_TC:    'from-blue-400 to-sky-500',
  LYCEE_1BAC:  'from-orange-400 to-amber-500',
  LYCEE_2BAC:  'from-red-400 to-rose-500',
  UNIVERSITY:  'from-purple-500 to-violet-600',
};

export function SeriesCard({ series, showAdminActions = false }: SeriesCardProps) {
  const viewLink = showAdminActions ? `/admin/exercises/series/${series.id}` : `/exercises/${series.id}`;
  const gradient = LEVEL_GRADIENTS[series.level] || 'from-blue-500 to-purple-500';
  const exerciseCount = series._count?.exercises || series.exercises?.length || 0;

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-muted overflow-hidden group">
      {/* Animated accent bar */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient} group-hover:h-2 transition-all duration-300`} />

      <CardHeader className="pb-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
            {formatLevel(series.level)}
          </Badge>
          {series.stream && series.stream !== 'NONE' && (
            <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300 text-xs">
              {formatStream(series.stream)}
            </Badge>
          )}
          <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300 text-xs flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            S{series.semester}
          </Badge>
        </div>

        <CardTitle className="line-clamp-2 text-base leading-snug group-hover:text-primary transition-colors">
          {series.title}
        </CardTitle>

        <div className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
          <LessonContentRenderer content={series.description || "Série d'exercices d'entraînement."} />
        </div>
      </CardHeader>

      <CardContent className="mt-auto pt-0 space-y-3">
        {series.lesson && (
          <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border/40">
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
            <span className="truncate">Leçon : {series.lesson.titleFr}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center font-medium text-foreground/80">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-primary" />
            <span>{exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        {showAdminActions ? (
          <div className="flex gap-2 pt-1">
            <Link href={viewLink} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">Voir</Button>
            </Link>
            <Link href={`/admin/exercises/series/${series.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <DeleteSeriesButton seriesId={series.id} seriesTitle={series.title} size="sm" />
          </div>
        ) : (
          <Link href={viewLink} className="block pt-1">
            <Button className="w-full gap-2 group/btn" size="sm">
              <span>Voir la série</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

