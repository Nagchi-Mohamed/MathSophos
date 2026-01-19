"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Keyboard, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyboardShortcutsProps {
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

export function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  const shortcuts: Shortcut[] = [
    // Media Controls
    { keys: ["Ctrl", "D"], description: "Activer/désactiver le micro", category: "Contrôles média" },
    { keys: ["Ctrl", "E"], description: "Activer/désactiver la caméra", category: "Contrôles média" },
    { keys: ["Ctrl", "Shift", "S"], description: "Partager l'écran", category: "Contrôles média" },
    { keys: ["Ctrl", "Shift", "R"], description: "Démarrer/arrêter l'enregistrement", category: "Contrôles média" },

    // Navigation
    { keys: ["Ctrl", "Shift", "C"], description: "Ouvrir le chat", category: "Navigation" },
    { keys: ["Ctrl", "Shift", "P"], description: "Ouvrir les participants", category: "Navigation" },
    { keys: ["Ctrl", "Shift", "W"], description: "Ouvrir le tableau blanc", category: "Navigation" },
    { keys: ["Ctrl", "Shift", "N"], description: "Ouvrir les notes", category: "Navigation" },
    { keys: ["Ctrl", "Shift", "A"], description: "Ouvrir les analytics", category: "Navigation" },

    // Actions
    { keys: ["Ctrl", "Shift", "H"], description: "Lever/baisser la main", category: "Actions" },
    { keys: ["Ctrl", "Shift", "B"], description: "Ouvrir les salles de sous-groupes", category: "Actions" },
    { keys: ["Ctrl", "Shift", "Q"], description: "Démarrer un quiz", category: "Actions" },
    { keys: ["Ctrl", "Shift", "T"], description: "Activer la transcription", category: "Actions" },

    // View
    { keys: ["Ctrl", "Shift", "G"], description: "Basculer vue galerie/orateur", category: "Vue" },
    { keys: ["Ctrl", "Shift", "F"], description: "Plein écran", category: "Vue" },
    { keys: ["Ctrl", "Shift", "M"], description: "Masquer/afficher les contrôles", category: "Vue" },

    // General
    { keys: ["Ctrl", "Shift", "K"], description: "Afficher les raccourcis clavier", category: "Général" },
    { keys: ["Ctrl", "Shift", "L"], description: "Quitter la session", category: "Général" },
    { keys: ["Esc"], description: "Fermer le dialogue actuel", category: "Général" },
  ];

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Keyboard className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Raccourcis clavier
              </h2>
              <p className="text-sm text-zinc-400">
                Gagnez du temps avec ces raccourcis
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors"
                      >
                        <span className="text-white">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <div key={keyIndex} className="flex items-center gap-1">
                              <kbd className="px-2 py-1 text-xs font-semibold text-white bg-zinc-800 border border-zinc-700 rounded shadow-sm">
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-zinc-600">+</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
                {category !== categories[categories.length - 1] && (
                  <Separator className="my-4 bg-zinc-800" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Command className="h-4 w-4" />
            <span>
              Astuce : Utilisez <kbd className="px-1.5 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">Shift</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-zinc-800 border border-zinc-700 rounded">K</kbd> pour afficher cette fenêtre à tout moment
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Hook to handle keyboard shortcuts
export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Build the key combination string
      const keys: string[] = [];
      if (e.ctrlKey) keys.push("ctrl");
      if (e.shiftKey) keys.push("shift");
      if (e.altKey) keys.push("alt");
      if (e.metaKey) keys.push("meta");

      // Add the actual key
      const key = e.key.toLowerCase();
      if (!["control", "shift", "alt", "meta"].includes(key)) {
        keys.push(key);
      }

      const combination = keys.join("+");

      // Check if we have a handler for this combination
      if (handlers[combination]) {
        e.preventDefault();
        handlers[combination]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
