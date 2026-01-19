"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Pencil,
  Square,
  Circle,
  Type,
  Eraser,
  Trash2,
  Download,
  Undo,
  Redo,
  MousePointer2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ScreenAnnotationProps {
  onClose: () => void;
}

type Tool = "pen" | "rectangle" | "circle" | "text" | "eraser" | "pointer";

interface DrawingElement {
  type: Tool;
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  lineWidth: number;
}

export function ScreenAnnotation({ onClose }: ScreenAnnotationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#FF0000");
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [history, setHistory] = useState<DrawingElement[][]>([]);
  const [historyStep, setHistoryStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all elements
    elements.forEach((element) => {
      drawElement(ctx, element);
    });

    // Draw current element
    if (currentElement) {
      drawElement(ctx, currentElement);
    }
  }, [elements, currentElement]);

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (element.type) {
      case "pen":
        if (element.points && element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x, element.points[0].y);
          for (let i = 1; i < element.points.length; i++) {
            ctx.lineTo(element.points[i].x, element.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case "rectangle":
        if (element.x !== undefined && element.y !== undefined && element.width && element.height) {
          ctx.strokeRect(element.x, element.y, element.width, element.height);
        }
        break;

      case "circle":
        if (element.x !== undefined && element.y !== undefined && element.width) {
          ctx.beginPath();
          ctx.arc(element.x, element.y, Math.abs(element.width), 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;

      case "text":
        if (element.x !== undefined && element.y !== undefined && element.text) {
          ctx.font = `${element.lineWidth * 8}px Arial`;
          ctx.fillStyle = element.color;
          ctx.fillText(element.text, element.x, element.y);
        }
        break;
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);

    if (tool === "pen") {
      setCurrentElement({
        type: "pen",
        points: [{ x, y }],
        color,
        lineWidth,
      });
    } else if (tool === "rectangle" || tool === "circle") {
      setCurrentElement({
        type: tool,
        x,
        y,
        width: 0,
        height: 0,
        color,
        lineWidth,
      });
    } else if (tool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        const newElement: DrawingElement = {
          type: "text",
          x,
          y,
          text,
          color,
          lineWidth,
        };
        setElements((prev) => [...prev, newElement]);
        saveToHistory([...elements, newElement]);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "pen") {
      setCurrentElement({
        ...currentElement,
        points: [...(currentElement.points || []), { x, y }],
      });
    } else if (tool === "rectangle") {
      setCurrentElement({
        ...currentElement,
        width: x - (currentElement.x || 0),
        height: y - (currentElement.y || 0),
      });
    } else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(x - (currentElement.x || 0), 2) + Math.pow(y - (currentElement.y || 0), 2)
      );
      setCurrentElement({
        ...currentElement,
        width: radius,
      });
    }
  };

  const stopDrawing = () => {
    if (currentElement) {
      const newElements = [...elements, currentElement];
      setElements(newElements);
      saveToHistory(newElements);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const saveToHistory = (newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setElements(history[historyStep - 1] || []);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setElements(history[historyStep + 1]);
    }
  };

  const clear = () => {
    setElements([]);
    setCurrentElement(null);
    saveToHistory([]);
    toast.success("Annotations cleared");
  };

  const downloadAnnotation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `annotation-${new Date().toISOString()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success("Annotation downloaded");
  };

  const colors = [
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFFFFF", // White
    "#000000", // Black
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm">
      {/* Toolbar */}
      <Card className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border-zinc-800 p-3 flex items-center gap-2 shadow-2xl">
        {/* Tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-zinc-700">
          <Button
            variant={tool === "pointer" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("pointer")}
            className={cn(tool === "pointer" && "bg-blue-600")}
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "pen" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("pen")}
            className={cn(tool === "pen" && "bg-blue-600")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "rectangle" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("rectangle")}
            className={cn(tool === "rectangle" && "bg-blue-600")}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "circle" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("circle")}
            className={cn(tool === "circle" && "bg-blue-600")}
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "text" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("text")}
            className={cn(tool === "text" && "bg-blue-600")}
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTool("eraser")}
            className={cn(tool === "eraser" && "bg-blue-600")}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1 pr-2 border-r border-zinc-700">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-all",
                color === c ? "border-white scale-110" : "border-zinc-600"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Line Width */}
        <div className="flex items-center gap-2 pr-2 border-r border-zinc-700">
          <span className="text-xs text-zinc-400">Size:</span>
          <Slider
            value={[lineWidth]}
            onValueChange={(value) => setLineWidth(value[0])}
            min={1}
            max={20}
            step={1}
            className="w-24"
          />
          <span className="text-xs text-white w-6">{lineWidth}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pr-2 border-r border-zinc-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyStep <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyStep >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clear}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadAnnotation}>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Close */}
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </Card>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0",
          tool === "pointer" ? "cursor-default" : "cursor-crosshair"
        )}
        onMouseDown={tool !== "pointer" ? startDrawing : undefined}
        onMouseMove={tool !== "pointer" ? draw : undefined}
        onMouseUp={tool !== "pointer" ? stopDrawing : undefined}
        onMouseLeave={tool !== "pointer" ? stopDrawing : undefined}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg">
        <p className="text-xs text-zinc-300">
          {tool === "pointer" && "Select pointer tool to stop annotating"}
          {tool === "pen" && "Click and drag to draw"}
          {tool === "rectangle" && "Click and drag to draw a rectangle"}
          {tool === "circle" && "Click and drag to draw a circle"}
          {tool === "text" && "Click to add text"}
          {tool === "eraser" && "Click to erase"}
        </p>
      </div>
    </div>
  );
}
