'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Play, RotateCcw, Info } from 'lucide-react';
import { LatexRenderer } from '@/components/latex-renderer';
import { mathEngine } from '@/lib/math-engine';
import { VirtualKeyboard } from './virtual-keyboard';

interface CalculationResult {
  integral: string;
  steps: string[];
  result: string;
}

export function IntegralCalculator() {
  const [expression, setExpression] = useState('');
  const [lowerLimit, setLowerLimit] = useState('');
  const [upperLimit, setUpperLimit] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateIntegral = async () => {
    if (!expression.trim()) {
      setError('Veuillez entrer une expression à intégrer');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate integral using math engine
      const integralResult = mathEngine.integral(expression);

      // Generate steps (simplified for now)
      const steps = [
        `Intégrale indéfinie: \\int ${expression} \\, dx`,
        `Résultat: ${integralResult} + C`
      ];

      setResult({
        integral: `\\int ${expression} \\, dx`,
        steps,
        result: `${integralResult} + C`
      });
    } catch (err) {
      console.error(err);
      setError('Erreur lors du calcul de l\'intégrale. Vérifiez votre expression.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDefiniteIntegral = async () => {
    if (!expression.trim() || !lowerLimit.trim() || !upperLimit.trim()) {
      setError('Veuillez entrer l\'expression et les limites');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // For now, we'll simulate the calculation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock result for demonstration
      const mockResult: CalculationResult = {
        integral: `\\int_{${lowerLimit}}^{${upperLimit}} ${expression} \\, dx`,
        steps: [
          `Intégrale définie: \\int_{${lowerLimit}}^{${upperLimit}} ${expression} \\, dx`,
          `Calcul de l'intégrale indéfinie: \\int ${expression} \\, dx = \\frac{x^{2}}{2} + C`,
          `Évaluation: \\left[\\frac{x^{2}}{2}\\right]_{${lowerLimit}}^{${upperLimit}}`,
          `Résultat: \\frac{${upperLimit}^{2}}{2} - \\frac{${lowerLimit}^{2}}{2}`
        ],
        result: `\\frac{${upperLimit}^{2}}{2} - \\frac{${lowerLimit}^{2}}{2}`
      };

      setResult(mockResult);
    } catch (err) {
      setError('Erreur lors du calcul de l\'intégrale définie');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setExpression('');
    setLowerLimit('');
    setUpperLimit('');
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Calculateur d'Intégrales
        </h1>
        <p className="text-muted-foreground">
          Calculez des intégrales indéfinies et définies avec étapes détaillées
        </p>
      </div>

      {/* Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculateur d'Intégrales
          </CardTitle>
          <CardDescription>
            Entrez votre expression mathématique et calculez son intégrale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="indefinite" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="indefinite">Intégrale Indéfinie</TabsTrigger>
              <TabsTrigger value="definite">Intégrale Définie</TabsTrigger>
            </TabsList>

            <TabsContent value="indefinite" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expression">Expression à intégrer (ex: x^2, sin(x), e^x)</Label>
                <Input
                  id="expression"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="Entrez votre expression..."
                  className="font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={calculateIntegral}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calcul en cours...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Calculer ∫ f(x) dx
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="definite" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="definite-expression">Expression</Label>
                  <Input
                    id="definite-expression"
                    value={expression}
                    onChange={(e) => setExpression(e.target.value)}
                    placeholder="x^2"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lower-limit">Limite inférieure (a)</Label>
                  <Input
                    id="lower-limit"
                    value={lowerLimit}
                    onChange={(e) => setLowerLimit(e.target.value)}
                    placeholder="0"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upper-limit">Limite supérieure (b)</Label>
                  <Input
                    id="upper-limit"
                    value={upperLimit}
                    onChange={(e) => setUpperLimit(e.target.value)}
                    placeholder="1"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={calculateDefiniteIntegral}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calcul en cours...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Calculer ∫[a,b] f(x) dx
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result Display */}
          {result && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-4">Résultat</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Intégrale:</p>
                    <LatexRenderer formula={result.integral} displayMode />
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Solution:</p>
                    <LatexRenderer formula={result.result} displayMode />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Étapes de calcul</h3>
                <div className="space-y-3">
                  {result.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <LatexRenderer formula={step} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Aide et Syntaxe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Fonctions supportées</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><LatexRenderer formula="x^n" className="inline-block" /> - Puissances</li>
                <li><LatexRenderer formula="sin(x), cos(x)" className="inline-block" /> - Trigonométrie</li>
                <li><LatexRenderer formula="exp(x), ln(x)" className="inline-block" /> - Exponentielles</li>
                <li><LatexRenderer formula="sqrt(x)" className="inline-block" /> - Racine carrée</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Exemples</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><LatexRenderer formula="x^2 \rightarrow \int x^2 dx = \frac{x^3}{3} + C" className="inline-block" /></li>
                <li><LatexRenderer formula="sin(x) \rightarrow \int sin(x) dx = -cos(x) + C" className="inline-block" /></li>
                <li><LatexRenderer formula="1/x \rightarrow \int \frac{1}{x} dx = ln|x| + C" className="inline-block" /></li>
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
