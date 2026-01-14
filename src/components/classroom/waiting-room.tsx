"use client";

import { useState, useEffect } from "react";
import { UserCheck, UserX, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Room } from "livekit-client";

interface WaitingParticipant {
  identity: string;
  name: string;
  joinedAt: number;
}

interface WaitingRoomProps {
  room: Room;
  waitingParticipants: WaitingParticipant[];
  onAdmit: (identity: string) => void;
  onDeny: (identity: string) => void;
  onAdmitAll: () => void;
}

export function WaitingRoom({
  room,
  waitingParticipants,
  onAdmit,
  onDeny,
  onAdmitAll,
}: WaitingRoomProps) {
  const [timeElapsed, setTimeElapsed] = useState<Map<string, number>>(new Map());

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimeElapsed = new Map<string, number>();
      waitingParticipants.forEach((p) => {
        const elapsed = Math.floor((now - p.joinedAt) / 1000);
        newTimeElapsed.set(p.identity, elapsed);
      });
      setTimeElapsed(newTimeElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [waitingParticipants]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (waitingParticipants.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 bg-white dark:bg-zinc-900 rounded-lg shadow-2xl border border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Waiting Room</h3>
          </div>
          <Badge variant="secondary">{waitingParticipants.length}</Badge>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {waitingParticipants.map((participant) => (
          <div
            key={participant.identity}
            className="p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                  {participant.name[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{participant.name}</p>
                <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3 w-3" />
                  <span>Waiting {formatTime(timeElapsed.get(participant.identity) || 0)}</span>
                </div>
              </div>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={() => {
                    onAdmit(participant.identity);
                    toast.success(`Admitted ${participant.name}`);
                  }}
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    onDeny(participant.identity);
                    toast.info(`Denied ${participant.name}`);
                  }}
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {waitingParticipants.length > 1 && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <Button
            size="sm"
            className="w-full"
            onClick={() => {
              onAdmitAll();
              toast.success(`Admitted all ${waitingParticipants.length} participants`);
            }}
          >
            Admit All ({waitingParticipants.length})
          </Button>
        </div>
      )}
    </div>
  );
}

// Waiting Room Screen for participants
export function WaitingRoomScreen({ userName }: { userName: string }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="text-center max-w-md px-6">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full" />
          <Users className="h-20 w-20 text-blue-600 dark:text-blue-400 mx-auto relative z-10" />
        </div>

        <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">
          Waiting to join
        </h2>

        <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-2">
          Hi {userName}!
        </p>

        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
          The host will let you in soon{dots}
        </p>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <Clock className="h-4 w-4" />
            <span>Please wait while the host admits you</span>
          </div>
        </div>

        <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
          Make sure your camera and microphone are ready
        </p>
      </div>
    </div>
  );
}
