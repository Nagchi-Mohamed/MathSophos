/**
 * Complete examples for manual content creation
 * These examples demonstrate proper formatting with LaTeX, markdown, and structure
 */

export const LESSON_EXAMPLE = `## 1. Introduction

L'analyse fonctionnelle est une branche des mathématiques qui étudie les espaces vectoriels munis d'une structure topologique, généralement induite par une norme. Elle généralise les concepts de distance, de convergence et de continuité des espaces euclidiens de dimension finie aux espaces de fonctions et autres espaces vectoriels de dimension infinie. Ce chapitre, fondamental pour l'Analyse 1 en filière MIP, introduit les notions d'espaces vectoriels normés, d'espaces de Banach, et d'opérateurs linéaires continus, qui sont les piliers de cette discipline. Comprendre ces concepts est essentiel pour aborder des sujets plus avancés en équations différentielles, en mécanique quantique ou en théorie des probabilités, où les solutions sont souvent des fonctions ou des opérateurs agissant sur des espaces de fonctions.

## 2. Définitions

**Espace Vectoriel Normé (EVN)**

Un espace vectoriel normé est un couple $(E, \\|\\cdot\\|)$ où $E$ est un espace vectoriel réel ou complexe, et $\\|\\cdot\\|$ est une norme sur $E$. Une norme est une application $\\|\\cdot\\|: E \\to \\mathbb{R}$ qui satisfait les trois propriétés suivantes pour tout $x, y \\in E$ et tout scalaire $\\alpha$ (réel ou complexe):

*Exemple :* Soit $E = \\mathbb{R}^n$. On peut définir la norme euclidienne $\\|x\\|_{2} = \\sqrt{\\sum_{i=1}^{n} |x_{i}|^2}$ pour $x = (x_{1}, \\ldots, x_{n}) \\in \\mathbb{R}^n$. C'est un EVN. On peut aussi considérer $\\|x\\|_{1} = \\sum_{i=1}^{n} |x_{i}|$ ou $\\|x\\|_{\\infty} = \\max_{i \\in \\{1, \\ldots, n\\}} |x_{i}|$.

---

**Propriétés d'une Norme**

Pour une application $\\|\\cdot\\|: E \\to \\mathbb{R}$ d'être une norme, elle doit vérifier:
1. $\\|x\\| \\geq 0$ et $\\|x\\| = 0 \\iff x = 0$ (Séparation)
2. $\\|\\alpha x\\| = |\\alpha| \\|x\\|$ pour tout scalaire $\\alpha$ (Homogénéité)
3. $\\|x+y\\| \\leq \\|x\\| + \\|y\\|$ (Inégalité triangulaire)

*Exemple :* Soit $E = C([a, b])$ l'espace des fonctions continues sur l'intervalle $[a, b]$. L'application $\\|f\\|_{\\infty} = \\sup_{t \\in [a, b]} |f(t)|$ est une norme sur $E$.

---

**Distance associée à une Norme**

Toute norme $\\|\\cdot\\|$ sur un espace vectoriel $E$ induit une distance $d(x, y) = \\|x-y\\|$ pour tout $x, y \\in E$. Cette distance vérifie les propriétés d'une métrique.

*Exemple :* Dans $\\mathbb{R}^2$ avec la norme euclidienne $\\|x\\|_2$, la distance entre $x=(x_{1}, x_{2})$ et $y=(y_{1}, y_{2})$ est $d(x, y) = \\sqrt{(x_{1}-y_{1})^2 + (x_{2}-y_{2})^2}$.

---

**Suite de Cauchy**

Une suite $(x_{n})_{n \\in \\mathbb{N}}$ dans un EVN $(E, \\|\\cdot\\|)$ est dite de Cauchy si pour tout $\\epsilon > 0$, il existe un entier $N \\in \\mathbb{N}$ tel que pour tous $m, n \\geq N$, on a $\\|x_{m} - x_{n}\\| < \\epsilon$.

*Exemple :* La suite $x_{n} = \\sum_{k=1}^{n} \\frac{1}{k^2}$ est une suite de Cauchy dans $\\mathbb{R}$ muni de la norme $\\|x\\| = |x|$.

---

**Espace de Banach**

Un espace de Banach est un espace vectoriel normé $(E, \\|\\cdot\\|)$ qui est complet pour la distance induite par la norme. La complétude signifie que toute suite de Cauchy dans $E$ converge vers un élément de $E$.

*Exemple :* L'espace $\\mathbb{R}^n$ muni de n'importe quelle norme est un espace de Banach. L'espace $C([a, b])$ muni de la norme $\\|f\\|_{\\infty} = \\sup_{t \\in [a, b]} |f(t)|$ est un espace de Banach.

---

**Opérateur Linéaire**

Soient $(E, \\|\\cdot\\|_{E})$ et $(F, \\|\\cdot\\|_{F})$ deux EVN. Une application $L: E \\to F$ est un opérateur linéaire si pour tous $x, y \\in E$ et tout scalaire $\\alpha$, on a:
1. $L(x+y) = L(x) + L(y)$ (Additivité)
2. $L(\\alpha x) = \\alpha L(x)$ (Homogénéité)

*Exemple :* L'application $L: C^1([0, 1]) \\to C([0, 1])$ définie par $L(f) = f'$ est un opérateur linéaire (où $C^1$ est l'espace des fonctions continûment différentiables).

---

**Opérateur Linéaire Continu (ou borné)**

Un opérateur linéaire $L: E \\to F$ est dit continu si pour tout $x_{0} \\in E$, pour toute suite $(x_{n})_{n \\in \\mathbb{N}}$ convergeant vers $x_{0}$ dans $E$, la suite $(L(x_{n}))_{n \\in \\mathbb{N}}$ converge vers $L(x_{0})$ dans $F$. Pour les opérateurs linéaires, la continuité est équivalente à être borné, c'est-à-dire, il existe une constante $M \\geq 0$ telle que $\\|L(x)\\|_{F} \\leq M \\|x\\|_{E}$ pour tout $x \\in E$.

*Exemple :* L'opérateur identité $I: E \\to E$ défini par $I(x) = x$ est un opérateur linéaire continu avec $M=1$.

---

**Norme d'un Opérateur Linéaire Continu**

Soit $L: E \\to F$ un opérateur linéaire continu. Sa norme $\\|L\\|$ est définie par:
$$\\|L\\| = \\inf \\{M \\geq 0 \\mid \\|L(x)\\|_{F} \\leq M \\|x\\|_{E} \\quad \\forall x \\in E \\}$$
Elle peut aussi être exprimée par:
$$\\|L\\| = \\sup_{x \\in E, x \\neq 0} \\frac{\\|L(x)\\|_{F}}{\\|x\\|_{E}} = \\sup_{\\|x\\|_{E}=1} \\|L(x)\\|_{F}$$
L'ensemble des opérateurs linéaires continus de $E$ vers $F$, noté $\\mathcal{L}(E, F)$, est lui-même un EVN muni de cette norme. Si $F$ est un espace de Banach, alors $\\mathcal{L}(E, F)$ est aussi un espace de Banach.

*Exemple :* L'opérateur $L: \\mathbb{R}^2 \\to \\mathbb{R}$ défini par $L(x_{1}, x_{2}) = x_{1} + 2x_{2}$ (avec la norme euclidienne standard) est linéaire et continu. Sa norme est $\\|L\\| = \\sqrt{1^2 + 2^2} = \\sqrt{5}$.

---

## 3. Théorèmes et Propriétés

**Théorème : Complétude de $\\mathbb{R}^n$ et $\\mathbb{C}^n$**

_Énoncé :_ Les espaces vectoriels $\\mathbb{R}^n$ et $\\mathbb{C}^n$, munis de n'importe quelle norme, sont des espaces de Banach.

_Démonstration :_ La preuve repose sur le fait que toutes les normes sur $\\mathbb{R}^n$ (ou $\\mathbb{C}^n$) sont équivalentes. Il suffit donc de prouver la complétude pour une norme particulière, comme la norme euclidienne $\\|\\cdot\\|_2$ ou la norme infinie $\\|\\cdot\\|_{\\infty}$. Une suite de Cauchy dans $(\\mathbb{R}^n, \\|\\cdot\\|_{\\infty})$ est une suite $(x^{(k)})_{k \\in \\mathbb{N}}$ où $x^{(k)} = (x_{1}^{(k)}, \\ldots, x_{n}^{(k)})$. La condition de Cauchy $\\|x^{(m)} - x^{(k)}\\|_{\\infty} < \\epsilon$ implique que $|x_{i}^{(m)} - x_{i}^{(k)}| < \\epsilon$ pour chaque composante $i \\in \\{1, \\ldots, n\\}$. Chaque suite de composantes $(x_{i}^{(k)})_{k \\in \\mathbb{N}}$ est donc une suite de Cauchy dans $\\mathbb{R}$, qui est complet. Ainsi, chaque $x_{i}^{(k)}$ converge vers un $x_{i}^{*} \\in \\mathbb{R}$. On peut alors montrer que $x^{(k)}$ converge vers $x^{*} = (x_{1}^{*}, \\ldots, x_{n}^{*}) \\in \\mathbb{R}^n$.

_Application :_ Ce théorème est fondamental car il garantit que les espaces finis-dimensionnels avec lesquels nous travaillons habituellement sont toujours complets, simplifiant l'analyse de la convergence dans ces contextes.

---

**Théorème : Équivalence des Normes en Dimension Finie**

_Énoncé :_ Sur un espace vectoriel de dimension finie $E$ (réel ou complexe), toutes les normes sont équivalentes. C'est-à-dire, pour deux normes $\\|\\cdot\\|_{1}$ et $\\|\\cdot\\|_{2}$ sur $E$, il existe des constantes $C_{1}, C_{2} > 0$ telles que pour tout $x \\in E$:
$$C_{1} \\|x\\|_{2} \\leq \\|x\\|_{1} \\leq C_{2} \\|x\\|_{2}$$

_Démonstration :_ La démonstration est généralement faite par l'absurde, en utilisant la compacité de la sphère unité dans un espace de dimension finie et la continuité de la fonction norme. On fixe une base et on montre que chaque norme est équivalente à la norme $\\|\\cdot\\|_{\\infty}$ sur $\\mathbb{R}^n$ (ou $\\mathbb{C}^n$).

_Application :_ Ce théorème est très important car il signifie que les propriétés topologiques d'un EVN de dimension finie (comme la convergence, la complétude, la continuité) sont indépendantes du choix de la norme.

---

**Théorème : Caractérisation de la Continuité d'un Opérateur Linéaire**

_Énoncé :_ Soit $L: E \\to F$ un opérateur linéaire entre deux EVN. Les conditions suivantes sont équivalentes:
1. $L$ est continu en $0 \\in E$.
2. $L$ est continu sur tout $E$.
3. $L$ est borné, c'est-à-dire, il existe une constante $M \\geq 0$ telle que $\\|L(x)\\|_{F} \\leq M \\|x\\|_{E}$ pour tout $x \\in E$.

_Démonstration :_ 1. $\\Rightarrow$ 2.: Si $L$ est continu en $0$, alors pour tout $\\epsilon > 0$, il existe $\\delta > 0$ tel que si $\\|x\\|_{E} < \\delta$, alors $\\|L(x)\\|_{F} < \\epsilon$. Pour montrer la continuité en un point $x_{0} \\in E$, soit $y$ tel que $\\|y-x_{0}\\|_{E} < \\delta$. Alors $\\|(y-x_{0})\\|_{E} < \\delta$, et par continuité en 0, $\\|L(y-x_{0})\\|_{F} < \\epsilon$. Par linéarité, $\\|L(y) - L(x_{0})\\|_{F} < \\epsilon$. Donc $L$ est continu en $x_{0}$.
2. $\\Rightarrow$ 3.: Si $L$ n'est pas borné, alors pour tout $n \\in \\mathbb{N}^{*}$, il existe $x_{n} \\in E$ tel que $\\|L(x_{n})\\|_{F} > n \\|x_{n}\\|_{E}$. Soit $y_{n} = \\frac{x_{n}}{n \\|x_{n}\\|_{E}}$. Alors $\\|y_{n}\\|_{E} = \\frac{1}{n} \\to 0$ quand $n \\to \\infty$. Mais $\\|L(y_{n})\\|_{F} = \\frac{\\|L(x_{n})\\|_{F}}{n \\|x_{n}\\|_{E}} > \\frac{n \\|x_{n}\\|_{E}}{n \\|x_{n}\\|_{E}} = 1$. Puisque $y_{n} \\to 0$ mais $L(y_{n})$ ne converge pas vers $0$ (sa norme est toujours supérieure à 1), $L$ n'est pas continu en $0$. C'est une contradiction.
3. $\\Rightarrow$ 1.: Si $L$ est borné, alors $\\|L(x)\\|_{F} \\leq M \\|x\\|_{E}$. Pour tout $\\epsilon > 0$, on choisit $\\delta = \\epsilon/M$ (si $M=0$, $L=0$ et la continuité est triviale). Si $\\|x\\|_{E} < \\delta$, alors $\\|L(x)\\|_{F} \\leq M \\|x\\|_{E} < M \\frac{\\epsilon}{M} = \\epsilon$. Donc $L$ est continu en $0$.

_Application :_ Ce théorème simplifie grandement l'étude de la continuité des opérateurs linéaires, réduisant la vérification de la continuité en tout point à la simple vérification de leur bornitude.

---

## 4. Formules Importantes

$$\\|x\\| \\geq 0 \\text{ et } \\|x\\| = 0 \\iff x = 0$$

Première propriété d'une norme : la séparation. La norme d'un vecteur est toujours positive ou nulle, et elle n'est nulle que si le vecteur est le vecteur nul.

_Variables :_ $x$: vecteur dans l'espace $E$.

---

$$\\|\\alpha x\\| = |\\alpha| \\|x\\|$$

Deuxième propriété d'une norme : l'homogénéité. Multiplier un vecteur par un scalaire $\\alpha$ multiplie sa norme par la valeur absolue de $\\alpha$.

_Variables :_ $x$: vecteur dans l'espace $E$. $\\alpha$: scalaire (réel ou complexe).

---

$$\\|x+y\\| \\leq \\|x\\| + \\|y\\|$$

Troisième propriété d'une norme : l'inégalité triangulaire. La norme de la somme de deux vecteurs est inférieure ou égale à la somme de leurs normes.

_Variables :_ $x, y$: vecteurs dans l'espace $E$.

---

$$d(x, y) = \\|x-y\\|$$

Formule de la distance induite par une norme. Toute norme sur un espace vectoriel $E$ définit naturellement une métrique sur $E$.

_Variables :_ $x, y$: vecteurs dans l'espace $E$.

---

$$\\|L\\| = \\sup_{x \\in E, x \\neq 0} \\frac{\\|L(x)\\|_{F}}{\\|x\\|_{E}}$$

Définition de la norme d'un opérateur linéaire continu $L: E \\to F$. C'est la plus petite constante $M$ telle que $\\|L(x)\\|_{F} \\leq M \\|x\\|_{E}$ pour tout $x \\in E$.

_Variables :_ $L$: opérateur linéaire continu. $x$: vecteur non nul de l'espace $E$. $\\|\\cdot\\|_{E}$: norme sur $E$. $\\|\\cdot\\|_{F}$: norme sur $F$.

---

## 5. Exemples

**Exemple 1 : Vérification qu'une application est une norme**

_Problème :_ Soit $E = \\mathbb{R}^2$. Pour $x = (x_{1}, x_{2}) \\in \\mathbb{R}^2$, l'application $\\|x\\| = |x_{1}| + 2|x_{2}|$ est-elle une norme sur $\\mathbb{R}^2$ ?

_Solution :_

Nous devons vérifier les trois propriétés d'une norme:

1. **Séparation ($\\|x\\| \\geq 0$ et $\\|x\\| = 0 \\iff x = 0 $):**
   Puisque $|x_{1}| \\geq 0$ et $|x_{2}| \\geq 0$, il est clair que $\\|x\\| = |x_{1}| + 2|x_{2}| \\geq 0$.
   Si $\\|x\\| = 0$, alors $|x_{1}| + 2|x_{2}| = 0$. Comme les termes sont positifs, cela implique $|x_{1}| = 0$ et $2|x_{2}| = 0$, d'où $x_{1} = 0$ et $x_{2} = 0$. Donc $x = (0, 0)$.
   Réciproquement, si $x = (0, 0)$, alors $\\|x\\| = |0| + 2|0| = 0$. La propriété de séparation est vérifiée.

2. **Homogénéité ($\\|\\alpha x\\| = |\\alpha| \\|x\\| $):**
   Soit $\\alpha \\in \\mathbb{R}$. Alors $\\alpha x = (\\alpha x_{1}, \\alpha x_{2})$.
   $\\|\\alpha x\\| = |\\alpha x_{1}| + 2|\\alpha x_{2}| = |\\alpha| |x_{1}| + 2|\\alpha| |x_{2}| = |\\alpha| (|x_{1}| + 2|x_{2}|) = |\\alpha| \\|x\\|$.
   La propriété d'homogénéité est vérifiée.

3. **Inégalité triangulaire ($\\|x+y\\| \\leq \\|x\\| + \\|y\\| $):**
   Soit $y = (y_{1}, y_{2}) \\in \\mathbb{R}^2$. Alors $x+y = (x_{1}+y_{1}, x_{2}+y_{2})$.
   $\\|x+y\\| = |x_{1}+y_{1}| + 2|x_{2}+y_{2}|$.
   Nous savons que $|a+b| \\leq |a| + |b|$ pour tout $a, b \\in \\mathbb{R}$. Donc:
   $|x_{1}+y_{1}| \\leq |x_{1}| + |y_{1}|$
   $|x_{2}+y_{2}| \\leq |x_{2}| + |y_{2}|$
   En combinant ces inégalités:
   $\\|x+y\\| \\leq (|x_{1}| + |y_{1}|) + 2(|x_{2}| + |y_{2}|)$
   $\\|x+y\\| \\leq (|x_{1}| + 2|x_{2}|) + (|y_{1}| + 2|y_{2}|)$
   $\\|x+y\\| \\leq \\|x\\| + \\|y\\|$.
   L'inégalité triangulaire est vérifiée.

Conclusion: Les trois propriétés sont vérifiées, donc l'application $\\|x\\| = |x_{1}| + 2|x_{2}|$ est bien une norme sur $\\mathbb{R}^2$.

_Explication :_ Pour montrer qu'une application est une norme, il est impératif de vérifier méticuleusement chaque propriété (séparation, homogénéité, inégalité triangulaire). La séparation est cruciale pour que la norme ne soit nulle que pour le vecteur nul. L'homogénéité reflète le changement d'échelle, et l'inégalité triangulaire est fondamentale pour le comportement additif de la norme, reliant la géométrie de l'espace.

---

**Exemple 2 : Calcul de la norme d'un opérateur linéaire**

_Problème :_ Soit $L: \\mathbb{R}^2 \\to \\mathbb{R}^2$ un opérateur linéaire défini par $L(x, y) = (x+y, x-y)$. On munit $\\mathbb{R}^2$ de la norme $\\|(u,v)\\|_{\\infty} = \\max(|u|, |v|)$. Calculer la norme $\\|L\\|$ de cet opérateur.

_Solution :_

La norme de l'opérateur $L$ est donnée par $\\|L\\| = \\sup_{\\|(x,y)\\|_{\\infty}=1} \\|L(x,y)\\|_{\\infty}$.
Nous avons $L(x, y) = (x+y, x-y)$. Donc $\\|L(x,y)\\|_{\\infty} = \\max(|x+y|, |x-y|)$.
Nous devons maximiser $\\max(|x+y|, |x-y|)$ sous la condition $\\max(|x|, |y|) = 1$. Cela signifie que $|x| \\leq 1$, $|y| \\leq 1$, et au moins un des deux est égal à 1.

Considérons les cas pour $x$ et $y$ :

1. Si $x=1$ et $y=1$: $\\|L(1,1)\\|_{\\infty} = \\max(|1+1|, |1-1|) = \\max(2, 0) = 2$.
2. Si $x=1$ et $y=0$: $\\|L(1,0)\\|_{\\infty} = \\max(|1+0|, |1-0|) = \\max(1, 1) = 1$.
3. Si $x=0$ et $y=1$: $\\|L(0,1)\\|_{\\infty} = \\max(|0+1|, |0-1|) = \\max(1, 1) = 1$.
4. Si $x=1$ et $y=-1$: $\\|L(1,-1)\\|_{\\infty} = \\max(|1-1|, |1-(-1)|) = \\max(0, 2) = 2$.

En général, en utilisant l'inégalité triangulaire $|x+y| \\leq |x| + |y|$ et $|x-y| \\leq |x| + |y|$.
Sous la condition $\\|(x,y)\\|_{\\infty} = \\max(|x|, |y|) = 1$, nous avons $|x| \\leq 1$ et $|y| \\leq 1$.
Donc $|x+y| \\leq |x| + |y| \\leq 1 + 1 = 2$.
De même $|x-y| \\leq |x| + |y| \\leq 1 + 1 = 2$.
Par conséquent, $\\|L(x,y)\\|_{\\infty} = \\max(|x+y|, |x-y|) \\leq 2$.
Comme nous avons trouvé des vecteurs (par exemple $(1,1)$ ou $(1,-1)$) pour lesquels la norme de l'image est 2, le supremum est atteint.
Donc, $\\|L\\| = 2$.

_Explication :_ Le calcul de la norme d'un opérateur linéaire continu revient à trouver la valeur maximale de $\\|L(x)\\|_{F}$ lorsque $\\|x\\|_{E} = 1$. Dans cet exemple, il s'agissait de trouver le supremum de $\\max(|x+y|, |x-y|)$ sur le carré unité défini par $\\max(|x|, |y|) = 1$. En testant les points extrêmes et en utilisant les inégalités classiques, on a pu borner la valeur et montrer qu'elle était atteinte, donnant ainsi la norme de l'opérateur.

---

## 6. Exercices d'Application

**Exercice 1**

Soit $E = \\mathbb{R}^2$. Pour $x = (x_{1}, x_{2}) \\in \\mathbb{R}^2$, l'application $\\|x\\| = \\sqrt{x_{1}^2 + 4x_{2}^2}$ est-elle une norme sur $\\mathbb{R}^2$ ? Justifier votre réponse.

<details>
<summary>Indices</summary>

- Vérifiez les trois propriétés de la norme: séparation, homogénéité, et inégalité triangulaire.
- Pour l'inégalité triangulaire, pensez à l'inégalité de Cauchy-Schwarz ou visualisez une transformation linéaire de l'espace.

</details>

<details>
<summary>Solution</summary>

Oui, c'est une norme. Elle vérifie les trois axiomes: $\\|x\\| \\geq 0$ et $\\|x\\| = 0 \\iff x=0$, $\\|\\alpha x\\| = |\\alpha| \\|x\\|$, et $\\|x+y\\| \\leq \\|x\\| + \\|y\\|$ (provenant de l'inégalité de Cauchy-Schwarz appliquée au produit scalaire modifié $\\langle x,y \\rangle = x_{1}y_{1} + 4x_{2}y_{2}$).

</details>

---

**Exercice 2**

Soit $E$ un EVN et $(x_{n})_{n \\in \\mathbb{N}}$ une suite de Cauchy dans $E$. Montrer que la suite $(\\|x_{n}\\|)_{n \\in \\mathbb{N}}$ des normes est une suite de Cauchy dans $\\mathbb{R}$.

<details>
<summary>Indices</summary>

- Rappelez-vous l'inégalité triangulaire inverse: $\\left| \\|a\\| - \\|b\\| \\right| \\leq \\|a-b\\|$.
- Appliquez la définition de suite de Cauchy à la suite $(x_{n})$.

</details>

<details>
<summary>Solution</summary>

Utiliser l'inégalité triangulaire inverse: $\\left| \\|x_{m}\\| - \\|x_{n}\\| \\right| \\leq \\|x_{m} - x_{n}\\|$. Comme $(x_{n})$ est de Cauchy, pour $\\epsilon > 0$ il existe $N$ tel que $\\|x_{m} - x_{n}\\| < \\epsilon$ pour $m, n \\geq N$. Donc $\\left| \\|x_{m}\\| - \\|x_{n}\\| \\right| < \\epsilon$ pour $m, n \\geq N$, ce qui prouve que $(\\|x_{n}\\|)$ est de Cauchy dans $\\mathbb{R}$.

</details>

---

## 7. Résumé

Ce chapitre a posé les fondations de l'analyse fonctionnelle en introduisant les notions cruciales d'espaces vectoriels normés (EVN) et d'espaces de Banach. Nous avons exploré les propriétés des normes, la distance qu'elles induisent, et la notion de complétude qui est essentielle pour la convergence des suites de Cauchy. Nous avons également étudié les opérateurs linéaires, en mettant en évidence l'équivalence entre continuité et bornitude pour ces opérateurs, et défini leur norme. Ces concepts sont les outils de base pour l'étude des équations aux dérivées partielles, des systèmes dynamiques, et bien d'autres domaines des mathématiques et de leurs applications.

## 8. Erreurs Courantes à Éviter

- Confondre la notion de convergence simple et de convergence uniforme, surtout dans les espaces de fonctions, où seule la convergence uniforme garantit la continuité de la limite.
- Oublier de vérifier l'une des propriétés d'une norme (séparation, homogénéité, inégalité triangulaire) lors de la démonstration qu'une application est une norme.
- Considérer à tort qu'un espace vectoriel normé est toujours complet. La complétude est une propriété forte et spécifique (ex: $\\mathbb{Q}$ n'est pas complet, $C^{\\infty}$ non plus sous la norme $\\|\\cdot\\|_{\\infty}$).
- Ne pas comprendre l'équivalence entre continuité et bornitude pour les opérateurs linéaires, et donc tenter de prouver la continuité par la définition $\\epsilon-\\delta$ plutôt que par la bornitude.
- Erreur de calcul ou d'interprétation lors de la détermination de la norme d'un opérateur linéaire continu, notamment en ne cherchant pas le supremum sur la sphère unité.`;

