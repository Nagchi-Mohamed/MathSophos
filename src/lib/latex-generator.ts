/**
 * Converts a PedagogicalSheet object to exact, compile-ready LaTeX code
 * matching the LaTeX specimen structure for Moroccan Mathematics Fiches Pédagogiques.
 */

function cleanTextForLatex(text: string | null | undefined): string {
  if (!text) return ""
  let clean = text
    // Replace common HTML tags with LaTeX commands
    .replace(/<h3>(.*?)<\/h3>/gi, '\\heading{$1}\n')
    .replace(/<h4>(.*?)<\/h4>/gi, '\\sub{$1}\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '\\textbf{$1}')
    .replace(/<b>(.*?)<\/b>/gi, '\\textbf{$1}')
    .replace(/<em>(.*?)<\/em>/gi, '\\textit{$1}')
    .replace(/<i>(.*?)<\/i>/gi, '\\textit{$1}')
    .replace(/<br\s*\/?>/gi, '\\newline ')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<ul[^>]*>/gi, '\\begin{itemize}[leftmargin=*, nosep, topsep=2pt]\n')
    .replace(/<\/ul>/gi, '\\end{itemize}\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '  \\item $1\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

  // Replace multiple blank lines
  clean = clean.replace(/\n{3,}/g, '\n\n')
  return clean.trim()
}

function formatBulletListForLatex(text: string | null | undefined): string {
  if (!text) return ""
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return ""

  let items = lines.map(line => {
    let clean = line.replace(/^[•\-\*]\s*/, '')
    return `  \\item ${cleanTextForLatex(clean)}`
  }).join('\n')

  return `\\begin{itemize}[leftmargin=*, nosep, topsep=2pt]\n${items}\n\\end{itemize}`
}

export function generateLatexForFiche(fiche: any): string {
  const teacherName = fiche.teacherName || "Mohamed Nagchi"
  const schoolName = fiche.schoolName || "Lycée Hassan I"
  const level = fiche.gradeLevel || "Tronc Commun Scientifique et Technique (TCSF)"
  const stream = fiche.stream || ""
  const levelFull = stream ? `${level} (${stream})` : level
  const duration = fiche.duration || "7 heures"
  const subject = fiche.subject || "Mathématiques"
  const schoolYear = fiche.schoolYear || "2025 -- 2026"
  const lessonTitle = fiche.lessonTitle || "Arithmétique dans $\\mathbb{N}$"
  const textbook = fiche.textbook || "Najah"

  const capacitiesList = formatBulletListForLatex(fiche.capacities || "")
  const contentsList = formatBulletListForLatex(fiche.programContents || "")
  const recommendations = cleanTextForLatex(fiche.pedagogicalGuidelines || "")
  const prerequisites = cleanTextForLatex(fiche.prerequisites || "")
  const didacticTools = cleanTextForLatex(fiche.didacticTools || "")

  // Parse sessions/content
  let sessions: any[] = []
  try {
    if (typeof fiche.content === 'string') {
      sessions = JSON.parse(fiche.content)
    } else if (Array.isArray(fiche.content)) {
      sessions = fiche.content
    }
  } catch (e) {
    sessions = []
  }

  // Format longtable rows
  let tableRows = ""

  sessions.forEach((s, idx) => {
    const sessionNum = idx + 1
    const sessionTitle = s.title || s.type || `Séance ${sessionNum}`
    const sessionDur = s.duration || ""

    // Session header row
    tableRows += `
% ----- SÉANCE ${sessionNum} -----
\\rowcolor{primary!12}
\\multicolumn{4}{|l|}{\\sffamily\\bfseries\\color{primary}${sessionTitle} \\hfill\\itshape\\normalfont (${sessionDur})}\\\\
\\hline

\\textbf{Séance ${sessionNum}}\\\\ \\itshape ${sessionDur} &
${cleanTextForLatex(s.demarche || s.content || "")} &
${cleanTextForLatex(s.traceEcrite || s.content || "")} &
${cleanTextForLatex(s.evaluation || s.observations || "")} \\\\
\\hline
`
  })

  const bilanSeq = cleanTextForLatex(fiche.bilanSequence || "")
  const diffObs = cleanTextForLatex(fiche.difficultiesObserved || "")
  const remProp = cleanTextForLatex(fiche.remediationProposed || "")
  const obs = cleanTextForLatex(fiche.observations || "")

  return `\\documentclass[11pt,a4paper]{article}

% ================= PACKAGES =================
\\usepackage{fontspec}
\\usepackage{polyglossia}
\\setdefaultlanguage{french}

\\usepackage{geometry}
\\geometry{left=1.4cm,right=1.4cm,top=2.3cm,bottom=1.8cm,headheight=16pt}

\\usepackage{xcolor}
\\usepackage{tcolorbox}
\\tcbuselibrary{skins,breakable}
\\usepackage{tabularx}
\\usepackage{longtable}
\\usepackage{array}
\\usepackage{booktabs}
\\usepackage{colortbl}
\\usepackage{enumitem}
\\usepackage{amsmath,amssymb}
\\usepackage{microtype}
\\usepackage{fancyhdr}
\\usepackage{lastpage}
\\usepackage{ragged2e}

% ================= POLICES =================
\\setmainfont{TeX Gyre Pagella}
\\setsansfont{TeX Gyre Heros}[Scale=0.95]

% ================= COULEURS =================
\\definecolor{primary}{HTML}{1B3A5C}     % Bleu marine profond
\\definecolor{secondary}{HTML}{0E7C86}   % Teal
\\definecolor{accent}{HTML}{B03A2E}      % Rouge brique
\\definecolor{lightbg}{HTML}{F4F6F8}
\\definecolor{rowalt}{HTML}{EEF3F7}
\\definecolor{linegray}{HTML}{C9D2DC}

% ================= EN-TÊTES / PIEDS =================
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small\\sffamily\\color{primary}\\textbf{${subject}} --- ${stream || level}}
\\fancyhead[C]{\\small\\sffamily\\color{primary}Fiche pédagogique --- ${lessonTitle}}
\\fancyhead[R]{\\small\\sffamily\\color{primary}${teacherName}}
\\fancyfoot[C]{\\small\\sffamily\\color{primary}\\thepage\\,/\\,\\pageref{LastPage}}
\\renewcommand{\\headrulewidth}{0.7pt}
\\renewcommand{\\footrulewidth}{0.3pt}
\\renewcommand{\\headrule}{\\hbox to\\headwidth{\\color{primary}\\leaders\\hrule height \\headrulewidth\\hfill}}
\\renewcommand{\\footrule}{\\hbox to\\headwidth{\\color{linegray}\\leaders\\hrule height \\footrulewidth\\hfill}}

% ================= COMMANDES UTILES =================
\\newcommand{\\heading}[1]{\\textcolor{primary}{\\textbf{#1}}}
\\newcommand{\\sub}[1]{\\textcolor{secondary}{\\textbf{#1}}}
\\newcommand{\\appli}{\\textcolor{accent}{\\textbf{\\textsf{Application}}}}

% ================= STYLES TCOLORBOX =================
\\newtcolorbox{pedabox}[1]{
  enhanced, breakable, arc=1.5mm, boxrule=0.6pt,
  colback=lightbg, colframe=linegray,
  left=8pt, right=8pt, top=9pt, bottom=7pt,
  title={\\sffamily\\bfseries #1},
  coltitle=white, colbacktitle=primary,
  attach boxed title to top left={xshift=8pt, yshift=-\\tcboxedtitleheight/2},
  boxed title style={arc=1mm, boxrule=0pt}
}

\\newtcolorbox{titlebanner}{
  enhanced, colback=primary, colframe=primary, arc=2mm, boxrule=0pt,
  left=12pt, right=12pt, top=10pt, bottom=10pt
}

% ================= DEBUT =================
\\begin{document}

% ============================================================
% 1. BANNIÈRE DE TITRE
% ============================================================
\\begin{titlebanner}
\\begin{center}
{\\color{white}\\sffamily\\Large\\bfseries FICHE PÉDAGOGIQUE}\\\\[3pt]
{\\color{white}\\sffamily\\large ${lessonTitle}}\\\\[4pt]
{\\color{white!80!primary}\\sffamily\\small ${levelFull} \\;$\\bullet$\\; Durée globale : ${duration}}
\\end{center}
\\end{titlebanner}

\\vspace{0.35cm}

% ============================================================
% 2. FICHE TECHNIQUE
% ============================================================
\\begin{pedabox}{Fiche technique}
\\renewcommand{\\arraystretch}{1.25}
\\begin{tabularx}{\\textwidth}{@{}>{\\sffamily\\bfseries\\color{primary}}p{3.1cm} X >{\\sffamily\\bfseries\\color{primary}}p{3.1cm} X@{}}
Professeur       & ${teacherName}                 & Établissement    & ${schoolName} \\\\[2pt]
\\arrayrulecolor{linegray}\\hline\\\\[-6pt]
Niveau           & ${levelFull} & Durée globale & ${duration} \\\\[2pt]
\\hline\\\\[-6pt]
Matière          & ${subject}                  & Année scolaire   & ${schoolYear} \\\\[2pt]
\\hline\\\\[-6pt]
Chapitre         & ${lessonTitle} & Manuel           & ${textbook} \\\\
\\end{tabularx}
\\end{pedabox}

\\vspace{0.25cm}

% ============================================================
% 3. CADRE PÉDAGOGIQUE
% ============================================================
\\begin{pedabox}{Cadre pédagogique}
\\renewcommand{\\arraystretch}{1.25}
\\begin{tabularx}{\\textwidth}{@{}>{\\sffamily\\bfseries\\color{primary}}p{3.6cm} X@{}}
Capacités attendues & 
${capacitiesList || "Non spécifiées"} \\\\[3pt]
\\arrayrulecolor{linegray}\\hline\\\\[-6pt]
Contenus du programme &
${contentsList || "Non spécifiés"} \\\\[3pt]
\\hline\\\\[-6pt]
Recommandations &
${recommendations || "Non spécifiées"} \\\\[3pt]
\\hline\\\\[-6pt]
Prérequis &
${prerequisites || "Non spécifiés"} \\\\[3pt]
\\hline\\\\[-6pt]
Outils didactiques &
${didacticTools || "Tableau, Manuel scolaire, fiches d'activités."} \\\\
\\end{tabularx}
\\end{pedabox}

\\vspace{0.3cm}

% ============================================================
% 4. DÉROULEMENT
% ============================================================
\\begin{center}
{\\large\\sffamily\\bfseries\\color{primary} Déroulement et plan de la séquence}
\\end{center}
\\vspace{0.15cm}

\\arrayrulecolor{linegray}
\\setlength{\\LTleft}{\\fill}
\\setlength{\\LTright}{\\fill}
\\setlength{\\LTcapwidth}{\\textwidth}
\\footnotesize

\\begin{longtable}{|>{\\raggedright\\arraybackslash}p{1.3cm}|>{\\raggedright\\arraybackslash}p{3.8cm}|>{\\raggedright\\arraybackslash}p{7.6cm}|>{\\raggedright\\arraybackslash}p{3.5cm}|}
\\hline
\\rowcolor{primary}
\\color{white}\\sffamily\\bfseries Séance \\& Durée &
\\color{white}\\sffamily\\bfseries Démarche \\& Activités &
\\color{white}\\sffamily\\bfseries Trace écrite (Contenu du cours) &
\\color{white}\\sffamily\\bfseries Évaluation \\\\
\\hline
\\endhead

${tableRows}

\\end{longtable}
\\normalsize

\\vspace{0.35cm}

% ============================================================
% 5. BILAN
% ============================================================
\\begin{pedabox}{Bilan de la séquence}
\\renewcommand{\\arraystretch}{1.6}
\\begin{tabularx}{\\textwidth}{@{}>{\\sffamily\\bfseries\\color{primary}}p{4cm} X@{}}
Bilan de la séquence     & ${bilanSeq} \\\\[4pt]
\\arrayrulecolor{linegray}\\hline\\\\[-8pt]
Difficultés constatées   & ${diffObs} \\\\[4pt]
\\hline\\\\[-8pt]
Remédiation proposée     & ${remProp} \\\\[4pt]
\\hline\\\\[-8pt]
Observations             & ${obs} \\\\
\\end{tabularx}
\\end{pedabox}

\\end{document}
`
}
