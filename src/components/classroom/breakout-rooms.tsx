"use client";

import { useState, useCallback } from "react";
import { Room, Participant } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Users,
  Plus,
  X,
  Play,
  StopCircle,
  Shuffle,
  Clock,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BreakoutRoom {
  id: string;
  name: string;
  roomNumber: number;
  participants: string[]; // participant identities
  capacity: number;
  status: "PENDING" | "ACTIVE" | "ENDED";
  duration?: number; // in seconds
}

interface BreakoutRoomsProps {
  room: Room;
  isTeacher: boolean;
  participants: Participant[];
  onClose: () => void;
}

export function BreakoutRooms({ room, isTeacher, participants, onClose }: BreakoutRoomsProps) {
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [numRooms, setNumRooms] = useState(2);
  const [assignmentMethod, setAssignmentMethod] = useState<"auto" | "manual">("auto");
  const [duration, setDuration] = useState(10); // minutes
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const createRooms = useCallback(() => {
    const rooms: BreakoutRoom[] = [];
    for (let i = 0; i < numRooms; i++) {
      rooms.push({
        id: `breakout-${i + 1}`,
        name: `Salle ${i + 1}`,
        roomNumber: i + 1,
        participants: [],
        capacity: 10,
        status: "PENDING",
        duration: duration * 60,
      });
    }

    // Auto-assign if selected
    if (assignmentMethod === "auto") {
      const studentParticipants = participants.filter(p => !p.isLocal);
      const shuffled = [...studentParticipants].sort(() => Math.random() - 0.5);

      shuffled.forEach((participant, index) => {
        const roomIndex = index % numRooms;
        rooms[roomIndex].participants.push(participant.identity);
      });
    }

    setBreakoutRooms(rooms);
    setIsCreating(false);
    toast.success("Salles de sous-groupes créées");
  }, [numRooms, assignmentMethod, participants, duration]);

  const assignParticipant = useCallback((participantId: string, roomId: string) => {
    setBreakoutRooms(prev => {
      // Remove from all rooms first
      const updated = prev.map(room => ({
        ...room,
        participants: room.participants.filter(p => p !== participantId)
      }));

      // Add to target room
      const targetRoom = updated.find(r => r.id === roomId);
      if (targetRoom && targetRoom.participants.length < targetRoom.capacity) {
        targetRoom.participants.push(participantId);
      }

      return updated;
    });
  }, []);

  const removeParticipant = useCallback((participantId: string, roomId: string) => {
    setBreakoutRooms(prev => prev.map(room =>
      room.id === roomId
        ? { ...room, participants: room.participants.filter(p => p !== participantId) }
        : room
    ));
  }, []);

  const startBreakoutRooms = useCallback(() => {
    // Send data message to all participants with their room assignments
    const encoder = new TextEncoder();
    breakoutRooms.forEach(breakoutRoom => {
      breakoutRoom.participants.forEach(participantId => {
        const data = encoder.encode(JSON.stringify({
          type: 'breakout-room-assignment',
          roomId: breakoutRoom.id,
          roomName: breakoutRoom.name,
          duration: breakoutRoom.duration
        }));
        room.localParticipant.publishData(data, { reliable: true, destinationIdentities: [participantId] });
      });
    });

    setBreakoutRooms(prev => prev.map(r => ({ ...r, status: "ACTIVE" })));
    setIsActive(true);
    setTimeRemaining(duration * 60);

    toast.success("Salles de sous-groupes démarrées", {
      description: `Durée: ${duration} minutes`
    });

    // Start countdown
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          endBreakoutRooms();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [breakoutRooms, room, duration]);

  const endBreakoutRooms = useCallback(() => {
    // Send message to all participants to return to main room
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'breakout-room-end'
    }));
    room.localParticipant.publishData(data, { reliable: true });

    setBreakoutRooms(prev => prev.map(r => ({ ...r, status: "ENDED" })));
    setIsActive(false);
    setTimeRemaining(null);

    toast.info("Salles de sous-groupes terminées");
  }, [room]);

  const broadcastMessage = useCallback((message: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'breakout-broadcast',
      message
    }));
    room.localParticipant.publishData(data, { reliable: true });
    toast.success("Message diffusé à toutes les salles");
  }, [room]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const unassignedParticipants = participants.filter(
    p => !p.isLocal && !breakoutRooms.some(room => room.participants.includes(p.identity))
  );

  if (!isTeacher) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="bg-[#1a1a1a] border-zinc-800 p-6 max-w-md">
          <div className="text-center">
            <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Salles de sous-groupes
            </h3>
            <p className="text-zinc-400">
              Seuls les enseignants peuvent gérer les salles de sous-groupes.
            </p>
            <Button onClick={onClose} className="mt-4">
              Fermer
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Salles de sous-groupes
              </h2>
              <p className="text-sm text-zinc-400">
                {breakoutRooms.length} salles • {participants.length - 1} participants
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && timeRemaining !== null && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {breakoutRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Aucune salle de sous-groupe
              </h3>
              <p className="text-zinc-400 text-center max-w-md mb-6">
                Créez des salles de sous-groupes pour diviser les participants en petits groupes de travail.
              </p>
              <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Créer des salles
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Unassigned Participants */}
              {unassignedParticipants.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">
                    Non assignés ({unassignedParticipants.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {unassignedParticipants.map(participant => (
                      <div
                        key={participant.identity}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white"
                      >
                        {participant.name || participant.identity}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Breakout Rooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {breakoutRooms.map(breakoutRoom => (
                  <Card
                    key={breakoutRoom.id}
                    className={cn(
                      "bg-zinc-900 border-zinc-800 p-4",
                      breakoutRoom.status === "ACTIVE" && "border-blue-500/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-semibold",
                          breakoutRoom.status === "ACTIVE" ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400"
                        )}>
                          {breakoutRoom.roomNumber}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{breakoutRoom.name}</h4>
                          <p className="text-xs text-zinc-500">
                            {breakoutRoom.participants.length}/{breakoutRoom.capacity} participants
                          </p>
                        </div>
                      </div>
                      {breakoutRoom.status === "ACTIVE" && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          En cours
                        </Badge>
                      )}
                    </div>

                    <Separator className="my-3 bg-zinc-800" />

                    <div className="space-y-2">
                      {breakoutRoom.participants.map(participantId => {
                        const participant = participants.find(p => p.identity === participantId);
                        return (
                          <div
                            key={participantId}
                            className="flex items-center justify-between bg-zinc-800/50 rounded px-3 py-2"
                          >
                            <span className="text-sm text-white">
                              {participant?.name || participantId}
                            </span>
                            {!isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeParticipant(participantId, breakoutRoom.id)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                      {breakoutRoom.participants.length === 0 && (
                        <p className="text-xs text-zinc-500 text-center py-2">
                          Aucun participant assigné
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {breakoutRooms.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-zinc-800">
            <div className="flex gap-2">
              {!isActive && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(true)}
                    className="border-zinc-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Recréer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const shuffled = [...participants.filter(p => !p.isLocal)].sort(() => Math.random() - 0.5);
                      setBreakoutRooms(prev => {
                        const updated = prev.map(room => ({ ...room, participants: [] as string[] }));
                        shuffled.forEach((participant, index) => {
                          const roomIndex = index % updated.length;
                          updated[roomIndex].participants.push(participant.identity);
                        });
                        return updated;
                      });
                      toast.success("Participants mélangés");
                    }}
                    className="border-zinc-700"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Mélanger
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {isActive ? (
                <Button
                  onClick={endBreakoutRooms}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Terminer les salles
                </Button>
              ) : (
                <Button
                  onClick={startBreakoutRooms}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={breakoutRooms.every(r => r.participants.length === 0)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Démarrer les salles
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Create Rooms Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="bg-[#1a1a1a] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Créer des salles de sous-groupes</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Configurez vos salles de sous-groupes pour diviser les participants.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="numRooms">Nombre de salles</Label>
              <Input
                id="numRooms"
                type="number"
                min={2}
                max={20}
                value={numRooms}
                onChange={(e) => setNumRooms(parseInt(e.target.value) || 2)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment">Méthode d'assignation</Label>
              <Select value={assignmentMethod} onValueChange={(v: any) => setAssignmentMethod(v)}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="auto">Automatique</SelectItem>
                  <SelectItem value="manual">Manuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durée (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                max={120}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)} className="border-zinc-700">
              Annuler
            </Button>
            <Button onClick={createRooms} className="bg-blue-600 hover:bg-blue-700">
              Créer les salles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