export const CHAPTER_EXAMPLE = `## 1. Introduction

L'analyse fonctionnelle est une branche des mathématiques qui étudie les espaces de fonctions. Elle généralise les concepts de l'algèbre linéaire aux espaces de dimension infinie.

Dans ce chapitre, nous allons étudier les **espaces normés** et leurs propriétés fondamentales.

## 2. Définitions

### Norme sur un espace vectoriel

Soit $E$ un espace vectoriel sur $\\mathbb{R}$ ou $\\mathbb{C}$. Une **norme** sur $E$ est une application $N: E \\to \\mathbb{R}^+$ vérifiant :

1. **Séparation** : $N(x) = 0 \\iff x = 0$
2. **Homogénéité** : $\\forall \\lambda \\in \\mathbb{K}, \\forall x \\in E, N(\\lambda x) = |\\lambda| N(x)$
3. **Inégalité triangulaire** : $\\forall x, y \\in E, N(x + y) \\leq N(x) + N(y)$

On note généralement $N(x) = \\|x\\|$.

**Exemple** : Sur $\\mathbb{R}^n$, $\\|(x_1, ..., x_n)\\| = \\sqrt{x_1^2 + ... + x_n^2}$ est une norme (norme euclidienne).

### Espace normé

Un **espace normé** est un couple $(E, \\|\\cdot\\|)$ où $E$ est un espace vectoriel et $\\|\\cdot\\|$ est une norme sur $E$.

## 3. Théorèmes

### Continuité de la norme

**Énoncé** : Soit $(E, \\|\\cdot\\|)$ un espace normé. L'application $x \\mapsto \\|x\\|$ est continue.

**Démonstration** :
Soit $(x_n)$ une suite dans $E$ qui converge vers $x \\in E$.

Pour tout $n \\in \\mathbb{N}$ :
$$|\\|x_n\\| - \\|x\\|| \\leq \\|x_n - x\\|$$

Cette inégalité découle de l'inégalité triangulaire inversée.

Comme $x_n \\to x$, on a $\\|x_n - x\\| \\to 0$, donc $\\|x_n\\| \\to \\|x\\|$.

**Application** : Cette propriété est fondamentale pour étudier la convergence dans les espaces normés.

### Inégalité de Cauchy-Schwarz

**Énoncé** : Dans un espace préhilbertien $(E, \\langle \\cdot, \\cdot \\rangle)$, pour tous $x, y \\in E$ :

$$|\\langle x, y \\rangle| \\leq \\|x\\| \\cdot \\|y\\|$$

avec égalité si et seulement si $x$ et $y$ sont colinéaires.

## 4. Exemples

### Exemple 1 : Vérification d'une norme

**Problème** : Montrer que $N(x) = |x_1| + |x_2|$ définit une norme sur $\\mathbb{R}^2$.

**Solution** :
1. **Séparation** : $N(x) = 0 \\iff |x_1| + |x_2| = 0 \\iff x_1 = x_2 = 0 \\iff x = 0$ ✓

2. **Homogénéité** : Pour $\\lambda \\in \\mathbb{R}$ :
   $$N(\\lambda x) = |\\lambda x_1| + |\\lambda x_2| = |\\lambda|(|x_1| + |x_2|) = |\\lambda| N(x)$$ ✓

3. **Inégalité triangulaire** : Pour $x, y \\in \\mathbb{R}^2$ :
   $$N(x + y) = |x_1 + y_1| + |x_2 + y_2| \\leq |x_1| + |y_1| + |x_2| + |y_2| = N(x) + N(y)$$ ✓

Donc $N$ est bien une norme.

### Exemple 2 : Convergence dans un espace normé

**Problème** : Dans $(\\mathbb{R}^2, \\|\\cdot\\|_\\infty)$ où $\\|(x, y)\\|_\\infty = \\max(|x|, |y|)$, étudier la convergence de la suite $u_n = (\\frac{1}{n}, \\frac{1}{n^2})$.

**Solution** :
$$\\|u_n - 0\\|_\\infty = \\max(\\frac{1}{n}, \\frac{1}{n^2}) = \\frac{1}{n} \\to 0$$

Donc $u_n \\to 0$ dans $(\\mathbb{R}^2, \\|\\cdot\\|_\\infty)$.

## 5. Exercices

### Exercice 1

**Question** : Soit $E = C([0,1], \\mathbb{R})$ l'espace des fonctions continues sur $[0,1]$. Montrer que $\\|f\\|_\\infty = \\sup_{x \\in [0,1]} |f(x)|$ définit une norme sur $E$.

**Indice** : Vérifier les trois axiomes de la norme.

### Exercice 2

**Question** : Dans $\\mathbb{R}^3$ muni de la norme euclidienne, calculer la distance entre $A = (1, 2, 3)$ et $B = (4, 5, 6)$.

**Réponse** : $d(A, B) = \\|B - A\\| = \\|(3, 3, 3)\\| = 3\\sqrt{3}$

## 6. Résumé

- Une norme mesure la "taille" des vecteurs dans un espace vectoriel
- Les espaces normés généralisent les espaces euclidiens
- La continuité de la norme est une propriété fondamentale
- Différentes normes peuvent être définies sur le même espace`;

