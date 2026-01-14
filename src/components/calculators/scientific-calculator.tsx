'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Delete, RotateCcw, Equal } from 'lucide-react';
import { VirtualKeyboard } from './virtual-keyboard';
import { LatexRenderer } from '@/components/latex-renderer';

export function ScientificCalculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const appendToExpression = (value: string) => {
    setExpression(prev => prev + value);
    setError('');
  };

  const clearExpression = () => {
    setExpression('');
    setResult('');
    setError('');
  };

  const deleteLastChar = () => {
    setExpression(prev => prev.slice(0, -1));
    setError('');
  };

  const calculateResult = () => {
    if (!expression.trim()) {
      setError('Veuillez entrer une expression');
      return;
    }

    try {
      // Replace mathematical constants and functions
      let processedExpression = expression
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/exp\(/g, 'Math.exp(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/\^/g, '**');

      // Evaluate the expression safely
      const calculatedResult = Function('"use strict"; return (' + processedExpression + ')')();

      if (isNaN(calculatedResult) || !isFinite(calculatedResult)) {
        throw new Error('Résultat invalide');
      }

      setResult(calculatedResult.toString());
      setError('');
    } catch (err) {
      setError('Expression invalide');
      setResult('');
    }
  };

  const scientificButtons = [
    { label: 'sin', value: 'sin(', className: 'col-span-1' },
    { label: 'cos', value: 'cos(', className: 'col-span-1' },
    { label: 'tan', value: 'tan(', className: 'col-span-1' },
    { label: 'ln', value: 'ln(', className: 'col-span-1' },
    { label: 'log', value: 'log(', className: 'col-span-1' },
    { label: 'exp', value: 'exp(', className: 'col-span-1' },
    { label: '√', value: 'sqrt(', className: 'col-span-1' },
    { label: 'π', value: 'π', className: 'col-span-1' },
    { label: 'e', value: 'e', className: 'col-span-1' },
    { label: '^', value: '^', className: 'col-span-1' },
  ];

  const numberButtons = [
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '÷', value: '/', className: 'bg-orange-500 hover:bg-orange-600' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '×', value: '*', className: 'bg-orange-500 hover:bg-orange-600' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '-', value: '-', className: 'bg-orange-500 hover:bg-orange-600' },
    { label: '0', value: '0', className: 'col-span-2' },
    { label: '.', value: '.' },
    { label: '+', value: '+', className: 'bg-orange-500 hover:bg-orange-600' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Calculateur Scientifique
        </h1>
        <p className="text-muted-foreground">
          Calculez des expressions mathématiques complexes avec fonctions scientifiques
        </p>
      </div>

      {/* Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculateur Scientifique
          </CardTitle>
          <CardDescription>
            Utilisez les boutons ou tapez directement votre expression
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display */}
          <div className="space-y-2">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Expression:</div>
              <Input
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="Entrez votre expression..."
                className="text-lg font-mono bg-background"
              />
            </div>

            {result && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="text-sm text-primary mb-1">Résultat:</div>
                <div className="text-xl font-bold text-primary">
                  {result}
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={clearExpression}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Effacer
            </Button>
            <Button
              onClick={deleteLastChar}
              variant="outline"
            >
              <Delete className="w-4 h-4" />
            </Button>
            <Button
              onClick={calculateResult}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Equal className="w-4 h-4 mr-2" />
              Calculer
            </Button>
          </div>

          {/* Scientific Functions */}
          <div className="grid grid-cols-5 gap-2">
            {scientificButtons.map((btn) => (
              <Button
                key={btn.label}
                onClick={() => appendToExpression(btn.value)}
                variant="outline"
                className={`h-12 ${btn.className || ''}`}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Numbers and Basic Operations */}
          <div className="grid grid-cols-4 gap-2">
            {numberButtons.map((btn) => (
              <Button
                key={btn.label}
                onClick={() => appendToExpression(btn.value)}
                className={`h-12 ${btn.className || ''}`}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {/* Parentheses */}
          <div className="flex gap-2">
            <Button
              onClick={() => appendToExpression('(')}
              variant="outline"
              className="flex-1 h-12"
            >
              (
            </Button>
            <Button
              onClick={() => appendToExpression(')')}
              variant="outline"
              className="flex-1 h-12"
            >
              )
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Aide et Syntaxe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Fonctions disponibles</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><LatexRenderer formula="sin(x)" className="inline-block" /> - Sinus</li>
                <li><LatexRenderer formula="cos(x)" className="inline-block" /> - Cosinus</li>
                <li><LatexRenderer formula="tan(x)" className="inline-block" /> - Tangente</li>
                <li><LatexRenderer formula="ln(x)" className="inline-block" /> - Logarithme népérien</li>
                <li><LatexRenderer formula="log(x)" className="inline-block" /> - Logarithme décimal</li>
                <li><LatexRenderer formula="exp(x)" className="inline-block" /> - Exponentielle</li>
                <li><LatexRenderer formula="sqrt(x)" className="inline-block" /> - Racine carrée</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Constantes et opérateurs</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><LatexRenderer formula="\pi" className="inline-block" /> - Nombre π (3.14159...)</li>
                <li><LatexRenderer formula="e" className="inline-block" /> - Nombre e (2.71828...)</li>
                <li><LatexRenderer formula="\wedge" className="inline-block" /> - Puissance (ex: 2^3 = 8)</li>
                <li><LatexRenderer formula="()" className="inline-block" /> - Parenthèses pour la priorité</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Exemples</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li><LatexRenderer formula="sin(\pi/2) = 1" className="inline-block" /></li>
              <li><LatexRenderer formula="\sqrt{16} + 2^3 = 4 + 8 = 12" className="inline-block" /></li>
              <li><LatexRenderer formula="ln(e^2) = 2" className="inline-block" /></li>
              <li><LatexRenderer formula="cos(0) \times \pi = 1 \times 3.14159... = 3.14159..." className="inline-block" /></li>
            </ul>
          </div>
        </CardContent>
      </Card>
      {/* Virtual Keyboard */}
      <VirtualKeyboard
        onInput={appendToExpression}
        onDelete={deleteLastChar}
        onClear={clearExpression}
      />
    </div>
  );
}
