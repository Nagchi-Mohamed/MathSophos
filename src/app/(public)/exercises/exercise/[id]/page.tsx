import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lightbulb, Download } from "lucide-react";
import Link from "next/link";
import { ExerciseContentRenderer } from "@/components/exercises/exercise-content-renderer";
import "katex/dist/katex.min.css"; // Keeping this if other parts still use katex styles, or remove if fully switched
import { getExerciseById } from "@/actions/content";
import { formatLevel } from "@/utils/formatters";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data: exercise } = await getExerciseById(id);

  if (!exercise) {
    return {
      title: "Exercice non trouvé | MathSophos",
    };
  }

  const preview = exercise.problemTextFr.substring(0, 100);
  return {
    title: `Exercice | MathSophos`,
    description: preview,
  };
}

export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: exercise } = await getExerciseById(id);

  if (!exercise) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Exercice non trouvé</h1>
        <Link href="/exercises">
          <Button>Retour aux exercices</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-4xl">
      <Link href="/exercises" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux exercices
      </Link>

      <div className="space-y-8">
        <div className="space-y-4 border-b pb-8">
          <div className="flex gap-2">
            {exercise.lesson && (
              <Badge variant="outline">{formatLevel(exercise.lesson.level)}</Badge>
            )}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl gradient-text w-fit">
            Exercice
          </h1>
          {exercise.lesson && (
            <p className="text-muted-foreground">
              Leçon associée:{" "}
              <Link href={`/lessons/${exercise.lesson.slug}`} className="text-primary hover:underline">
                {exercise.lesson.titleFr}
              </Link>
            </p>
          )}
        </div>

        {/* Problem Statement */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Énoncé</h2>
          <article className="prose prose-slate lg:prose-lg dark:prose-invert max-w-none">
            <ExerciseContentRenderer content={exercise.problemTextFr} />
          </article>
        </div>

        {/* Hints */}
        {exercise.hints && exercise.hints.length > 0 && (
          <details className="space-y-4 bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
            <summary className="flex items-center gap-2 cursor-pointer list-none">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold inline">Indices</h2>
            </summary>
            <ul className="space-y-2 mt-4">
              {exercise.hints.map((hint: string, index: number) => (
                <li key={index} className="text-sm">
                  <div className="flex gap-2">
                    <span className="font-bold">{index + 1}.</span>
                    <div className="flex-1">
                      <ExerciseContentRenderer content={hint} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Solution */}
        <details className="space-y-4 border rounded-lg p-6">
          <summary className="text-xl font-bold cursor-pointer flex items-center justify-between">
            <span>Solution</span>
            {exercise.correctionFileUrl && (
              <a
                href={exercise.correctionFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center text-sm font-normal text-blue-600 hover:underline"
              >
                <Download className="w-4 h-4 mr-1" />
                Télécharger la correction (PDF)
              </a>
            )}
          </summary>
          <article className="prose prose-slate lg:prose-lg dark:prose-invert max-w-none mt-4">
            <ExerciseContentRenderer content={exercise.solutionFr} />
          </article>
        </details>
      </div>
    </div>
  );
}
