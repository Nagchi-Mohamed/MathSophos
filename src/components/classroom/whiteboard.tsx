"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Pencil,
  Eraser,
  Type,
  Square,
  Circle,
  ArrowRight,
  Trash2,
  Download,
  Undo,
  Redo,
  X,
  Sigma,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Room } from "livekit-client";
import katex from "katex";
import "katex/dist/katex.min.css";

interface WhiteboardProps {
  room: Room;
  isTeacher: boolean;
  onClose: () => void;
}

type Tool = "pen" | "eraser" | "text" | "rectangle" | "circle" | "arrow" | "math";
type DrawAction = {
  tool: Tool;
  points?: number[];
  color?: string;
  width?: number;
  text?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  latex?: string;
};

const COLORS = [
  "#000000", // Black
  "#FF0000", // Red
  "#0000FF", // Blue
  "#00FF00", // Green
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFFFFF", // White
];

export function Whiteboard({ room, isTeacher, onClose }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [showLatexInput, setShowLatexInput] = useState(false);
  const [latexInput, setLatexInput] = useState("");
  const [latexPosition, setLatexPosition] = useState({ x: 0, y: 0 });

  const currentPath = useRef<number[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Redraw canvas from history
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and reset
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Replay history
    history.slice(0, historyStep).forEach((action) => {
      if (action.tool === "pen" && action.points) {
        ctx.strokeStyle = action.color || "#000000";
        ctx.lineWidth = action.width || 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        for (let i = 0; i < action.points.length; i += 2) {
          if (i === 0) {
            ctx.moveTo(action.points[i], action.points[i + 1]);
          } else {
            ctx.lineTo(action.points[i], action.points[i + 1]);
          }
        }
        ctx.stroke();
      } else if (action.tool === "eraser" && action.points) {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = action.width || 20;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        for (let i = 0; i < action.points.length; i += 2) {
          if (i === 0) {
            ctx.moveTo(action.points[i], action.points[i + 1]);
          } else {
            ctx.lineTo(action.points[i], action.points[i + 1]);
          }
        }
        ctx.stroke();
      } else if (action.tool === "text" && action.text && action.x !== undefined && action.y !== undefined) {
        ctx.fillStyle = action.color || "#000000";
        ctx.font = `${action.width || 16}px Arial`;
        ctx.fillText(action.text, action.x, action.y);
      } else if (action.tool === "rectangle" && action.x !== undefined && action.y !== undefined && action.w !== undefined && action.h !== undefined) {
        ctx.strokeStyle = action.color || "#000000";
        ctx.lineWidth = action.width || 3;
        ctx.strokeRect(action.x, action.y, action.w, action.h);
      } else if (action.tool === "circle" && action.x !== undefined && action.y !== undefined && action.w !== undefined) {
        ctx.strokeStyle = action.color || "#000000";
        ctx.lineWidth = action.width || 3;
        ctx.beginPath();
        ctx.arc(action.x, action.y, action.w, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (action.tool === "math" && action.latex && action.x !== undefined && action.y !== undefined) {
        try {
          const html = katex.renderToString(action.latex, {
            throwOnError: false,
            displayMode: true,
          });
          // For canvas rendering, we'd need to convert HTML to canvas
          // For now, we'll render it as text
          ctx.fillStyle = action.color || "#000000";
          ctx.font = "20px Arial";
          ctx.fillText(action.latex, action.x, action.y);
        } catch (e) {
          console.error("KaTeX render error:", e);
        }
      }
    });
  }, [history, historyStep]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Broadcast drawing actions
  const broadcastAction = useCallback((action: DrawAction) => {
    if (!room) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ type: "whiteboard", action }));
    room.localParticipant.publishData(data, { reliable: true });
  }, [room]);

  // Listen for remote drawing actions
  useEffect(() => {
    if (!room) return;

    const onDataReceived = (payload: Uint8Array) => {
      const decoder = new TextDecoder();
      const message = decoder.decode(payload);
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === "whiteboard") {
          setHistory((prev) => [...prev, parsed.action]);
          setHistoryStep((prev) => prev + 1);
        }
      } catch (e) {
        console.error("Failed to parse whiteboard data:", e);
      }
    };

    room.on("dataReceived", onDataReceived as any);
    return () => {
      room.off("dataReceived", onDataReceived as any);
    };
  }, [room]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (e.nativeEvent.type.startsWith('touch')) {
      // Prevent scrolling while drawing
      // e.preventDefault(); // Using CSS touch-action: none instead for better performance
    }

    if (!isTeacher) return;

    const { x, y } = getCoordinates(e);

    if (tool === "math") {
      setLatexPosition({ x, y });
      setShowLatexInput(true);
      return;
    }

    setIsDrawing(true);
    currentPath.current = [x, y];
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isTeacher) return;

    const { x, y } = getCoordinates(e);

    currentPath.current.push(x, y);

    // Draw preview
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "pen") {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const len = currentPath.current.length;
      if (len >= 4) {
        ctx.beginPath();
        ctx.moveTo(currentPath.current[len - 4], currentPath.current[len - 3]);
        ctx.lineTo(currentPath.current[len - 2], currentPath.current[len - 1]);
        ctx.stroke();
      }
    } else if (tool === "eraser") {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = lineWidth * 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const len = currentPath.current.length;
      if (len >= 4) {
        ctx.beginPath();
        ctx.moveTo(currentPath.current[len - 4], currentPath.current[len - 3]);
        ctx.lineTo(currentPath.current[len - 2], currentPath.current[len - 1]);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || !isTeacher) return;

    setIsDrawing(false);

    if (currentPath.current.length > 0) {
      const action: DrawAction = {
        tool,
        points: [...currentPath.current],
        color,
        width: tool === "eraser" ? lineWidth * 3 : lineWidth,
      };

      setHistory((prev) => [...prev.slice(0, historyStep), action]);
      setHistoryStep((prev) => prev + 1);
      broadcastAction(action);
    }

    currentPath.current = [];
  };

  const addLatex = () => {
    if (!latexInput.trim()) return;

    const action: DrawAction = {
      tool: "math",
      latex: latexInput,
      x: latexPosition.x,
      y: latexPosition.y,
      color,
    };

    setHistory((prev) => [...prev.slice(0, historyStep), action]);
    setHistoryStep((prev) => prev + 1);
    broadcastAction(action);

    setLatexInput("");
    setShowLatexInput(false);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep((prev) => prev - 1);
    }
  };

  const redo = () => {
    if (historyStep < history.length) {
      setHistoryStep((prev) => prev + 1);
    }
  };

  const clearCanvas = () => {
    setHistory([]);
    setHistoryStep(0);
    broadcastAction({ tool: "pen", points: [] }); // Signal clear
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `whiteboard-${new Date().toISOString()}.png`;
    a.click();
    toast.success("Whiteboard downloaded");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Whiteboard</h2>
          <div className="flex items-center gap-2">
            {isTeacher && (
              <>
                <Button variant="outline" size="sm" onClick={undo} disabled={historyStep === 0}>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={redo} disabled={historyStep === history.length}>
                  <Redo className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={clearCanvas}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCanvas}>
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        {isTeacher && (
          <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
            <div className="flex gap-1">
              <Button
                variant={tool === "pen" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("pen")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === "eraser" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("eraser")}
              >
                <Eraser className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === "rectangle" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("rectangle")}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === "circle" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("circle")}
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === "math" ? "default" : "outline"}
                size="sm"
                onClick={() => setTool("math")}
              >
                <Sigma className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Color:</span>
              <div className="flex gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={cn(
                      "w-6 h-6 rounded border-2",
                      color === c ? "border-blue-500 scale-110" : "border-gray-300"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-medium">Size:</span>
              <Slider
                value={[lineWidth]}
                onValueChange={([value]) => setLineWidth(value)}
                min={1}
                max={20}
                step={1}
                className="w-32"
              />
              <span className="text-sm text-gray-600 w-8">{lineWidth}</span>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />

          {/* LaTeX Input Modal */}
          {showLatexInput && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Enter LaTeX Formula</h3>
                <Input
                  value={latexInput}
                  onChange={(e) => setLatexInput(e.target.value)}
                  placeholder="e.g., x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
                  className="mb-4"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addLatex();
                    if (e.key === "Escape") setShowLatexInput(false);
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button onClick={addLatex} className="flex-1">Add</Button>
                  <Button variant="outline" onClick={() => setShowLatexInput(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isTeacher && (
          <div className="p-4 bg-yellow-50 border-t border-yellow-200 text-sm text-yellow-800">
            <strong>View-only mode.</strong> Only the teacher can draw on the whiteboard.
          </div>
        )}
      </div>
    </div>
  );
}
