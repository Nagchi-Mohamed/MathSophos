import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLevel, formatStream } from '@/utils/formatters';
import { BookOpen, Layers, Edit, Trash2 } from 'lucide-react';
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

export function SeriesCard({ series, showAdminActions = false }: SeriesCardProps) {
  const viewLink = showAdminActions ? `/admin/exercises/series/${series.id}` : `/exercises/${series.id}`;

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline">{formatLevel(series.level)}</Badge>
          {series.stream && series.stream !== 'NONE' && (
            <Badge variant="outline">{formatStream(series.stream)}</Badge>
          )}
          <Badge variant="secondary">Semestre {series.semester}</Badge>
        </div>
        <CardTitle className="line-clamp-2 text-xl">{series.title}</CardTitle>
        <div className="text-sm text-muted-foreground line-clamp-2 mt-2">
          <LessonContentRenderer content={series.description || "Aucune description"} />
        </div>
      </CardHeader>
      <CardContent className="mt-auto pt-0 space-y-4">
        {series.lesson && (
          <div className="flex items-center text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="truncate">Leçon : {series.lesson.titleFr}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            <span>{series._count?.exercises || series.exercises?.length || 0} exercices</span>
          </div>
        </div>

        {showAdminActions ? (
          <div className="flex gap-2">
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
          <Link href={viewLink} className="block">
            <Button className="w-full">Voir la série</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
