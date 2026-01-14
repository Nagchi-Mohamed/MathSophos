/**
 * Strict AI Prompt Templates
 * Enforces high-quality mathematical content generation
 */

export const AGGRESSIVE_MATH_CONTENT_PROTOCOL = `
# **AGGRESSIVE MATH CONTENT GENERATION PROTOCOL**

## **⚠️ NON-NEGOTIABLE FORMATTING RULES:**

### **1. LATEX ENCLOSURE MANDATE:**

\`\`\`
- ALL mathematical expressions MUST use $...$ for inline and $$...$$ for display
- NEVER use \\(...\\) or \\[...\\]
- EVERY SINGLE EQUATION must be enclosed, even simple ones like "-2 + 1.5 + 0.5 = 0"
- WRONG: "Calculons les sommes : * L1: -2 + 3,5 - 1 = 0,5"
- CORRECT: "Calculons les sommes : * L1: $ -2 + 3.5 - 1 = 0.5 $"
- Example: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
\`\`\`

### **1.1. DECIMAL SEPARATOR MANDATE:**

\`\`\`
- Use ONLY periods (.) for decimal points, NEVER commas (,)
- WRONG: 2,1, 0,5, -3,2
- CORRECT: 2.1, 0.5, -3.2
- Example: $ -5.7 + 7.8 = 2.1 $
- Temperature format: $ -3.2^{\\circ}\\text{C} $ NOT $ -3,2^circ C $
\`\`\`

### **2. TABULAR/ARRAY FORMATTING:**

\`\`\`
- Use \\begin{array}{ccc} ... \\end{array} for matrices/tables
- Separate rows with \\\\ and columns with &
- ALWAYS escape backslashes: \\\\\\\\ for new rows
- Remove unnecessary "text" labels inside cells - keep arrays clean
- Use \\text{} for text inside arrays when needed
- WRONG: \\text{Somme Ligne} inside array cell
- BETTER: Just "Somme" or use bold formatting outside array
- Example:

$$

\\begin{array}{|c|c|c|}

\\hline

-2 & 3.5 & -1 \\\\\\\\

\\hline

1.5 & 0 & -1.5 \\\\\\\\

\\hline

\\end{array}

$$

- For bullet lists with equations:

$$

\\begin{array}{l}

\\bullet \\text{ Ligne 1: } (-2 + 3.5 - 1 = 0.5) \\\\\\\\

\\bullet \\text{ Ligne 2: } (1.5 + 0 - 1.5 = 0)

\\end{array}

$$
\`\`\`

### **3. FRACTION AND RADICAL PROTOCOL:**

\`\`\`
- ALWAYS use \\frac{numerator}{denominator}
- NEVER use / for fractions unless in plain text explanation
- Roots: \\sqrt{x} for square, \\sqrt[n]{x} for nth root
- Example: $\\frac{\\sqrt[3]{27}}{2} + \\frac{1}{\\pi}$
\`\`\`

### **4. WHITESPACE AND LINE BREAKS:**

\`\`\`
- Use \\\\\\\\ for forced line breaks inside math environments (ONLY inside $...$ or $$...$$)
- Use \\quad or \\qquad for spacing, NEVER multiple spaces
- Example: $x + y = 5 \\\\\\\\ 2x - y = 1$
- **🚨 ABSOLUTELY FORBIDDEN: NEVER use \\n, \\\\n, or any escaped newline characters**
- **✅ MANDATORY: ALWAYS use REAL NEWLINES (actual line breaks, pressing Enter) in JSON strings**
- **When you need to go to the next line in JSON strings, you MUST press Enter and create a real newline**
- WRONG: "Step 1\\nStep 2" or "Step 1 \\n Step 2" or "$ ... $ \\n $ ... $" or "proof": "... \\n ..."
- CORRECT: Use actual newlines (real line breaks) like this in JSON:
  "proof": "Step 1
  Step 2"
- For multiple LaTeX expressions on separate lines, use REAL NEWLINES (press Enter between them):
  "proof": "$ \\vec{GA} = ... $ 
  $ \\alpha ... $ 
  $ (\\alpha + \\beta) ... $"
- **CRITICAL**: In JSON strings, when you want content on the next line, you MUST:
  1. Close the current line with a quote
  2. Press Enter (create a real newline)
  3. Start the next line
- Example CORRECT format for proof with multiple equations:
  "proof": "En utilisant la relation de Chasles $ \\vec{GA} = \\vec{GM} + \\vec{MA} $ et $ \\vec{GB} = \\vec{GM} + \\vec{MB} $: 
  $ \\alpha (\\vec{GM} + \\vec{MA}) + \\beta (\\vec{GM} + \\vec{MB}) = \\vec{0} \\\\ $ 
  $ (\\alpha + \\beta) \\vec{GM} + \\alpha \\vec{MA} + \\beta \\vec{MB} = \\vec{0} \\\\ $ 
  $ (\\alpha + \\beta) \\vec{MG} = \\alpha \\vec{MA} + \\beta \\vec{MB} \\\\ $"
- **REMEMBER**: JSON allows real newlines inside strings. Use them! Never escape them with \\n
\`\`\`

### **5. SPECIAL CHARACTER HANDLING:**

\`\`\`
- Greek letters: \\alpha, \\beta, \\gamma, \\Delta, \\Omega
- Operators: \\times, \\cdot, \\div, \\pm, \\mp
- Relations: \\leq, \\geq, \\neq, \\approx, \\equiv
- Sets: \\subset, \\subseteq, \\cup, \\cap, \\emptyset, \\mathbb{R}, \\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{C}
- DIDACTIC STYLING (Optional but recommended for steps):
  - Use \\cancel{expression} to show cancellation: \\frac{\\cancel{x}y}{\\cancel{x}}
  - Use \\textcolor{red}{text} to highlight changes: 2x + \\textcolor{red}{5} = \\textcolor{red}{5}
- Example: $\\alpha \\cdot \\beta \\leq \\pi \\times \\sqrt{2} \\quad \\forall x \\in \\mathbb{R}$
\`\`\`

### **5.1. INDEX NOTATION (CRITICAL FOR MATHJAX):**

\`\`\`
- **ALL indices MUST be enclosed in braces {} for proper MathJax rendering**
- WRONG: k_i, x_n, a_{n+1} (missing braces for single character indices)
- CORRECT: k_{i}, x_{n}, a_{n+1} (braces for ALL indices)
- Single character indices: k_{i}, x_{j}, u_{n}
- Multi-character indices: x_{n+1}, a_{i,j}, f_{n-1}
- **Rule**: If it's an index/subscript, it MUST be in braces: _{...}
- Examples:
  - WRONG: $k_i = k_{i-1} + 1$ (first k_i missing braces)
  - CORRECT: $k_{i} = k_{i-1} + 1$
  - WRONG: $u_n = 2u_{n-1}$ (first u_n missing braces)
  - CORRECT: $u_{n} = 2u_{n-1}$
  - WRONG: $x_i, y_j, z_k$ (all missing braces)
  - CORRECT: $x_{i}, y_{j}, z_{k}$
\`\`\`

### **6. FUNCTION NAMES:**

\`\`\`
- Use \\sin, \\cos, \\tan, \\log, \\ln, \\exp
- NEVER write sin, cos, etc. without backslash
- Example: $\\sin^2(x) + \\cos^2(x) = 1$
\`\`\`

### **7. PARENTHESES SCALING:**

\`\`\`
- Use \\left( ... \\right) for automatic sizing
- Similarly for brackets: \\left[ ... \\right], \\left\\{ ... \\right\\}
- Example: $\\left(\\frac{a}{b}\\right)^2 = \\frac{a^2}{b^2}$
\`\`\`

## **📋 CONTENT STRUCTURE TEMPLATES:**

### **LESSON TEMPLATE:**

\`\`\`
**Lesson Title: [Title]**

**Objective:** [Clear statement]

**Content:**

$$

\\begin{array}{l}

\\text{1. Introduction:} \\\\\\\\

\\quad \\text{• Key concept: } [concept] \\\\\\\\

\\quad \\text{• Formula: } $ [formula] $ \\\\\\\\

\\\\[8pt]

\\text{2. Derivation/Explanation:} \\\\\\\\

\\quad [Step-by-step with proper Latex]

\\end{array}

$$

**Key Formula Box:**

$$

\\boxed{[Main formula here]}

$$
\`\`\`

### **EXERCISE TEMPLATE:**

\`\`\`
**Exercise [Number]: [Topic]**

**Question:**

$$

\\begin{array}{l}

\\text{Given: } [given information] \\\\\\\\

\\text{Find: } [what to find] \\\\\\\\

\\end{array}

$$

**Working Area:**

$$

\\begin{array}{rcl}

\\text{Step 1:} & & [space] \\\\\\\\

\\text{Step 2:} & & [space] \\\\\\\\

\\text{Step 3:} & & [space]

\\end{array}

$$

**Answer:** $\\boxed{[Final answer]}$
\`\`\`

### **EXAM TEMPLATE:**

\`\`\`
**Part A: Multiple Choice**

1. Question: [text]

   A) $ [option1] $ 

   B) $ [option2] $

   C) $ [option3] $

   D) $ [option4] $

**Part B: Problem Solving**

$$

\\begin{array}{l}

\\text{Problem: } [problem statement with Latex] \\\\\\\\

\\text{Solution:} \\\\\\\\

\\quad [step-by-step solution]

\\end{array}

$$
\`\`\`

## **🚨 SANITY CHECK BEFORE OUTPUT:**

\`\`\`
1. Are ALL math expressions in $...$ or $$...$$?
2. Are ALL backslashes escaped properly?
3. Are tables using \\begin{array} with proper \\\\\\\\ for line breaks?
4. Are fractions using \\frac{}{}?
5. Are function names preceded with backslash (\\sin, \\log)?
6. Are ALL decimals using periods (.) NOT commas (,)?
7. Is EVERY equation enclosed, even simple ones?
8. Are arrays clean without verbose "text" labels?
9. Is temperature format correct: $ ^{\\circ}\\text{C} $?
10. Are ALL newlines in JSON strings REAL NEWLINES (actual line breaks), NOT \\n or \\\\n?
11. Are ALL indices in braces: k_{i}, x_{n}, u_{n+1} (NOT k_i, x_n)?
12. Is output copy-paste ready for MathJax?
\`\`\`

## **⚠️ CRITICAL FIXES REQUIRED - COMMON ERRORS:**

\`\`\`
WARNING: Previous outputs had these errors that MUST be corrected:

1. **DECIMAL SEPARATOR VIOLATION:**
   - Used commas (,) for decimals: "2,1", "0,5" ← THIS IS WRONG
   - FORCE: Use ONLY periods (.) for decimal points
   - CORRECT: 2.1, 0.5, 7.3
   - Example: $ -5.7 + 7.8 = 2.1 $

2. **INCOMPLETE MATH ENCLOSURE:**
   - Some expressions lack proper enclosure
   - WRONG: "Calculons les sommes : * L1: -2 + 3,5 - 1 = 0,5"
   - CORRECT: "Calculons les sommes : * L1: $ -2 + 3.5 - 1 = 0.5 $"
   - EVERY SINGLE EQUATION must be in $ ... $

3. **ARRAY FORMAT IMPROVEMENT:**
   - Remove "text" from array headers for cleaner formatting
   - WRONG: \\text{Somme Ligne}
   - BETTER: Just "Somme" or use bold formatting outside array

4. **TEMPERATURE FORMAT:**
   - Write as $ -3.2^{\\circ}\\text{C} $ not $ -3,2^circ C $

5. **BULLET FORMAT:**
   - Use proper LaTeX spacing with \\text{} for labels:
   $$
   \\begin{array}{l}
   \\bullet \\text{ Ligne 1: } (-2 + 3.5 - 1 = 0.5) \\\\\\\\
   \\bullet \\text{ Ligne 2: } (1.5 + 0 - 1.5 = 0)
   \\end{array}
   $$

YOU MUST CORRECT THESE IN ALL FUTURE OUTPUTS. IF YOU USE COMMAS FOR DECIMALS AGAIN, THE CONTENT WILL BE UNUSABLE.
\`\`\`

## **❌ ABSOLUTELY FORBIDDEN:**

- Raw LaTeX without $...$ or $$...$$
- \\(...\\) delimiters
- Unsized parentheses for large expressions
- Plain text function names (sin, cos, log)
- Inconsistent line break formatting
- **COMMAS (,) FOR DECIMALS** - Use ONLY periods (.) for decimal points
- **UNENCLOSED EQUATIONS** - Every single equation must be in $ ... $ or $$ ... $$
- **VERBOSE ARRAY HEADERS** - Remove unnecessary "text" labels inside array cells
- **🚨 ESCAPED NEWLINES (\\n, \\\\n)** - NEVER use \\n or \\\\n in JSON strings. ALWAYS use REAL NEWLINES (press Enter)

## **✅ EXAMPLE OF PERFECT OUTPUT:**

\`\`\`
Voici les solutions détaillées pour chaque problème :

1. **Calculs de sommes et différences :**

   a) $ (-4.2) + (+7.8) + (-1.5) = (-4.2 - 1.5) + 7.8 = -5.7 + 7.8 = 2.1 $

   b) $ (+10) - (-3.5) + (-6.2) = 10 + 3.5 - 6.2 = 13.5 - 6.2 = 7.3 $

   c) $ -5.1 - 2.9 + 8.3 - (-1.7) = -5.1 - 2.9 + 8.3 + 1.7 = (-5.1 - 2.9) + (8.3 + 1.7) = -8 + 10 = 2 $

2. **Calcul de la température à Ifrane :**

   Température initiale : $ -3.2^{\\circ}\\text{C} $

   Augmentation à midi : $ +8.5^{\\circ}\\text{C} $

   Baisse à 18h : $ -4.7^{\\circ}\\text{C} $

   Température à 18h : $ -3.2 + 8.5 - 4.7 $

   $ -3.2 + 8.5 = 5.3 $

   $ 5.3 - 4.7 = 0.6 $

   La température à Ifrane à 18h est $ 0.6^{\\circ}\\text{C} $.

3. **Tableau et vérification :**

   $$

   \\begin{array}{|c|c|c|}

   \\hline

   -2 & 3.5 & -1 \\\\\\\\

   \\hline

   1.5 & 0 & -1.5 \\\\\\\\

   \\hline

   0.5 & -3.5 & 2 \\\\\\\\

   \\hline

   \\end{array}

   $$

   **Calcul des sommes :**

   $$

   \\begin{array}{l}

   \\bullet \\text{Ligne 1: } (-2 + 3.5 - 1 = 0.5) \\\\\\\\

   \\bullet \\text{Ligne 2: } (1.5 + 0 - 1.5 = 0) \\\\\\\\

   \\bullet \\text{Ligne 3: } (0.5 - 3.5 + 2 = -1) \\\\\\\\

   \\bullet \\text{Colonne 1: } (-2 + 1.5 + 0.5 = 0) \\\\\\\\

   \\bullet \\text{Colonne 2: } (3.5 + 0 - 3.5 = 0) \\\\\\\\

   \\bullet \\text{Colonne 3: } (-1 - 1.5 + 2 = -0.5) \\\\\\\\

   \\bullet \\text{Diagonale: } (-2 + 0 + 2 = 0)

   \\end{array}

   $$

   Les sommes ne sont pas égales, donc ce n'est **pas** un carré magique.
\`\`\`

## **🔧 TECHNICAL NOTES FOR YOUR APP:**

1. This format is **MathJax-ready**
2. All line breaks are explicitly marked with \\\\\\\\
3. Tables will render properly with borders
4. Fractions, radicals, and matrices will display correctly
5. No ambiguous spacing or formatting

---

**VIOLATION OF THESE RULES WILL RESULT IN UNRENDERABLE CONTENT. FOLLOW STRICTLY.**

---

## **⚠️ FINAL REMINDER - CRITICAL FOR RENDERING:**

**IMPORTANT: MathJax can only render content inside $ ... $ or $$ ... $$.**

**If you write math without these delimiters, it will appear as plain text in the app.**

**Always use $ for inline math and $$ for displayed math.**

**Use . for decimals, not ,.**

🚫 ABSOLUTELY FORBIDDEN - NEVER INCLUDE:
- Nonsense words: "uéglin", "teintze", "Vivérification", "Établissement", "cognatrice"
- Garbage text: "S_3 e 1", "Slim", "SDf", "equitimptique", "Extra-close branc"
- Incorrect syntax: "\\ln(ab) = \\ln(a + b)\\ln(b)" (THIS IS MATHEMATICALLY WRONG)
- Incomplete expressions
- Repeated meaningless phrases
- Malformed LaTeX: "\\frac{5-\\frac{5+\\frac{5+8}4" (unbalanced braces)

✅ REQUIRED FORMAT:
- Mathematical expressions: Use \\latex{expression} for ALL math
- Proper French mathematical terminology
- Clear, logical step-by-step explanations
- Complete examples with verified solutions
- Balanced braces in ALL LaTeX expressions

📝 CORRECT MATHEMATICAL SYNTAX EXAMPLES:

CORRECT: "La fonction logarithme népérien est définie pour \\latex{x > 0}"
CORRECT: "\\latex{\\lim_{x \\to +\\infty} \\ln x = +\\infty}"
CORRECT: "\\latex{\\log_a x = \\frac{\\ln x}{\\ln a}}"
CORRECT: "\\latex{\\ln(ab) = \\ln a + \\ln b}"

❌ EXAMPLES OF UNACCEPTABLE CONTENT:
BAD: "uéglin(teintze) Vrac(ln x)(ln a) S_3 e 1"
BAD: "Slim(x to +\\ln(nx)) \\ln x = -\\ln(nx)"
BAD: "\\ln(ab) = \\ln(a + b)\\ln(b)" (MATHEMATICALLY INCORRECT!)
BAD: "Extra-close branc or missing open brace"
BAD: "\\frac{5-\\frac{5+\\frac{5+8}4" (UNBALANCED BRACES!)

CONTENT QUALITY VALIDATION:
1. Every mathematical statement must be verifiably correct
2. All steps in proofs must be logically sound
3. Examples must have complete, accurate solutions
4. No placeholder text, no nonsense words
5. All LaTeX must have balanced braces

YOUR CONTENT WILL BE AUTOMATICALLY REJECTED IF IT CONTAINS ANY OF THE FORBIDDEN ELEMENTS.
`;

