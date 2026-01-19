"use client";

import { useState, useCallback } from "react";
import {
  Hand,
  UserX,
  MicOff as MicOffIcon,
  Pin,
  Maximize2,
  Users2,
  MessageSquarePlus,
  Presentation,
  Settings,
  Volume2,
  VolumeX,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Participant, Room } from "livekit-client";

interface EnhancedControlsProps {
  room: Room;
  isTeacher: boolean;
  participants: Participant[];
  raisedHands: Set<string>;
  pinnedParticipants: Set<string>;
  spotlightedParticipant: string | null;
  onToggleRaiseHand: () => void;
  onMuteParticipant: (identity: string) => void;
  onRemoveParticipant: (identity: string) => void;
  onPinParticipant: (identity: string) => void;
  onSpotlightParticipant: (identity: string | null) => void;
  onMuteAll: () => void;
  onOpenWhiteboard: () => void;
  onOpenPolls: () => void;
  onOpenBreakoutRooms?: () => void;
  onOpenAttendance?: () => void;
  onOpenQuiz?: () => void;
}


export function EnhancedControls({
  room,
  isTeacher,
  participants,
  raisedHands,
  pinnedParticipants,
  spotlightedParticipant,
  onToggleRaiseHand,
  onMuteParticipant,
  onRemoveParticipant,
  onPinParticipant,
  onSpotlightParticipant,
  onMuteAll,
  onOpenWhiteboard,
  onOpenPolls,
  onOpenBreakoutRooms,
  onOpenAttendance,
  onOpenQuiz,
}: EnhancedControlsProps) {
  const localParticipant = room.localParticipant;
  const isHandRaised = raisedHands.has(localParticipant.identity);

  return (
    <div className="flex items-center gap-2">
      {/* Desktop View */}
      <div className="hidden md:flex items-center gap-2">
        {/* Raise Hand Button */}
        <Button
          variant={isHandRaised ? "default" : "outline"}
          size="sm"
          onClick={onToggleRaiseHand}
          className={cn(
            "gap-2",
            isHandRaised && "bg-yellow-600 hover:bg-yellow-700 animate-pulse"
          )}
        >
          <Hand className="h-4 w-4" />
          {isHandRaised ? "Lower Hand" : "Raise Hand"}
        </Button>

        {/* Teacher-only Controls */}
        {isTeacher && (
          <>
            {/* Host Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Host Controls
                  {raisedHands.size > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {raisedHands.size}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] text-zinc-300 border-[#333]">
                <DropdownMenuLabel>Host Actions</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#333]" />

                <DropdownMenuItem onClick={onMuteAll} className="gap-2 hover:bg-[#333] focus:bg-[#333] cursor-pointer">
                  <MicOffIcon className="h-4 w-4" />
                  Mute All Participants
                </DropdownMenuItem>

                {raisedHands.size > 0 && (
                  <>
                    <DropdownMenuSeparator className="bg-[#333]" />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Raised Hands ({raisedHands.size})
                    </DropdownMenuLabel>
                    {Array.from(raisedHands).map((identity) => {
                      const participant = participants.find(p => p.identity === identity);
                      if (!participant) return null;
                      return (
                        <DropdownMenuItem
                          key={identity}
                          className="gap-2 text-yellow-600 hover:bg-[#333] focus:bg-[#333] cursor-pointer"
                          onClick={() => {
                            onSpotlightParticipant(identity);
                            toast.success(`Spotlighted ${participant.name || identity}`);
                          }}
                        >
                          <Hand className="h-4 w-4" />
                          {participant.name || identity}
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Collaboration Tools */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenWhiteboard}
              className="gap-2"
            >
              <Presentation className="h-4 w-4" />
              Whiteboard
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPolls}
              className="gap-2"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Poll
            </Button>

            {onOpenBreakoutRooms && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenBreakoutRooms}
                className="gap-2"
              >
                <Users2 className="h-4 w-4" />
                Breakout Rooms
              </Button>
            )}

            {onOpenAttendance && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAttendance}
                className="gap-2"
              >
                <Users2 className="h-4 w-4" />
                Attendance
              </Button>
            )}

            {onOpenQuiz && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenQuiz}
                className="gap-2"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Quiz
              </Button>
            )}
          </>
        )}
      </div>

      {/* Mobile View - Styled Selector/Menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <MoreVertical className="h-5 w-5 text-zinc-400" />
              {(isHandRaised || raisedHands.size > 0) && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] text-zinc-300 border-[#333]">
            <DropdownMenuLabel className="text-zinc-500 uppercase text-xs font-bold tracking-wider">Session Controls</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#333]" />

            <DropdownMenuItem
              onClick={onToggleRaiseHand}
              className={cn("gap-2 cursor-pointer focus:bg-[#333]", isHandRaised && "text-yellow-500")}
            >
              <Hand className="h-4 w-4" />
              {isHandRaised ? "Lower Hand" : "Raise Hand"}
            </DropdownMenuItem>

            {isTeacher && (
              <>
                <DropdownMenuItem onClick={onOpenWhiteboard} className="gap-2 cursor-pointer focus:bg-[#333]">
                  <Presentation className="h-4 w-4" />
                  Open Whiteboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenPolls} className="gap-2 cursor-pointer focus:bg-[#333]">
                  <MessageSquarePlus className="h-4 w-4" />
                  Open Polls
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#333]" />
                <DropdownMenuLabel className="text-zinc-500 uppercase text-xs font-bold tracking-wider">Host Actions</DropdownMenuLabel>

                <DropdownMenuItem onClick={onMuteAll} className="gap-2 cursor-pointer focus:bg-[#333] text-red-400">
                  <MicOffIcon className="h-4 w-4" />
                  Mute All
                </DropdownMenuItem>

                {raisedHands.size > 0 && (
                  <>
                    <DropdownMenuSeparator className="bg-[#333]" />
                    <DropdownMenuLabel className="text-zinc-500 text-xs">Raised Hands</DropdownMenuLabel>
                    {Array.from(raisedHands).map((identity) => {
                      const participant = participants.find(p => p.identity === identity);
                      if (!participant) return null;
                      return (
                        <DropdownMenuItem
                          key={identity}
                          className="gap-2 text-yellow-600 cursor-pointer focus:bg-[#333]"
                          onClick={() => {
                            onSpotlightParticipant(identity);
                            toast.success(`Spotlighted ${participant.name || identity}`);
                          }}
                        >
                          <Hand className="h-4 w-4" />
                          {participant.name || identity}
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Participant Context Menu for Teachers
export function ParticipantContextMenu({
  participant,
  isTeacher,
  isPinned,
  isSpotlighted,
  onMute,
  onRemove,
  onPin,
  onSpotlight,
}: {
  participant: Participant;
  isTeacher: boolean;
  isPinned: boolean;
  isSpotlighted: boolean;
  onMute: () => void;
  onRemove: () => void;
  onPin: () => void;
  onSpotlight: () => void;
}) {
  if (!isTeacher) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Manage Participant</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onPin} className="gap-2">
          <Pin className="h-4 w-4" />
          {isPinned ? "Unpin" : "Pin"} Participant
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onSpotlight} className="gap-2">
          <Maximize2 className="h-4 w-4" />
          {isSpotlighted ? "Remove Spotlight" : "Spotlight"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {participant.isMicrophoneEnabled && (
          <DropdownMenuItem onClick={onMute} className="gap-2">
            <MicOffIcon className="h-4 w-4" />
            Mute Participant
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={onRemove}
          className="gap-2 text-red-600 focus:text-red-600"
        >
          <UserX className="h-4 w-4" />
          Remove from Meeting
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
