export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const dictionary = {
  fr: {
    nav: {
      home: 'Accueil',
      lessons: 'Leçons',
      exercises: 'Exercices',
      calculators: 'Calculatrices',
      forum: 'Forum',
      classrooms: 'Classroom',
      login: 'Connexion',
    },
    footer: {
      rights: 'Tous droits réservés.',
      about: 'À propos',
      contact: 'Contact',
    },
    common: {
      downloadPdf: 'Télécharger le PDF',
      resources: 'Ressources',
      administration: 'Administration',
      level: 'Niveau',
      stream: 'Filière',
      semester: 'Semestre',
      professor: 'Professeur',
      backToLessons: 'Retour aux leçons',
      backToExercises: 'Retour aux séries',
      exercise: 'Exercice',
      hints: 'Indices',
      detailedSolution: 'Solution détaillée',
      modules: 'modules',
      relatedSeries: 'Séries d\'exercices associées',
      exercisesCount: 'exercices',
      previous: 'Précédent',
      next: 'Suivant',
      pageOf: 'Page {0} sur {1}', // Simplified for now, will handle substitution manually or via simple replace in component
      noResults: 'Aucun résultat',
      tryOtherFilters: 'Essayez d\'autres filtres',
      availableLessons: 'Leçons disponibles',
      availableSeries: 'Séries trouvées',
      resultsFound: 'résultats trouvés',
      search: 'Recherche',
      clickToViewChapters: 'Cliquez pour voir les chapitres',
      clickToViewExercises: 'Cliquez pour voir les exercices',
      noChapter: 'Aucun chapitre',
      noLesson: 'Aucune leçon',
      noStream: 'Aucune filière',
      noModule: 'Aucun module',
    },
    pages: {
      lessons: {
        title: 'Bibliothèque de Leçons',
        subtitle: 'Sélectionnez votre cycle d\'études pour accéder aux cours et exercices.',
      },
      exercises: {
        title: 'Bibliothèque d\'Exercices',
        subtitle: 'Sélectionnez votre cycle d\'études pour accéder aux exercices et problèmes.',
      },
      common: {
        chooseLevel: 'Choisissez votre niveau',
        chooseStream: 'Choisissez votre filière',
        chooseSemester: 'Choisissez le semestre',
        chooseModule: 'Choisissez le module',
        chooseLesson: 'Choisissez la leçon',
        chaptersOf: 'Chapitres de',
      }
    },
    cycles: {
      COLLEGE: 'Collège',
      LYCEE: 'Lycée',
      SUPERIEUR: 'Supérieur',
      PRIMARY: 'Primaire',
      COLLEGE_DESC: '1ère à 3ème année',
      LYCEE_DESC: 'Tronc commun et Bac',
      SUPERIEUR_DESC: 'Université et Grandes Écoles',
    }
  },
  en: {
    nav: {
      home: 'Home',
      lessons: 'Lessons',
      exercises: 'Exercises',
      calculators: 'Calculators',
      forum: 'Forum',
      classrooms: 'Classrooms',
      login: 'Login',
    },
    footer: {
      rights: 'All rights reserved.',
      about: 'About',
      contact: 'Contact',
    },
    common: {
      downloadPdf: 'Download PDF',
      resources: 'Resources',
      administration: 'Administration',
      level: 'Level',
      stream: 'Stream',
      semester: 'Semester',
      professor: 'Professor',
      backToLessons: 'Back to lessons',
      backToExercises: 'Back to series',
      exercise: 'Exercise',
      hints: 'Hints',
      detailedSolution: 'Detailed Solution',
      relatedSeries: 'Related Exercise Series',
      exercisesCount: 'exercises',
      previous: 'Previous',
      next: 'Next',
      pageOf: 'Page {0} of {1}',
      noResults: 'No results',
      tryOtherFilters: 'Try other filters',
      availableLessons: 'Available Lessons',
      availableSeries: 'Series Found',
      resultsFound: 'results found',
      search: 'Search',
      clickToViewChapters: 'Click to view chapters',
      clickToViewExercises: 'Click to view exercises',
      noChapter: 'No chapter',
      noLesson: 'No lesson',
      noStream: 'No stream',
      noModule: 'No module',
      modules: 'modules',
    },
    pages: {
      lessons: {
        title: 'Lessons Library',
        subtitle: 'Select your study cycle to access courses and exercises.',
      },
      exercises: {
        title: 'Exercises Library',
        subtitle: 'Select your study cycle to access exercises and problems.',
      },
      common: {
        chooseLevel: 'Choose your level',
        chooseStream: 'Choose your stream',
        chooseSemester: 'Choose semester',
        chooseModule: 'Choose module',
        chooseLesson: 'Choose lesson',
        chaptersOf: 'Chapters of',
      }
    },
    cycles: {
      COLLEGE: 'Middle School',
      LYCEE: 'High School',
      SUPERIEUR: 'Higher Education',
      PRIMARY: 'Primary School',
      COLLEGE_DESC: '1st to 3rd year',
      LYCEE_DESC: 'Common Core and Baccalaureate',
      SUPERIEUR_DESC: 'University and Grandes Écoles',
    }
  },
};

/**
 * Standard interface for content that has bilingual fields
 */
export interface LocalizableContent {
  titleFr?: string;
  titleEn?: string | null;
  contentFr?: string | null;
  contentEn?: string | null;
  problemTextFr?: string;
  problemTextEn?: string | null;
  solutionFr?: string;
  solutionEn?: string | null;
  [key: string]: any;
}

/**
 * Helper to get localized title and content from an object.
 * Returns the requested language version if available and non-empty,
 * otherwise falls back to the default language (usually French).
 */
export function getLocalizedData<T extends LocalizableContent>(
  data: T,
  language: Locale
): {
  title: string;
  content: string;
  problemText?: string;
  solution?: string;
  original: T
} {
  const isEn = language === 'en';

  // Title logic
  let title = data.titleFr || ''; // Default
  if (isEn && data.titleEn) {
    title = data.titleEn;
  } else if (data.title) {
    // Some objects might use 'title' directly
    title = data.title;
  }

  // Content logic
  let content = data.contentFr || ''; // Default
  if (isEn && data.contentEn) {
    content = data.contentEn;
  } else if (data.content) {
    content = data.content;
  } else if (data.description) {
    // Fallback for objects that might use description as content
    content = data.description;
  }

  // Exercise specific logic
  let problemText = data.problemTextFr || '';
  if (isEn && data.problemTextEn) {
    problemText = data.problemTextEn;
  }

  let solution = data.solutionFr || '';
  if (isEn && data.solutionEn) {
    solution = data.solutionEn;
  }

  return {
    title,
    content,
    problemText: problemText || undefined,
    solution: solution || undefined,
    original: data
  };
}