export const STRICT_MATH_LESSON_PROMPT = `
${AGGRESSIVE_MATH_CONTENT_PROTOCOL}

CRITICAL INSTRUCTIONS - READ CAREFULLY:

YOU MUST FOLLOW THESE RULES EXACTLY OR CONTENT WILL BE REJECTED:

🚫 ABSOLUTELY FORBIDDEN - NEVER INCLUDE:
- Nonsense words: "uéglin", "teintze", "Vivérification", "Établissement", "cognatrice"
- Garbage text: "S_3 e 1", "Slim", "SDf", "equitimptique", "Extra-close branc"
- Incorrect syntax: "\\ln(ab) = \\ln(a + b)\\ln(b)" (THIS IS MATHEMATICALLY WRONG)
- Incomplete expressions
- Repeated meaningless phrases
- Malformed LaTeX: "\\frac{5-\\frac{5+\\frac{5+8}4" (unbalanced braces)

✅ REQUIRED FORMAT:
- Mathematical expressions: Use \\latex{expression} for ALL math
- Proper French mathematical terminology
- Clear, logical step-by-step explanations
- Complete examples with verified solutions
- Balanced braces in ALL LaTeX expressions

📝 CORRECT MATHEMATICAL SYNTAX EXAMPLES:

CORRECT: "La fonction logarithme népérien est définie pour \\latex{x > 0}"
CORRECT: "\\latex{\\lim_{x \\to +\\infty} \\ln x = +\\infty}"
CORRECT: "\\latex{\\log_a x = \\frac{\\ln x}{\\ln a}}"
CORRECT: "\\latex{\\ln(ab) = \\ln a + \\ln b}"

❌ EXAMPLES OF UNACCEPTABLE CONTENT:
BAD: "uéglin(teintze) Vrac(ln x)(ln a) S_3 e 1"
BAD: "Slim(x to +\\ln(nx)) \\ln x = -\\ln(nx)"
BAD: "\\ln(ab) = \\ln(a + b)\\ln(b)" (MATHEMATICALLY INCORRECT!)
BAD: "Extra-close branc or missing open brace"
BAD: "\\frac{5-\\frac{5+\\frac{5+8}4" (UNBALANCED BRACES!)

CONTENT QUALITY VALIDATION:
1. Every mathematical statement must be verifiably correct
2. All steps in proofs must be logically sound
3. Examples must have complete, accurate solutions
4. No placeholder text, no nonsense words
5. All LaTeX must have balanced braces

YOUR CONTENT WILL BE AUTOMATICALLY REJECTED IF IT CONTAINS ANY OF THE FORBIDDEN ELEMENTS.
`;

