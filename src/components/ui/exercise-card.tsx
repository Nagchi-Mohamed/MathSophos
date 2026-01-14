import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatLevel, formatStream } from '@/utils/formatters';

export interface ExerciseCardProps {
  exercise: {
    id: string;
    slug: string;
    problemTextFr: string;
    lesson?: {
      titleFr: string;
      slug: string;
      level: string;
      stream?: string;
      semester?: number;
      category?: string | null;
    } | null;
  };
}

// Extract exercise title in format "Exercices sur [Lesson Title]"
const getExerciseTitle = (lessonTitle?: string) => {
  if (lessonTitle) {
    return `Exercices sur ${lessonTitle}`;
  }
  return 'Exercices de mathématiques';
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const exerciseTitle = getExerciseTitle(exercise.lesson?.titleFr);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-wrap gap-2 mb-2">
          {exercise.lesson && (
            <>
              <Badge variant="secondary">{formatLevel(exercise.lesson.level)}</Badge>
              {exercise.lesson.stream && exercise.lesson.stream !== 'NONE' && (
                <Badge variant="outline">{formatStream(exercise.lesson.stream)}</Badge>
              )}
            </>
          )}
        </div>
        <CardTitle className="line-clamp-1">{exerciseTitle}</CardTitle>
        <CardDescription className="line-clamp-2">
          {exercise.lesson?.category || 'Mathématiques'} • Semestre {exercise.lesson?.semester || 1}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <Link href={`/exercises/exercise/${exercise.id}`}>
          <Button className="w-full">Voir l'exercice</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
