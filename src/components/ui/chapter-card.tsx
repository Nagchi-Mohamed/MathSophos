import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';

export interface ChapterCardProps {
  chapter: {
    id: string;
    titleFr: string;
    slug?: string;
    chapterNumber: number;
    category?: string | null;
  };
}

export function ChapterCard({ chapter }: ChapterCardProps) {
  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted overflow-hidden group">
      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
      <CardHeader className="pb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50">
            Chapitre {chapter.chapterNumber}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors">
          {chapter.titleFr}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2">
          <BookOpen className="w-4 h-4" />
          {chapter.category || 'Mathématiques'} • Chapitre {chapter.chapterNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        {chapter.slug ? (
          <Link href={`/chapters/${chapter.slug}`} className="w-full">
            <Button className="w-full group-hover:bg-primary/90 transition-colors" variant="secondary">
              Voir le chapitre
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        ) : (
          <Button className="w-full" variant="secondary" disabled>
            Chapitre en préparation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