export const STRICT_EXERCISE_PROMPT = `
${AGGRESSIVE_MATH_CONTENT_PROTOCOL}

CRITICAL INSTRUCTIONS FOR EXERCISE GENERATION:

🚫 ABSOLUTELY FORBIDDEN:
- Nonsense text or garbage characters
- Mathematically incorrect statements
- Incomplete LaTeX expressions
- Unbalanced braces in LaTeX
- Generic exercises not aligned with Moroccan curriculum

✅ REQUIRED:
- Use \\latex{...} for ALL mathematical expressions
- Verify all mathematical statements are correct
- Ensure all LaTeX has balanced braces
- Provide complete, accurate solutions
- Exercises MUST be relevant to the Moroccan curriculum for the specified grade level
- Use appropriate difficulty level for the grade
- Include real-world applications when possible
- Solutions must be step-by-step and educational

📊 CRITICAL RULES FOR VARIATION TABLES (MANDATORY):
🚫 NEVER USE:
- 'tabular' environment - ONLY use 'array'
- Markdown tables (| ... | ... |) for variation tables
- f'(α) or f'(\\alpha) - ALWAYS use f'(x)
- α alone in f(x) row - ALWAYS use f(α) or f(\\alpha)
- ∞ and + in separate columns - ALWAYS use +∞ in single column
- Missing variation arrows (\\searrow and \\nearrow)

✅ MANDATORY STANDARD FORMAT for variation tables:
Use EXCLUSIVELY this format in a $$...$$ block:

$$
\\begin{array}{|c|c|c|c|c|c|}
\\hline
x & 0 & & \\alpha & & +\\infty \\\\
\\hline
f'(x) & & - & 0 & + & \\\\
\\hline
f(x) & +\\infty & \\searrow & f(\\alpha) & \\nearrow & +\\infty \\\\
\\hline
\\end{array}
$$

MANDATORY STRUCTURE:
- Environment: \\begin{array}{|c|c|c|c|c|c|} ... \\end{array}
- Horizontal lines: \\hline after each data row
- Columns: 6 columns (x, 0, empty, α, empty, +∞)
- f'(x) row: Must have f'(x) (NEVER f'(α)), then -, 0, + in correct columns
- f(x) row: Must have +∞, \\searrow, f(\\alpha), \\nearrow, +∞
- Empty cells: Use & & to create empty cells between important values

EXAMPLE CORRECT FORMAT FOR MOROCCAN CURRICULUM:
{
  "problemText": "Résoudre l'équation \\latex{\\ln(x^2) - 5\\ln x + 2 = 0}",
  "solution": "1. On pose \\latex{Y = \\ln x}. L'équation devient \\latex{2Y^2 - 5Y + 2 = 0}\\n2. Le discriminant est \\latex{\\Delta = 25 - 16 = 9}\\n3. Les solutions sont \\latex{Y_1 = \\frac{5+3}{4} = 2} et \\latex{Y_2 = \\frac{5-3}{4} = \\frac{1}{2}}\\n4. Donc \\latex{x = e^2} ou \\latex{x = e^{1/2} = \\sqrt{e}}",
  "hints": ["Utilisez le changement de variable \\latex{Y = \\ln x}", "Résolvez l'équation quadratique en Y"],
  "difficulty": "medium"
}
`;

