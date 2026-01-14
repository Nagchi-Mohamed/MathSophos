/**
 * Predefined templates for Exams and Controls
 * Following Moroccan educational standards
 */

import { ExamJson, ControlJson } from "./exam-json-schemas"

// ============================================================================
// Template Metadata
// ============================================================================

export interface TemplateInfo {
  id: string
  name: string
  description: string
  category: "exam" | "control"
  level?: string
  type?: string
}

// ============================================================================
// Exam Templates
// ============================================================================

/**
 * National Exam Template (Moroccan Format)
 * Standard structure: 4-5 exercises, 20 points, 2 hours
 */
export const NATIONAL_EXAM_TEMPLATE: ExamJson = {
  title: "EXAMEN NATIONAL DE MATHÉMATIQUES",
  subtitle: `Session ${new Date().getFullYear()}`,
  duration: "2h",
  totalPoints: 20,
  instructions: `- Durée : 2h
- Barème : 20 points
- La présentation, la rédaction et l'orthographe seront prises en compte
- Toute réponse doit être justifiée
- L'utilisation de la calculatrice est autorisée selon les consignes`,
  metadata: {
    type: "EXAM",
    examType: "NATIONAL",
  },
  exercises: [
    {
      title: "Exercice 1 (4 points) : Application directe",
      problem: `Soit $f$ la fonction définie sur $\\mathbb{R}$ par : $f(x) = x^2 - 4x + 3$.

a) Calculer $f(0)$ et $f(2)$. **(1pt)**

b) Factoriser $f(x)$. **(2pts)**

c) Résoudre l'équation $f(x) = 0$. **(1pt)**`,
      solution: `**a)** Calcul des valeurs :
- $f(0) = 0^2 - 4(0) + 3 = 3$
- $f(2) = 2^2 - 4(2) + 3 = 4 - 8 + 3 = -1$

**b)** Factorisation :
$f(x) = x^2 - 4x + 3$

On cherche deux nombres dont la somme est $-4$ et le produit est $3$ : $-1$ et $-3$.

$f(x) = (x - 1)(x - 3)$

**c)** Résolution de $f(x) = 0$ :
$(x - 1)(x - 3) = 0$

Donc $x = 1$ ou $x = 3$

$S = \\{1; 3\\}$`,
      points: 4,
      spaceLines: 8,
    },
    {
      title: "Exercice 2 (6 points) : Fonctions et dérivées",
      problem: `Soit $g$ la fonction définie sur $\\mathbb{R}$ par : $g(x) = x^3 - 3x^2 + 2$.

a) Calculer $g'(x)$ où $g'$ est la dérivée de $g$. **(1pt)**

b) Étudier le signe de $g'(x)$ sur $\\mathbb{R}$. **(2pts)**

c) Dresser le tableau de variations de $g$. **(2pts)**

d) Déterminer les coordonnées des points d'intersection de la courbe représentative de $g$ avec l'axe des abscisses. **(1pt)**`,
      solution: `**a)** Calcul de la dérivée :
$g'(x) = 3x^2 - 6x = 3x(x - 2)$

**b)** Étude du signe de $g'(x)$ :
$g'(x) = 3x(x - 2)$

| $x$ | $-\\infty$ | | $0$ | | $2$ | | $+\\infty$ |
|-----|-----------|---|-----|---|-----|---|-----------|
| $3x$ | $-$ | | $0$ | $+$ | | $+$ | |
| $x-2$ | $-$ | | $-$ | | $0$ | $+$ | |
| $g'(x)$ | $+$ | | $0$ | $-$ | $0$ | $+$ | |

**c)** Tableau de variations :

$$
\\begin{array}{|c|c|c|c|c|c|}
\\hline
x & -\\infty & & 0 & & 2 & & +\\infty \\\\
\\hline
g'(x) & & + & 0 & - & 0 & + & \\\\
\\hline
g(x) & -\\infty & \\nearrow & 2 & \\searrow & -2 & \\nearrow & +\\infty \\\\
\\hline
\\end{array}
$$

**d)** Points d'intersection avec l'axe des abscisses :
On résout $g(x) = 0$ : $x^3 - 3x^2 + 2 = 0$

Par essai : $g(1) = 1 - 3 + 2 = 0$, donc $x = 1$ est solution.

Points : $(1, 0)$ et approximativement $(2.73, 0)$ et $(-0.73, 0)$`,
      points: 6,
      spaceLines: 12,
    },
    {
      title: "Exercice 3 (6 points) : Suites numériques",
      problem: `Soit $(u_n)$ la suite définie par : $u_0 = 1$ et $u_{n+1} = \\frac{2u_n + 3}{u_n + 2}$ pour tout $n \\in \\mathbb{N}$.

a) Calculer $u_1$ et $u_2$. **(1pt)**

b) Montrer que pour tout $n \\in \\mathbb{N}$, $u_n > 0$. **(2pts)**

c) Étudier la monotonie de la suite $(u_n)$. **(2pts)**

d) En déduire que la suite $(u_n)$ est convergente. **(1pt)**`,
      solution: `Solutions détaillées pour l'exercice sur les suites...`,
      points: 6,
      spaceLines: 12,
    },
    {
      title: "Exercice 4 (4 points) : Géométrie dans l'espace",
      problem: `Dans l'espace muni d'un repère orthonormé $(O; \\vec{i}, \\vec{j}, \\vec{k})$, on considère les points :
- $A(1, 2, 0)$
- $B(3, 1, 2)$
- $C(0, 3, 1)$

a) Calculer les coordonnées du vecteur $\\overrightarrow{AB}$. **(1pt)**

b) Calculer la distance $AB$. **(1pt)**

c) Déterminer une équation cartésienne du plan $(ABC)$. **(2pts)**`,
      solution: `Solutions détaillées pour l'exercice de géométrie...`,
      points: 4,
      spaceLines: 10,
    },
  ],
}

