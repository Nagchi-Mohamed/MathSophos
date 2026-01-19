"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Room, Participant } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Users,
  X,
  Save,
  Copy,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  cursorPosition?: number;
}

interface CollaborativeNotesProps {
  room: Room;
  participants: Participant[];
  onClose: () => void;
}

export function CollaborativeNotes({ room, participants, onClose }: CollaborativeNotesProps) {
  const [content, setContent] = useState("");
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync content with other participants
  const syncContent = useCallback((newContent: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "notes-update",
        content: newContent,
        author: room.localParticipant.identity,
        timestamp: new Date().toISOString(),
      })
    );
    room.localParticipant.publishData(data, { reliable: true });
  }, [room]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Debounce sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncContent(newContent);
    }, 500);
  };

  // Listen for updates from other participants
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant?: Participant) => {
      const decoder = new TextDecoder();
      const message = decoder.decode(payload);
      try {
        const data = JSON.parse(message);

        if (data.type === "notes-update" && participant) {
          // Only update if it's from another participant
          if (participant.identity !== room.localParticipant.identity) {
            setContent(data.content);
            setActiveUsers((prev) => new Set(prev).add(participant.identity));

            // Remove user from active list after 3 seconds
            setTimeout(() => {
              setActiveUsers((prev) => {
                const next = new Set(prev);
                next.delete(participant.identity);
                return next;
              });
            }, 3000);
          }
        }
      } catch (e) {
        console.error("Failed to parse notes data:", e);
      }
    };

    room.on("dataReceived" as any, handleData);
    return () => {
      room.off("dataReceived" as any, handleData);
    };
  }, [room]);

  const saveNotes = async () => {
    setIsSaving(true);

    // In production, save to database
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLastSaved(new Date());
    setIsSaving(false);
    toast.success("Notes sauvegardées");
  };

  const downloadNotes = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Notes téléchargées");
  };

  const copyNotes = async () => {
    await navigator.clipboard.writeText(content);
    toast.success("Notes copiées dans le presse-papiers");
  };

  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newText = "";

    switch (format) {
      case "bold":
        newText = `**${selectedText}**`;
        break;
      case "italic":
        newText = `*${selectedText}*`;
        break;
      case "h1":
        newText = `# ${selectedText}`;
        break;
      case "h2":
        newText = `## ${selectedText}`;
        break;
      case "ul":
        newText = `- ${selectedText}`;
        break;
      case "ol":
        newText = `1. ${selectedText}`;
        break;
    }

    const newContent =
      content.substring(0, start) + newText + content.substring(end);
    handleContentChange(newContent);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Notes collaboratives
              </h2>
              <p className="text-sm text-zinc-400">
                {wordCount} mots • {charCount} caractères
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-xs text-zinc-500">
                Sauvegardé à {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting("bold")}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting("italic")}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2 bg-zinc-700" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting("h1")}
              className="h-8 w-8 p-0"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting("h2")}
              className="h-8 w-8 p-0"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2 bg-zinc-700" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting("ul")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => insertFormatting("ol")}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {activeUsers.size > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {Array.from(activeUsers).slice(0, 3).map((userId) => {
                    const participant = participants.find((p) => p.identity === userId);
                    return (
                      <Avatar key={userId} className="h-6 w-6 border-2 border-zinc-900">
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          {participant?.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-400 border-green-500/20"
                >
                  {activeUsers.size} en train d'écrire
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-6 overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Commencez à prendre des notes... Les modifications sont synchronisées en temps réel avec tous les participants."
            className="w-full h-full bg-zinc-900 border-zinc-800 text-white resize-none focus-visible:ring-1 focus-visible:ring-blue-500 font-mono text-sm leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">
              {participants.length} participant{participants.length !== 1 ? "s" : ""} dans la session
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyNotes}
              className="border-zinc-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadNotes}
              className="border-zinc-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            <Button
              onClick={saveNotes}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
