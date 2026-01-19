"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Smile,
  Heart,
  ThumbsUp,
  Laugh,
  PartyPopper,
  Lightbulb,
  Rocket,
  Star,
  Zap,
  Trophy,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionCount {
  emoji: string;
  count: number;
  users: string[];
}

interface ReactionsBarProps {
  onReact: (emoji: string) => void;
  reactions: Map<string, ReactionCount>;
  currentUser: string;
}

const REACTIONS = [
  { emoji: "👍", icon: ThumbsUp, label: "J'aime", color: "text-blue-500" },
  { emoji: "❤️", icon: Heart, label: "Adore", color: "text-red-500" },
  { emoji: "😂", icon: Laugh, label: "Drôle", color: "text-yellow-500" },
  { emoji: "🎉", icon: PartyPopper, label: "Célébration", color: "text-purple-500" },
  { emoji: "💡", icon: Lightbulb, label: "Idée", color: "text-orange-500" },
  { emoji: "🚀", icon: Rocket, label: "Génial", color: "text-green-500" },
  { emoji: "⭐", icon: Star, label: "Excellent", color: "text-yellow-400" },
  { emoji: "⚡", icon: Zap, label: "Rapide", color: "text-cyan-500" },
  { emoji: "🏆", icon: Trophy, label: "Champion", color: "text-amber-500" },
  { emoji: "😊", icon: Smile, label: "Content", color: "text-pink-500" },
];

export function ReactionsBar({ onReact, reactions, currentUser }: ReactionsBarProps) {
  const [showAll, setShowAll] = useState(false);
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null);

  const handleReact = useCallback((emoji: string) => {
    onReact(emoji);
    setAnimatingReaction(emoji);
    setTimeout(() => setAnimatingReaction(null), 1000);

    // Show floating emoji animation
    createFloatingEmoji(emoji);
  }, [onReact]);

  const createFloatingEmoji = (emoji: string) => {
    const container = document.getElementById("reactions-container");
    if (!container) return;

    const emojiElement = document.createElement("div");
    emojiElement.textContent = emoji;
    emojiElement.className = "floating-emoji";
    emojiElement.style.cssText = `
      position: fixed;
      font-size: 48px;
      pointer-events: none;
      z-index: 9999;
      animation: float-up 2s ease-out forwards;
      left: ${Math.random() * window.innerWidth}px;
      bottom: 100px;
    `;

    container.appendChild(emojiElement);
    setTimeout(() => emojiElement.remove(), 2000);
  };

  const displayedReactions = showAll ? REACTIONS : REACTIONS.slice(0, 6);
  const totalReactions = Array.from(reactions.values()).reduce(
    (sum, r) => sum + r.count,
    0
  );

  return (
    <>
      <div id="reactions-container" />
      <style jsx global>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(1.5);
            opacity: 0;
          }
        }
      `}</style>

      <Card className="bg-[#1a1a1a] border-zinc-800 p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-white">Réactions</span>
          {totalReactions > 0 && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              {totalReactions}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-3">
          {displayedReactions.map((reaction) => {
            const Icon = reaction.icon;
            const reactionData = reactions.get(reaction.emoji);
            const hasReacted = reactionData?.users.includes(currentUser);
            const count = reactionData?.count || 0;

            return (
              <Button
                key={reaction.emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleReact(reaction.emoji)}
                className={cn(
                  "relative h-12 flex flex-col items-center justify-center gap-1 hover:bg-zinc-800 transition-all",
                  hasReacted && "bg-zinc-800 ring-2 ring-blue-500/50",
                  animatingReaction === reaction.emoji && "scale-125"
                )}
                title={reaction.label}
              >
                <Icon className={cn("h-5 w-5", reaction.color)} />
                {count > 0 && (
                  <span className="text-xs text-zinc-400 font-medium">
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {REACTIONS.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-zinc-400 hover:text-white"
          >
            {showAll ? "Voir moins" : `+${REACTIONS.length - 6} réactions`}
          </Button>
        )}

        {/* Active Reactions Display */}
        {totalReactions > 0 && (
          <>
            <Separator className="my-3 bg-zinc-800" />
            <div className="space-y-2">
              {Array.from(reactions.entries())
                .filter(([_, data]) => data.count > 0)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5)
                .map(([emoji, data]) => (
                  <div
                    key={emoji}
                    className="flex items-center justify-between p-2 bg-zinc-900/50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{emoji}</span>
                      <span className="text-sm text-zinc-400">
                        {data.users.slice(0, 3).join(", ")}
                        {data.users.length > 3 && ` +${data.users.length - 3}`}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
                      {data.count}
                    </Badge>
                  </div>
                ))}
            </div>
          </>
        )}
      </Card>
    </>
  );
}

// Floating Reactions Overlay Component
export function FloatingReactions({ reactions }: { reactions: Array<{ emoji: string; x: number; y: number; timestamp: number }> }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {reactions.map((reaction, index) => (
        <div
          key={`${reaction.timestamp}-${index}`}
          className="absolute text-4xl animate-float-up"
          style={{
            left: `${reaction.x}px`,
            top: `${reaction.y}px`,
            animation: "float-up 2s ease-out forwards",
          }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
}

// Quick Reaction Picker (appears on hover over video)
export function QuickReactionPicker({ onReact }: { onReact: (emoji: string) => void }) {
  const quickReactions = REACTIONS.slice(0, 5);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {quickReactions.map((reaction) => {
        const Icon = reaction.icon;
        return (
          <button
            key={reaction.emoji}
            onClick={() => onReact(reaction.emoji)}
            className={cn(
              "h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all hover:scale-125",
              reaction.color
            )}
            title={reaction.label}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}
