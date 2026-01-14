'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Delete, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';

interface VirtualKeyboardProps {
  onInput: (value: string) => void;
  onDelete: () => void;
  onClear: () => void;
  className?: string;
}

export function VirtualKeyboard({ onInput, onDelete, onClear, className = '' }: VirtualKeyboardProps) {
  const [mode, setMode] = useState<'basic' | 'scientific' | 'greek'>('basic');
  const [isExpanded, setIsExpanded] = useState(true);

  const basicKeys = [
    ['7', '8', '9', '+', '('],
    ['4', '5', '6', '-', ')'],
    ['1', '2', '3', '*', '^'],
    ['0', '.', '=', '/', 'sqrt']
  ];

  const scientificKeys = [
    ['sin', 'cos', 'tan', 'log', 'ln'],
    ['asin', 'acos', 'atan', 'exp', 'abs'],
    ['pi', 'e', '!', 'deg', 'rad'],
    ['(', ')', '{', '}', 'mod']
  ];

  const greekKeys = [
    ['alpha', 'beta', 'gamma', 'delta', 'epsilon'],
    ['theta', 'lambda', 'mu', 'pi', 'rho'],
    ['sigma', 'tau', 'phi', 'omega', 'Delta'],
    ['sum', 'prod', 'int', 'lim', 'infty']
  ];

  const currentKeys = mode === 'basic' ? basicKeys : mode === 'scientific' ? scientificKeys : greekKeys;

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <ChevronUp className="w-4 h-4 mr-2" />
        Clavier Math
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-full max-w-md shadow-xl border-t-4 border-t-blue-500 ${className}`}>
      <div className="p-2 bg-gray-50 dark:bg-gray-800 border-b flex justify-between items-center">
        <div className="flex gap-1">
          <Button
            variant={mode === 'basic' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('basic')}
            className="text-xs"
          >
            Basique
          </Button>
          <Button
            variant={mode === 'scientific' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('scientific')}
            className="text-xs"
          >
            Science
          </Button>
          <Button
            variant={mode === 'greek' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setMode('greek')}
            className="text-xs"
          >
            Grec
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-2 grid gap-1">
        {currentKeys.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-5 gap-1">
            {row.map((key) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => onInput(key)}
                className="h-10 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {key === 'sqrt' ? '√' : key === 'pi' ? 'π' : key}
              </Button>
            ))}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-1 mt-1">
          <Button variant="destructive" size="sm" onClick={onClear}>
            Effacer Tout
          </Button>
          <Button variant="secondary" size="sm" onClick={onDelete}>
            <Delete className="w-4 h-4 mr-2" />
            Effacer
          </Button>
        </div>
      </div>
    </Card>
  );
}
