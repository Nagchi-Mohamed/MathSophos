"use client";

import { useState, useEffect, useCallback } from "react";
import { Room, Participant } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Sparkles,
  Download,
  Copy,
  X,
  Clock,
  Users,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
  FileText,
  Brain,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingSummary {
  sessionTitle: string;
  duration: number;
  participants: string[];
  keyTopics: string[];
  actionItems: string[];
  decisions: string[];
  questions: string[];
  sentiment: "positive" | "neutral" | "negative";
  engagementScore: number;
  highlights: string[];
}

interface AIAssistantProps {
  room: Room;
  participants: Participant[];
  sessionDuration: number;
  onClose: () => void;
}

export function AIAssistant({ room, participants, sessionDuration, onClose }: AIAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [progress, setProgress] = useState(0);

  const generateSummary = useCallback(async () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate AI processing
    const steps = [
      { progress: 20, message: "Analyzing conversation..." },
      { progress: 40, message: "Extracting key topics..." },
      { progress: 60, message: "Identifying action items..." },
      { progress: 80, message: "Generating insights..." },
      { progress: 100, message: "Finalizing summary..." },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProgress(step.progress);
      toast.info(step.message);
    }

    // Generate mock summary - in production, use AI API
    const mockSummary: MeetingSummary = {
      sessionTitle: room.name,
      duration: sessionDuration,
      participants: participants.map((p) => p.name || p.identity),
      keyTopics: [
        "Équations du second degré",
        "Méthodes de résolution",
        "Applications pratiques",
        "Exercices de révision",
      ],
      actionItems: [
        "Compléter les exercices 5-10 pour la prochaine session",
        "Réviser les formules de résolution",
        "Préparer des questions pour le prochain cours",
        "Lire le chapitre 3 du manuel",
      ],
      decisions: [
        "Le prochain quiz aura lieu vendredi",
        "Les salles de sous-groupes seront utilisées pour les exercices",
        "Session de révision programmée pour jeudi",
      ],
      questions: [
        "Comment résoudre les équations avec discriminant négatif?",
        "Quelle est la différence entre les méthodes graphique et algébrique?",
        "Peut-on utiliser la calculatrice pendant l'examen?",
      ],
      sentiment: "positive",
      engagementScore: 87,
      highlights: [
        "Excellente participation de tous les étudiants",
        "Discussion approfondie sur les méthodes de résolution",
        "Plusieurs questions pertinentes posées",
        "Bonne compréhension générale du sujet",
      ],
    };

    setSummary(mockSummary);
    setIsGenerating(false);
    toast.success("Résumé généré avec succès!");
  }, [room, participants, sessionDuration]);

  const exportSummary = () => {
    if (!summary) return;

    const text = `
# Résumé de Session - ${summary.sessionTitle}

## Informations Générales
- **Durée:** ${Math.floor(summary.duration / 60)}h ${summary.duration % 60}m
- **Participants:** ${summary.participants.length}
- **Score d'engagement:** ${summary.engagementScore}%
- **Sentiment:** ${summary.sentiment}

## Participants
${summary.participants.map((p) => `- ${p}`).join("\n")}

## Sujets Clés
${summary.keyTopics.map((t) => `- ${t}`).join("\n")}

## Actions à Effectuer
${summary.actionItems.map((a) => `- [ ] ${a}`).join("\n")}

## Décisions Prises
${summary.decisions.map((d) => `- ${d}`).join("\n")}

## Questions Posées
${summary.questions.map((q) => `- ${q}`).join("\n")}

## Points Forts
${summary.highlights.map((h) => `- ${h}`).join("\n")}

---
Généré automatiquement par l'Assistant IA MathSphere
    `.trim();

    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-${new Date().toISOString()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Résumé exporté");
  };

  const copySummary = async () => {
    if (!summary) return;

    const text = `Résumé: ${summary.sessionTitle}\n\nActions:\n${summary.actionItems.join("\n")}`;
    await navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Assistant IA
              </h2>
              <p className="text-sm text-zinc-400">
                Résumé intelligent de votre session
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-400 border-green-500/20"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Généré
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse flex items-center justify-center">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-ping opacity-20" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Génération du résumé...
              </h3>
              <p className="text-zinc-400 mb-6">
                L'IA analyse votre session
              </p>
              <Progress value={progress} className="w-64 h-2" />
              <p className="text-sm text-zinc-500 mt-2">{progress}%</p>
            </div>
          ) : !summary ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Résumé intelligent
              </h3>
              <p className="text-zinc-400 text-center max-w-md mb-6">
                Générez un résumé complet de votre session avec l'IA : sujets clés,
                actions à effectuer, décisions et insights.
              </p>
              <Button
                onClick={generateSummary}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Générer le résumé
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-zinc-400">Durée</p>
                      <p className="text-lg font-bold text-white">
                        {formatDuration(summary.duration)}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-xs text-zinc-400">Participants</p>
                      <p className="text-lg font-bold text-white">
                        {summary.participants.length}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-zinc-400">Engagement</p>
                      <p className="text-lg font-bold text-white">
                        {summary.engagementScore}%
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-xs text-zinc-400">Sentiment</p>
                      <p className="text-lg font-bold text-white capitalize">
                        {summary.sentiment}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Key Topics */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-white">
                    Sujets Clés
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.keyTopics.map((topic, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Action Items */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-white">
                    Actions à Effectuer
                  </h3>
                </div>
                <div className="space-y-2">
                  {summary.actionItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="h-5 w-5 rounded border-2 border-zinc-600 mt-0.5" />
                      <p className="text-white flex-1">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Decisions */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-white">
                    Décisions Prises
                  </h3>
                </div>
                <div className="space-y-2">
                  {summary.decisions.map((decision, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg"
                    >
                      <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                      <p className="text-white">{decision}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Questions */}
              <Card className="bg-zinc-900 border-zinc-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-white">
                    Questions Posées
                  </h3>
                </div>
                <div className="space-y-2">
                  {summary.questions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <span className="text-orange-500 font-bold mt-0.5">Q:</span>
                      <p className="text-zinc-300">{question}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Highlights */}
              <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-white">
                    Points Forts
                  </h3>
                </div>
                <div className="space-y-2">
                  {summary.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-white">{highlight}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {summary && (
          <div className="flex items-center justify-between p-6 border-t border-zinc-800">
            <p className="text-sm text-zinc-400">
              Généré par l'IA • {new Date().toLocaleString("fr-FR")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copySummary}
                className="border-zinc-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
              <Button
                onClick={exportSummary}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
