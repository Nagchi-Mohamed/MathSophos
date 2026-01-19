"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  PictureInPicture2,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Pin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PiPModeProps {
  videoElement: HTMLVideoElement | null;
  participantName: string;
  onClose: () => void;
}

export function PictureInPictureMode({ videoElement, participantName, onClose }: PiPModeProps) {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 280 });
  const [size, setSize] = useState({ width: 400, height: 225 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Enable browser's native PiP if supported
  const enableNativePiP = useCallback(async () => {
    if (!videoElement) {
      toast.error("Aucune vidéo disponible");
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoElement.requestPictureInPicture();
        toast.success("Mode Picture-in-Picture activé");
      }
    } catch (error) {
      console.error("PiP error:", error);
      toast.error("Picture-in-Picture non supporté");
    }
  }, [videoElement]);

  // Custom PiP implementation
  const toggleCustomPiP = useCallback(() => {
    setIsActive(!isActive);
    if (!isActive) {
      toast.success("Mini-lecteur activé");
    }
  }, [isActive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPinned) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || isPinned) return;

    const newX = e.clientX - dragRef.current.startX;
    const newY = e.clientY - dragRef.current.startY;

    // Keep within viewport
    const maxX = window.innerWidth - size.width;
    const maxY = window.innerHeight - size.height;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging, isPinned, size]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const toggleSize = () => {
    if (size.width === 400) {
      setSize({ width: 600, height: 338 });
    } else {
      setSize({ width: 400, height: 225 });
    }
  };

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-[100] bg-black rounded-lg shadow-2xl overflow-hidden transition-all",
        isDragging && "cursor-grabbing",
        isPinned && "ring-2 ring-blue-500"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      {/* Drag Handle */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between px-2 opacity-0 hover:opacity-100 transition-opacity",
          !isPinned && "cursor-grab active:cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
      >
        <span className="text-xs text-white font-medium truncate">
          {participantName}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPinned(!isPinned)}
            className="h-6 w-6 p-0 hover:bg-white/10"
          >
            <Pin className={cn("h-3 w-3", isPinned && "text-blue-500")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSize}
            className="h-6 w-6 p-0 hover:bg-white/10"
          >
            {size.width === 400 ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsActive(false);
              onClose();
            }}
            className="h-6 w-6 p-0 hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
        {videoElement ? (
          <video
            ref={(el) => {
              if (el && videoElement.srcObject) {
                el.srcObject = videoElement.srcObject;
              }
            }}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-zinc-500 text-sm">Aucune vidéo</div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMuted(!isMuted)}
          className="h-8 w-8 p-0 hover:bg-white/10"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={enableNativePiP}
          className="h-8 w-8 p-0 hover:bg-white/10"
        >
          <PictureInPicture2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Resize Handle */}
      {!isPinned && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
          }}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/30 rounded-sm" />
        </div>
      )}
    </div>
  );
}

// PiP Toggle Button Component
export function PiPToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="gap-2"
      title="Picture-in-Picture"
    >
      <PictureInPicture2 className="h-4 w-4" />
      <span className="hidden md:inline">Mini-lecteur</span>
    </Button>
  );
}