/**
 * Regional Exam Template (Moroccan Format)
 * Standard structure: 3-4 exercises, 20 points, 1h30
 */
export const REGIONAL_EXAM_TEMPLATE: ExamJson = {
  title: "EXAMEN RÉGIONAL DE MATHÉMATIQUES",
  subtitle: `Session ${new Date().getFullYear()}`,
  duration: "1h30min",
  totalPoints: 20,
  instructions: `- Durée : 1h30
- Barème : 20 points
- La présentation, la rédaction et l'orthographe seront prises en compte
- Toute réponse doit être justifiée
- L'utilisation de la calculatrice est autorisée`,
  metadata: {
    type: "EXAM",
    examType: "REGIONAL",
  },
  exercises: [
    {
      title: "Exercice 1 (5 points) : Calcul algébrique",
      problem: `a) Développer et réduire : $(2x + 3)^2 - (x - 1)(2x + 3)$. **(2pts)**

b) Factoriser l'expression obtenue. **(2pts)**

c) Résoudre l'équation : $(2x + 3)^2 - (x - 1)(2x + 3) = 0$. **(1pt)**`,
      solution: `Solutions détaillées...`,
      points: 5,
      spaceLines: 10,
    },
    {
      title: "Exercice 2 (7 points) : Fonctions",
      problem: `Exercice sur les fonctions...`,
      solution: `Solutions détaillées...`,
      points: 7,
      spaceLines: 12,
    },
    {
      title: "Exercice 3 (8 points) : Problème de synthèse",
      problem: `Problème de synthèse...`,
      solution: `Solutions détaillées...`,
      points: 8,
      spaceLines: 15,
    },
  ],
}

/**
 * Local Exam Template (Customizable)
 * Flexible structure for local assessments
 */
