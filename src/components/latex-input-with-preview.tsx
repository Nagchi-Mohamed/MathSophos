"use client";

import { LatexRenderer } from "@/components/latex-renderer";

interface LatexInputWithPreviewProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  examples?: string[];
}

/**
 * Input component with live KaTeX preview
 */
export function LatexInputWithPreview({
  label,
  placeholder = 'Entrez une formule...',
  value,
  onChange,
  className = '',
  examples = []
}: LatexInputWithPreviewProps) {
  const handleExampleClick = (example: string) => {
    onChange(example);
  };

  return (
    <div className={`math-input-container ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <div className="space-y-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
        />

        {value && (
          <div className="bg-muted/30 border border-border rounded-md p-3">
            <div className="text-sm text-muted-foreground mb-1">Prévisualisation:</div>
            <LatexRenderer formula={value} displayMode={true} />
          </div>
        )}

        {examples.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Exemples rapides:</div>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
