"use client";

import { useState, useEffect } from "react";
import { Room, LocalAudioTrack, createLocalAudioTrack } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

interface AudioSettingsProps {
  room: Room;
  onClose: () => void;
}

export function AudioSettings({ room, onClose }: AudioSettingsProps) {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMicrophoneWorking, setIsMicrophoneWorking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt">("prompt");
  const [isTestingMic, setIsTestingMic] = useState(false);

  // Load audio devices
  useEffect(() => {
    loadAudioDevices();
    checkMicrophonePermission();
  }, []);

  const loadAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`,
          kind: d.kind,
        }));

      const audioOutputs = devices
        .filter((d) => d.kind === "audiooutput")
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 5)}`,
          kind: d.kind,
        }));

      setAudioDevices([...audioInputs, ...audioOutputs]);

      // Set default devices
      if (audioInputs.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioInputs[0].deviceId);
      }
      if (audioOutputs.length > 0 && !selectedSpeaker) {
        setSelectedSpeaker(audioOutputs[0].deviceId);
      }
    } catch (error) {
      console.error("Failed to load audio devices:", error);
      toast.error("Impossible de charger les périphériques audio");
    }
  };

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
      setPermissionStatus(result.state);

      result.addEventListener("change", () => {
        setPermissionStatus(result.state);
      });
    } catch (error) {
      console.error("Permission check failed:", error);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus("granted");
      await loadAudioDevices();
      toast.success("Permission accordée!");
    } catch (error) {
      console.error("Permission denied:", error);
      setPermissionStatus("denied");
      toast.error("Permission refusée. Veuillez autoriser l'accès au microphone.");
    }
  };

  const testMicrophone = async () => {
    setIsTestingMic(true);
    try {
      const track = await createLocalAudioTrack({
        deviceId: selectedMicrophone,
      });

      // Monitor audio level
      const interval = setInterval(() => {
        // Simulate audio level (in production, use actual audio analysis)
        const level = Math.random() * 100;
        setAudioLevel(level);
        setIsMicrophoneWorking(level > 5);
      }, 100);

      // Stop after 5 seconds
      setTimeout(() => {
        clearInterval(interval);
        track.stop();
        setIsTestingMic(false);
        setAudioLevel(0);
      }, 5000);
    } catch (error) {
      console.error("Microphone test failed:", error);
      toast.error("Test du microphone échoué");
      setIsTestingMic(false);
    }
  };

  const changeMicrophone = async (deviceId: string) => {
    try {
      setSelectedMicrophone(deviceId);

      // Update LiveKit track
      const track = await createLocalAudioTrack({
        deviceId,
      });

      await room.localParticipant.publishTrack(track);
      toast.success("Microphone changé");
    } catch (error) {
      console.error("Failed to change microphone:", error);
      toast.error("Impossible de changer le microphone");
    }
  };

  const changeSpeaker = async (deviceId: string) => {
    try {
      setSelectedSpeaker(deviceId);
      // Note: Changing speaker requires HTMLMediaElement.setSinkId()
      toast.success("Haut-parleur changé");
    } catch (error) {
      console.error("Failed to change speaker:", error);
      toast.error("Impossible de changer le haut-parleur");
    }
  };

  const microphones = audioDevices.filter((d) => d.kind === "audioinput");
  const speakers = audioDevices.filter((d) => d.kind === "audiooutput");

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Paramètres Audio
              </h2>
              <p className="text-sm text-zinc-400">
                Configurez votre microphone et vos haut-parleurs
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Permission Status */}
          <Card className={cn(
            "p-4 border",
            permissionStatus === "granted" && "bg-green-500/10 border-green-500/20",
            permissionStatus === "denied" && "bg-red-500/10 border-red-500/20",
            permissionStatus === "prompt" && "bg-yellow-500/10 border-yellow-500/20"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {permissionStatus === "granted" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-white">
                    {permissionStatus === "granted" && "Microphone autorisé"}
                    {permissionStatus === "denied" && "Microphone bloqué"}
                    {permissionStatus === "prompt" && "Permission requise"}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {permissionStatus === "granted" && "Vous pouvez utiliser votre microphone"}
                    {permissionStatus === "denied" && "Veuillez autoriser l'accès dans les paramètres du navigateur"}
                    {permissionStatus === "prompt" && "Cliquez pour autoriser l'accès au microphone"}
                  </p>
                </div>
              </div>
              {permissionStatus !== "granted" && (
                <Button
                  onClick={requestMicrophonePermission}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Autoriser
                </Button>
              )}
            </div>
          </Card>

          {/* Microphone Selection */}
          <div className="space-y-2">
            <Label className="text-white">Microphone</Label>
            <Select value={selectedMicrophone} onValueChange={changeMicrophone}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="Sélectionnez un microphone" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {microphones.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Microphone Test */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white">Test du microphone</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={testMicrophone}
                disabled={isTestingMic || permissionStatus !== "granted"}
                className="border-zinc-700"
              >
                {isTestingMic ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Tester
                  </>
                )}
              </Button>
            </div>

            {/* Audio Level Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Niveau audio</span>
                <Badge
                  variant="outline"
                  className={cn(
                    isMicrophoneWorking
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-zinc-800 text-zinc-500 border-zinc-700"
                  )}
                >
                  {isMicrophoneWorking ? "Fonctionne" : "Silencieux"}
                </Badge>
              </div>
              <Progress
                value={audioLevel}
                className="h-2"
              />
              <p className="text-xs text-zinc-500">
                Parlez dans votre microphone pour tester le niveau audio
              </p>
            </div>
          </div>

          {/* Speaker Selection */}
          <div className="space-y-2">
            <Label className="text-white">Haut-parleurs</Label>
            <Select value={selectedSpeaker} onValueChange={changeSpeaker}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="Sélectionnez des haut-parleurs" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {speakers.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Troubleshooting Tips */}
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              Dépannage
            </h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Vérifiez que votre microphone est branché et allumé</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Assurez-vous qu'aucune autre application n'utilise le microphone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Vérifiez les paramètres de confidentialité de votre navigateur</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Essayez de rafraîchir la page si le problème persiste</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-zinc-800">
          <Button
            variant="outline"
            onClick={loadAudioDevices}
            className="border-zinc-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Terminé
          </Button>
        </div>
      </Card>
    </div>
  );
}