export const LOCAL_EXAM_TEMPLATE: ExamJson = {
  title: "EXAMEN LOCAL DE MATHÉMATIQUES",
  subtitle: "À personnaliser",
  duration: "2h",
  totalPoints: 20,
  instructions: `- Durée : 2h
- Barème : 20 points
- La présentation, la rédaction et l'orthographe seront prises en compte
- Toute réponse doit être justifiée`,
  metadata: {
    type: "EXAM",
    examType: "LOCAL",
  },
  exercises: [
    {
      title: "Exercice 1 (5 points) : [Titre à définir]",
      problem: "Énoncé de l'exercice...",
      solution: "Solution détaillée...",
      points: 5,
      spaceLines: 10,
    },
    {
      title: "Exercice 2 (7 points) : [Titre à définir]",
      problem: "Énoncé de l'exercice...",
      solution: "Solution détaillée...",
      points: 7,
      spaceLines: 12,
    },
    {
      title: "Exercice 3 (8 points) : [Titre à définir]",
      problem: "Énoncé de l'exercice...",
      solution: "Solution détaillée...",
      points: 8,
      spaceLines: 15,
    },
  ],
}

// ============================================================================
// Control Templates
// ============================================================================

/**
 * Control Template - Semester 1, Control 1
 */
export const CONTROL_S1_C1_TEMPLATE: ControlJson = {
  semester: 1,
  controlNumber: 1,
  duration: "1h",
  totalPoints: 20,
  instructions: `- Durée : 1h
- Barème : 20 points
- La présentation, la rédaction et l'orthographe seront prises en compte
- Toute réponse doit être justifiée`,
  metadata: {
    type: "CONTROL",
  },
  exercises: [
    {
      title: "Exercice 1 (8 points) : [Leçon 1]",
      problem: "Énoncé couvrant la première leçon...",
      solution: "Solution détaillée...",
      points: 8,
      spaceLines: 10,
    },
    {
      title: "Exercice 2 (12 points) : [Leçon 2]",
      problem: "Énoncé couvrant la deuxième leçon...",
      solution: "Solution détaillée...",
      points: 12,
      spaceLines: 15,
    },
  ],
}

/**
 * Control Template - Semester 1, Control 2
 */
export const CONTROL_S1_C2_TEMPLATE: ControlJson = {
  semester: 1,
  controlNumber: 2,
  duration: "1h",
  totalPoints: 20,
  instructions: `- Durée : 1h
- Barème : 20 points
- La présentation, la rédaction et l'orthographe seront prises en compte
- Toute réponse doit être justifiée`,
  metadata: {
    type: "CONTROL",
  },
  exercises: [
    {
      title: "Exercice 1 (10 points) : [Leçon 3]",
      problem: "Énoncé...",
      solution: "Solution...",
      points: 10,
      spaceLines: 12,
    },
    {
      title: "Exercice 2 (10 points) : [Leçon 4]",
      problem: "Énoncé...",
      solution: "Solution...",
      points: 10,
      spaceLines: 12,
    },
  ],
}

/**
 * Control Template - Semester 1, Control 3 (Comprehensive)
 */
export const CONTROL_S1_C3_TEMPLATE: ControlJson = {
  semester: 1,
  controlNumber: 3,
  duration: "1h30min",
  totalPoints: 20,
  instructions: `- Durée : 1h30
- Barème : 20 points
- Contrôle de synthèse du Semestre 1
- La présentation, la rédaction et l'orthographe seront prises en compte
- Toute réponse doit être justifiée`,
  metadata: {
    type: "CONTROL",
  },
  exercises: [
    {
      title: "Exercice 1 (6 points) : Révision Leçons 1-2",
      problem: "Énoncé de synthèse...",
      solution: "Solution...",
      points: 6,
      spaceLines: 10,
    },
    {
      title: "Exercice 2 (7 points) : Révision Leçons 3-4",
      problem: "Énoncé de synthèse...",
      solution: "Solution...",
      points: 7,
      spaceLines: 12,
    },
    {
      title: "Exercice 3 (7 points) : Problème de synthèse",
      problem: "Énoncé global...",
      solution: "Solution...",
      points: 7,
      spaceLines: 12,
    },
  ],
}

