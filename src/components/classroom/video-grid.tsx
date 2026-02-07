"use client";

import { useState, useEffect, useRef } from "react";
import { Participant, Track } from "livekit-client";
import {
  useRemoteParticipants,
  useLocalParticipant,
  VideoTrack,
  AudioTrack,
  ParticipantTile,
} from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Pin,
  Maximize,
  Minimize,
  MoreVertical,
  User,
} from "lucide-react";

interface VideoGridProps {
  viewMode: "gallery" | "speaker";
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isMobile?: boolean;
}

export function VideoGrid({
  viewMode,
  isFullscreen,
  onToggleFullscreen,
  isMobile = false,
}: VideoGridProps) {
  const participants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();
  const [pinnedParticipant, setPinnedParticipant] = useState<Participant | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<Participant | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Calculate grid layout
  const getGridLayout = () => {
    const count = participants.length + 1; // +1 for local participant

    if (isMobile) {
      // Mobile: simpler layouts
      if (count === 1) return "grid-cols-1";
      if (count === 2) return "grid-cols-1";
      return "grid-cols-2";
    }

    // Desktop: Google Meet style
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    if (count <= 12) return "grid-cols-4";
    if (count <= 16) return "grid-cols-4";
    return "grid-cols-5";
  };

  // Calculate tile aspect ratio
  const getTileAspectRatio = () => {
    const count = participants.length + 1;
    if (count <= 2) return "aspect-video"; // 16:9
    if (count <= 6) return "aspect-video";
    return "aspect-square"; // 1:1 for many participants
  };

  // Detect active speaker
  useEffect(() => {
    const handleSpeaking = (participant: Participant) => {
      setActiveSpeaker(participant);
    };

    participants.forEach((p) => {
      p.on("isSpeakingChanged", () => {
        if (p.isSpeaking) {
          handleSpeaking(p);
        }
      });
    });
  }, [participants]);

  const renderParticipantTile = (participant: Participant, isLocal: boolean = false) => {
    const videoTrack = participant.videoTrackPublications.values().next().value;
    const audioTrack = participant.audioTrackPublications.values().next().value;
    const isVideoEnabled = videoTrack?.isSubscribed && !videoTrack?.isMuted;
    const isAudioEnabled = audioTrack?.isSubscribed && !audioTrack?.isMuted;
    const isPinned = pinnedParticipant?.identity === participant.identity;
    const isActive = activeSpeaker?.identity === participant.identity;

    return (
      <div
        key={participant.identity}
        className={cn(
          "relative rounded-lg overflow-hidden bg-zinc-900 border-2 transition-all",
          getTileAspectRatio(),
          isActive && "border-blue-500 ring-2 ring-blue-500/50",
          isPinned && "border-green-500 ring-2 ring-green-500/50",
          !isActive && !isPinned && "border-zinc-800"
        )}
      >
        {/* Video or Avatar */}
        {isVideoEnabled ? (
          <VideoTrack
            trackRef={{
              participant: participant,
              source: Track.Source.Camera,
              publication: videoTrack
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <div className="h-20 w-20 rounded-full bg-zinc-700 flex items-center justify-center">
              <User className="h-10 w-10 text-zinc-400" />
            </div>
          </div>
        )}

        {/* Overlay Info */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="bg-black/40 border-white/20 text-white backdrop-blur-sm"
              >
                {participant.name || participant.identity}
                {isLocal && " (Vous)"}
              </Badge>
              {isPinned && (
                <Badge
                  variant="outline"
                  className="bg-green-500/20 border-green-500/50 text-green-400 backdrop-blur-sm"
                >
                  <Pin className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              {/* Audio Status */}
              <div className="flex items-center gap-1">
                {isAudioEnabled ? (
                  <div className="h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Mic className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center">
                    <MicOff className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pointer-events-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 bg-black/40 hover:bg-black/60 backdrop-blur-sm"
                  onClick={() =>
                    setPinnedParticipant(isPinned ? null : participant)
                  }
                  title={isPinned ? "Détacher" : "Épingler"}
                >
                  <Pin className={cn("h-3 w-3", isPinned && "text-green-400")} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 bg-black/40 hover:bg-black/60 backdrop-blur-sm"
                  onClick={() => {
                    if (isPinned && isFullscreen) {
                      onToggleFullscreen();
                    } else {
                      setPinnedParticipant(participant);
                      if (!isFullscreen) onToggleFullscreen();
                    }
                  }}
                  title={isPinned && isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                >
                  {isPinned && isFullscreen ? (
                    <Minimize className="h-3 w-3 text-white" />
                  ) : (
                    <Maximize className="h-3 w-3 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Speaking Indicator */}
          {isActive && (
            <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none animate-pulse" />
          )}
        </div>
      </div>
    );
  };

  if (viewMode === "speaker" && (pinnedParticipant || activeSpeaker)) {
    const mainSpeaker = pinnedParticipant || activeSpeaker;
    const otherParticipants = participants.filter(
      (p) => p.identity !== mainSpeaker?.identity
    );

    return (
      <div className="h-full flex flex-col gap-2 p-2">
        {/* Main Speaker */}
        <div className="flex-1 min-h-0">
          {mainSpeaker && renderParticipantTile(mainSpeaker)}
        </div>

        {/* Thumbnails */}
        {((localParticipant && localParticipant.identity !== mainSpeaker?.identity) || otherParticipants.length > 0) && (
          <div className="h-32 flex gap-2 overflow-x-auto">
            {localParticipant && localParticipant.identity !== mainSpeaker?.identity && renderParticipantTile(localParticipant, true)}
            {otherParticipants.map((p) => (
              <div key={p.identity} className="w-40 flex-shrink-0">
                {renderParticipantTile(p)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Gallery View
  return (
    <div
      ref={gridRef}
      className={cn(
        "h-full w-full p-2 overflow-auto",
        "grid gap-2 auto-rows-fr",
        getGridLayout()
      )}
    >
      {/* Local Participant */}
      {localParticipant && renderParticipantTile(localParticipant, true)}

      {/* Remote Participants */}
      {participants.map((participant) => renderParticipantTile(participant))}
    </div>
  );
}
