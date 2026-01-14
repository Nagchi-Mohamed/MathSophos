"use client";

import { useState } from "react";
import { LatexRenderer } from "@/components/latex-renderer";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const inlineMath = "$E = mc^2$";
const displayMath = "$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$";
const complexMath = "$$f(x) = \\begin{cases} x^2 & x > 0 \\\\ -x & x \\le 0 \\end{cases}$$";

const testCases = [
  {
    name: "Basic Tabular",
    content: `\\begin{tabular}{|c|c|}
a & b \\\\
c & d \\\\
\\end{tabular}`,
  },
  {
    name: "Tabular with hline",
    content: `\\begin{tabular}{|c|c|c|}
\\hline
x & 0 & +\\infty \\\\
\\hline
f'(x) & - & + \\\\
\\hline
\\end{tabular}`,
  },
  {
    name: "Array with vertical lines",
    content: `\\begin{array}{|c|c|c|}
\\hline
x & 0 & +\\infty \\\\
\\hline
f(x) & 0 & +\\infty \\\\
\\hline
\\end{array}`,
  },
  {
    name: "Variation Table",
    content: `\\begin{array}{|c|c|c|c|c|}
\\hline
x & -\\infty & 0 & \\alpha & +\\infty \\\\
\\hline
f'(x) & & - & 0 & + \\\\
\\hline
f(x) & +\\infty & \\searrow & f(\\alpha) & \\nearrow & +\\infty \\\\
\\hline
\\end{array}`,
  },
  {
    name: "pmatrix",
    content: `\\begin{pmatrix}
a & b \\\\
c & d \\\\
\\end{pmatrix}`,
  },
  {
    name: "bmatrix",
    content: `\\begin{bmatrix}
1 & 2 & 3 \\\\
4 & 5 & 6 \\\\
\\end{bmatrix}`,
  },
  {
    name: "Cases environment",
    content: `f(x) = \\begin{cases}
x^2 & \\text{if } x > 0 \\\\
-x & \\text{if } x \\leq 0 \\\\
\\end{cases}`,
  },
  {
    name: "Align environment",
    content: `\\begin{align}
x &= a + b \\\\
y &= c + d \\\\
\\end{align}`,
  },
  {
    name: "Complex nested",
    content: `\\begin{array}{c}
\\begin{pmatrix}
a & b \\\\
c & d \\\\
\\end{pmatrix}
\\end{array}`,
  },
];



export default function TestMathRenderingPage() {
  const [customInput, setCustomInput] = useState("");
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Math Rendering Test Suite</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Test Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testCases.map((test, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{test.name}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCustomInput(test.content);
                      setSelectedTest(test.name);
                    }}
                  >
                    Load
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded overflow-x-auto">
                  {test.content.substring(0, 100)}
                  {test.content.length > 100 ? "..." : ""}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Render Area */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTest ? `Rendering: ${selectedTest}` : "Custom Input"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter LaTeX code here..."
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="border rounded-lg p-4 bg-muted/50 min-h-[300px]">
              <MarkdownRenderer content={customInput} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Tests Preview */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Tests Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <h2 className="text-xl font-semibold mb-2">Inline Math</h2>
          <div className="p-4 bg-muted rounded-md mb-2">
            <LatexRenderer formula={inlineMath} />
          </div>
          <p className="text-sm text-muted-foreground mb-4">Code: {inlineMath}</p>

          <h2 className="text-xl font-semibold mb-2">Display Math</h2>
          <div className="p-4 bg-muted rounded-md mb-2">
            <LatexRenderer formula={displayMath} displayMode={true} />
          </div>
          <p className="text-sm text-muted-foreground mb-4">Code: {displayMath}</p>

          <h2 className="text-xl font-semibold mb-2">Complex Math</h2>
          <div className="p-4 bg-muted rounded-md mb-2">
            <LatexRenderer formula={complexMath} displayMode={true} />
          </div>
          <p className="text-sm text-muted-foreground mb-4">Code: {complexMath}</p>
        </CardContent>
      </Card>
    </div>
  );
}

