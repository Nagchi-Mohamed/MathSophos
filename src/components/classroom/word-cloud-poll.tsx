"use client";

import { useState, useEffect, useCallback } from "react";
import { Room } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Cloud,
  Send,
  X,
  TrendingUp,
  Hash,
  Download,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WordData {
  text: string;
  count: number;
  users: string[];
}

interface WordCloudPollProps {
  room: Room;
  question: string;
  isTeacher: boolean;
  onClose: () => void;
}

export function WordCloudPoll({ room, question, isTeacher, onClose }: WordCloudPollProps) {
  const [words, setWords] = useState<Map<string, WordData>>(new Map());
  const [inputValue, setInputValue] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Listen for word submissions
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant: any) => {
      const decoder = new TextDecoder();
      const message = decoder.decode(payload);
      try {
        const data = JSON.parse(message);
        if (data.type === "wordcloud-response") {
          const word = data.word.toLowerCase().trim();
          const userName = participant?.name || participant?.identity || "Anonymous";

          setWords((prev) => {
            const newWords = new Map(prev);
            const existing = newWords.get(word);

            if (existing) {
              if (!existing.users.includes(userName)) {
                existing.count++;
                existing.users.push(userName);
              }
            } else {
              newWords.set(word, {
                text: word,
                count: 1,
                users: [userName],
              });
            }

            return newWords;
          });
        }
      } catch (e) {
        console.error("Failed to parse word cloud data:", e);
      }
    };

    room.on("dataReceived" as any, handleData);
    return () => {
      room.off("dataReceived" as any, handleData);
    };
  }, [room]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || hasSubmitted) return;

    const word = inputValue.trim().toLowerCase();

    // Send to other participants
    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        type: "wordcloud-response",
        word,
      })
    );
    room.localParticipant.publishData(data, { reliable: true });

    // Add locally
    const userName = room.localParticipant.name || room.localParticipant.identity;
    setWords((prev) => {
      const newWords = new Map(prev);
      const existing = newWords.get(word);

      if (existing) {
        if (!existing.users.includes(userName)) {
          existing.count++;
          existing.users.push(userName);
        }
      } else {
        newWords.set(word, {
          text: word,
          count: 1,
          users: [userName],
        });
      }

      return newWords;
    });

    setHasSubmitted(true);
    setInputValue("");
    toast.success("Réponse envoyée!");
  }, [inputValue, hasSubmitted, room]);

  const resetPoll = () => {
    setWords(new Map());
    setHasSubmitted(false);
    toast.info("Sondage réinitialisé");
  };

  const exportResults = () => {
    const sortedWords = Array.from(words.values()).sort((a, b) => b.count - a.count);
    const text = sortedWords
      .map((w, i) => `${i + 1}. ${w.text} (${w.count} réponse${w.count > 1 ? "s" : ""})`)
      .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wordcloud-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Résultats exportés");
  };

  const sortedWords = Array.from(words.values()).sort((a, b) => b.count - a.count);
  const maxCount = sortedWords[0]?.count || 1;
  const totalResponses = sortedWords.reduce((sum, w) => sum + w.count, 0);

  // Calculate font size based on frequency
  const getFontSize = (count: number) => {
    const minSize = 14;
    const maxSize = 48;
    const ratio = count / maxCount;
    return minSize + (maxSize - minSize) * ratio;
  };

  // Get color based on frequency
  const getColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-blue-500";
    if (ratio > 0.4) return "text-purple-500";
    if (ratio > 0.2) return "text-green-500";
    return "text-zinc-400";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Nuage de Mots
              </h2>
              <p className="text-sm text-zinc-400">{question}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-400 border-blue-500/20"
            >
              <Hash className="h-3 w-3 mr-1" />
              {totalResponses} réponse{totalResponses !== 1 ? "s" : ""}
            </Badge>
            {isTeacher && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetPoll}
                  className="border-zinc-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportResults}
                  className="border-zinc-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Word Cloud Visualization */}
          <div className="flex-1 p-8 overflow-auto">
            {sortedWords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Cloud className="h-16 w-16 text-zinc-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  En attente de réponses
                </h3>
                <p className="text-zinc-400 max-w-md">
                  Les mots soumis apparaîtront ici en temps réel
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4 p-8">
                {sortedWords.map((word, index) => (
                  <div
                    key={word.text}
                    className={cn(
                      "font-bold transition-all hover:scale-110 cursor-pointer",
                      getColor(word.count)
                    )}
                    style={{
                      fontSize: `${getFontSize(word.count)}px`,
                      animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                    }}
                    title={`${word.count} réponse${word.count > 1 ? "s" : ""} - ${word.users.join(", ")}`}
                  >
                    {word.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar with Rankings */}
          <div className="w-80 border-l border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white mb-1">
                Classement
              </h3>
              <p className="text-xs text-zinc-400">
                Mots les plus populaires
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {sortedWords.slice(0, 10).map((word, index) => (
                  <Card
                    key={word.text}
                    className="bg-zinc-900 border-zinc-800 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                          index === 0 && "bg-yellow-500 text-black",
                          index === 1 && "bg-gray-400 text-black",
                          index === 2 && "bg-orange-600 text-white",
                          index > 2 && "bg-zinc-700 text-zinc-300"
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate capitalize">
                          {word.text}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {word.count} réponse{word.count > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-400">
                          {Math.round((word.count / totalResponses) * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                        style={{ width: `${(word.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Input Area */}
            {!isTeacher && isActive && (
              <div className="p-4 border-t border-zinc-800">
                {hasSubmitted ? (
                  <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Sparkles className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-green-400 mb-1">
                      Réponse envoyée!
                    </p>
                    <p className="text-xs text-zinc-400">
                      Merci pour votre participation
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-zinc-400 mb-2">
                      Votre réponse (un mot):
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="Entrez un mot..."
                        className="bg-zinc-900 border-zinc-800"
                        maxLength={30}
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={!inputValue.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
