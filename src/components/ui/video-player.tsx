"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { X, Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  autoPlay?: boolean;
}

export function VideoPlayer({ src, title, isOpen, onClose, autoPlay = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setProgress(0);
      setIsPlaying(autoPlay);
    }
  }, [isOpen, src, autoPlay]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none text-white ring-0 outline-none w-[90vw] md:w-[80vw] lg:w-[70vw]">
        <DialogTitle className="sr-only">{title || "Lecteur vidéo"}</DialogTitle>
        <div className="relative aspect-video group">
          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="text-lg font-medium drop-shadow-md">{title || "Vidéo"}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-0">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedData={handleLoadedData}
            onClick={togglePlay}
            onError={(e) => {
              console.error("Video load error:", e);
              console.error("Video src:", src);
              setIsLoading(false);
            }}
          />

          {/* Controls Bottom Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer" onClick={(e) => {
              if (videoRef.current) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const newTime = (x / rect.width) * videoRef.current.duration;
                videoRef.current.currentTime = newTime;
              }
            }}>
              <div className="h-full bg-primary rounded-full relative" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/10 hover:text-white">
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>

                <div className="flex items-center gap-2 group/vol">
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/10 hover:text-white">
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => videoRef.current?.requestFullscreen()} className="text-white hover:bg-white/10 hover:text-white">
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
