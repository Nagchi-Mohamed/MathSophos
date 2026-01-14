
import { EducationalLevel, Stream } from "@/lib/enums";

export type Cycle = "COLLEGE" | "LYCEE" | "SUPERIEUR";

export const EDUCATION_SYSTEM = {
  COLLEGE: {
    label: "Collège",
    description: "Enseignement collégial (1ère à 3ème année)",
    levels: [
      { value: EducationalLevel.COLLEGE_1AC, label: "1ère Année Collège (1AC)" },
      { value: EducationalLevel.COLLEGE_2AC, label: "2ème Année Collège (2AC)" },
      { value: EducationalLevel.COLLEGE_3AC, label: "3ème Année Collège (3AC)" },
    ],
  },
  LYCEE: {
    label: "Lycée",
    description: "Enseignement qualifiant (Tronc commun à 2ème Bac)",
    levels: [
      {
        value: EducationalLevel.LYCEE_TC,
        label: "Tronc Commun",
        streams: [
          { value: Stream.TC_SCIENCES, label: "Sciences" },
          { value: Stream.TC_LETTRES, label: "Lettres et Sciences Humaines" },
          { value: Stream.TC_TECHNOLOGIE, label: "Technologie" },
        ]
      },
      {
        value: EducationalLevel.LYCEE_1BAC,
        label: "1ère Année Bac",
        streams: [
          { value: Stream.SC_EXPERIMENTAL, label: "Sciences Expérimentales" },
          { value: Stream.SC_MATH_A, label: "Sciences Mathématiques A" },
          { value: Stream.SC_MATH_B, label: "Sciences Mathématiques B" },
          { value: Stream.SC_ECONOMIE, label: "Sciences Économiques et Gestion" },
          { value: Stream.LETTRES_HUMAINES, label: "Lettres et Sciences Humaines" },
        ]
      },
      {
        value: EducationalLevel.LYCEE_2BAC,
        label: "2ème Année Bac",
        streams: [
          { value: Stream.SC_PHYSIQUE, label: "Sciences Physiques" },
          { value: Stream.SC_VIE_TERRE, label: "Sciences de la Vie et de la Terre" },
          { value: Stream.SC_MATH_A, label: "Sciences Mathématiques A" },
          { value: Stream.SC_MATH_B, label: "Sciences Mathématiques B" },
          { value: Stream.SC_ECONOMIE, label: "Sciences Économiques" },
          { value: Stream.LETTRES_HUMAINES, label: "Lettres et Sciences Humaines" },
        ]
      },
    ],
  },
  SUPERIEUR: {
    label: "Supérieur",
    description: "Enseignement supérieur et universitaire",
    levels: [
      { value: EducationalLevel.UNIVERSITY, label: "Université" },
    ],
    categories: [
      { value: "Analyse", label: "Analyse" },
      { value: "Algebre", label: "Algèbre" },
      { value: "Informatique", label: "Informatique" },
      { value: "Probabilites", label: "Probabilités" },
      { value: "Statistiques", label: "Statistiques" },
      { value: "Physique", label: "Physique" },
    ],
  },
};

export const SEMESTERS = [
  { value: 1, label: "Semestre 1" },
  { value: 2, label: "Semestre 2" },
];
