import { MatrixCalculator } from '@/components/calculators/matrix-calculator';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculateur de Matrices | MathSophos',
  description: 'Effectuez des opérations matricielles complexes : déterminant, inverse, multiplication, etc.',
};

export default function MatrixCalculatorPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <MatrixCalculator />
    </div>
  );
}
