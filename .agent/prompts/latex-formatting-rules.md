# STRICT LaTeX FORMATTING RULES FOR AI CONTENT GENERATION

## CRITICAL RULES - MUST FOLLOW EXACTLY

### 1. DELIMITER RULES
```
✅ ACCEPTABLE:
- $expression$                 (inline math)
- $$expression$$               (display math)
- \(expression\)               (inline math - alternative)
- \[expression\]               (display math - alternative)

❌ FORBIDDEN:
- $ expression $               (NO spaces after/before $)
- | $something$ |              (NO math inside table with pipes)
- Mixed $and\( delimiters      (NO mixing styles)
```

### 2. TABLE FORMATTING - ABSOLUTE RULES

```markdown
# ❌ WRONG - NEVER DO THIS:
| $ | q | < 1$ |
| $a$ | $b$ | $c$ |

# ✅ CORRECT - ALWAYS DO THIS:
| Expression | Condition | Result |
|---|---|---|
| $\sum_{n=0}^{\infty} q^n$ | $|q| < 1$ | Converges |

# ABSOLUTE RULE: Complete expressions in single cells only
```

### 3. COMPLETE EXPRESSIONS ONLY
```
❌ WRONG:
- $f(x) = 
- $\sum_{n=0}^{
- $|q| < 1$ and $

✅ CORRECT:
- $f(x) = x^2 + 3x - 5$
- $\sum_{n=0}^{\infty} \frac{1}{n^2}$
- Condition: $|q| < 1$ and $q \in \mathbb{R}$
```

### 4. SPACING RULES
```
❌ WRONG:  $  x + y  $          (spaces inside delimiters)
✅ CORRECT: $x+y$               (no spaces inside math)
✅ CORRECT: La valeur est $x$.  (normal text spacing)
```

## SPECIFIC TEMPLATES

### Geometric Series Table
```markdown
| Expression | Condition | Convergence | Sum Formula |
|---|---|---|---|
| $\sum_{n=0}^{\infty} q^n$ | $|q| < 1$ | Converges | $\frac{1}{1-q}$ |
| $\sum_{n=1}^{\infty} q^n$ | $|q| < 1$ | Converges | $\frac{q}{1-q}$ |
| $\sum_{n=k}^{\infty} q^n$ | $|q| < 1$ | Converges | $\frac{q^k}{1-q}$ |
| Any geometric series | $|q| \geq 1$ | Diverges | - |
```

### Equations
```markdown
For a quadratic equation: $ax^2 + bx + c = 0$

The solutions are:
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

Where:
- $a$, $b$, $c$ are real coefficients
- $a \neq 0$
```

### Piecewise Functions
```markdown
The absolute value function:
$$
f(x) = \begin{cases}
x & \text{if } x \geq 0 \\
-x & \text{if } x < 0
\end{cases}
$$
```

## VALIDATION CHECKLIST

BEFORE OUTPUTTING, VERIFY:
1. ✅ All math expressions are complete: $ starts and ends in same logical unit
2. ✅ No math expressions are split across table cells
3. ✅ All { have matching }
4. ✅ All \begin have matching \end
5. ✅ No spaces between $ and the expression: CORRECT: $x$, WRONG: $ x $
6. ✅ Tables: LaTeX only in cell content, not in | separators
7. ✅ No mixing of $ $ and \( \) delimiters in same document
8. ✅ All underscores in text are escaped: \_
9. ✅ All dollar signs in text are escaped: \$
10. ✅ Complex expressions use display math $$ on separate lines

## FAILURE EXAMPLES TO AVOID

```
❌ | $ | q | < 1$ |           ← SPLIT ACROSS CELLS
❌ $ incomplete expression     ← NO MATCHING $
❌ {a^2 + b^2 = c^2           ← MISSING }
❌ \begin{cases} x & if x>0   ← NO \end
❌ | $x$ | $y$ | $z$ |        ← MATH IN PIPE SEPARATORS
```

## PROMPT TEMPLATE

Use this exact structure when generating content:

```markdown
You are a mathematics content generator. Generate content with perfect LaTeX formatting for MathJax rendering.

STRICT FORMATTING RULES - DO NOT DEVIATE:

1. MATH DELIMITERS:
   - Use $expression$ for inline math
   - Use $$expression$$ for display math (own line)
   - NO spaces: "$x$" ✓ | "$ x $" ✗
   - NO mixing with \(\) - choose one style

2. TABLES:
   - Structure: | Header | Header |
                |--------|--------|
                | Cell   | Cell   |
   - LaTeX ONLY inside cells: | Description | $E = mc^2$ |
   - NEVER: | $E$ | $=$ | $mc^2$ | ← SPLIT EXPRESSION
   - ALWAYS: | Equation | $E = mc^2$ | ← COMPLETE IN ONE CELL

3. COMPLETENESS:
   - Every $ opened must close
   - Every { must have }
   - Every \begin must have \end
   - NO line breaks inside expressions

4. SPECIAL CHARACTERS IN TEXT:
   - Underscore: a\_b not a_b
   - Dollar: price: \$10 not $10
   - Braces: set \\{1,2,3\\} not {1,2,3}

5. VERIFICATION:
   - Count $: must be even
   - Check table cells: one complete expression per cell
   - Ensure no math in | separators

EXAMPLE CORRECT OUTPUT:
The quadratic formula: $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

| Series | Condition | Sum |
|---|---|---|
| Geometric | $|q| < 1$ | $\frac{1}{1-q}$ |
| Harmonic | - | Diverges |

CRITICAL: Your output will be automatically rejected if it contains:
1. Math expressions split across table cells
2. Unmatched delimiters ($, {, \begin, etc.)
3. LaTeX inside | characters in markdown tables
4. Spaces between $ and expression

Now generate content about: [TOPIC]
```

## ENFORCEMENT

Your output MUST pass these checks:
- `/\$[^$]*?\$/g` must find complete pairs
- `/\\begin\{[^}]+\}/` must have matching `\\end`
- No instances of `/\|.*?\$.*?\$/` inside table rows

Non-compliant output will cause rendering failures.
