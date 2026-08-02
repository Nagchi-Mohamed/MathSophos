import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLevel, formatStream } from '@/utils/formatters';
import { BookOpen, ArrowRight, Calendar } from 'lucide-react';

export interface LessonCardProps {
  lesson: {
    id: string;
    titleFr: string;
    slug: string;
    level: string;
    stream: string;
    category?: string | null;
    semester?: number;
  };
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

export function LessonCard({ lesson }: LessonCardProps) {
  const gradient = LEVEL_GRADIENTS[lesson.level] || 'from-blue-500 to-purple-500';

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-muted overflow-hidden group">
      {/* Animated accent bar */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient} group-hover:h-2 transition-all duration-300`} />

      <CardHeader className="pb-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs"
          >
            {formatLevel(lesson.level)}
          </Badge>
          {lesson.stream && lesson.stream !== 'NONE' && (
            <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300 text-xs">
              {formatStream(lesson.stream)}
            </Badge>
          )}
          {lesson.semester && (
            <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-300 text-xs flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              S{lesson.semester}
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 text-base leading-snug group-hover:text-primary transition-colors">
          {lesson.titleFr}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5 mt-1.5 text-xs">
          <BookOpen className="w-3 h-3 shrink-0" />
          <span className="truncate">{lesson.category || 'Mathématiques'}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto pt-0">
        <Link
          href={
            lesson.level === 'UNIVERSITY'
              ? (lesson.slug ? `/chapters/${lesson.slug}` : '#')
              : `/lessons/${lesson.slug}`
          }
          className="w-full block"
        >
          <Button
            className="w-full gap-2 group/btn"
            variant="secondary"
            size="sm"
            disabled={lesson.level === 'UNIVERSITY' && !lesson.slug}
          >
            {lesson.level === 'UNIVERSITY' ? 'Voir le chapitre' : 'Voir la leçon'}
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