export const SERIES_EXAMPLE_JSON = `[
  {
    "problemTextFr": "Soit $f$ la fonction définie sur $\\\\mathbb{R}$ par $f(x) = x^2 - 4x + 3$.\\n\\n1. Déterminer les racines de $f$.\\n2. Étudier le signe de $f(x)$.\\n3. Tracer le tableau de variations de $f$.",
    "solutionFr": "**1. Racines de f**\\n\\nOn résout $f(x) = 0$ :$$x^2 - 4x + 3 = 0$$\\n\\nDiscriminant : $\\\\Delta = 16 - 12 = 4$\\n\\nRacines : $x_1 = \\\\frac{4 - 2}{2} = 1$ et $x_2 = \\\\frac{4 + 2}{2} = 3$\\n\\n**2. Signe de f**\\n\\nComme $a = 1 > 0$, le trinôme est :\n- Positif pour $x < 1$ ou $x > 3$\n- Négatif pour $1 < x < 3$\n- Nul pour $x = 1$ ou $x = 3$\\n\\n**3. Tableau de variations**\\n\\nSommet : $x_S = -\\\\frac{b}{2a} = 2$, $f(2) = 4 - 8 + 3 = -1$\\n\\n$$\\\\begin{array}{|c|c|c|c|}\\n\\\\hline\\nx & -\\\\infty & 2 & +\\\\infty \\\\\\\\\\n\\\\hline\\nf'(x) & - & 0 & + \\\\\\\\\\n\\\\hline\\nf(x) & +\\\\infty & \\\\searrow & -1 & \\\\nearrow & +\\\\infty \\\\\\\\\\n\\\\hline\\n\\\\end{array}$$",
    "hints": ["Calculer le discriminant", "Utiliser la formule $x_S = -\\\\frac{b}{2a}$"],
    "difficulty": "EASY"
  },
  {
    "problemTextFr": "Soit $(u_n)$ la suite définie par $u_0 = 1$ et $u_{n+1} = 2u_n + 3$ pour tout $n \\\\in \\\\mathbb{N}$.\\n\\n1. Calculer $u_1$, $u_2$, $u_3$.\\n2. Montrer que la suite $(v_n)$ définie par $v_n = u_n + 3$ est géométrique.\\n3. En déduire l'expression de $u_n$ en fonction de $n$.",
    "solutionFr": "**1. Calcul des premiers termes**\\n\\n- $u_1 = 2(1) + 3 = 5$\\n- $u_2 = 2(5) + 3 = 13$\\n- $u_3 = 2(13) + 3 = 29$\\n\\n**2. Suite géométrique**\\n\\nPosons $v_n = u_n + 3$.\\n\\nAlors : $v_{n+1} = u_{n+1} + 3 = 2u_n + 3 + 3 = 2u_n + 6 = 2(u_n + 3) = 2v_n$\\n\\nDonc $(v_n)$ est géométrique de raison $q = 2$ et de premier terme $v_0 = u_0 + 3 = 4$.\\n\\n**3. Expression de $u_n$**\\n\\nOn a : $v_n = v_0 \\\\cdot q^n = 4 \\\\cdot 2^n = 2^{n+2}$\\n\\nDonc : $u_n = v_n - 3 = 2^{n+2} - 3$",
    "hints": ["Poser $v_n = u_n + c$ et chercher $c$", "Calculer $v_{n+1}$ en fonction de $v_n$"],
    "difficulty": "MEDIUM"
  },
  {
    "problemTextFr": "Soit $f$ la fonction définie sur $]0, +\\\\infty[$ par $f(x) = x - 1 - \\\\ln(x)$.\\n\\n1. Étudier les variations de $f$.\\n2. En déduire le signe de $f(x)$.\\n3. Montrer que pour tout $x > 0$, $x \\\\geq 1 + \\\\ln(x)$.",
    "solutionFr": "**1. Variations de f**\\n\\nDérivée : $f'(x) = 1 - \\\\frac{1}{x} = \\\\frac{x - 1}{x}$\\n\\nSigne de $f'(x)$ :\n- $f'(x) < 0$ pour $0 < x < 1$\n- $f'(x) = 0$ pour $x = 1$\n- $f'(x) > 0$ pour $x > 1$\\n\\nTableau de variations :\\n\\n$$\\\\begin{array}{|c|c|c|c|}\\n\\\\hline\\nx & 0 & 1 & +\\\\infty \\\\\\\\\\n\\\\hline\\nf'(x) & & - & 0 & + & \\\\\\\\\\n\\\\hline\\nf(x) & +\\\\infty & \\\\searrow & 0 & \\\\nearrow & +\\\\infty \\\\\\\\\\n\\\\hline\\n\\\\end{array}$$\\n\\n**2. Signe de f**\\n\\nComme $f$ admet un minimum en $x = 1$ avec $f(1) = 0$, on a $f(x) \\\\geq 0$ pour tout $x > 0$.\\n\\n**3. Inégalité**\\n\\n$f(x) \\\\geq 0 \\\\iff x - 1 - \\\\ln(x) \\\\geq 0 \\\\iff x \\\\geq 1 + \\\\ln(x)$",
    "hints": ["Calculer la dérivée", "Trouver le minimum de $f$", "Utiliser $f(x) \\\\geq f(1)$"],
    "difficulty": "HARD"
  }
]`;