export const STRICT_EXAM_EXERCISE_PROMPT = `
${AGGRESSIVE_MATH_CONTENT_PROTOCOL}

CRITICAL INSTRUCTIONS - READ CAREFULLY - EXAM-STYLE EXERCISES:

YOU MUST FOLLOW THESE RULES EXACTLY OR CONTENT WILL BE REJECTED:

🚫 ABSOLUTELY FORBIDDEN - NEVER INCLUDE:
- Nonsense words: "uéglin", "teintze", "Vivérification", "Établissement", "cognatrice"
- Garbage text: "S_3 e 1", "Slim", "SDf", "equitimptique", "Extra-close branc"
- Incorrect syntax: "\\ln(ab) = \\ln(a + b)\\ln(b)" (THIS IS MATHEMATICALLY WRONG)
- Incomplete expressions
- Repeated meaningless phrases
- Malformed LaTeX: "\\frac{5-\\frac{5+\\frac{5+8}4" (unbalanced braces)
- Single isolated questions without context

✅ REQUIRED FORMAT - REAL EXAM PROBLEM:
- Generate a COMPLETE EXAM-STYLE EXERCISE with 5 to 12 RELATED QUESTIONS
- All questions stem from a single realistic problem (real-world context)
- Provide complete, verified solutions for ALL questions
- Balanced braces in ALL LaTeX expressions
- Proper French mathematical terminology
- Clear, logical progression from easier to harder questions

📊 CRITICAL RULES FOR VARIATION TABLES (MANDATORY):
🚫 NEVER USE:
- 'tabular' environment - ONLY use 'array'
- Markdown tables (| ... | ... |) for variation tables
- f'(α) or f'(\\alpha) - ALWAYS use f'(x)
- α alone in f(x) row - ALWAYS use f(α) or f(\\alpha)
- ∞ and + in separate columns - ALWAYS use +∞ in single column
- Missing variation arrows (\\searrow and \\nearrow)

✅ MANDATORY STANDARD FORMAT for variation tables:
Use EXCLUSIVELY this format in a $$...$$ block:

$$
\\begin{array}{|c|c|c|c|c|c|}
\\hline
x & 0 & & \\alpha & & +\\infty \\\\
\\hline
f'(x) & & - & 0 & + & \\\\
\\hline
f(x) & +\\infty & \\searrow & f(\\alpha) & \\nearrow & +\\infty \\\\
\\hline
\\end{array}
$$

MANDATORY STRUCTURE:
- Environment: \\begin{array}{|c|c|c|c|c|c|} ... \\end{array}
- Horizontal lines: \\hline after each data row
- Columns: 6 columns (x, 0, empty, α, empty, +∞)
- f'(x) row: Must have f'(x) (NEVER f'(α)), then -, 0, + in correct columns
- f(x) row: Must have +∞, \\searrow, f(\\alpha), \\nearrow, +∞
- Empty cells: Use & & to create empty cells between important values

✅ CONTENT QUALITY VALIDATION:
1. Every mathematical statement must be verifiably correct
2. All steps in proofs must be logically sound
3. Solutions must be complete and accurate
4. No placeholder text, no nonsense words
5. All LaTeX must have balanced braces
6. Exercise must match Moroccan curriculum
7. Problem must be realistic with real-world context
8. Variation tables MUST use the standard format specified above

📝 STRUCTURE - REAL EXAM EXERCISE:
The exercise must have:
1. An INTRODUCTION with a realistic scenario (production, population, physics, etc.)
2. A mathematical setup with definitions of variables
3. 5-12 numbered questions of increasing difficulty:
   - Questions 1-2: Application directe (basic calculations)
   - Questions 3-4: Analyse et raisonnement
   - Questions 5-7: Problèmes et démonstrations
   - Questions 8-12: Synthèse et applications avancées (if present)
4. Complete solutions for each question
5. Clear mathematical justifications

📝 CORRECT EXAM-STYLE EXERCISE EXAMPLE:

{
  "title": "Production industrielle et suites géométriques",
  "problemText": "Une entreprise fabrique des composants électroniques. La production mensuelle initiale est de 1000 pièces. Suite à des améliorations technologiques, la production augmente de 5% chaque mois. De plus, pour compenser la demande croissante, l'entreprise ajoute 50 pièces supplémentaires chaque mois à la production totale. On note $u_n$ le nombre de pièces produites le $n$-ième mois, avec $u_0 = 1000$.",
  "questions": [
    {
      "number": 1,
      "text": "Écrivez la relation de récurrence liant $u_{n+1}$ et $u_n$.",
      "solution": "Selon l'énoncé, la production augmente de 5%, donc elle est multipliée par 1.05. Ensuite, on ajoute 50 pièces. Donc : $u_{n+1} = 1.05 \\times u_n + 50$"
    },
    {
      "number": 2,
      "text": "Calculez $u_1$ et $u_2$.",
      "solution": "$u_1 = 1.05 \\times 1000 + 50 = 1050 + 50 = 1100$ pièces\\n$u_2 = 1.05 \\times 1100 + 50 = 1155 + 50 = 1205$ pièces"
    },
    {
      "number": 3,
      "text": "Montrez que la suite $(u_n)$ est croissante.",
      "solution": "On calcule $u_{n+1} - u_n = (1.05 u_n + 50) - u_n = 0.05 u_n + 50$. Puisque $u_n > 0$ pour tout $n$, on a $u_{n+1} - u_n > 0$, donc la suite est croissante."
    },
    {
      "number": 4,
      "text": "La production peut-elle rester bornée ? Justifiez votre réponse.",
      "solution": "La suite est croissante et satisfait $u_{n+1} = 1.05 u_n + 50$ avec coefficient 1.05 > 1. Comme $u_0 = 1000 > 0$, la suite tend vers l'infini. Donc la production n'est pas bornée."
    },
    {
      "number": 5,
      "text": "On cherche une suite auxiliaire. Posez $v_n = u_n - L$ où $L$ est une constante. Trouvez la valeur de $L$ telle que $(v_n)$ soit géométrique.",
      "solution": "$v_{n+1} = u_{n+1} - L = 1.05 u_n + 50 - L = 1.05(u_n - L) + 1.05 L + 50 - L = 1.05 v_n + 0.05 L + 50$. Pour que $(v_n)$ soit géométrique, il faut $0.05 L + 50 = 0$, donc $L = -1000$."
    },
    {
      "number": 6,
      "text": "Avec $v_n = u_n - (-1000) = u_n + 1000$, écrivez l'expression générale de $v_n$.",
      "solution": "Puisque $v_{n+1} = 1.05 v_n$ et $v_0 = u_0 + 1000 = 1000 + 1000 = 2000$, la suite $(v_n)$ est géométrique de raison 1.05. Donc $v_n = 2000 \\times (1.05)^n$."
    },
    {
      "number": 7,
      "text": "Déduisez l'expression générale de $u_n$ en fonction de $n$.",
      "solution": "Puisque $u_n = v_n - 1000$, on a $u_n = 2000 \\times (1.05)^n - 1000$."
    }
  ],
  "difficulty": "MEDIUM",
  "hints": ["Commencez par identifier le coefficient multiplicatif et le terme constant", "Pour la suite auxiliaire, cherchez l'équilibre : $L = 1.05 L + 50$", "Rappelez-vous que si $v_{n+1} = r v_n$, alors $v_n = v_0 \\times r^n$"]
}

❌ EXAMPLES OF UNACCEPTABLE CONTENT:
BAD: "uéglin(teintze) Vrac(ln x)(ln a) S_3 e 1"
BAD: "Slim(x to +\\ln(nx)) \\ln x = -\\ln(nx)"
BAD: "\\ln(ab) = \\ln(a + b)\\ln(b)" (MATHEMATICALLY INCORRECT!)
BAD: "Extra-close branc or missing open brace"
BAD: Single question without context

YOUR CONTENT WILL BE AUTOMATICALLY REJECTED IF IT CONTAINS ANY OF THE FORBIDDEN ELEMENTS.
`;
