import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EducationalLevel, Stream, LessonStatus } from '@prisma/client';

const PLACEHOLDER_CONTENT = `# Cette leçon sera bientôt disponible

Nous travaillons actuellement sur le contenu de cette leçon. Elle sera disponible très prochainement.

## En attendant

Vous pouvez :
- Explorer les autres leçons disponibles
- Consulter les exercices associés
- Nous contacter si vous avez des questions

Merci de votre patience ! 📚
`;

interface LessonData {
  titleFr: string;
  level: EducationalLevel;
  stream: Stream;
  semester: number;
  order: number;
  category?: string;
}

export const ALL_LESSONS: LessonData[] = [


  // COLLÈGE 1AC
  { titleFr: "Nombres décimaux relatifs : Présentation", level: "COLLEGE_1AC", stream: "NONE", semester: 1, order: 1, category: "Nombres" },
  { titleFr: "Opérations sur les nombres relatifs (addition, soustraction)", level: "COLLEGE_1AC", stream: "NONE", semester: 1, order: 2, category: "Nombres" },
  { titleFr: "Opérations sur les nombres relatifs (multiplication, division)", level: "COLLEGE_1AC", stream: "NONE", semester: 1, order: 3, category: "Nombres" },
  { titleFr: "Nombres fractionnaires (opérations)", level: "COLLEGE_1AC", stream: "NONE", semester: 1, order: 4, category: "Nombres" },
  { titleFr: "Puissances", level: "COLLEGE_1AC", stream: "NONE", semester: 1, order: 5, category: "Nombres" },
  { titleFr: "Calcul littéral (Développement et factorisation)", level: "COLLEGE_1AC", stream: "NONE", semester: 1, order: 6, category: "Algèbre" },
  { titleFr: "Équations et Problèmes (premier degré)", level: "COLLEGE_1AC", stream: "NONE", semester: 2, order: 7, category: "Algèbre" },
  { titleFr: "La proportionnalité", level: "COLLEGE_1AC", stream: "NONE", semester: 2, order: 8, category: "Nombres" },
  { titleFr: "Les angles", level: "COLLEGE_1AC", stream: "NONE", semester: 2, order: 9, category: "Géométrie" },
  { titleFr: "Les triangles", level: "COLLEGE_1AC", stream: "NONE", semester: 2, order: 10, category: "Géométrie" },
  { titleFr: "La symétrie centrale", level: "COLLEGE_1AC", stream: "NONE", semester: 2, order: 11, category: "Géométrie" },
  { titleFr: "Les quadrilatères usuels", level: "COLLEGE_1AC", stream: "NONE", semester: 2, order: 12, category: "Géométrie" },
  { titleFr: "Repère dans le plan", level: "COLLEGE_1AC", stream: "NONE", semester: 2, order: 13, category: "Géométrie" },

  // COLLÈGE 2AC
  { titleFr: "Les nombres rationnels (Présentation)", level: "COLLEGE_2AC", stream: "NONE", semester: 1, order: 1, category: "Nombres" },
  { titleFr: "Les nombres rationnels : Somme et différence", level: "COLLEGE_2AC", stream: "NONE", semester: 1, order: 2, category: "Nombres" },
  { titleFr: "Les nombres rationnels : Multiplication et division", level: "COLLEGE_2AC", stream: "NONE", semester: 1, order: 3, category: "Nombres" },
  { titleFr: "Les puissances", level: "COLLEGE_2AC", stream: "NONE", semester: 1, order: 4, category: "Nombres" },
  { titleFr: "Calcul littéral (identités remarquables)", level: "COLLEGE_2AC", stream: "NONE", semester: 1, order: 5, category: "Algèbre" },
  { titleFr: "Ordre et opérations (inégalités)", level: "COLLEGE_2AC", stream: "NONE", semester: 1, order: 6, category: "Algèbre" },
  { titleFr: "Les équations", level: "COLLEGE_2AC", stream: "NONE", semester: 2, order: 7, category: "Algèbre" },
  { titleFr: "Droites remarquables dans un triangle", level: "COLLEGE_2AC", stream: "NONE", semester: 2, order: 8, category: "Géométrie" },
  { titleFr: "Théorème de la droite des milieux", level: "COLLEGE_2AC", stream: "NONE", semester: 2, order: 9, category: "Géométrie" },
  { titleFr: "Triangle rectangle et cercle circonscrit", level: "COLLEGE_2AC", stream: "NONE", semester: 2, order: 10, category: "Géométrie" },
  { titleFr: "Vecteurs et translation", level: "COLLEGE_2AC", stream: "NONE", semester: 2, order: 11, category: "Géométrie" },
  { titleFr: "Pyramide et cône de révolution", level: "COLLEGE_2AC", stream: "NONE", semester: 2, order: 12, category: "Géométrie" },
  { titleFr: "Statistique", level: "COLLEGE_2AC", stream: "NONE", semester: 2, order: 13, category: "Statistiques" },

  // COLLÈGE 3AC
  { titleFr: "Les identités remarquables", level: "COLLEGE_3AC", stream: "NONE", semester: 1, order: 1, category: "Algèbre" },
  { titleFr: "Les puissances", level: "COLLEGE_3AC", stream: "NONE", semester: 1, order: 2, category: "Nombres" },
  { titleFr: "Les racines carrées", level: "COLLEGE_3AC", stream: "NONE", semester: 1, order: 3, category: "Nombres" },
  { titleFr: "Ordre et opérations", level: "COLLEGE_3AC", stream: "NONE", semester: 1, order: 4, category: "Algèbre" },
  { titleFr: "Théorème de Thalès et sa réciproque", level: "COLLEGE_3AC", stream: "NONE", semester: 1, order: 5, category: "Géométrie" },
  { titleFr: "Théorème de Pythagore et sa réciproque", level: "COLLEGE_3AC", stream: "NONE", semester: 1, order: 6, category: "Géométrie" },
  { titleFr: "Trigonométrie (Cosinus, Sinus, Tangente)", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 7, category: "Géométrie" },
  { titleFr: "Angles au centre et angles inscrits", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 8, category: "Géométrie" },
  { titleFr: "Triangles isométriques et semblables", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 9, category: "Géométrie" },
  { titleFr: "Équations et inéquations (premier degré)", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 10, category: "Algèbre" },
  { titleFr: "Systèmes de deux équations à deux inconnues", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 11, category: "Algèbre" },
  { titleFr: "Fonctions linéaires et affines", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 12, category: "Analyse" },
  { titleFr: "Vecteurs et translation", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 13, category: "Géométrie" },
  { titleFr: "Repère dans le plan (Coordonnées)", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 14, category: "Géométrie" },
  { titleFr: "Équation d'une droite", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 15, category: "Géométrie" },
  { titleFr: "Géométrie dans l'espace (Sections de solides)", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 16, category: "Géométrie" },
  { titleFr: "Statistique", level: "COLLEGE_3AC", stream: "NONE", semester: 2, order: 17, category: "Statistiques" },

  // TRONC COMMUN
  { titleFr: "Les ensembles de nombres ℕ, ℤ, ℚ, 𝔻 et ℝ", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 1, order: 1, category: "Algèbre" },
  { titleFr: "Arithmétique dans ℕ (PPCM, PGCD)", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 1, order: 2, category: "Arithmétique" },
  { titleFr: "L'ordre dans ℝ et intervalles", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 1, order: 3, category: "Analyse" },
  { titleFr: "Les polynômes (factorisation, racines)", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 1, order: 4, category: "Algèbre" },
  { titleFr: "Équations, inéquations et systèmes", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 1, order: 5, category: "Algèbre" },
  { titleFr: "Calcul vectoriel dans le plan", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 1, order: 6, category: "Géométrie" },
  { titleFr: "La projection dans le plan", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 1, order: 7, category: "Géométrie" },
  { titleFr: "Généralités sur les fonctions", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 2, order: 8, category: "Analyse" },
  { titleFr: "Trigonométrie 1 (Cercle trigonométrique)", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 2, order: 9, category: "Trigonométrie" },
  { titleFr: "Trigonométrie 2 (Équations trigonométriques)", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 2, order: 10, category: "Trigonométrie" },
  { titleFr: "La droite dans le plan", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 2, order: 11, category: "Géométrie" },
  { titleFr: "Transformations du plan", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 2, order: 12, category: "Géométrie" },
  { titleFr: "Le produit scalaire", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 2, order: 13, category: "Géométrie" },
  { titleFr: "Géométrie dans l'espace (droites et plans)", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 2, order: 14, category: "Géométrie" },
  { titleFr: "Statistiques (Paramètres)", level: "LYCEE_TC", stream: "TC_SCIENCES", semester: 2, order: 15, category: "Statistiques" },

  // 1BAC SC MATH
  { titleFr: "Notions de logique (Propositions, quantificateurs)", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 1, order: 1, category: "Logique" },
  { titleFr: "Ensembles et applications", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 1, order: 2, category: "Algèbre" },
  { titleFr: "Généralités sur les fonctions", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 1, order: 3, category: "Analyse" },
  { titleFr: "Les suites numériques", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 1, order: 4, category: "Analyse" },
  { titleFr: "Le barycentre dans le plan", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 1, order: 5, category: "Géométrie" },
  { titleFr: "Étude analytique du produit scalaire", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 1, order: 6, category: "Géométrie" },
  { titleFr: "Calcul trigonométrique (Formules)", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 7, category: "Trigonométrie" },
  { titleFr: "La rotation dans le plan", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 8, category: "Géométrie" },
  { titleFr: "Limites d'une fonction numérique", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 9, category: "Analyse" },
  { titleFr: "Dérivabilité d'une fonction", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 10, category: "Analyse" },
  { titleFr: "Étude des fonctions", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 11, category: "Analyse" },
  { titleFr: "Dénombrement", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 12, category: "Probabilités" },
  { titleFr: "Arithmétique dans ℤ (Congruence)", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 13, category: "Arithmétique" },
  { titleFr: "Vecteurs de l'espace", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 14, category: "Géométrie" },
  { titleFr: "Géométrie analytique de l'espace", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 15, category: "Géométrie" },
  { titleFr: "Produit scalaire dans l'espace", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 16, category: "Géométrie" },
  { titleFr: "Produit vectoriel dans l'espace", level: "LYCEE_1BAC", stream: "SC_MATH_A", semester: 2, order: 17, category: "Géométrie" },

  // 2BAC SC MATH
  { titleFr: "Limites et continuité (Théorèmes)", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 1, order: 1, category: "Analyse" },
  { titleFr: "Dérivation et applications (T.A.F., Rolle)", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 1, order: 2, category: "Analyse" },
  { titleFr: "Les suites numériques (récurrentes, adjacentes)", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 1, order: 3, category: "Analyse" },
  { titleFr: "Fonctions logarithmes", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 1, order: 4, category: "Analyse" },
  { titleFr: "Fonctions exponentielles", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 1, order: 5, category: "Analyse" },
  { titleFr: "Les nombres complexes (Forme algébrique)", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 1, order: 6, category: "Algèbre" },
  { titleFr: "Les nombres complexes (Forme trigonométrique)", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 2, order: 7, category: "Algèbre" },
  { titleFr: "Fonctions primitives", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 2, order: 8, category: "Analyse" },
  { titleFr: "Calcul intégral et aires", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 2, order: 9, category: "Analyse" },
  { titleFr: "Équations différentielles", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 2, order: 10, category: "Analyse" },
  { titleFr: "Arithmétique (Bezout, Gauss)", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 2, order: 11, category: "Arithmétique" },
  { titleFr: "Structures algébriques", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 2, order: 12, category: "Algèbre" },
  { titleFr: "Espaces vectoriels", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 2, order: 13, category: "Algèbre" },
  { titleFr: "Dénombrement et Probabilités", level: "LYCEE_2BAC", stream: "SC_MATH_A", semester: 2, order: 14, category: "Probabilités" },
];

export async function POST() {
  try {
    let created = 0;
    let skipped = 0;

    for (const lesson of ALL_LESSONS) {
      const slug = lesson.titleFr
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const existing = await prisma.lesson.findUnique({ where: { slug } });

      if (!existing) {
        await prisma.lesson.create({
          data: {
            titleFr: lesson.titleFr,
            slug,
            contentFr: PLACEHOLDER_CONTENT,
            level: lesson.level,
            stream: lesson.stream,
            semester: lesson.semester,
            order: lesson.order,
            category: lesson.category,
            status: LessonStatus.PUBLISHED,
          },
        });
        created++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seed completed! Created: ${created}, Skipped: ${skipped}`,
      created,
      skipped,
      total: ALL_LESSONS.length,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