export const EXAM_EXAMPLE = {
  title: "Examen Blanc - Mathématiques",
  description: "Examen complet couvrant les suites numériques et les fonctions",
  duration: 180,
  totalPoints: 20,
  exercises: [
    {
      title: "Étude de fonction",
      problemText: `Soit $f$ la fonction définie sur $\\mathbb{R}$ par :

$$f(x) = x^3 - 3x + 1$$

**Partie A : Étude des variations (8 points)**

1. Calculer $f'(x)$ et étudier son signe. (2 pts)
2. Dresser le tableau de variations de $f$. (2 pts)
3. Montrer que l'équation $f(x) = 0$ admet exactement trois solutions. (2 pts)
4. Déterminer une valeur approchée de ces solutions. (2 pts)

**Partie B : Étude graphique (4 points)**

5. Déterminer les points d'inflexion de la courbe représentative de $f$. (2 pts)
6. Tracer l'allure de la courbe. (2 pts)`,
      solution: `**Partie A**

1. $f'(x) = 3x^2 - 3 = 3(x^2 - 1) = 3(x-1)(x+1)$

   Signe : $f'(x) < 0$ pour $x \\in ]-1, 1[$, $f'(x) > 0$ sinon

2. Tableau de variations :
   - $f(-1) = -1 + 3 + 1 = 3$ (maximum local)
   - $f(1) = 1 - 3 + 1 = -1$ (minimum local)

3. $f$ est continue, $f(-2) < 0$, $f(-1) > 0$, $f(1) < 0$, $f(2) > 0$
   
   Par le théorème des valeurs intermédiaires, il existe trois solutions.

4. Solutions approchées : $x_1 \\approx -1.88$, $x_2 \\approx 0.35$, $x_3 \\approx 1.53$

**Partie B**

5. $f''(x) = 6x$, donc point d'inflexion en $x = 0$, $f(0) = 1$

6. Courbe en S passant par $(0, 1)$`,
      points: 12,
      hints: ["Factoriser $f'(x)$", "Utiliser le TVI", "Calculer $f''(x)$"]
    },
    {
      title: "Suites numériques",
      problemText: `Soit $(u_n)$ la suite définie par $u_0 = 2$ et pour tout $n \\in \\mathbb{N}$ :

$$u_{n+1} = \\frac{u_n + 6}{u_n + 2}$$

1. Calculer $u_1$ et $u_2$. (1 pt)
2. Montrer que pour tout $n \\in \\mathbb{N}$, $u_n > 0$. (2 pts)
3. Étudier la monotonie de $(u_n)$. (2 pts)
4. Montrer que $(u_n)$ est convergente et déterminer sa limite. (3 pts)`,
      solution: `1. $u_1 = \\frac{2 + 6}{2 + 2} = 2$, $u_2 = \\frac{2 + 6}{2 + 2} = 2$

2. Par récurrence :
   - $u_0 = 2 > 0$ ✓
   - Si $u_n > 0$, alors $u_{n+1} = \\frac{u_n + 6}{u_n + 2} > 0$ ✓

3. $u_{n+1} - u_n = \\frac{u_n + 6}{u_n + 2} - u_n = \\frac{u_n + 6 - u_n(u_n + 2)}{u_n + 2} = \\frac{6 - u_n^2 - u_n}{u_n + 2}$

   Pour $u_n = 2$ : $u_{n+1} - u_n = 0$, donc la suite est constante.

4. La suite est constante égale à 2, donc convergente vers $\\ell = 2$.`,
      points: 8,
      hints: ["Récurrence pour la positivité", "Calculer $u_{n+1} - u_n$", "Résoudre $\\ell = \\frac{\\ell + 6}{\\ell + 2}$"]
    }
  ]
};

