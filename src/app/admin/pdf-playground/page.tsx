
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function PdfPlaygroundPage() {
  const [content, setContent] = useState("# Hello World\n\nThis is a sample PDF document.\n\n## Math Example\n\nLet $f(x) = x^2 + 2x + 1$.\n\n$$ \\int_0^\\infty e^{-x} dx = 1 $$");
  const [title, setTitle] = useState("Test Document");
  const [type, setType] = useState("custom");
  const [meta, setMeta] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom",
          title,
          content,
          metadata: meta
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Generation failed with unknown error");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "playground-test.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">PDF Generator Playground</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Document Title</Label>
                <Input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Markdown</SelectItem>
                    <SelectItem value="lesson">Lesson (Real DB ID needed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
              <div className="space-y-2">
                <Label>Metadata: Level</Label>
                <Input placeholder="e.g. 2BAC" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeta({ ...meta, level: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Metadata: Stream</Label>
                <Input placeholder="e.g. SC_PHYSIQUE" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeta({ ...meta, stream: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Metadata: Semester</Label>
                <Input placeholder="e.g. 1" type="number" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeta({ ...meta, semester: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Metadata: Category</Label>
                <Input placeholder="e.g. ANALYSE" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeta({ ...meta, category: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Metadata: Professor</Label>
                <Input placeholder="Prof: Mohamed Nagchi" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeta({ ...meta, professor: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Content (Markdown & LaTeX)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

// Simple Input component helper if not imported
function Input({ value, onChange, className, ...props }: any) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      value={value}
      onChange={onChange}
      {...props}
    />
  )
}
