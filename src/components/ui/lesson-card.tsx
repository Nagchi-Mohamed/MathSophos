import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLevel, formatStream } from '@/utils/formatters';
import { BookOpen, ArrowRight } from 'lucide-react';

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

export function LessonCard({ lesson }: LessonCardProps) {
  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted overflow-hidden group">
      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
      <CardHeader className="pb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50">
            {formatLevel(lesson.level)}
          </Badge>
          {lesson.stream !== 'NONE' && (
            <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">
              {formatStream(lesson.stream)}
            </Badge>
          )}
        </div>
        <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors">
          {lesson.titleFr}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2">
          <BookOpen className="w-4 h-4" />
          {lesson.category || 'Mathématiques'} • Semestre {lesson.semester}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <Link 
          href={
            lesson.level === 'UNIVERSITY' 
              ? (lesson.slug ? `/chapters/${lesson.slug}` : '#')
              : `/lessons/${lesson.slug}`
          } 
          className="w-full"
        >
          <Button 
            className="w-full group-hover:bg-primary/90 transition-colors" 
            variant="secondary"
            disabled={lesson.level === 'UNIVERSITY' && !lesson.slug}
          >
            {lesson.level === 'UNIVERSITY' ? 'Voir le chapitre' : 'Voir la leçon'}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