// Helper function to format the exam example as a string
export function getExamExampleString(): string {
  return JSON.stringify(EXAM_EXAMPLE, null, 2);
}

export const SUPERIEUR_SERIES_EXAMPLE_JSON = `{
  "title": "Série d'Analyse : Espaces Vectoriels Normés",
  "description": "Cette série couvre les notions de base de la topologie : normes, boules ouvertes/fermées, et suites dans les espaces vectoriels normés.",
  "exercises": [
    {
      "title": "Comparaison de normes sur R^2",
      "questions": [
        {
          "question": "Soit $E = \\\\mathbb{R}^2$. On définit pour $x = (x_1, x_2)$ :\\\\n$N_1(x) = |x_1| + |x_2|$, $N_2(x) = \\\\sqrt{x_1^2 + x_2^2}$, $N_{\\\\infty}(x) = \\\\max(|x_1|, |x_2|)$.\\\\n\\\\nMontrer que $N_{\\\\infty}(x) \\\\le N_2(x) \\\\le N_1(x)$.",
          "solution": "1. **Inégalité $N_{\\\\infty} \\\\le N_2$** :\\\\nSoit $i$ tel que $|x_i| = N_{\\\\infty}(x)$. Alors $N_{\\\\infty}(x)^2 = x_i^2 \\\\le x_1^2 + x_2^2 = N_2(x)^2$. Donc $N_{\\\\infty}(x) \\\\le N_2(x)$.\\\\n\\\\n2. **Inégalité $N_2 \\\\le N_1$** :\\\\n$N_1(x)^2 = (|x_1| + |x_2|)^2 = x_1^2 + x_2^2 + 2|x_1||x_2| = N_2(x)^2 + 2|x_1||x_2| \\\\ge N_2(x)^2$.",
          "hints": ["Élever au carré pour comparer", "Utiliser l'identité remarquable $(a+b)^2$"]
        },
        {
          "question": "En déduire que ces normes sont équivalentes.",
          "solution": "On a montré $N_{\\\\infty} \\\\le N_2 \\\\le N_1$. De plus, on a clairement $N_1(x) \\\\le 2 N_{\\\\infty}(x)$.\\\\nOn a donc la chaîne : $N_{\\\\infty} \\\\le N_2 \\\\le N_1 \\\\le 2N_{\\\\infty}$.\\\\nPar transitivité, toutes ces normes sont équivalentes.",
          "hints": ["Trouver une constante C telle que $N_1 \\\\le C N_{\\\\infty}$"]
        }
      ]
    },
    {
      "title": "Suites de Cauchy dans les EVN",
      "questions": [
        {
          "question": "Soit $(E, \\\\|\\\\cdot\\\\|)$ un espace vectoriel normé. Montrer que toute suite convergente est de Cauchy.",
          "solution": "Soit $(u_n)$ une suite convergeant vers $\\\\ell$. Soit $\\\\varepsilon > 0$.Il existe $N$ tel que $\\\\forall n \\\\ge N, \\\\|u_n - \\\\ell\\\\| < \\\\varepsilon/2$.Pour $p, q \\\\ge N$ : $\\\\mid u_p - u_q\\\\| \\\\le \\\\|u_p - \\\\ell\\\\| + \\\\|\\\\ell - u_q\\\\| < \\\\varepsilon/2 + \\\\varepsilon/2 = \\\\varepsilon$.",
          "hints": ["Utiliser l'inégalité triangulaire", "Intercaler la limite l"]
        }
      ]
    }
  ]
}`;
