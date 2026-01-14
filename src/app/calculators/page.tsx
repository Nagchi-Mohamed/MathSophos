'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, FunctionSquare, Sigma, TrendingUp, Grid } from 'lucide-react';

const calculators = [
  {
    id: 'derivative',
    title: 'Calculateur de Dérivées',
    description: 'Calculez les dérivées de fonctions mathématiques',
    icon: TrendingUp,
    href: '/calculators/derivative',
    color: 'bg-blue-500'
  },
  {
    id: 'integral',
    title: 'Calculateur d\'Intégrales',
    description: 'Calculez les intégrales définies et indéfinies',
    icon: Sigma,
    href: '/calculators/integral',
    color: 'bg-green-500'
  },
  {
    id: 'algebra',
    title: 'Calculateur d\'Algèbre',
    description: 'Résolvez des équations algébriques avec étapes détaillées',
    icon: FunctionSquare,
    href: '/calculators/algebra',
    color: 'bg-orange-500'
  },
  {
    id: 'scientific',
    title: 'Calculateur Scientifique',
    description: 'Calculatrice scientifique avec fonctions avancées',
    icon: Calculator,
    href: '/calculators/scientific',
    color: 'bg-purple-500'
  },
  {
    id: 'matrix',
    title: 'Calculateur de Matrices',
    description: 'Opérations sur les matrices : déterminant, inverse, produit...',
    icon: Grid,
    href: '/calculators/matrix',
    color: 'bg-indigo-500'
  }
];

export default function CalculatorsPage() {
  const [selectedCalculator, setSelectedCalculator] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Calculateurs Mathématiques
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Découvrez notre collection complète de calculateurs mathématiques avec rendu MathJax,
            calculs précis et explications détaillées.
          </p>
        </div>

        {/* Calculators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {calculators.map((calculator) => {
            const IconComponent = calculator.icon;
            return (
              <Card
                key={calculator.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => setSelectedCalculator(calculator.id)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${calculator.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                    {calculator.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {calculator.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link href={calculator.href}>
                    <Button className="w-full group-hover:bg-primary/90 transition-colors">
                      Utiliser ce calculateur
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Fonctionnalités Avancées
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rendu MathJax</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Formules mathématiques parfaitement rendues
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <FunctionSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Calculs Précis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Algorithmes mathématiques avancés
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sigma className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Étapes Détaillées</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Explications pas à pas des calculs
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Historique</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Sauvegarde de vos calculs précédents
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
