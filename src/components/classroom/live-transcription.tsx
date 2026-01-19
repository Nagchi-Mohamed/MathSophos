"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Room } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Mic,
  Languages,
  Download,
  Copy,
  X,
  Pause,
  Play,
  Settings,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptEntry {
  id: string;
  timestamp: Date;
  speaker: string;
  text: string;
  language: string;
  confidence: number;
  translation?: string;
}

interface LiveTranscriptionProps {
  room: Room;
  isTeacher: boolean;
  onClose: () => void;
}

export function LiveTranscription({ room, isTeacher, onClose }: LiveTranscriptionProps) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState("fr-FR");
  const [targetLanguage, setTargetLanguage] = useState("en-US");
  const [showTranslation, setShowTranslation] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Supported languages
  const languages = [
    { code: "fr-FR", name: "Français" },
    { code: "en-US", name: "English (US)" },
    { code: "en-GB", name: "English (UK)" },
    { code: "es-ES", name: "Español" },
    { code: "de-DE", name: "Deutsch" },
    { code: "it-IT", name: "Italiano" },
    { code: "pt-PT", name: "Português" },
    { code: "ar-SA", name: "العربية" },
    { code: "zh-CN", name: "中文" },
    { code: "ja-JP", name: "日本語" },
  ];

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = sourceLanguage;

      recognitionRef.current.onresult = async (event: any) => {
        const results = event.results;
        const lastResult = results[results.length - 1];

        if (lastResult.isFinal) {
          const text = lastResult[0].transcript;
          const confidence = lastResult[0].confidence;

          // Translate if needed
          let translation;
          if (showTranslation && sourceLanguage !== targetLanguage) {
            translation = await translateText(text, sourceLanguage, targetLanguage);
          }

          const entry: TranscriptEntry = {
            id: Date.now().toString(),
            timestamp: new Date(),
            speaker: room.localParticipant.name || "You",
            text,
            language: sourceLanguage,
            confidence,
            translation,
          };

          setTranscript((prev) => [...prev, entry]);

          // Send to other participants
          const encoder = new TextEncoder();
          const data = encoder.encode(
            JSON.stringify({
              type: "transcription",
              entry,
            })
          );
          room.localParticipant.publishData(data, { reliable: true });
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          // Ignore no-speech errors
          return;
        }
        toast.error("Transcription error", {
          description: event.error,
        });
      };

      recognitionRef.current.onend = () => {
        if (isActive && !isPaused) {
          // Restart if still active
          recognitionRef.current?.start();
        }
      };
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [sourceLanguage, targetLanguage, showTranslation, isActive, isPaused, room]);

  // Listen for transcriptions from other participants
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant: any) => {
      const decoder = new TextDecoder();
      const message = decoder.decode(payload);
      try {
        const data = JSON.parse(message);
        if (data.type === "transcription") {
          setTranscript((prev) => [...prev, data.entry]);
        }
      } catch (e) {
        console.error("Failed to parse transcription data:", e);
      }
    };

    room.on("dataReceived" as any, handleData);
    return () => {
      room.off("dataReceived" as any, handleData);
    };
  }, [room]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const translateText = async (
    text: string,
    from: string,
    to: string
  ): Promise<string> => {
    // In production, use Google Translate API or similar
    // For demo, return a placeholder
    try {
      // Simulated translation
      return `[Translated to ${to}] ${text}`;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  const startTranscription = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsActive(true);
        setIsPaused(false);
        toast.success("Transcription started");
      } catch (error) {
        console.error("Error starting transcription:", error);
        toast.error("Failed to start transcription");
      }
    } else {
      toast.error("Speech recognition not supported in this browser");
    }
  }, []);

  const pauseTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsPaused(true);
      toast.info("Transcription paused");
    }
  }, []);

  const resumeTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsPaused(false);
      toast.success("Transcription resumed");
    }
  }, []);

  const stopTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsActive(false);
      setIsPaused(false);
      toast.info("Transcription stopped");
    }
  }, []);

  const exportTranscript = useCallback(() => {
    const text = transcript
      .map((entry) => {
        const time = entry.timestamp.toLocaleTimeString();
        const translation = entry.translation ? `\n  Translation: ${entry.translation}` : "";
        return `[${time}] ${entry.speaker}: ${entry.text}${translation}`;
      })
      .join("\n\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript exported");
  }, [transcript]);

  const copyTranscript = useCallback(() => {
    const text = transcript
      .map((entry) => {
        const time = entry.timestamp.toLocaleTimeString();
        return `[${time}] ${entry.speaker}: ${entry.text}`;
      })
      .join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Transcript copied to clipboard");
  }, [transcript]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Mic className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Transcription en direct
              </h2>
              <p className="text-sm text-zinc-400">
                {isActive
                  ? isPaused
                    ? "En pause"
                    : "En cours..."
                  : "Prêt à démarrer"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge
                variant="outline"
                className={cn(
                  isPaused
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    : "bg-green-500/10 text-green-400 border-green-500/20 animate-pulse"
                )}
              >
                {isPaused ? "Pause" : "Live"}
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">
                Langue source
              </label>
              <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">
                Langue cible
              </label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">
                Options
              </label>
              <Button
                variant="outline"
                className={cn(
                  "w-full border-zinc-800",
                  showTranslation && "bg-blue-500/10 border-blue-500/20"
                )}
                onClick={() => setShowTranslation(!showTranslation)}
              >
                <Languages className="h-4 w-4 mr-2" />
                {showTranslation ? "Traduction activée" : "Activer traduction"}
              </Button>
            </div>
          </div>
        </div>

        {/* Transcript */}
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <FileText className="h-12 w-12 text-zinc-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Aucune transcription
              </h3>
              <p className="text-zinc-400 max-w-md">
                Démarrez la transcription pour voir le texte en temps réel.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcript.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {entry.speaker}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs"
                      >
                        {languages.find((l) => l.code === entry.language)?.name}
                      </Badge>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-white leading-relaxed">{entry.text}</p>
                  {entry.translation && showTranslation && (
                    <>
                      <Separator className="my-2 bg-zinc-800" />
                      <div className="flex items-start gap-2">
                        <Languages className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-blue-300 text-sm leading-relaxed">
                          {entry.translation}
                        </p>
                      </div>
                    </>
                  )}
                  {entry.confidence && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            entry.confidence > 0.8
                              ? "bg-green-500"
                              : entry.confidence > 0.6
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          )}
                          style={{ width: `${entry.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">
                        {Math.round(entry.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-800">
          <div className="flex gap-2">
            {transcript.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyTranscript}
                  className="border-zinc-700"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTranscript}
                  className="border-zinc-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {!isActive ? (
              <Button
                onClick={startTranscription}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Démarrer
              </Button>
            ) : isPaused ? (
              <>
                <Button
                  onClick={resumeTranscription}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Reprendre
                </Button>
                <Button
                  onClick={stopTranscription}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Arrêter
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={pauseTranscription}
                  variant="outline"
                  className="border-zinc-700"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={stopTranscription}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Arrêter
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
