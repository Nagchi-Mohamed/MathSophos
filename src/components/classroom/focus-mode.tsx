"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Focus,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Users,
  MessageSquare,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusModeProps {
  isActive: boolean;
  onToggle: () => void;
  onHideParticipants: (hide: boolean) => void;
  onHideChat: (hide: boolean) => void;
  onMuteNotifications: (mute: boolean) => void;
}

export function FocusMode({
  isActive,
  onToggle,
  onHideParticipants,
  onHideChat,
  onMuteNotifications,
}: FocusModeProps) {
  const [hideParticipants, setHideParticipants] = useState(false);
  const [hideChat, setHideChat] = useState(false);
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        toast.success("Mode plein écran activé");
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        toast.info("Mode plein écran désactivé");
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      toast.error("Impossible d'activer le plein écran");
    }
  }, []);

  const handleToggleFocus = useCallback(() => {
    onToggle();
    if (!isActive) {
      // Activate focus mode
      setHideParticipants(true);
      setHideChat(true);
      setMuteNotifications(true);
      onHideParticipants(true);
      onHideChat(true);
      onMuteNotifications(true);
      toast.success("Mode focus activé", {
        description: "Distractions minimisées pour une meilleure concentration",
      });
    } else {
      // Deactivate focus mode
      setHideParticipants(false);
      setHideChat(false);
      setMuteNotifications(false);
      onHideParticipants(false);
      onHideChat(false);
      onMuteNotifications(false);
      toast.info("Mode focus désactivé");
    }
  }, [isActive, onToggle, onHideParticipants, onHideChat, onMuteNotifications]);

  const handleToggleParticipants = useCallback(() => {
    const newValue = !hideParticipants;
    setHideParticipants(newValue);
    onHideParticipants(newValue);
  }, [hideParticipants, onHideParticipants]);

  const handleToggleChat = useCallback(() => {
    const newValue = !hideChat;
    setHideChat(newValue);
    onHideChat(newValue);
  }, [hideChat, onHideChat]);

  const handleToggleNotifications = useCallback(() => {
    const newValue = !muteNotifications;
    setMuteNotifications(newValue);
    onMuteNotifications(newValue);
  }, [muteNotifications, onMuteNotifications]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcut (F for focus)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "f" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        handleToggleFocus();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleToggleFocus]);

  return (
    <div className="relative">
      {/* Focus Mode Toggle Button */}
      <Button
        variant={isActive ? "default" : "ghost"}
        size="sm"
        onClick={handleToggleFocus}
        className={cn(
          "gap-2",
          isActive && "bg-purple-600 hover:bg-purple-700"
        )}
      >
        <Focus className="h-4 w-4" />
        <span className="hidden md:inline">
          {isActive ? "Mode Focus" : "Focus"}
        </span>
      </Button>

      {/* Focus Mode Indicator */}
      {isActive && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <Card className="bg-purple-600 border-purple-500 px-4 py-2 flex items-center gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="text-white font-medium">Mode Focus Actif</span>
            </div>
            <Separator orientation="vertical" className="h-4 bg-purple-400" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 text-white hover:bg-purple-700"
            >
              Paramètres
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFocus}
              className="h-6 w-6 p-0 text-white hover:bg-purple-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      )}

      {/* Focus Mode Settings Panel */}
      {isActive && showSettings && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <Card className="bg-[#1a1a1a] border-zinc-800 p-4 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                Paramètres du Mode Focus
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {/* Hide Participants */}
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-white">Masquer participants</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleParticipants}
                  className={cn(
                    "h-8 w-8 p-0",
                    hideParticipants ? "text-purple-500" : "text-zinc-500"
                  )}
                >
                  {hideParticipants ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Hide Chat */}
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-white">Masquer chat</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleChat}
                  className={cn(
                    "h-8 w-8 p-0",
                    hideChat ? "text-purple-500" : "text-zinc-500"
                  )}
                >
                  {hideChat ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Mute Notifications */}
              <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-white">Couper notifications</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleNotifications}
                  className={cn(
                    "h-8 w-8 p-0",
                    muteNotifications ? "text-purple-500" : "text-zinc-500"
                  )}
                >
                  {muteNotifications ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Separator className="bg-zinc-800" />

              {/* Fullscreen */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="w-full border-zinc-700 justify-between"
              >
                <span className="flex items-center gap-2">
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                  {isFullscreen ? "Quitter plein écran" : "Plein écran"}
                </span>
                <kbd className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded">
                  F11
                </kbd>
              </Button>
            </div>

            <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-purple-400 mb-1">
                    Raccourci clavier
                  </p>
                  <p className="text-xs text-zinc-400">
                    Utilisez <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">Shift</kbd> + <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">F</kbd> pour basculer
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Immersive View Component (for presentations)
export function ImmersiveView({ isActive, onClose }: { isActive: boolean; onClose: () => void }) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/10"
      >
        <X className="h-4 w-4 mr-2" />
        Quitter
      </Button>
      <div className="w-full h-full flex items-center justify-center">
        {/* Content goes here */}
      </div>
    </div>
  );
}
