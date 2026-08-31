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
  HelpCircle,
  Sparkles,
  ClipboardList,
  Layers,
  Radio
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
import { MathSophosIcon } from "@/components/ui/math-sophos-logo";

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
      {/* Desktop View Controls */}
      <div className="hidden md:flex items-center gap-2">
        {/* Raise Hand Button */}
        <Button
          variant={isHandRaised ? "default" : "outline"}
          size="sm"
          onClick={onToggleRaiseHand}
          className={cn(
            "gap-2 font-semibold text-xs rounded-xl backdrop-blur-md transition-all",
            isHandRaised
              ? "bg-amber-500 hover:bg-amber-600 text-black border-amber-400 animate-pulse shadow-lg shadow-amber-500/20"
              : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/80"
          )}
        >
          <Hand className="h-3.5 w-3.5" />
          <span>{isHandRaised ? "Main levée" : "Lever la main"}</span>
        </Button>

        {/* Teacher-only Controls */}
        {isTeacher && (
          <>
            {/* Host Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 font-semibold text-xs bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border-indigo-500/30 rounded-xl backdrop-blur-md"
                >
                  <Settings className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Contrôles Hôte</span>
                  {raisedHands.size > 0 && (
                    <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-amber-500 text-black font-bold">
                      {raisedHands.size}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-zinc-950 text-zinc-200 border-zinc-800 shadow-2xl rounded-2xl p-1.5">
                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                  Gestion Enseignant
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />

                <DropdownMenuItem
                  onClick={onMuteAll}
                  className="gap-2 hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer rounded-xl text-xs py-2 text-rose-400 font-medium"
                >
                  <MicOffIcon className="h-4 w-4" />
                  Couper le micro de tous les élèves
                </DropdownMenuItem>

                {raisedHands.size > 0 && (
                  <>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuLabel className="text-[11px] font-semibold text-amber-400 px-2">
                      Mains levées ({raisedHands.size})
                    </DropdownMenuLabel>
                    {Array.from(raisedHands).map((identity) => {
                      const participant = participants.find((p) => p.identity === identity);
                      if (!participant) return null;
                      return (
                        <DropdownMenuItem
                          key={identity}
                          className="gap-2 text-amber-300 hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer rounded-xl text-xs py-2"
                          onClick={() => {
                            onSpotlightParticipant(identity);
                            toast.success(`Parole donnée à ${participant.name || identity}`);
                          }}
                        >
                          <Hand className="h-3.5 w-3.5 text-amber-400" />
                          <span className="truncate">{participant.name || identity}</span>
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
              className="gap-2 font-semibold text-xs bg-blue-950/60 hover:bg-blue-900/80 text-blue-200 border-blue-500/30 rounded-xl backdrop-blur-md"
            >
              <Presentation className="h-3.5 w-3.5 text-blue-400" />
              <span>Tableau Blanc</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPolls}
              className="gap-2 font-semibold text-xs bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border-purple-500/30 rounded-xl backdrop-blur-md"
            >
              <MessageSquarePlus className="h-3.5 w-3.5 text-purple-400" />
              <span>Sondages</span>
            </Button>

            {onOpenBreakoutRooms && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenBreakoutRooms}
                className="gap-2 font-semibold text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border-emerald-500/30 rounded-xl backdrop-blur-md"
              >
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                <span>Ateliers</span>
              </Button>
            )}

            {onOpenAttendance && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAttendance}
                className="gap-2 font-semibold text-xs bg-teal-950/60 hover:bg-teal-900/80 text-teal-200 border-teal-500/30 rounded-xl backdrop-blur-md"
              >
                <ClipboardList className="h-3.5 w-3.5 text-teal-400" />
                <span>Présences</span>
              </Button>
            )}

            {onOpenQuiz && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenQuiz}
                className="gap-2 font-semibold text-xs bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border-rose-500/30 rounded-xl backdrop-blur-md"
              >
                <MathSophosIcon size={16} />
                <span>Quiz Live</span>
              </Button>
            )}
          </>
        )}
      </div>

      {/* Mobile View Menu */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl bg-zinc-900/80 text-zinc-200 border border-zinc-700">
              <MoreVertical className="h-4 w-4" />
              {(isHandRaised || raisedHands.size > 0) && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-zinc-950 text-zinc-200 border-zinc-800 rounded-2xl p-1.5 shadow-2xl">
            <DropdownMenuLabel className="text-zinc-400 text-xs font-bold uppercase tracking-wider px-2 py-1">
              Outils & Interactions
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />

            <DropdownMenuItem
              onClick={onToggleRaiseHand}
              className={cn("gap-2 cursor-pointer focus:bg-zinc-900 rounded-xl text-xs py-2", isHandRaised && "text-amber-400 font-bold")}
            >
              <Hand className="h-4 w-4" />
              {isHandRaised ? "Baisser la main" : "Lever la main"}
            </DropdownMenuItem>

            {isTeacher && (
              <>
                <DropdownMenuItem onClick={onOpenWhiteboard} className="gap-2 cursor-pointer focus:bg-zinc-900 rounded-xl text-xs py-2 text-blue-300">
                  <Presentation className="h-4 w-4 text-blue-400" />
                  Tableau Blanc
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenPolls} className="gap-2 cursor-pointer focus:bg-zinc-900 rounded-xl text-xs py-2 text-purple-300">
                  <MessageSquarePlus className="h-4 w-4 text-purple-400" />
                  Sondages
                </DropdownMenuItem>

                {onOpenBreakoutRooms && (
                  <DropdownMenuItem onClick={onOpenBreakoutRooms} className="gap-2 cursor-pointer focus:bg-zinc-900 rounded-xl text-xs py-2 text-emerald-300">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    Salles d'Atelier
                  </DropdownMenuItem>
                )}

                {onOpenAttendance && (
                  <DropdownMenuItem onClick={onOpenAttendance} className="gap-2 cursor-pointer focus:bg-zinc-900 rounded-xl text-xs py-2 text-teal-300">
                    <ClipboardList className="h-4 w-4 text-teal-400" />
                    Registre de Présences
                  </DropdownMenuItem>
                )}

                {onOpenQuiz && (
                  <DropdownMenuItem onClick={onOpenQuiz} className="gap-2 cursor-pointer focus:bg-zinc-900 rounded-xl text-xs py-2 text-rose-300">
                    <MathSophosIcon size={16} />
                    Quiz en Direct
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuLabel className="text-zinc-400 text-xs font-bold uppercase tracking-wider px-2 py-1">
                  Actions Hôte
                </DropdownMenuLabel>

                <DropdownMenuItem onClick={onMuteAll} className="gap-2 cursor-pointer focus:bg-zinc-900 rounded-xl text-xs py-2 text-rose-400 font-semibold">
                  <MicOffIcon className="h-4 w-4" />
                  Couper tous les micros
                </DropdownMenuItem>
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
          className="h-7 w-7 rounded-lg bg-black/40 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-950 text-zinc-200 border-zinc-800 rounded-2xl p-1.5">
        <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">Gérer le participant</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />

        <DropdownMenuItem onClick={onPin} className="gap-2 rounded-xl text-xs cursor-pointer">
          <Pin className="h-4 w-4 text-blue-400" />
          {isPinned ? "Détacher l'épingle" : "Épingler au premier plan"}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onSpotlight} className="gap-2 rounded-xl text-xs cursor-pointer">
          <Maximize2 className="h-4 w-4 text-indigo-400" />
          {isSpotlighted ? "Retirer la mise en avant" : "Mettre en avant (Spotlight)"}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-zinc-800" />

        {participant.isMicrophoneEnabled && (
          <DropdownMenuItem onClick={onMute} className="gap-2 rounded-xl text-xs cursor-pointer text-amber-400">
            <MicOffIcon className="h-4 w-4" />
            Désactiver le micro
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={onRemove}
          className="gap-2 rounded-xl text-xs cursor-pointer text-rose-500 focus:bg-rose-950/40"
        >
          <UserX className="h-4 w-4" />
          Exclure du cours
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
