# Guide d'Utilisation LaTeX pour MathSophos

Ce guide explique comment utiliser la notation LaTeX pour créer du contenu mathématique dans MathSophos (leçons, exercices, et réponses AI).

## Règles de Base

1. **Délimiteurs** :
    - Inline (dans le texte) : `$ ... $` (ex: $a^2 + b^2 = c^2$)
    - Block (centré) : `$$ ... $$`

2. **Commandes Mathématiques** :
    - Fractions : `\frac{a}{b}` -> $\frac{a}{b}$
    - Puissances : `x^2`
    - Indices : `x_i`
    - Racines : `\sqrt{x}`
    - Intégrales : `\int_{a}^{b} f(x) dx`
    - Sommes : `\sum_{i=0}^{n} i`

3. **Symboles Spéciaux** :
    - $\alpha, \beta, \gamma, \delta$ (`\alpha, \beta, \gamma, \delta`)
    - $\infty$ (`\infty`)
    - $\in, \subset, \cup, \cap$ (`\in, \subset, \cup, \cap`)

## Exemples Complexes

### Matrice

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$

### Système d'équations

$$
\begin{cases}
2x + y = 10 \\
x - y = 2
\end{cases}
$$

## Bonnes Pratiques

- **Espaces** : LaTeX gère les espaces automatiquement en mode mathématique. Utilisez `\quad` pour forcer un espace.
- **Texte dans les maths** : Utilisez `\text{mot}` pour écrire du texte normal au milieu d'une formule.
- **Accolades** : Si vos exposants ou indices ont plus d'un caractère, entourez-les d'accolades `{}`. Ex: `e^{2x}`.
