import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LessonStatus } from '@prisma/client';

export async function POST() {
  try {
    console.log('Seeding exercises via API...');

    // Get all published lessons
    const lessons = await prisma.lesson.findMany({
      where: { status: LessonStatus.PUBLISHED },
    });

    let exercisesCreated = 0;

    for (const lesson of lessons) {
      // Create 3 exercises per lesson
      for (let i = 1; i <= 3; i++) {
        const slug = `${lesson.slug}-exercice-${i}`;
        const existing = await prisma.exercise.findUnique({ where: { slug } });

        if (!existing) {
          await prisma.exercise.create({
            data: {
              slug,
              problemTextFr: `# Exercice ${i}

## Sujet: ${lesson.titleFr}

Cet exercice sera bientôt disponible avec un énoncé complet.

En attendant, vous pouvez :
- Relire la leçon "${lesson.titleFr}"
- Consulter les autres exercices disponibles
- Poser vos questions sur le forum

📚 Bon courage !`,
              solutionFr: `# Solution de l'exercice ${i}

La solution détaillée sera bientôt disponible.

## Méthode recommandée

1. Relisez attentivement l'énoncé
2. Identifiez les concepts clés de la leçon "${lesson.titleFr}"
3. Appliquez les formules et méthodes vues en cours
4. Vérifiez votre résultat

💡 N'hésitez pas à demander de l'aide sur le forum si vous êtes bloqué !`,
              hints: [
                `Relisez la leçon "${lesson.titleFr}"`,
                `Identifiez les concepts clés`,
                `Appliquez les méthodes vues en cours`,
                `Prenez votre temps et procédez étape par étape`
              ],
              lessonId: lesson.id,
            },
          });
          exercisesCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seed completed! Created: ${exercisesCreated} exercises for ${lessons.length} lessons.`,
      created: exercisesCreated,
      lessonsCount: lessons.length,
    });
  } catch (error: any) {
    console.error('Exercise seed error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
