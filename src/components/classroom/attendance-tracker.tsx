"use client";

import { useState, useEffect, useCallback } from "react";
import { Room, Participant, RoomEvent } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Users,
  X,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  FileText,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  participantId: string;
  participantName: string;
  joinedAt: Date;
  leftAt?: Date;
  duration: number; // in seconds
  isPresent: boolean;
  deviceInfo?: string;
}

interface AttendanceTrackerProps {
  room: Room;
  isTeacher: boolean;
  participants: Participant[];
  sessionId?: string;
  onClose: () => void;
}

export function AttendanceTracker({
  room,
  isTeacher,
  participants,
  sessionId,
  onClose,
}: AttendanceTrackerProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, AttendanceRecord>>(
    new Map()
  );
  const [sessionStartTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track participant join/leave
  useEffect(() => {
    if (!room) return;

    const handleParticipantConnected = (participant: Participant) => {
      setAttendanceRecords((prev) => {
        const newRecords = new Map(prev);
        newRecords.set(participant.identity, {
          participantId: participant.identity,
          participantName: participant.name || participant.identity,
          joinedAt: new Date(),
          duration: 0,
          isPresent: true,
          deviceInfo: getUserAgent(),
        });
        return newRecords;
      });

      toast.success(`${participant.name || participant.identity} a rejoint`, {
        duration: 2000,
      });
    };

    const handleParticipantDisconnected = (participant: Participant) => {
      setAttendanceRecords((prev) => {
        const newRecords = new Map(prev);
        const record = newRecords.get(participant.identity);
        if (record) {
          const leftAt = new Date();
          const duration = Math.floor((leftAt.getTime() - record.joinedAt.getTime()) / 1000);
          newRecords.set(participant.identity, {
            ...record,
            leftAt,
            duration,
            isPresent: false,
          });
        }
        return newRecords;
      });

      toast.info(`${participant.name || participant.identity} a quitté`, {
        duration: 2000,
      });
    };

    // Initialize with current participants
    participants.forEach((participant) => {
      if (!attendanceRecords.has(participant.identity)) {
        handleParticipantConnected(participant);
      }
    });

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room, participants]);

  // Update durations for active participants
  useEffect(() => {
    setAttendanceRecords((prev) => {
      const newRecords = new Map(prev);
      newRecords.forEach((record, key) => {
        if (record.isPresent) {
          const duration = Math.floor((currentTime.getTime() - record.joinedAt.getTime()) / 1000);
          newRecords.set(key, { ...record, duration });
        }
      });
      return newRecords;
    });
  }, [currentTime]);

  const getUserAgent = () => {
    if (typeof window === "undefined") return "Unknown";
    const ua = window.navigator.userAgent;
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Unknown";
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const exportToCSV = useCallback(() => {
    const headers = [
      "Nom",
      "Heure d'arrivée",
      "Heure de départ",
      "Durée",
      "Statut",
      "Appareil",
    ];

    const rows = Array.from(attendanceRecords.values()).map((record) => [
      record.participantName,
      formatTime(record.joinedAt),
      record.leftAt ? formatTime(record.leftAt) : "En cours",
      formatDuration(record.duration),
      record.isPresent ? "Présent" : "Parti",
      record.deviceInfo || "Unknown",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `attendance_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Rapport d'assiduité exporté");
  }, [attendanceRecords]);

  const exportToPDF = useCallback(() => {
    // In a real implementation, you would use a library like jsPDF
    toast.info("Export PDF en cours de développement");
  }, []);

  const sendAttendanceEmail = useCallback(() => {
    // In a real implementation, you would send an email with the attendance report
    toast.info("Envoi d'email en cours de développement");
  }, []);

  const records = Array.from(attendanceRecords.values());
  const presentCount = records.filter((r) => r.isPresent).length;
  const totalCount = records.length;
  const averageDuration =
    records.length > 0
      ? Math.floor(
        records.reduce((sum, r) => sum + r.duration, 0) / records.length
      )
      : 0;

  if (!isTeacher) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="bg-[#1a1a1a] border-zinc-800 p-6 max-w-md">
          <div className="text-center">
            <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Suivi de l'assiduité
            </h3>
            <p className="text-zinc-400">
              Seuls les enseignants peuvent voir le rapport d'assiduité.
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
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Suivi de l'assiduité
              </h2>
              <p className="text-sm text-zinc-400">
                Session démarrée à {formatTime(sessionStartTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-zinc-700">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a1a] border-zinc-800 text-white">
                <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Exporter en CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Exporter en PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={sendAttendanceEmail} className="cursor-pointer">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer par email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-zinc-800">
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Présents</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {presentCount}/{totalCount}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Durée moyenne</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatDuration(averageDuration)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Taux de présence</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {totalCount > 0
                    ? Math.round((presentCount / totalCount) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Table */}
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Participant</TableHead>
                <TableHead className="text-zinc-400">Arrivée</TableHead>
                <TableHead className="text-zinc-400">Départ</TableHead>
                <TableHead className="text-zinc-400">Durée</TableHead>
                <TableHead className="text-zinc-400">Statut</TableHead>
                <TableHead className="text-zinc-400">Appareil</TableHead>
                <TableHead className="text-zinc-400"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow
                  key={record.participantId}
                  className="border-zinc-800 hover:bg-zinc-900/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                          {record.participantName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">
                        {record.participantName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {formatTime(record.joinedAt)}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {record.leftAt ? formatTime(record.leftAt) : "-"}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {formatDuration(record.duration)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        record.isPresent
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      )}
                    >
                      {record.isPresent ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Présent
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Parti
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {record.deviceInfo || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1a1a1a] border-zinc-800 text-white">
                        <DropdownMenuItem className="cursor-pointer">
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          Envoyer un rappel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-800">
          <p className="text-sm text-zinc-400">
            {records.length} participant{records.length !== 1 ? "s" : ""} au total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-zinc-700">
              Fermer
            </Button>
            <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Télécharger le rapport
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
