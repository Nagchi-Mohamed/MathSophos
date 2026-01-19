"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MoreVertical,
  Hand,
  MessageSquare,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";

interface MobileControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  hasUnreadMessages: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleHand: () => void;
  onLeave: () => void;
  onOpenChat: () => void;
  onOpenParticipants: () => void;
  onOpenMore: () => void;
}

export function MobileControls({
  isAudioEnabled,
  isVideoEnabled,
  isHandRaised,
  hasUnreadMessages,
  onToggleAudio,
  onToggleVideo,
  onToggleHand,
  onLeave,
  onOpenChat,
  onOpenParticipants,
  onOpenMore,
}: MobileControlsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    const checkActivity = setInterval(() => {
      if (Date.now() - lastInteraction > 3000) {
        setIsVisible(false);
      }
    }, 1000);

    const handleInteraction = () => {
      setLastInteraction(Date.now());
      setIsVisible(true);
    };

    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("click", handleInteraction);

    return () => {
      clearInterval(checkActivity);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };
  }, [lastInteraction]);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 p-4 transition-transform duration-300 z-50",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      {/* Main Controls Bar */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          {/* Leave Button */}
          <Button
            size="icon"
            variant="destructive"
            onClick={onLeave}
            className="h-12 w-12 rounded-full shadow-lg"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>

          {/* Video Toggle */}
          <Button
            size="icon"
            variant={isVideoEnabled ? "secondary" : "destructive"}
            onClick={onToggleVideo}
            className={cn(
              "h-12 w-12 rounded-full",
              !isVideoEnabled && "bg-red-500/10 text-red-500 hover:bg-red-500/20"
            )}
          >
            {isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          {/* Audio Toggle */}
          <Button
            size="icon"
            variant={isAudioEnabled ? "secondary" : "destructive"}
            onClick={onToggleAudio}
            className={cn(
              "h-12 w-12 rounded-full",
              !isAudioEnabled && "bg-red-500/10 text-red-500 hover:bg-red-500/20"
            )}
          >
            {isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          {/* Raise Hand */}
          <Button
            size="icon"
            variant={isHandRaised ? "default" : "secondary"}
            onClick={onToggleHand}
            className={cn(
              "h-12 w-12 rounded-full",
              isHandRaised && "bg-blue-600 text-white"
            )}
          >
            <Hand className="h-5 w-5" />
          </Button>

          {/* More Menu */}
          <Button
            size="icon"
            variant="secondary"
            onClick={onOpenMore}
            className="h-12 w-12 rounded-full relative"
          >
            <MoreVertical className="h-5 w-5" />
            {hasUnreadMessages && (
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-zinc-900" />
            )}
          </Button>
        </div>

        {/* Bottom Tab Bar */}
        <div className="flex items-center justify-around mt-4 pt-4 border-t border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenParticipants}
            className="flex flex-col items-center gap-1 h-auto py-2 text-zinc-400 hover:text-white"
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">Participants</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenChat}
            className="flex flex-col items-center gap-1 h-auto py-2 text-zinc-400 hover:text-white relative"
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5" />
              {hasUnreadMessages && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </div>
            <span className="text-xs">Chat</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
