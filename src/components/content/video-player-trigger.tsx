"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { VideoPlayer } from "@/components/ui/video-player";

interface VideoPlayerTriggerProps {
  src: string;
  title?: string;
}

export function VideoPlayerTrigger({ src, title }: VideoPlayerTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // If title is the URL itself (common with autolinking), show a generic "Watch Video" label
  const displayTitle = title && title !== src ? title : "Regarder le cours vidéo";

  return (
    <>
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Prevent parent clicks (like forum card nav)
          setIsOpen(true);
        }}
        className="group relative w-full max-w-sm aspect-video bg-slate-900 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary/50 transition-all my-4 shadow-md inline-flex flex-col items-center justify-center border border-slate-800"
      >
        {/* Video Thumbnail (First frame) */}
        <video
          src={`${src}#t=0.1`}
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none"
          preload="metadata"
          muted
          playsInline
        />

        {/* Play Button Overlay */}
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none">
          <span className="h-12 w-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </span>

        {/* Optional Title Overlay at bottom */}
        {title && title !== src && (
          <span className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            <span className="text-white text-sm font-medium line-clamp-1">{title}</span>
          </span>
        )}
      </span>

      <VideoPlayer
        src={src}
        title={displayTitle}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        autoPlay={true}
      />
    </>
  );
}
