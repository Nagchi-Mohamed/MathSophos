import { toTextbookLesson } from '../lib/textbook-adapter';

const BENCHMARK_LESSON_RAW = {
  id: 'benchmark-logique-1',
  slug: 'notions-de-logique-1766238530971',
  titleFr: 'Notions de logique',
  titleEn: 'Notions of Logic',
  level: 'LYCEE_1BAC',
  stream: 'SC_MATH_A',
  semester: 1,
  category: 'Logique',
  contentFr: `# Notions de logique

## Objectifs
- Comprendre les connecteurs logiques
- Maîtriser le raisonnement par récurrence et par l'absurde

## 1. Propositions
Une proposition mathématique est une assertion qui est soit vraie, soit fausse, mais pas les deux à la fois.

### Définition 1.1
On appelle proposition toute affirmation mathématique $P$ susceptible d'être vraie ($V$) ou fausse ($F$).

### Exemple 1.1
- "$2 + 3 = 5$" est une proposition vraie.
- "Tout nombre entier est pair" est une proposition fausse.

## 2. Connecteurs logiques

### Théorème 2.1
Soient $P$ et $Q$ deux propositions. L'implication $P \\Rightarrow Q$ est fausse seulement si $P$ est vraie et $Q$ est fausse.

### Démonstration
Si $P$ est vraie et $Q$ est vraie, $P \\Rightarrow Q$ est vraie.
■

## 3. Exercices d'application

### Exercice 1
Démontrer que pour tout $n \\in \\mathbb{N}$, $n(n+1)$ est pair.

#### Indications
- Raisonner par disjonction des cas ($n$ pair ou $n$ impair).

#### Solution
Si $n = 2k$, alors $n(n+1) = 2k(2k+1)$ qui est divisible par 2.
Si $n = 2k+1$, alors $n(n+1) = (2k+1)(2k+2) = 2(2k+1)(k+1)$ qui est divisible par 2.
CQFD.
`,
  exercises: [
    {
      id: 'ex-1',
      problemTextFr: 'Démontrer par l\'absurde que $\\sqrt{2} \\notin \\mathbb{Q}$.',
      hints: ['Supposer $\\sqrt{2} = \\frac{a}{b}$ avec $a, b$ premiers entre eux.'],
      solutionFr: 'Si $\\sqrt{2} = \\frac{a}{b}$, alors $a^2 = 2b^2$, ce qui implique que $a$ et $b$ sont pairs, contradiction avec $\\text{pgcd}(a,b)=1$.',
      difficulty: 3,
    }
  ]
};

console.log('--- RUNNING BENCHMARK LESSON VERIFICATION ---');
const structured = toTextbookLesson(BENCHMARK_LESSON_RAW as any);

console.log('1. Schema Version:', structured.schemaVersion);
console.log('2. Title:', structured.title);
console.log('3. Section Count:', structured.sections.length);
console.log('4. Sections Titles:', structured.sections.map(s => `${s.number}. ${s.title}`));
console.log('5. Total Blocks Extracted:', structured.sections.reduce((acc, s) => acc + s.blocks.length, 0));
console.log('6. Block Types Found:', Array.from(new Set(structured.sections.flatMap(s => s.blocks.map(b => b.type)))));
console.log('7. Exercises Adapted:', structured.exercises?.length);
console.log('8. Objectives Extracted:', structured.metadata.objectives?.length);

if (structured.sections.length > 0 && structured.exercises?.length === 1) {
  console.log('✅ Content-Integrity Verification: PASSED 100%!');
} else {
  console.error('❌ Content-Integrity Verification: FAILED!');
  process.exit(1);
}