// Similar templates for Semester 2
export const CONTROL_S2_C1_TEMPLATE: ControlJson = {
  ...CONTROL_S1_C1_TEMPLATE,
  semester: 2,
}

export const CONTROL_S2_C2_TEMPLATE: ControlJson = {
  ...CONTROL_S1_C2_TEMPLATE,
  semester: 2,
}

export const CONTROL_S2_C3_TEMPLATE: ControlJson = {
  ...CONTROL_S1_C3_TEMPLATE,
  semester: 2,
}

// ============================================================================
// Template Registry
// ============================================================================

export const EXAM_TEMPLATES: Record<string, { info: TemplateInfo; template: ExamJson }> = {
  national: {
    info: {
      id: "national",
      name: "Examen National",
      description: "Format standard de l'examen national (4-5 exercices, 20 points, 2h)",
      category: "exam",
      type: "NATIONAL",
    },
    template: NATIONAL_EXAM_TEMPLATE,
  },
  regional: {
    info: {
      id: "regional",
      name: "Examen Régional",
      description: "Format standard de l'examen régional (3-4 exercices, 20 points, 1h30)",
      category: "exam",
      type: "REGIONAL",
    },
    template: REGIONAL_EXAM_TEMPLATE,
  },
  local: {
    info: {
      id: "local",
      name: "Examen Local",
      description: "Format personnalisable pour examens locaux",
      category: "exam",
      type: "LOCAL",
    },
    template: LOCAL_EXAM_TEMPLATE,
  },
}

export const CONTROL_TEMPLATES: Record<string, { info: TemplateInfo; template: ControlJson }> = {
  s1_c1: {
    info: {
      id: "s1_c1",
      name: "Contrôle 1 - Semestre 1",
      description: "Premier contrôle du semestre 1",
      category: "control",
    },
    template: CONTROL_S1_C1_TEMPLATE,
  },
  s1_c2: {
    info: {
      id: "s1_c2",
      name: "Contrôle 2 - Semestre 1",
      description: "Deuxième contrôle du semestre 1",
      category: "control",
    },
    template: CONTROL_S1_C2_TEMPLATE,
  },
  s1_c3: {
    info: {
      id: "s1_c3",
      name: "Contrôle 3 - Semestre 1",
      description: "Contrôle de synthèse du semestre 1",
      category: "control",
    },
    template: CONTROL_S1_C3_TEMPLATE,
  },
  s2_c1: {
    info: {
      id: "s2_c1",
      name: "Contrôle 1 - Semestre 2",
      description: "Premier contrôle du semestre 2",
      category: "control",
    },
    template: CONTROL_S2_C1_TEMPLATE,
  },
  s2_c2: {
    info: {
      id: "s2_c2",
      name: "Contrôle 2 - Semestre 2",
      description: "Deuxième contrôle du semestre 2",
      category: "control",
    },
    template: CONTROL_S2_C2_TEMPLATE,
  },
  s2_c3: {
    info: {
      id: "s2_c3",
      name: "Contrôle 3 - Semestre 2",
      description: "Contrôle de synthèse du semestre 2",
      category: "control",
    },
    template: CONTROL_S2_C3_TEMPLATE,
  },
}

/**
 * Get all available templates
 */
export function getAllTemplates() {
  return {
    exams: Object.values(EXAM_TEMPLATES),
    controls: Object.values(CONTROL_TEMPLATES),
  }
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ExamJson | ControlJson | null {
  if (EXAM_TEMPLATES[id]) {
    return EXAM_TEMPLATES[id].template
  }
  if (CONTROL_TEMPLATES[id]) {
    return CONTROL_TEMPLATES[id].template
  }
  return null
}
