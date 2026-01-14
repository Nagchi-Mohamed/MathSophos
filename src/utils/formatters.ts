export const formatLevel = (level: string): string => {
  const map: Record<string, string> = {
    PRIMAIRE_1: "1ère Année Primaire",
    PRIMAIRE_2: "2ème Année Primaire",
    PRIMAIRE_3: "3ème Année Primaire",
    PRIMAIRE_4: "4ème Année Primaire",
    PRIMAIRE_5: "5ème Année Primaire",
    PRIMAIRE_6: "6ème Année Primaire",
    COLLEGE_1AC: "1ère Année Collège",
    COLLEGE_2AC: "2ème Année Collège",
    COLLEGE_3AC: "3ème Année Collège",
    LYCEE_TC: "Tronc Commun",
    LYCEE_1BAC: "1ère Bac",
    LYCEE_2BAC: "2ème Bac",
    UNIVERSITY: "Université",
  };
  return map[level] || level;
};

export const formatStream = (stream: string): string | null => {
  if (stream === "NONE") return null;
  const map: Record<string, string> = {
    TC_LETTRES: "Lettres",
    TC_SCIENCES: "Sciences",
    TC_TECHNOLOGIE: "Technologie",
    SC_MATH_A: "Sc. Math A",
    SC_MATH_B: "Sc. Math B",
    SC_EXPERIMENTAL: "Sc. Expérimentales",
    SC_PHYSIQUE: "Sc. Physiques",
    SC_VIE_TERRE: "SVT",
    SC_ECONOMIE: "Sc. Économiques",
    LETTRES_HUMAINES: "Lettres & Sc. Humaines",
  };
  return map[stream] || stream;
};
