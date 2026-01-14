import { PrismaClient, UserRole, EducationalLevel, LessonStatus, Stream } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const needsSsl = typeof connectionString === 'string' && /sslmode=require|ssl=true|sslmode=verify-full/i.test(connectionString)
const pool = new Pool({ connectionString, ssl: needsSsl ? { rejectUnauthorized: false } : undefined })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

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

const ALL_LESSONS: LessonData[] = [
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

async function main() {
  console.log('Start seeding...')

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mathsophos.com' },
    update: {},
    create: {
      email: 'admin@mathsophos.com',
      name: 'Admin MathSophos',
      passwordHash: passwordHash,
      role: UserRole.ADMIN,
    },
  })

  const teacher = await prisma.user.upsert({
    where: { email: 'prof@mathsophos.com' },
    update: {},
    create: {
      email: 'prof@mathsophos.com',
      name: 'Prof MathSophos',
      passwordHash: passwordHash,
      role: UserRole.TEACHER,
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'eleve@mathsophos.com' },
    update: {},
    create: {
      email: 'eleve@mathsophos.com',
      name: 'Élève MathSophos',
      passwordHash: passwordHash,
      role: UserRole.STUDENT,
    },
  })

  console.log('✓ Users created')

  // 2. Create AI Contexts
  let mathTutorContext = await prisma.aiContext.findFirst({
    where: { name: "Tuteur Mathématiques Bienveillant" }
  })

  if (!mathTutorContext) {
    mathTutorContext = await prisma.aiContext.create({
      data: {
        name: "Tuteur Mathématiques Bienveillant",
        description: "Pour expliquer des concepts aux élèves de collège/lycée.",
        systemPrompt: `Tu es un professeur de mathématiques expert et bienveillant pour le système éducatif marocain.
Ton objectif est d'expliquer les concepts mathématiques de manière claire, progressive et adaptée au niveau de l'élève (Collège ou Lycée).
Utilise des exemples concrets et encourage l'élève.
Si l'élève est bloqué, donne des indices plutôt que la réponse directe.
Formatte tes réponses en Markdown avec LaTeX pour les formules mathématiques (ex: $x^2$).`,
      },
    })
  }

  let exerciseGeneratorContext = await prisma.aiContext.findFirst({
    where: { name: "Générateur d'Exercices" }
  })

  if (!exerciseGeneratorContext) {
    exerciseGeneratorContext = await prisma.aiContext.create({
      data: {
        name: "Générateur d'Exercices",
        description: "Pour créer des exercices avec solutions détaillées.",
        systemPrompt: `Tu es un expert en création de contenu pédagogique pour les mathématiques au Maroc.
Génère des exercices variés (application directe, problèmes, QCM) adaptés au niveau spécifié.
Pour chaque exercice, fournis :
1. L'énoncé clair.
2. Des indices progressifs.
3. La solution détaillée pas à pas.
Formatte en Markdown.`,
      },
    })
  }

  console.log('✓ AI Contexts created')

  // 3. Seed Lessons
  console.log('Seeding lessons...')
  let created = 0
  let skipped = 0

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

  console.log(`✓ Lessons: Created ${created}, Skipped ${skipped}`)

  // 4. Seed Exercises (for each lesson, create 3 exercises)
  console.log('Seeding exercises...')
  const lessons = await prisma.lesson.findMany({
    where: { status: LessonStatus.PUBLISHED },
  })

  let exercisesCreated = 0

  for (const lesson of lessons) {
    // Create 3 exercises per lesson
    for (let i = 1; i <= 3; i++) {
      const slug = `${lesson.slug}-exercice-${i}`
      const existing = await prisma.exercise.findUnique({ where: { slug } })

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
        })
        exercisesCreated++
      }
    }
  }

  console.log(`✓ Exercises created: ${exercisesCreated}`)
  console.log(`✓ Total lessons seeded: ${lessons.length}`)
  console.log('\n✅ Seeding finished successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
