"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Download,
  Share2,
  X,
  Clock,
  Users,
  MessageSquare,
  Bookmark,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionEvent {
  timestamp: number;
  type: "join" | "leave" | "message" | "reaction" | "poll" | "quiz" | "share";
  participant: string;
  data?: any;
}

interface Highlight {
  timestamp: number;
  duration: number;
  title: string;
  type: "important" | "question" | "discussion" | "activity";
}

interface SessionReplayProps {
  sessionId: string;
  duration: number;
  events: SessionEvent[];
  highlights: Highlight[];
  onClose: () => void;
}

export function SessionReplay({
  sessionId,
  duration,
  events,
  highlights,
  onClose,
}: SessionReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTimeline, setShowTimeline] = useState(true);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + (100 * playbackSpeed) / 1000;
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkip = (seconds: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(duration, prev + seconds)));
  };

  const jumpToHighlight = (highlight: Highlight) => {
    setCurrentTime(highlight.timestamp);
    setSelectedHighlight(highlight);
    setIsPlaying(true);
  };

  const getCurrentEvents = () => {
    return events.filter(
      (event) =>
        event.timestamp >= currentTime - 5 && event.timestamp <= currentTime
    );
  };

  const exportHighlights = () => {
    const text = highlights
      .map(
        (h) =>
          `[${formatTime(h.timestamp)}] ${h.title} (${h.type}) - ${h.duration}s`
      )
      .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-highlights-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Moments forts exportés");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Play className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Replay de Session
              </h2>
              <p className="text-sm text-zinc-400">
                Durée totale: {formatTime(duration)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                isPlaying
                  ? "bg-green-500/10 text-green-400 border-green-500/20 animate-pulse"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              )}
            >
              {isPlaying ? "En lecture" : "En pause"}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video/Content Area */}
          <div className="flex-1 flex flex-col bg-black">
            {/* Playback Area */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="text-center">
                <Clock className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-4xl font-bold text-white mb-2">
                  {formatTime(currentTime)}
                </p>
                <p className="text-zinc-400">
                  {Math.round((currentTime / duration) * 100)}% complété
                </p>
              </div>

              {/* Current Events Overlay */}
              <div className="absolute bottom-20 left-4 right-4">
                <ScrollArea className="max-h-32">
                  {getCurrentEvents().map((event, index) => (
                    <div
                      key={index}
                      className="mb-2 p-3 bg-zinc-900/80 backdrop-blur-sm rounded-lg border border-zinc-800"
                    >
                      <div className="flex items-center gap-2">
                        {event.type === "message" && (
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        )}
                        {event.type === "join" && (
                          <Users className="h-4 w-4 text-green-500" />
                        )}
                        {event.type === "leave" && (
                          <Users className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-white">
                          {event.participant}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-zinc-800">
              {/* Timeline */}
              <div className="mb-4">
                <div className="relative">
                  <Slider
                    value={[currentTime]}
                    onValueChange={handleSeek}
                    max={duration}
                    step={1}
                    className="mb-2"
                  />
                  {/* Highlight Markers */}
                  <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
                    {highlights.map((highlight, index) => (
                      <div
                        key={index}
                        className={cn(
                          "absolute h-2 rounded-full cursor-pointer pointer-events-auto",
                          highlight.type === "important" && "bg-red-500",
                          highlight.type === "question" && "bg-yellow-500",
                          highlight.type === "discussion" && "bg-blue-500",
                          highlight.type === "activity" && "bg-green-500"
                        )}
                        style={{
                          left: `${(highlight.timestamp / duration) * 100}%`,
                          width: `${(highlight.duration / duration) * 100}%`,
                        }}
                        onClick={() => jumpToHighlight(highlight)}
                        title={highlight.title}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(-10)}
                  >
                    <Rewind className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(-5)}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handlePlayPause}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(5)}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSkip(10)}
                  >
                    <FastForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">Vitesse:</span>
                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm text-white"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>
                  </div>

                  <Button variant="ghost" size="sm" onClick={exportHighlights}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights Sidebar */}
          <div className="w-80 border-l border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white mb-1">
                Moments Forts
              </h3>
              <p className="text-xs text-zinc-400">
                {highlights.length} moment{highlights.length !== 1 ? "s" : ""} identifié
                {highlights.length !== 1 ? "s" : ""}
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {highlights.map((highlight, index) => (
                  <Card
                    key={index}
                    className={cn(
                      "bg-zinc-900 border-zinc-800 p-3 cursor-pointer hover:bg-zinc-800 transition-colors",
                      selectedHighlight === highlight && "ring-2 ring-blue-500"
                    )}
                    onClick={() => jumpToHighlight(highlight)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          highlight.type === "important" &&
                          "bg-red-500/10 text-red-400 border-red-500/20",
                          highlight.type === "question" &&
                          "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                          highlight.type === "discussion" &&
                          "bg-blue-500/10 text-blue-400 border-blue-500/20",
                          highlight.type === "activity" &&
                          "bg-green-500/10 text-green-400 border-green-500/20"
                        )}
                      >
                        {highlight.type}
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        {formatTime(highlight.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-white mb-1">{highlight.title}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      <span>{highlight.duration}s</span>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </Card>
    </div>
  );
}
