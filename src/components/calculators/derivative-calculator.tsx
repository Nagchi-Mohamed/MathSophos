'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LatexInputWithPreview } from '@/components/latex-input-with-preview';
import { LatexRenderer } from '@/components/latex-renderer';
import { mathEngine } from '@/lib/math-engine';
import { TrendingUp, Calculator, BookOpen, AlertCircle } from 'lucide-react';
import { VirtualKeyboard } from './virtual-keyboard';

interface CalculationStep {
  step: number;
  description: string;
  formula: string;
  result?: string;
}

export function DerivativeCalculator() {
  const [expression, setExpression] = useState('');
  const [variable, setVariable] = useState('x');
  const [result, setResult] = useState<string>('');
  const [steps, setSteps] = useState<CalculationStep[]>([]);
  const [error, setError] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  const exampleExpressions = [
    'x^2',
    'sin(x)',
    'e^x',
    'ln(x)',
    'x^3 + 2*x^2 - x + 1',
    'cos(x) + sin(x)',
    'x^2 * sin(x)',
    'e^x * x^2'
  ];

  const calculateDerivative = async () => {
    if (!expression.trim()) {
      setError('Veuillez entrer une expression.');
      return;
    }

    setIsCalculating(true);
    setError('');
    setResult('');
    setSteps([]);

    try {
      // Calculate the derivative
      const derivative = mathEngine.derivative(expression, variable);

      // Generate calculation steps
      const calculationSteps: CalculationStep[] = [
        {
          step: 1,
          description: 'Expression originale',
          formula: expression,
        },
        {
          step: 2,
          description: 'Variable de dérivation',
          formula: variable,
        },
        {
          step: 3,
          description: 'Application des règles de dérivation',
          formula: `\\frac{d}{d${variable}}(${expression})`,
        },
        {
          step: 4,
          description: 'Résultat de la dérivation',
          formula: derivative,
          result: derivative
        }
      ];

      setSteps(calculationSteps);
      setResult(derivative);

    } catch (err) {
      console.error('Derivative calculation error:', err);
      setError('Erreur lors du calcul de la dérivée. Vérifiez votre expression.');
    } finally {
      setIsCalculating(false);
    }
  };

  const clearAll = () => {
    setExpression('');
    setVariable('x');
    setResult('');
    setSteps([]);
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Calculateur de Dérivées
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Calculez les dérivées de fonctions mathématiques avec des étapes détaillées.
          Utilisez MathJax pour un rendu parfait des formules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Paramètres du Calcul
            </CardTitle>
            <CardDescription>
              Entrez votre fonction et la variable de dérivation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Expression Input */}
            <LatexInputWithPreview
              label="Expression à dériver"
              placeholder="Ex: x^2, sin(x), e^x..."
              value={expression}
              onChange={setExpression}
              examples={exampleExpressions}
            />

            {/* Variable Input */}
            <div className="space-y-2">
              <Label htmlFor="variable">Variable de dérivation</Label>
              <Input
                id="variable"
                value={variable}
                onChange={(e) => setVariable(e.target.value)}
                placeholder="x"
                className="w-20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={calculateDerivative}
                disabled={isCalculating}
                className="flex-1"
              >
                {isCalculating ? 'Calcul en cours...' : 'Calculer la Dérivée'}
              </Button>
              <Button variant="outline" onClick={clearAll}>
                Effacer
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Résultat et Étapes
            </CardTitle>
            <CardDescription>
              Détail du calcul pas à pas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result && (
              <div className="space-y-4">
                {/* Final Result */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="text-sm font-medium text-primary mb-2">
                    Dérivée calculée:
                  </div>
                  <div className="text-lg">
                    <LatexRenderer formula={`\\frac{d}{d${variable}}(${expression}) = ${result}`} />
                  </div>
                </div>

                {/* Calculation Steps */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">
                    Étapes du calcul:
                  </h4>
                  {steps.map((step) => (
                    <div key={step.step} className="border border-border rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground mb-1">
                            {step.description}
                          </div>
                          <LatexRenderer formula={step.formula} />
                          {step.result && (
                            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                              = {step.result}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!result && !error && (
              <div className="text-center text-muted-foreground py-8">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Entrez une expression et cliquez sur "Calculer" pour voir le résultat</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Aide et Syntaxe</CardTitle>
          <CardDescription>
            Guide pour utiliser le calculateur de dérivées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Opérateurs supportés:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><code>+</code> : Addition</li>
                <li><code>-</code> : Soustraction</li>
                <li><code>*</code> : Multiplication</li>
                <li><code>/</code> : Division</li>
                <li><code>^</code> : Puissance (ex: x^2)</li>
                <li><code>()</code> : Parenthèses</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Fonctions supportées:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><code>sin(x)</code> : Sinus</li>
                <li><code>cos(x)</code> : Cosinus</li>
                <li><code>tan(x)</code> : Tangente</li>
                <li><code>ln(x)</code> : Logarithme népérien</li>
                <li><code>log(x)</code> : Logarithme décimal</li>
                <li><code>e^x</code> : Exponentielle</li>
                <li><code>sqrt(x)</code> : Racine carrée</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Virtual Keyboard */}
      <VirtualKeyboard
        onInput={(val) => setExpression(prev => prev + val)}
        onDelete={() => setExpression(prev => prev.slice(0, -1))}
        onClear={() => setExpression('')}
      />
    </div>
  );
}
