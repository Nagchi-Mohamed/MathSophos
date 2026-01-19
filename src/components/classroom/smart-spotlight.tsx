"use client";

import { useState, useEffect, useCallback } from "react";
import { Participant } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  MessageSquare,
  Hand,
  Video,
  Mic,
  Star,
  Award,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParticipantMetrics {
  identity: string;
  name: string;
  messageCount: number;
  questionsAsked: number;
  handsRaised: number;
  speakingTime: number;
  engagementScore: number;
  isActive: boolean;
}

interface SmartSpotlightProps {
  participants: Participant[];
  onSpotlight: (identity: string) => void;
  currentSpotlight: string | null;
}

export function SmartSpotlight({
  participants,
  onSpotlight,
  currentSpotlight,
}: SmartSpotlightProps) {
  const [metrics, setMetrics] = useState<Map<string, ParticipantMetrics>>(
    new Map()
  );
  const [autoSpotlight, setAutoSpotlight] = useState(false);
  const [spotlightReason, setSpotlightReason] = useState<string>("");

  // Initialize metrics for participants
  useEffect(() => {
    const newMetrics = new Map<string, ParticipantMetrics>();

    participants.forEach((p) => {
      const existing = metrics.get(p.identity);
      newMetrics.set(p.identity, {
        identity: p.identity,
        name: p.name || p.identity,
        messageCount: existing?.messageCount || Math.floor(Math.random() * 20),
        questionsAsked: existing?.questionsAsked || Math.floor(Math.random() * 5),
        handsRaised: existing?.handsRaised || Math.floor(Math.random() * 3),
        speakingTime: existing?.speakingTime || Math.floor(Math.random() * 300),
        engagementScore: existing?.engagementScore || Math.floor(Math.random() * 100),
        isActive: p.isSpeaking || false,
      });
    });

    setMetrics(newMetrics);
  }, [participants]);

  // Auto-spotlight logic
  useEffect(() => {
    if (!autoSpotlight) return;

    const interval = setInterval(() => {
      const metricsArray = Array.from(metrics.values());

      // Find most engaged participant
      const mostEngaged = metricsArray.reduce((prev, current) => {
        return current.engagementScore > prev.engagementScore ? current : prev;
      }, metricsArray[0]);

      // Find most active speaker
      const mostActive = metricsArray.find((m) => m.isActive);

      // Find participant with most questions
      const mostQuestions = metricsArray.reduce((prev, current) => {
        return current.questionsAsked > prev.questionsAsked ? current : prev;
      }, metricsArray[0]);

      // Prioritize: Active speaker > Most questions > Most engaged
      let selectedParticipant: ParticipantMetrics | undefined;
      let reason = "";

      if (mostActive) {
        selectedParticipant = mostActive;
        reason = "Participant actif";
      } else if (mostQuestions.questionsAsked > 0) {
        selectedParticipant = mostQuestions;
        reason = `${mostQuestions.questionsAsked} question${mostQuestions.questionsAsked > 1 ? "s" : ""}`;
      } else {
        selectedParticipant = mostEngaged;
        reason = `${mostEngaged.engagementScore}% d'engagement`;
      }

      if (selectedParticipant && selectedParticipant.identity !== currentSpotlight) {
        onSpotlight(selectedParticipant.identity);
        setSpotlightReason(reason);
        toast.info(`Spotlight: ${selectedParticipant.name}`, {
          description: reason,
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [autoSpotlight, metrics, currentSpotlight, onSpotlight]);

  const calculateEngagementLevel = (score: number) => {
    if (score >= 80) return { label: "Très actif", color: "text-green-500" };
    if (score >= 60) return { label: "Actif", color: "text-blue-500" };
    if (score >= 40) return { label: "Modéré", color: "text-yellow-500" };
    return { label: "Passif", color: "text-zinc-500" };
  };

  const topParticipants = Array.from(metrics.values())
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 5);

  return (
    <Card className="bg-[#1a1a1a] border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="text-sm font-semibold text-white">
            Spotlight Intelligent
          </h3>
        </div>
        <Button
          variant={autoSpotlight ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setAutoSpotlight(!autoSpotlight);
            toast.success(
              autoSpotlight
                ? "Spotlight automatique désactivé"
                : "Spotlight automatique activé"
            );
          }}
          className={cn(
            autoSpotlight && "bg-purple-600 hover:bg-purple-700"
          )}
        >
          <Zap className="h-3 w-3 mr-1" />
          {autoSpotlight ? "Auto ON" : "Auto OFF"}
        </Button>
      </div>

      {autoSpotlight && currentSpotlight && spotlightReason && (
        <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-purple-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-purple-400">
                Spotlight actuel
              </p>
              <p className="text-xs text-zinc-400">{spotlightReason}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-zinc-400 mb-3">
          Top participants par engagement
        </p>

        {topParticipants.map((participant, index) => {
          const engagement = calculateEngagementLevel(participant.engagementScore);
          const isSpotlighted = participant.identity === currentSpotlight;

          return (
            <div
              key={participant.identity}
              className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer",
                isSpotlighted
                  ? "bg-purple-500/10 border-purple-500/20 ring-2 ring-purple-500/50"
                  : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
              )}
              onClick={() => {
                onSpotlight(participant.identity);
                toast.success(`Spotlight sur ${participant.name}`);
              }}
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                    index === 0 && "bg-yellow-500 text-black",
                    index === 1 && "bg-gray-400 text-black",
                    index === 2 && "bg-orange-600 text-white",
                    index > 2 && "bg-zinc-700 text-zinc-300"
                  )}
                >
                  {index === 0 && <Award className="h-4 w-4" />}
                  {index !== 0 && index + 1}
                </div>

                {/* Avatar */}
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-500 text-white text-xs">
                    {participant.name[0]}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {participant.name}
                    </p>
                    {participant.isActive && (
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {participant.messageCount}
                    </div>
                    <div className="flex items-center gap-1">
                      <Hand className="h-3 w-3" />
                      {participant.handsRaised}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      {Math.floor(participant.speakingTime / 60)}m
                    </div>
                  </div>
                </div>

                {/* Engagement Score */}
                <div className="text-right">
                  <div className={cn("text-sm font-bold", engagement.color)}>
                    {participant.engagementScore}%
                  </div>
                  <div className="text-xs text-zinc-500">
                    {engagement.label}
                  </div>
                </div>
              </div>

              {/* Engagement Bar */}
              <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    participant.engagementScore >= 80 && "bg-green-500",
                    participant.engagementScore >= 60 &&
                    participant.engagementScore < 80 &&
                    "bg-blue-500",
                    participant.engagementScore >= 40 &&
                    participant.engagementScore < 60 &&
                    "bg-yellow-500",
                    participant.engagementScore < 40 && "bg-zinc-600"
                  )}
                  style={{ width: `${participant.engagementScore}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 mb-2">Critères d'engagement:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-zinc-400">
            <MessageSquare className="h-3 w-3" />
            Messages
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <Hand className="h-3 w-3" />
            Mains levées
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <Mic className="h-3 w-3" />
            Temps de parole
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <TrendingUp className="h-3 w-3" />
            Activité
          </div>
        </div>
      </div>
    </Card>
  );
}
