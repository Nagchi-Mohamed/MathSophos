'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Equal, X, AlertCircle } from 'lucide-react';
import { LatexRenderer } from '@/components/latex-renderer';
import { mathEngine } from '@/lib/math-engine';
import { VirtualKeyboard } from './virtual-keyboard';

interface AlgebraResult {
  solution: string;
  steps: string[];
  type: string;
}

export default function AlgebraCalculator() {
  const [equation, setEquation] = useState('');
  const [result, setResult] = useState<AlgebraResult | null>(null);
  const [error, setError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const solveEquation = async () => {
    if (!equation.trim()) {
      setError('Veuillez entrer une équation');
      return;
    }

    setIsCalculating(true);
    setError('');
    setResult(null);

    try {
      // Use math engine to solve
      const solution = mathEngine.solve(equation);

      setResult({
        solution: solution.join(', '),
        steps: ['Analyse de l\'équation', 'Résolution...'],
        type: 'Résultat'
      });
    } catch (err) {
      setError('Erreur lors de la résolution de l\'équation');
      console.error('Algebra calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const solveAlgebraEquation = async (eq: string): Promise<AlgebraResult> => {
    // Basic equation parsing and solving
    // This is a simplified implementation - can be enhanced with math libraries

    const cleanEq = eq.replace(/\s+/g, '').toLowerCase();

    // Handle linear equations like ax + b = c
    if (cleanEq.includes('x') && !cleanEq.includes('x^2')) {
      return solveLinearEquation(cleanEq);
    }

    // Handle quadratic equations like ax^2 + bx + c = 0
    if (cleanEq.includes('x^2')) {
      return solveQuadraticEquation(cleanEq);
    }

    // Handle systems of equations
    if (cleanEq.includes('&') || cleanEq.includes('and')) {
      return solveSystemOfEquations(cleanEq);
    }

    throw new Error('Type d\'équation non supporté');
  };

  const solveLinearEquation = (eq: string): AlgebraResult => {
    // Simple linear equation solver: ax + b = c
    const steps: string[] = [];

    // Remove spaces and convert to lowercase
    let equation = eq.replace(/\s+/g, '');

    // Handle equations with = sign
    if (equation.includes('=')) {
      const [left, right] = equation.split('=');

      // Move all terms to left side: ax + b - c = 0
      const newLeft = `${left}-(${right})`;
      equation = `${newLeft}=0`;
      steps.push(`Déplacer tous les termes du côté gauche: ${newLeft} = 0`);
    }

    // For now, return a placeholder result
    // This would need a proper algebra solver library
    steps.push('Résoudre l\'équation linéaire...');
    steps.push('Solution: x = valeur_calculée');

    return {
      solution: 'x = \\frac{-b}{a}',
      steps,
      type: 'Équation linéaire'
    };
  };

  const solveQuadraticEquation = (eq: string): AlgebraResult => {
    const steps: string[] = [];

    steps.push('Identifier les coefficients a, b, c dans ax² + bx + c = 0');
    steps.push('Appliquer la formule quadratique: x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
    steps.push('Calculer le discriminant: Δ = b² - 4ac');
    steps.push('Solutions: x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}');

    return {
      solution: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
      steps,
      type: 'Équation quadratique'
    };
  };

  const solveSystemOfEquations = (eq: string): AlgebraResult => {
    const steps: string[] = [];

    steps.push('Système d\'équations détecté');
    steps.push('Utiliser la méthode de substitution ou élimination');
    steps.push('Résoudre étape par étape...');

    return {
      solution: 'Solution du système',
      steps,
      type: 'Système d\'équations'
    };
  };

  const examples = [
    { equation: '2x + 3 = 7', description: 'Équation linéaire simple' },
    { equation: 'x^2 - 5x + 6 = 0', description: 'Équation quadratique' },
    { equation: '3x + 2y = 8 & x - y = 1', description: 'Système de 2 équations' },
    { equation: 'x^2 + 2x - 8 = 0', description: 'Factorisation possible' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Calculateur d'Algèbre
        </h1>
        <p className="text-muted-foreground">
          Résolvez des équations algébriques avec étapes détaillées
        </p>
      </div>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Calculateur</TabsTrigger>
          <TabsTrigger value="examples">Exemples</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Résoudre une Équation
              </CardTitle>
              <CardDescription>
                Entrez votre équation algébrique. Utilisez x comme variable principale.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="equation">Équation</Label>
                <div className="flex gap-2">
                  <Input
                    id="equation"
                    placeholder="ex: 2x + 3 = 7 ou x^2 - 5x + 6 = 0"
                    value={equation}
                    onChange={(e) => setEquation(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={solveEquation}
                    disabled={isCalculating}
                    className="px-6"
                  >
                    {isCalculating ? 'Calcul...' : 'Résoudre'}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive font-medium">{error}</span>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Solution</CardTitle>
                      <CardDescription>{result.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg">
                        <Equal className="w-5 h-5 text-primary" />
                        <LatexRenderer formula={result.solution} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Étapes de Résolution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.steps.map((step, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <LatexRenderer formula={step} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exemples d'Équations</CardTitle>
              <CardDescription>
                Cliquez sur un exemple pour l'essayer dans le calculateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {examples.map((example, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setEquation(example.equation)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <LatexRenderer formula={example.equation} />
                        <p className="text-sm text-muted-foreground mt-1">
                          {example.description}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Essayer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Virtual Keyboard */}
      <VirtualKeyboard
        onInput={(val) => setEquation(prev => prev + val)}
        onDelete={() => setEquation(prev => prev.slice(0, -1))}
        onClear={() => setEquation('')}
      />
    </div>
  );
}
