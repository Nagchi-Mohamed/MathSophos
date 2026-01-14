'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Grid, Plus, Minus, X, ArrowLeftRight, Trash2 } from 'lucide-react';
import { LatexRenderer } from '@/components/latex-renderer';
import { mathEngine } from '@/lib/math-engine';

type Matrix = number[][];

export function MatrixCalculator() {
  const [rowsA, setRowsA] = useState(3);
  const [colsA, setColsA] = useState(3);
  const [matrixA, setMatrixA] = useState<Matrix>(Array(3).fill(0).map(() => Array(3).fill(0)));

  const [rowsB, setRowsB] = useState(3);
  const [colsB, setColsB] = useState(3);
  const [matrixB, setMatrixB] = useState<Matrix>(Array(3).fill(0).map(() => Array(3).fill(0)));

  const [result, setResult] = useState<{ type: string; value: string | Matrix } | null>(null);
  const [error, setError] = useState('');

  const updateMatrixSize = (matrix: 'A' | 'B', rows: number, cols: number) => {
    const newMatrix = Array(rows).fill(0).map(() => Array(cols).fill(0));
    if (matrix === 'A') {
      setRowsA(rows);
      setColsA(cols);
      setMatrixA(newMatrix);
    } else {
      setRowsB(rows);
      setColsB(cols);
      setMatrixB(newMatrix);
    }
    setResult(null);
    setError('');
  };

  const updateCellValue = (matrix: 'A' | 'B', row: number, col: number, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    if (matrix === 'A') {
      const newMatrix = [...matrixA];
      newMatrix[row] = [...newMatrix[row]];
      newMatrix[row][col] = numValue;
      setMatrixA(newMatrix);
    } else {
      const newMatrix = [...matrixB];
      newMatrix[row] = [...newMatrix[row]];
      newMatrix[row][col] = numValue;
      setMatrixB(newMatrix);
    }
  };

  const renderMatrixInput = (matrix: 'A' | 'B', data: Matrix, rows: number, cols: number) => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Lignes:</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={rows}
            onChange={(e) => updateMatrixSize(matrix, parseInt(e.target.value) || 1, cols)}
            className="w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>Colonnes:</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={cols}
            onChange={(e) => updateMatrixSize(matrix, rows, parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
      </div>
      <div className="overflow-x-auto p-2 border rounded-lg bg-muted/30">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))` }}
        >
          {data.map((row, i) => (
            row.map((cell, j) => (
              <Input
                key={`${i}-${j}`}
                type="number"
                value={cell}
                onChange={(e) => updateCellValue(matrix, i, j, e.target.value)}
                className="text-center"
              />
            ))
          ))}
        </div>
      </div>
    </div>
  );

  const formatMatrixLatex = (m: Matrix) => {
    return `\\begin{pmatrix} ${m.map(row => row.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
  };

  const calculate = (operation: string) => {
    try {
      setError('');
      let res: any;
      let type = '';

      switch (operation) {
        case 'detA':
          if (rowsA !== colsA) throw new Error('La matrice doit être carrée pour calculer le déterminant');
          res = mathEngine.matrixDeterminant(matrixA);
          type = 'Déterminant (A)';
          break;
        case 'invA':
          if (rowsA !== colsA) throw new Error('La matrice doit être carrée pour calculer l\'inverse');
          res = mathEngine.matrixInverse(matrixA);
          type = 'Inverse (A)';
          break;
        case 'transA':
          res = mathEngine.matrixTranspose(matrixA);
          type = 'Transposée (A)';
          break;
        case 'add':
          if (rowsA !== rowsB || colsA !== colsB) throw new Error('Les dimensions des matrices doivent être identiques');
          res = mathEngine.matrixAdd(matrixA, matrixB);
          type = 'A + B';
          break;
        case 'sub':
          if (rowsA !== rowsB || colsA !== colsB) throw new Error('Les dimensions des matrices doivent être identiques');
          res = mathEngine.matrixSubtract(matrixA, matrixB);
          type = 'A - B';
          break;
        case 'mul':
          if (colsA !== rowsB) throw new Error('Le nombre de colonnes de A doit être égal au nombre de lignes de B');
          res = mathEngine.matrixMultiply(matrixA, matrixB);
          type = 'A × B';
          break;
      }

      setResult({ type, value: res });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setResult(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Calculateur de Matrices
        </h1>
        <p className="text-muted-foreground">
          Opérations matricielles avancées : déterminant, inverse, multiplication...
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Matrice A</CardTitle>
          </CardHeader>
          <CardContent>
            {renderMatrixInput('A', matrixA, rowsA, colsA)}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={() => calculate('detA')}>Det(A)</Button>
              <Button size="sm" variant="outline" onClick={() => calculate('invA')}>Inv(A)</Button>
              <Button size="sm" variant="outline" onClick={() => calculate('transA')}>Trans(A)</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matrice B</CardTitle>
          </CardHeader>
          <CardContent>
            {renderMatrixInput('B', matrixB, rowsB, colsB)}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-muted-foreground italic">Utilisée pour les opérations binaires</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opérations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 justify-center">
          <Button onClick={() => calculate('add')} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> A + B
          </Button>
          <Button onClick={() => calculate('sub')} className="bg-primary hover:bg-primary/90">
            <Minus className="w-4 h-4 mr-2" /> A - B
          </Button>
          <Button onClick={() => calculate('mul')} className="bg-primary hover:bg-primary/90">
            <X className="w-4 h-4 mr-2" /> A × B
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Résultat : {result.type}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-4 bg-background rounded-lg shadow-inner">
              {typeof result.value === 'number' ? (
                <span className="text-2xl font-bold">{result.value}</span>
              ) : (
                <LatexRenderer
                  formula={`\\[ ${formatMatrixLatex(result.value as Matrix)} \\]`}
                  displayMode={true}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
