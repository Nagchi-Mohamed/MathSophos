"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  Chat,
  useLocalParticipant,
  TrackToggle,
  useRoomContext,
  useConnectionState,
  useParticipants,
  useRemoteParticipants,
  ConnectionQualityIndicator,
  VideoTrack,
  useMediaDeviceSelect,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, LocalVideoTrack, createLocalTracks, DisconnectReason, ConnectionState, Participant, RemoteParticipant, RoomEvent, DataPacket_Kind, ParticipantEvent } from "livekit-client";
import {
  Loader2,
  AlertCircle,
  MessageSquare,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Users,
  Settings2,
  CheckCircle2,
  MonitorUp,
  X,
  LayoutGrid,
  Maximize2,
  Smile,
  Hand,
  MoreVertical,
  ChevronUp,
  PhoneOff,
  ShieldCheck,
  Disc,
  Check,
  Send,
  Lock,
  StopCircle
} from "lucide-react";
import { toast } from "sonner";
import { getParticipantToken, checkLiveKitConnection } from "@/actions/livekit";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EnhancedControls } from "@/components/classroom/enhanced-controls";
import { Whiteboard } from "@/components/classroom/whiteboard";
import { Polls } from "@/components/classroom/polls";
import { WaitingRoom, WaitingRoomScreen } from "@/components/classroom/waiting-room";
import { BackgroundEffects } from "@/components/classroom/background-effects";
import { FileShare, FileAttachmentCard, FilePreviewModal } from "@/components/classroom/file-share";
import { BreakoutRooms } from "@/components/classroom/breakout-rooms";
import { AttendanceTracker } from "@/components/classroom/attendance-tracker";
import { LiveQuiz } from "@/components/classroom/live-quiz";
import { LiveTranscription } from "@/components/classroom/live-transcription";
import { RecordingManager } from "@/components/classroom/recording-manager";
import { CollaborativeNotes } from "@/components/classroom/collaborative-notes";
import { AnalyticsDashboard } from "@/components/classroom/analytics-dashboard";
import { KeyboardShortcuts, useKeyboardShortcuts } from "@/components/classroom/keyboard-shortcuts";
import { AIAssistant } from "@/components/classroom/ai-assistant";
import { ReactionsBar } from "@/components/classroom/reactions-bar";
import { PictureInPictureMode } from "@/components/classroom/picture-in-picture";
import { FocusMode } from "@/components/classroom/focus-mode";
import { SessionReplay } from "@/components/classroom/session-replay";
import { SmartSpotlight } from "@/components/classroom/smart-spotlight";
import { WordCloudPoll } from "@/components/classroom/word-cloud-poll";
import { VideoGrid } from "@/components/classroom/video-grid";
import { AudioSettings } from "@/components/classroom/audio-settings";
import { MobileControls } from "@/components/classroom/mobile-controls";

interface LiveSessionProps {
  roomName: string;
  userName: string;
  userEmail?: string | null;
  isTeacher: boolean;
}

export function LiveSession({ roomName, userName, userEmail, isTeacher }: LiveSessionProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<string | null>(null);

  const [preJoinChoices, setPreJoinChoices] = useState<{
    username: string;
    videoEnabled: boolean;
    audioEnabled: boolean;
    videoDeviceId?: string;
    audioDeviceId?: string;
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const resp = await getParticipantToken(roomName, userName);
        setToken(resp);
      } catch (e) {
        console.error(e);
        setError("Failed to authenticate. Please check your connection.");
      }
    })();
  }, [roomName, userName]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!url) {
      setError("System Configuration Error: The LiveKit Server URL (NEXT_PUBLIC_LIVEKIT_URL) is missing from the environment configuration.");
    } else if (!url.startsWith("wss://")) {
      console.warn("LiveKit URL does not start with wss://. This may cause connection issues.");
    }
  }, []);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 p-8">
        <div className="text-center max-w-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">Connection Issue</h3>
          <div className="bg-zinc-900/50 p-4 rounded-lg border border-red-500/20 mb-6 text-left overflow-hidden">
            <p className="text-zinc-300 font-mono text-xs whitespace-pre-wrap break-all">{error}</p>
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <Button variant="outline" onClick={() => window.location.href = '/classrooms'}>Back</Button>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isMounted) return null;

  return (
    <div className="h-[calc(100dvh-6rem)] md:h-[calc(100vh-6rem)] w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 relative group select-none">
      {token === "" ? (
        <div className="flex h-full w-full items-center justify-center bg-zinc-950">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-zinc-400 font-medium ml-4">Connecting to Classroom...</p>
        </div>
      ) : (
        <LiveKitRoom
          video={preJoinChoices?.videoEnabled ? { deviceId: preJoinChoices.videoDeviceId } : false}
          audio={preJoinChoices?.audioEnabled ? { deviceId: preJoinChoices.audioDeviceId } : false}
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          connect={!!preJoinChoices}
          options={{ adaptiveStream: true, dynacast: true, publishDefaults: { simulcast: true } }}
          data-lk-theme="default"
          style={{ height: '100%' }}
          onDisconnected={(reason) => {
            if (reason === DisconnectReason.CLIENT_INITIATED) {
              window.location.href = `/classrooms`;
            } else {
              setError(`Disconnected: ${reason}`);
              setPreJoinChoices(null);
            }
          }}
          onError={(err) => setError(`Room Error: ${err.message}`)}
        >
          {!preJoinChoices ? (
            <CustomLobby userName={userName} isTeacher={isTeacher} onJoin={setPreJoinChoices} />
          ) : (
            <ZoomLikeConference isTeacher={isTeacher} />
          )}
        </LiveKitRoom>
      )}
    </div>
  );
}

function CustomLobby({ userName, isTeacher, onJoin }: { userName: string, isTeacher: boolean, onJoin: (values: any) => void }) {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Device hooks
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (!audioEnabled || !selectedAudioDevice) {
      setAudioLevel(0);
      return;
    }

    let audioContext: AudioContext | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let javascriptNode: ScriptProcessorNode | null = null;
    let stream: MediaStream | null = null;

    const startAnalysis = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedAudioDevice } }
        });

        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 1024;

        microphone.connect(analyser);
        analyser.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);

        javascriptNode.onaudioprocess = () => {
          if (!analyser) return;
          const array = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(array);
          let values = 0;
          const length = array.length;
          for (let i = 0; i < length; i++) {
            values += array[i];
          }
          const average = values / length;
          setAudioLevel(Math.min(100, Math.max(0, average * 2)));
        };
      } catch (e) {
        console.error("Error accessing audio for visualizer", e);
      }
    };

    startAnalysis();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (javascriptNode) javascriptNode.disconnect();
      if (analyser) analyser.disconnect();
      if (microphone) microphone.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    };
  }, [audioEnabled, selectedAudioDevice]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Initial enumerate
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vids = devices.filter(d => d.kind === 'videoinput');
        const auds = devices.filter(d => d.kind === 'audioinput');

        setVideoDevices(vids);
        setAudioDevices(auds);

        if (vids.length > 0) setSelectedVideoDevice(vids[0].deviceId);
        if (auds.length > 0) setSelectedAudioDevice(auds[0].deviceId);

        // Listen for changes
        navigator.mediaDevices.ondevicechange = async () => {
          const newDevices = await navigator.mediaDevices.enumerateDevices();
          setVideoDevices(newDevices.filter(d => d.kind === 'videoinput'));
          setAudioDevices(newDevices.filter(d => d.kind === 'audioinput'));
        };
      } catch (e) {
        console.error("Error enumerating devices", e);
      }
    };
    getDevices();
    return () => { navigator.mediaDevices.ondevicechange = null; };
  }, []);

  useEffect(() => {
    let track: LocalVideoTrack | null = null;
    const enableVideo = async () => {
      if (videoEnabled) {
        try {
          if (videoTrack) {
            videoTrack.stop();
          }
          const tracks = await createLocalTracks({
            audio: false,
            video: selectedVideoDevice ? { deviceId: selectedVideoDevice } : true
          });
          track = tracks[0] as LocalVideoTrack;
          setVideoTrack(track);
          if (videoRef.current) {
            track.attach(videoRef.current);
          }
        } catch (e) {
          console.error("Error accessing camera", e);
        }
      } else {
        if (videoTrack) {
          videoTrack.stop();
          setVideoTrack(null);
        }
      }
    };
    enableVideo();
    return () => {
      track?.stop();
    };
  }, [videoEnabled, selectedVideoDevice]);

  return (
    <div className="h-full w-full bg-[#1a1a1a] flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full bg-[#242424] border-0 shadow-2xl overflow-hidden grid md:grid-cols-2 rounded-lg">
        <div className="p-10 flex flex-col justify-center bg-[#1a1a1a]">
          <h2 className="text-2xl font-semibold text-white mb-6">Rejoindre la réunion</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">VOTRE NOM</label>
              <div className="h-10 flex items-center px-3 rounded bg-[#242424] text-white border border-[#3e3e3e]">
                {userName} {isTeacher && "(Enseignant)"}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">Ne pas se connecter à l'audio</span>
                <input type="checkbox" checked={!audioEnabled} onChange={() => setAudioEnabled(!audioEnabled)} className="accent-blue-600 h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-sm">Désactiver ma vidéo</span>
                <input type="checkbox" checked={!videoEnabled} onChange={() => setVideoEnabled(!videoEnabled)} className="accent-blue-600 h-4 w-4" />
              </div>
            </div>

            <Button
              className="w-full h-10 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors"
              onClick={() => onJoin({
                username: userName,
                videoEnabled,
                audioEnabled,
                videoDeviceId: selectedVideoDevice,
                audioDeviceId: selectedAudioDevice
              })}
            >
              Rejoindre
            </Button>
          </div>
        </div>

        <div className="bg-black relative flex items-center justify-center overflow-hidden">
          {videoEnabled ? (
            <video ref={videoRef} className="w-full h-full object-cover transform -scale-x-100" />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-zinc-800 text-zinc-400">{userName[0]}</AvatarFallback>
              </Avatar>
              <div className="text-zinc-500">Vidéo désactivée</div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-white/50">
            <div>{videoEnabled ? "Vérification vidéo : Réussie" : "Vidéo : Désactivée"}</div>

            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", audioLevel > 5 ? "bg-green-500 animate-pulse" : "bg-red-500")} />
              <div className="w-24 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100 ease-out"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span>{audioEnabled ? "Micro activé" : "Micro désactivé"}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

interface ChatMessage {
  timestamp: number;
  sender?: Participant;
  message: string;
}

function ZoomLikeConference({ isTeacher }: { isTeacher: boolean }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const [viewMode, setViewMode] = useState<'gallery' | 'speaker'>('gallery');
  const [sidebarView, setSidebarView] = useState<'none' | 'chat' | 'participants'>('none');
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();
  const room = useRoomContext();
  const connectionState = useConnectionState(room);
  const participants = useParticipants();

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) return;

    if (room && localParticipant) {
      const data = new TextEncoder().encode(JSON.stringify({ type: 'typing', identity: localParticipant.identity }));
      room.localParticipant.publishData(data, { reliable: false });

      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  }, [room, localParticipant]);

  // Zoom-like Controls State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Speech detection for local participant
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!localParticipant) return;

    const onSpeakingChanged = (speaking: boolean) => {
      setIsSpeaking(speaking);
    };

    localParticipant.on(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);

    // Check initial state
    setIsSpeaking(localParticipant.isSpeaking);

    return () => {
      localParticipant.off(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);
    };
  }, [localParticipant]);

  const startLocalRecording = async () => {
    try {
      // 1. Capture Screen (Video + System Audio)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" } as any,
        audio: true
      });

      // 2. Capture Microphone (User Voice)
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // 3. Combine streams
      // Note: MediaRecorder in Chrome/Firefox typically mixes multiple audio tracks.
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...screenStream.getAudioTracks(),
        ...micStream.getAudioTracks()
      ]);

      const mediaRecorder = new MediaRecorder(combinedStream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);

        setIsRecording(false);
        toast.info("Recording saved to computer.");

        // Ensure all tracks are fully stopped
        combinedStream.getTracks().forEach(track => track.stop());
        screenStream.getTracks().forEach(track => track.stop());
        micStream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording Started", { description: "Capturing screen and microphone..." });

      // Stop recording if the user stops sharing via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        stopLocalRecording();
      };

    } catch (err) {
      console.error("Error starting recording:", err);
      toast.error("Could not start recording", { description: "Permission denied or not supported." });
    }
  };

  const stopLocalRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const [securitySettings, setSecuritySettings] = useState({
    lockMeeting: false,
    enableWaitingRoom: false,
    allowShareScreen: true,
    allowChat: true,
    allowRename: true,
    allowUnmute: true,
  });

  // Enhanced Features State
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [pinnedParticipants, setPinnedParticipants] = useState<Set<string>>(new Set());
  const [spotlightedParticipant, setSpotlightedParticipant] = useState<string | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showBackgroundEffects, setShowBackgroundEffects] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState<Array<{ identity: string, name: string, joinedAt: number }>>([]);
  const [fileAttachments, setFileAttachments] = useState<any[]>([]);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // New enterprise features
  const [showBreakoutRooms, setShowBreakoutRooms] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showLiveQuiz, setShowLiveQuiz] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [showRecordings, setShowRecordings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Phase 3 features
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showPiP, setShowPiP] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [showSessionReplay, setShowSessionReplay] = useState(false);
  const [showSmartSpotlight, setShowSmartSpotlight] = useState(false);
  const [showWordCloud, setShowWordCloud] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // New Enhanced States
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLeave = useCallback(async () => {
    await room.disconnect();
    window.location.href = '/classrooms';
  }, [room]);
  const [reactions, setReactions] = useState<Map<string, any>>(new Map());


  // Immersive Mobile Controls
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      // Only auto-hide if no modal/sidebar is open
      if (sidebarView === 'none' && !showWhiteboard && !showPolls) {
        setControlsVisible(false);
      }
    }, 4000);
  }, [sidebarView, showWhiteboard, showPolls]);

  useEffect(() => {
    showControls();
    if (window.innerWidth < 768) {
      setViewMode('speaker');
    }
    const handleActivity = () => showControls();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls]);

  // Keyboard Shortcuts Integration
  useKeyboardShortcuts({
    "ctrl+shift+b": () => setShowBreakoutRooms(true),
    "ctrl+shift+q": () => setShowLiveQuiz(true),
    "ctrl+shift+t": () => setShowTranscription(true),
    "ctrl+shift+n": () => setShowNotes(true),
    "ctrl+shift+a": () => setShowAnalytics(true),
    "ctrl+shift+k": () => setShowKeyboardShortcuts(true),
    "ctrl+shift+w": () => setShowWhiteboard(true),
    "ctrl+shift+p": () => setSidebarView(sidebarView === 'participants' ? 'none' : 'participants'),
    "ctrl+shift+c": () => setSidebarView(sidebarView === 'chat' ? 'none' : 'chat'),
    "ctrl+shift+h": () => toggleRaiseHand(),
    "ctrl+shift+f": () => setFocusModeActive(!focusModeActive),
    "ctrl+shift+g": () => setViewMode(viewMode === 'gallery' ? 'speaker' : 'gallery'),
    "esc": () => {
      // Close any open overlays
      setShowBreakoutRooms(false);
      setShowAttendance(false);
      setShowLiveQuiz(false);
      setShowTranscription(false);
      setShowRecordings(false);
      setShowNotes(false);
      setShowAnalytics(false);
      setShowKeyboardShortcuts(false);
      setShowAIAssistant(false);
      setShowWordCloud(false);
      setShowSessionReplay(false);
      setShowWhiteboard(false);
      setShowPolls(false);
      setShowBackgroundEffects(false);
    },
  });

  // Track session duration
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  const handleVideoTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't toggle if clicking a button or interactive element
    if ((e.target as HTMLElement).closest('button, input, .interactive')) return;
    setControlsVisible(prev => !prev);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const sendChat = useCallback((message: string) => {
    if (room && localParticipant) {
      const chatPacket = JSON.stringify({ type: 'chat', message, timestamp: Date.now() });
      const encoder = new TextEncoder();
      const data = encoder.encode(chatPacket);
      room.localParticipant.publishData(data, { reliable: true });

      // Add to local chat immediately
      setChatMessages((prev) => [...prev, { timestamp: Date.now(), sender: localParticipant, message }]);
      setChatInput("");
    }
  }, [room, localParticipant]);

  // Enhanced Control Actions
  const toggleRaiseHand = useCallback(() => {
    const isRaised = raisedHands.has(localParticipant.identity);
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'raise-hand',
      identity: localParticipant.identity,
      raised: !isRaised
    }));
    room.localParticipant.publishData(data, { reliable: true });

    setRaisedHands(prev => {
      const next = new Set(prev);
      if (isRaised) {
        next.delete(localParticipant.identity);
      } else {
        next.add(localParticipant.identity);
      }
      return next;
    });
  }, [room, localParticipant, raisedHands]);

  const muteParticipant = useCallback((identity: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'mute-request',
      targetIdentity: identity
    }));
    room.localParticipant.publishData(data, { reliable: true });
    toast.success("Mute request sent");
  }, [room]);

  const removeParticipant = useCallback((identity: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'remove-request',
      targetIdentity: identity
    }));
    room.localParticipant.publishData(data, { reliable: true });
    toast.success("Participant removed");
  }, [room]);

  const spotlightParticipant = useCallback((identity: string | null) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'spotlight',
      identity
    }));
    room.localParticipant.publishData(data, { reliable: true });
    setSpotlightedParticipant(identity);
  }, [room]);

  const muteAll = useCallback(() => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'mute-all'
    }));
    room.localParticipant.publishData(data, { reliable: true });
    toast.success("Muted all participants");
  }, [room]);

  const pinParticipant = useCallback((identity: string) => {
    setPinnedParticipants(prev => {
      const next = new Set(prev);
      if (next.has(identity)) {
        next.delete(identity);
      } else {
        next.add(identity);
      }
      return next;
    });
  }, []);

  const handleFileSelect = useCallback((file: any) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      type: 'file-share',
      file
    }));
    room.localParticipant.publishData(data, { reliable: true });
    setFileAttachments(prev => [...prev, file]);
  }, [room]);

  const admitParticipant = useCallback((identity: string) => {
    // In production, this would send a server request
    setWaitingParticipants(prev => prev.filter(p => p.identity !== identity));
  }, []);

  const denyParticipant = useCallback((identity: string) => {
    setWaitingParticipants(prev => prev.filter(p => p.identity !== identity));
  }, []);

  const admitAll = useCallback(() => {
    setWaitingParticipants([]);
  }, []);

  useEffect(() => {
    if (!room) return;

    const onDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: DataPacket_Kind,
      topic?: string
    ) => {
      const decoder = new TextDecoder();
      const message = decoder.decode(payload);
      try {
        const parsed = JSON.parse(message);

        // Handle chat messages
        if (parsed.type === 'chat') {
          setChatMessages((prev) => [...prev, { timestamp: parsed.timestamp, sender: participant, message: parsed.message }]);
        }

        // Handle raise hand
        if (parsed.type === 'raise-hand') {
          setRaisedHands(prev => {
            const next = new Set(prev);
            if (parsed.raised) {
              next.add(parsed.identity);
              if (isTeacher) {
                toast.info(`${parsed.identity} raised their hand`, { duration: 3000 });
              }
            } else {
              next.delete(parsed.identity);
            }
            return next;
          });
        }

        // Handle mute request (from teacher)
        if (parsed.type === 'mute-request' && parsed.targetIdentity === localParticipant.identity) {
          localParticipant.setMicrophoneEnabled(false);
          toast.info("You have been muted by the host");
        }

        // Handle mute all
        if (parsed.type === 'mute-all' && !isTeacher) {
          localParticipant.setMicrophoneEnabled(false);
          toast.info("Host muted all participants");
        }

        // Handle remove request
        if (parsed.type === 'remove-request' && parsed.targetIdentity === localParticipant.identity) {
          toast.error("You have been removed from the meeting");
          setTimeout(() => room.disconnect(), 1000);
        }

        // Handle spotlight
        if (parsed.type === 'spotlight') {
          setSpotlightedParticipant(parsed.identity);
          if (parsed.identity) {
            toast.info(`${parsed.identity} is now spotlighted`);
          }
        }

        // Handle file share
        if (parsed.type === 'file-share') {
          setFileAttachments(prev => [...prev, parsed.file]);
          toast.success(`${participant?.name || 'Someone'} shared a file`);
        }

        // Handle typing
        if (parsed.type === 'typing' && participant) {
          setTypingUsers(prev => {
            const next = new Set(prev);
            next.add(participant.name || participant.identity);
            return next;
          });

          // Clear typing status after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const next = new Set(prev);
              next.delete(participant.name || participant.identity);
              return next;
            });
          }, 3000);
        }

      } catch (e) {
        console.error("Failed to parse data message:", e);
      }
    };

    room.on(RoomEvent.DataReceived, onDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [room, localParticipant, isTeacher]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, sidebarView]);

  // If not connected yet, show loading
  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="flex h-full w-full justify-center items-center bg-[#1a1a1a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-zinc-400">Entering meeting...</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = (view: 'chat' | 'participants') => {
    setSidebarView(current => current === view ? 'none' : view);
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-white relative overflow-hidden font-sans">

      {/* Whiteboard Overlay */}
      {showWhiteboard && (
        <Whiteboard
          room={room}
          isTeacher={isTeacher}
          onClose={() => setShowWhiteboard(false)}
        />
      )}

      {/* Polls Overlay */}
      {showPolls && (
        <Polls
          room={room}
          isTeacher={isTeacher}
          participants={participants}
          onClose={() => setShowPolls(false)}
        />
      )}

      {/* Background Effects Overlay */}
      {showBackgroundEffects && (
        <BackgroundEffects
          videoTrack={localParticipant.videoTrackPublications.values().next().value?.track?.mediaStreamTrack || null}
          onClose={() => setShowBackgroundEffects(false)}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          attachment={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Breakout Rooms Overlay */}
      {showBreakoutRooms && (
        <BreakoutRooms
          room={room}
          isTeacher={isTeacher}
          participants={participants}
          onClose={() => setShowBreakoutRooms(false)}
        />
      )}

      {/* Attendance Tracker Overlay */}
      {showAttendance && (
        <AttendanceTracker
          room={room}
          isTeacher={isTeacher}
          participants={participants}
          onClose={() => setShowAttendance(false)}
        />
      )}

      {/* Live Quiz Overlay */}
      {showLiveQuiz && (
        <LiveQuiz
          room={room}
          isTeacher={isTeacher}
          participants={participants}
          onClose={() => setShowLiveQuiz(false)}
        />
      )}

      {/* Live Transcription Overlay */}
      {showTranscription && (
        <LiveTranscription
          room={room}
          isTeacher={isTeacher}
          onClose={() => setShowTranscription(false)}
        />
      )}

      {/* Recording Manager Overlay */}
      {showRecordings && (
        <RecordingManager
          classroomId={room.name}
          onClose={() => setShowRecordings(false)}
        />
      )}

      {/* Collaborative Notes Overlay */}
      {showNotes && (
        <CollaborativeNotes
          room={room}
          participants={participants}
          onClose={() => setShowNotes(false)}
        />
      )}

      {/* Analytics Dashboard Overlay */}
      {showAnalytics && (
        <AnalyticsDashboard
          classroomId={room.name}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Keyboard Shortcuts Overlay */}
      {showKeyboardShortcuts && (
        <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
      )}

      {/* Phase 3 - AI Assistant Overlay */}
      {showAIAssistant && (
        <AIAssistant
          room={room}
          participants={participants}
          sessionDuration={sessionDuration}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

      {/* Phase 3 - Word Cloud Poll Overlay */}
      {showWordCloud && (
        <WordCloudPoll
          room={room}
          question="Quel est le mot clé de cette session?"
          isTeacher={isTeacher}
          onClose={() => setShowWordCloud(false)}
        />
      )}

      {/* Phase 3 - Session Replay Overlay */}
      {showSessionReplay && (
        <SessionReplay
          sessionId={room.name}
          duration={sessionDuration}
          events={[]}
          highlights={[]}
          onClose={() => setShowSessionReplay(false)}
        />
      )}

      {/* Phase 3 - Focus Mode */}
      <FocusMode
        isActive={focusModeActive}
        onToggle={() => setFocusModeActive(!focusModeActive)}
        onHideParticipants={(hide) => {
          if (hide) setSidebarView('none');
        }}
        onHideChat={(hide) => {
          if (hide) setSidebarView('none');
        }}
        onMuteNotifications={(mute) => {
          // Handle notification muting
        }}
      />

      {/* Waiting Room (for teachers) */}
      {isTeacher && waitingParticipants.length > 0 && (
        <WaitingRoom
          room={room}
          waitingParticipants={waitingParticipants}
          onAdmit={admitParticipant}
          onDeny={denyParticipant}
          onAdmitAll={admitAll}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative" onClick={handleVideoTap}>
        {/* Video Grid Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center p-1" onTouchEnd={(e) => {
          if (e.target === e.currentTarget) handleVideoTap(e);
        }}>
          {/* Top Bar (Auto-hides or subtle) */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 transition-all duration-300 ease-in-out bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto",
            controlsVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
          )}>
            <div className="flex items-center gap-4 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="font-semibold text-white">MathSophos Classroom</span>
                <span className="scale-50 text-zinc-600">|</span>
                <span className="truncate max-w-[200px]">{room.name}</span>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 bg-zinc-900/80 px-2 py-1 rounded">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white font-medium">Recording...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isMobile && (
                <EnhancedControls
                  room={room}
                  isTeacher={isTeacher}
                  participants={participants}
                  raisedHands={raisedHands}
                  pinnedParticipants={pinnedParticipants}
                  spotlightedParticipant={spotlightedParticipant}
                  onToggleRaiseHand={toggleRaiseHand}
                  onMuteParticipant={muteParticipant}
                  onRemoveParticipant={removeParticipant}
                  onPinParticipant={pinParticipant}
                  onSpotlightParticipant={spotlightParticipant}
                  onMuteAll={muteAll}
                  onOpenWhiteboard={() => setShowWhiteboard(true)}
                  onOpenPolls={() => setShowPolls(true)}
                  onOpenBreakoutRooms={() => setShowBreakoutRooms(true)}
                  onOpenAttendance={() => setShowAttendance(true)}
                  onOpenQuiz={() => setShowLiveQuiz(true)}
                />
              )}

            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAudioSettings(true)}
                className="h-7 w-7 p-0 bg-[#1a1a1a]/80 hover:bg-[#2a2a2a] text-white border border-white/10 rounded-full"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === 'gallery' ? 'speaker' : 'gallery')}
                className="h-7 text-xs bg-[#1a1a1a]/80 hover:bg-[#2a2a2a] text-white border border-white/10"
              >
                {viewMode === 'gallery' ? <Maximize2 className="h-3 w-3 mr-2" /> : <LayoutGrid className="h-3 w-3 mr-2" />}
                {viewMode === 'gallery' ? 'Speaker View' : 'Gallery View'}
              </Button>
            </div>
          </div>

          <VideoGrid
            viewMode={viewMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isMobile={isMobile}
          />

          {/* Audio Settings Overlay */}
          {showAudioSettings && (
            <AudioSettings
              room={room}
              onClose={() => setShowAudioSettings(false)}
            />
          )}

          {/* Mobile Controls */}
          {isMobile && (
            <MobileControls
              isAudioEnabled={localParticipant.isMicrophoneEnabled}
              isVideoEnabled={localParticipant.isCameraEnabled}
              isHandRaised={false} // Would need to track this state for local user
              hasUnreadMessages={false} // Would need to track unread messages
              onToggleAudio={() => room.localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled)}
              onToggleVideo={() => room.localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)}
              onToggleHand={toggleRaiseHand}
              onLeave={handleLeave}
              onOpenChat={() => setSidebarView(sidebarView === 'chat' ? 'none' : 'chat')}
              onOpenParticipants={() => setSidebarView(sidebarView === 'participants' ? 'none' : 'participants')}
              onOpenMore={() => setShowAudioSettings(true)}
            />
          )}
        </div>

        {/* Sidebar */}
        {sidebarView !== 'none' && (
          <div className="absolute inset-0 z-50 md:static md:z-auto w-full md:w-[350px] bg-[#1a1a1a] border-l border-[#333] flex flex-col h-full animate-in slide-in-from-right duration-200 shadow-2xl">
            <div className="h-12 border-b border-[#333] flex items-center justify-between px-4">
              <h3 className="font-semibold text-sm">
                {sidebarView === 'participants' ? `Participants (${participants.length})` : 'Chat'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setSidebarView('none')} className="h-6 w-6 hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sidebarView === 'participants' ? (
                <ParticipantsList isTeacher={isTeacher} raisedHands={raisedHands} />
              ) : (
                <>


                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* File Attachments */}
                    {fileAttachments.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <div className="text-xs text-zinc-500 font-medium px-2">Shared Files</div>
                        {fileAttachments.map((file, index) => (
                          <FileAttachmentCard
                            key={index}
                            attachment={file}
                            onDownload={() => {
                              const a = document.createElement("a");
                              a.href = file.url;
                              a.download = file.name;
                              a.click();
                            }}
                            onPreview={() => setPreviewFile(file)}
                          />
                        ))}
                      </div>
                    )}

                    {chatMessages.length === 0 && fileAttachments.length === 0 ? (
                      <div className="text-zinc-500 text-center text-sm mt-10">
                        No messages yet
                      </div>
                    ) : (
                      chatMessages.map((msg, index) => {
                        const isMe = msg.sender?.identity === localParticipant.identity;
                        return (
                          <div key={index} className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500 font-medium">
                                {msg.sender?.name || msg.sender?.identity || "Unknown"}
                              </span>
                              <span className="text-[10px] text-zinc-600">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "px-3 py-2 rounded-2xl text-sm max-w-[85%] break-words",
                                isMe
                                  ? "bg-blue-600 text-white rounded-tr-sm"
                                  : "bg-[#333] text-zinc-200 rounded-tl-sm"
                              )}
                            >
                              {msg.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Typing Indicator */}
                  {typingUsers.size > 0 && (
                    <div className="px-4 py-1 text-xs text-zinc-500 italic animate-pulse">
                      {Array.from(typingUsers).length > 2
                        ? "Multiple people are typing..."
                        : `${Array.from(typingUsers).join(", ")} is typing...`
                      }
                    </div>
                  )}

                  {/* Chat Input */}
                  <div className="p-3 border-t border-[#333] bg-[#1a1a1a]">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!chatInput.trim()) return;
                        sendChat(chatInput);
                      }}
                      className="flex gap-2"
                    >
                      <FileShare onFileSelect={handleFileSelect} />
                      <Input
                        value={chatInput}
                        onChange={(e) => {
                          setChatInput(e.target.value);
                          handleTyping();
                        }}
                        placeholder="Tapez un message..."
                        className="bg-[#2a2a2a] border-none focus-visible:ring-1 focus-visible:ring-zinc-600 text-zinc-200"
                      />
                      <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div
        className={cn(
          "h-[80px] bg-[#1a1a1a]/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-4 select-none shrink-0 z-50 overflow-x-auto no-scrollbar transition-all duration-300 ease-in-out absolute bottom-0 left-0 right-0 md:relative md:translate-y-0",
          !controlsVisible && "translate-y-full md:translate-y-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto",
          "pb-safe"
        )}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Left: Audio/Video */}
        <div className="flex items-center gap-1 min-w-[180px]">
          <div className="flex items-center gap-1 bg-[#2a2a2a] rounded-lg p-1">
            <button
              className={cn(
                "p-2 rounded hover:bg-[#333] transition-colors relative group min-w-[40px] flex items-center justify-center isolate",
                isSpeaking && isMicrophoneEnabled && "bg-green-500/10 ring-1 ring-green-500/50"
              )}
              onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
            >
              {isMicrophoneEnabled ? (
                <div className="relative">
                  <Mic className={cn("h-5 w-5 transition-colors duration-150", isSpeaking ? "text-green-500 fill-green-500" : "text-white")} />
                  {isSpeaking && <span className="absolute inset-0 rounded-full animate-ping bg-green-500/50 opacity-75 -z-10"></span>}
                </div>
              ) : (
                <MicOff className="h-5 w-5 text-red-500" />
              )}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {isMicrophoneEnabled ? "Couper le micro" : "Activer le micro"}
              </span>
            </button>
            <MediaDeviceMenu kind="audioinput" />
          </div>

          <div className="flex items-center gap-1 bg-[#2a2a2a] rounded-lg p-1">
            <button
              className={cn("p-2 rounded hover:bg-[#333] transition-colors relative group min-w-[40px] flex items-center justify-center isolate")}
              onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
            >
              {isCameraEnabled ? (
                <VideoIcon className="h-5 w-5 text-white" />
              ) : (
                <VideoOff className="h-5 w-5 text-red-500" />
              )}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {isCameraEnabled ? "Arrêter la vidéo" : "Démarrer la vidéo"}
              </span>
            </button>
            <MediaDeviceMenu kind="videoinput" />
          </div>
        </div>

        {/* Center: Main Controls */}
        <div className="flex items-center justify-center gap-2 flex-1 min-w-max px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center gap-1.5 min-w-[64px] py-2 rounded-lg transition-all duration-200 hover:bg-[#2a2a2a] group">
                <ShieldCheck className="h-5 w-5 text-zinc-300 group-hover:text-white stroke-[1.5] transition-colors" />
                <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">Sécurité</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-zinc-300 w-56 mb-2" side="top">
              <DropdownMenuLabel className="text-xs text-zinc-500 uppercase">Paramètres de sécurité</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#333]" />
              <DropdownMenuCheckboxItem checked={securitySettings.lockMeeting} onCheckedChange={(c) => setSecuritySettings(p => ({ ...p, lockMeeting: !!c }))}>
                Verrouiller la réunion
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={securitySettings.enableWaitingRoom} onCheckedChange={(c) => setSecuritySettings(p => ({ ...p, enableWaitingRoom: !!c }))}>
                Activer la salle d'attente
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator className="bg-[#333]" />
              <DropdownMenuLabel className="text-xs text-zinc-500 uppercase">Autoriser les participants à :</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={securitySettings.allowShareScreen} onCheckedChange={(c) => setSecuritySettings(p => ({ ...p, allowShareScreen: !!c }))}>
                Partager l'écran
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={securitySettings.allowChat} onCheckedChange={(c) => setSecuritySettings(p => ({ ...p, allowChat: !!c }))}>
                Discuter
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={securitySettings.allowRename} onCheckedChange={(c) => setSecuritySettings(p => ({ ...p, allowRename: !!c }))}>
                Se renommer
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={securitySettings.allowUnmute} onCheckedChange={(c) => setSecuritySettings(p => ({ ...p, allowUnmute: !!c }))}>
                Se réactiver le micro
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ControlButton
            icon={Users}
            label="Participants"
            badge={participants.length}
            active={sidebarView === 'participants'}
            onClick={() => toggleSidebar('participants')}
          />
          <ControlButton
            icon={MessageSquare}
            label="Discussion"
            active={sidebarView === 'chat'}
            onClick={() => toggleSidebar('chat')}
          />

          <div className="w-px h-8 bg-[#333] mx-2" />

          <div
            className={cn("flex flex-col items-center gap-1.5 group cursor-pointer px-4 min-w-[70px] py-2 rounded-lg transition-all", isScreenShareEnabled && "bg-[#2a2a2a]")}
            onClick={async () => {
              try {
                await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
              } catch (e) {
                toast.error("Screen Share Failed", { description: "You might need to grant browser permissions." });
              }
            }}
          >
            <MonitorUp className={cn("h-5 w-5 stroke-[1.5]", !isScreenShareEnabled ? "text-green-500 group-hover:text-green-400" : "text-red-500")} />
            <span className={cn("text-[10px] font-medium transition-colors", isScreenShareEnabled ? "text-red-500" : "text-green-500 group-hover:text-green-400")}>
              {isScreenShareEnabled ? "Arrêter le partage" : "Partager"}
            </span>
          </div>

          <div className="w-px h-8 bg-[#333] mx-2" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex flex-col items-center gap-1.5 min-w-[64px] py-2 rounded-lg transition-all duration-200 hover:bg-[#2a2a2a] group", isRecording && "bg-[#2a2a2a]")}>
                {isRecording ? (
                  <StopCircle className="h-5 w-5 text-red-500 animate-pulse stroke-[1.5]" />
                ) : (
                  <Disc className="h-5 w-5 text-zinc-300 group-hover:text-white stroke-[1.5] transition-colors" />
                )}
                <span className={cn("text-[10px] font-medium transition-colors", isRecording ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-300")}>
                  {isRecording ? "Arrêter" : "Enregistrer"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-zinc-300 w-48 mb-2" side="top">
              {isRecording ? (
                <DropdownMenuItem className="text-red-500 hover:bg-red-500/10 hover:text-red-500 cursor-pointer" onClick={() => stopLocalRecording()}>
                  Arrêter l'enregistrement
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem className="hover:bg-[#333] cursor-pointer" onClick={() => toast.info("Cloud Recording", { description: "Cloud recording disabled for this demo." })}>
                    Enregistrer dans le cloud
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#333] cursor-pointer" onClick={startLocalRecording}>
                    Enregistrer sur cet ordinateur
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <button className="flex flex-col items-center gap-1.5 min-w-[64px] py-2 rounded-lg transition-all duration-200 hover:bg-[#2a2a2a] group">
                <Smile className="h-5 w-5 text-zinc-300 group-hover:text-yellow-400 stroke-[1.5] transition-colors" />
                <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">Réactions</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2 bg-[#2a2a2a] border-[#333]" side="top">
              <div className="flex gap-2">
                {['👏', '👍', '🎉', '❤️', '😂', '😮'].map(emoji => (
                  <button
                    key={emoji}
                    className="text-2xl hover:bg-[#333] p-2 rounded transition-colors"
                    onClick={() => {
                      if (localParticipant) {
                        const data = new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji }));
                        localParticipant.publishData(data, { reliable: true });
                        window.dispatchEvent(new CustomEvent('local-reaction', { detail: { identity: localParticipant.identity, emoji } }));
                        toast.success(`Sent ${emoji}`);
                      }
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right: End Call */}
        <div className="flex items-center justify-end min-w-[180px]">
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-6 h-9"
            onClick={() => room.disconnect()}
          >
            Terminer
          </Button>
        </div>

      </div>
      <RoomAudioRenderer />
    </div>
  );
}

// Helper Components

function ControlGroup({ children }: { children: React.ReactNode }) {
  return <div className="relative flex items-center pr-3">{children}</div>;
}

function ControlButton({ icon: Icon, label, onClick, badge, active, variant = 'default' }: { icon: any, label: string, onClick: () => void, badge?: number, active?: boolean, variant?: 'default' | 'danger' | 'success' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 min-w-[64px] py-2 rounded-lg transition-all duration-200 relative group",
        "hover:bg-[#2a2a2a] active:scale-95",
        active && "bg-[#2a2a2a]",
        variant === 'danger' && "text-red-500 hover:bg-red-500/10",
        variant === 'success' && "text-green-500 hover:bg-green-500/10"
      )}
    >
      <div className="relative">
        <Icon
          className={cn(
            "h-5 w-5 transition-colors duration-200 stroke-[1.5]",
            active ? "text-blue-400" : "text-zinc-300 group-hover:text-white",
            variant === 'danger' && "text-red-500 group-hover:text-red-400",
            variant === 'success' && "text-green-500 group-hover:text-green-400"
          )}
        />
        {badge ? (
          <span className="absolute -top-2 -right-3 h-4 min-w-[16px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold px-1 rounded-full border-2 border-[#1a1a1a]">
            {badge}
          </span>
        ) : null}
      </div>
      <span className={cn(
        "text-[10px] font-medium transition-colors",
        active ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300",
        variant === 'danger' && "text-red-500/80 group-hover:text-red-400",
        variant === 'success' && "text-green-500/80 group-hover:text-green-400"
      )}>
        {label}
      </span>
    </button>
  )
}

function ParticipantsList({ isTeacher, raisedHands }: { isTeacher: boolean, raisedHands?: Set<string> }) {
  const participants = useParticipants();
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {participants.map((p) => (
          <ParticipantItem key={p.identity} participant={p} isHandRaised={raisedHands?.has(p.identity)} />
        ))}
      </div>
      <div className="p-3 border-t border-[#333] grid grid-cols-2 gap-2 bg-[#1a1a1a]">
        <Button variant="outline" className="h-9 text-xs border-zinc-700 bg-[#2a2a2a] hover:bg-[#333] text-zinc-300" onClick={() => toast.info("Invite Link Copied")}>
          Invite
        </Button>
        {isTeacher && (
          <Button variant="destructive" className="h-9 text-xs bg-red-600/10 text-red-500 hover:bg-red-600/20 border-red-600/20 border" onClick={() => toast.success("Muted All Participants")}>
            Mute All
          </Button>
        )}
      </div>
    </div>
  )
}

function ParticipantItem({ participant, isHandRaised }: { participant: Participant, isHandRaised?: boolean }) {
  const { isMicrophoneEnabled, isCameraEnabled } = useParticipantStatus(participant);
  // Check if it's me
  const { localParticipant } = useLocalParticipant();
  const isLocal = participant.identity === localParticipant.identity;

  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-[#2a2a2a] group transition-colors cursor-default">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-zinc-700 text-xs text-white">
            {participant.identity?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white flex items-center gap-2">
            {participant.name || participant.identity}
            {isLocal && <span className="text-zinc-500 text-xs ml-1">(Me)</span>}
            {isHandRaised && <Hand className="h-4 w-4 text-yellow-500 fill-yellow-500 animate-pulse ml-2" />}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-zinc-400">
        {isCameraEnabled ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4 text-red-500" />}
        {isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 text-red-500" />}
      </div>
    </div>
  )
}

function useParticipantStatus(participant?: Participant) {
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(participant?.isMicrophoneEnabled ?? false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(participant?.isCameraEnabled ?? false);

  useEffect(() => {
    if (!participant) return;
    setIsMicrophoneEnabled(participant.isMicrophoneEnabled);
    setIsCameraEnabled(participant.isCameraEnabled);

    const onTrackMuted = (pub: any) => {
      if (pub.kind === Track.Kind.Audio) setIsMicrophoneEnabled(false);
      if (pub.kind === Track.Kind.Video) setIsCameraEnabled(false);
    };
    const onTrackUnmuted = (pub: any) => {
      if (pub.kind === Track.Kind.Audio) setIsMicrophoneEnabled(true);
      if (pub.kind === Track.Kind.Video) setIsCameraEnabled(true);
    };

    participant.on(ParticipantEvent.TrackMuted, onTrackMuted);
    participant.on(ParticipantEvent.TrackUnmuted, onTrackUnmuted);

    return () => {
      participant.off(ParticipantEvent.TrackMuted, onTrackMuted);
      participant.off(ParticipantEvent.TrackUnmuted, onTrackUnmuted);
    }
  }, [participant]);

  return { isMicrophoneEnabled, isCameraEnabled };
}

function CustomParticipantTileRenderer(props: any) {
  const { participant } = props;
  const { isMicrophoneEnabled } = useParticipantStatus(participant);
  // Return early if no participant to prevent errors
  if (!participant) return null;
  const [reaction, setReaction] = useState<string | null>(null);
  const room = useRoomContext();

  useEffect(() => {
    const onData = (payload: Uint8Array, participant?: RemoteParticipant, kind?: DataPacket_Kind, topic?: string) => {
      const str = new TextDecoder().decode(payload);
      try {
        const data = JSON.parse(str);
        if (data.type === 'reaction' && participant?.identity === props.participant.identity) {
          setReaction(data.emoji);
          setTimeout(() => setReaction(null), 3000);
        }
      } catch (e) { }
    };
    // Listen for local reactions too
    const onLocal = (e: any) => {
      if (e.detail?.identity === props.participant.identity) {
        setReaction(e.detail.emoji);
        setTimeout(() => setReaction(null), 3000);
      }
    };

    room.on(RoomEvent.DataReceived, onData);
    window.addEventListener('local-reaction', onLocal);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
      window.removeEventListener('local-reaction', onLocal);
    };
  }, [room, props.participant.identity]);

  return (
    <ParticipantTile {...props} className="relative group border border-[#333] rounded overflow-hidden data-[speaking=true]:border-green-500 transition-colors bg-[#222]">
      {props.trackRef ? (
        <VideoTrack
          trackRef={props.trackRef}
          className={cn(
            "w-full h-full object-cover absolute inset-0 z-0",
            participant.isLocal && "transform -scale-x-100"
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">{participant.identity?.[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}
      {/* Custom Name Tag */}
      <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-2 z-20">
        {isMicrophoneEnabled ? (
          <div className="h-3 w-1.5 bg-green-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
        ) : (
          <MicOff className="h-3 w-3 text-red-500" />
        )}
        <span>{participant.name || participant.identity}</span>
        {participant.isLocal && <span className="text-zinc-400 text-[10px] font-normal tracking-wide">(Me)</span>}
      </div>
      {/* Network Quality (Zoom style) */}
      <div className="absolute top-2 right-2 z-20">
        <ConnectionQualityIndicator participant={participant} />
      </div>
      {/* Reaction Overlay */}
      {reaction && (
        <div className="absolute top-4 left-4 text-4xl animate-bounce z-30 filter drop-shadow-lg">
          {reaction}
        </div>
      )}
    </ParticipantTile>
  )
}

function SpeakerView({ tracks }: { tracks: any[] }) {
  // Determine active speaker
  const room = useRoomContext();
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  useEffect(() => {
    const onActiveSpeakerChange = (speakers: Participant[]) => {
      if (speakers.length > 0) {
        setActiveSpeakerId(speakers[0].identity);
      }
    };
    room.on(RoomEvent.ActiveSpeakersChanged, onActiveSpeakerChange);
    return () => { room.off(RoomEvent.ActiveSpeakersChanged, onActiveSpeakerChange); };
  }, [room]);

  // Logic: 
  // 1. Screen Share (any)
  // 2. Active Speaker (if not local)
  // 3. First remote participant
  // 4. Fallback

  const screenShareTrack = tracks.find(t => t.source === Track.Source.ScreenShare);
  const activeSpeakerTrack = tracks.find(t => t.participant.identity === activeSpeakerId && t.source === Track.Source.Camera);
  const fallbackTrack = tracks.find(t => !t.participant.isLocal && t.source === Track.Source.Camera) || tracks[0];

  const mainTrack = screenShareTrack || activeSpeakerTrack || fallbackTrack;
  const otherTracks = tracks.filter(t => t !== mainTrack);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Top Strip */}
      {otherTracks.length > 0 && (
        <div className="h-[120px] flex gap-2 p-2 overflow-x-auto bg-black border-b border-[#333] shrink-0">
          {otherTracks.map(track => (
            <div key={track.participant.identity + track.source} className="h-full aspect-video min-w-[160px]">
              <CustomParticipantTileRenderer trackRef={track} participant={track.participant} />
            </div>
          ))}
        </div>
      )}

      {/* Main Stage */}
      <div className="flex-1 p-2 min-h-0">
        {mainTrack && (
          <CustomParticipantTileRenderer
            trackRef={mainTrack}
            participant={mainTrack.participant}
            style={{ height: '100%' }}
            className={cn(
              "w-full h-full object-contain",
              mainTrack.source === Track.Source.ScreenShare && "object-contain bg-[#111]"
            )}
          />
        )}
        {!mainTrack && (
          <div className="h-full w-full flex items-center justify-center text-zinc-500">
            Waiting for participants...
          </div>
        )}
      </div>
    </div>
  )
}

function MediaDeviceMenu({ kind }: { kind: 'audioinput' | 'videoinput' }) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="h-full w-6 hover:bg-[#333] rounded-r-lg flex items-center justify-center text-zinc-400 border-l border-[#333]">
          <ChevronUp className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#1a1a1a] text-zinc-300 border-[#333] mb-2 min-w-[200px]" side="top" align="start">
        <DropdownMenuLabel className="text-xs text-zinc-500 uppercase tracking-wider">
          Select {kind === 'audioinput' ? 'Microphone' : 'Camera'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#333]" />
        {devices.map((device) => (
          <DropdownMenuItem
            key={device.deviceId}
            className={cn("hover:bg-blue-600 focus:bg-blue-600 cursor-pointer text-xs flex items-center justify-between", activeDeviceId === device.deviceId && "text-indigo-400 font-medium")}
            onClick={() => {
              setActiveMediaDevice(device.deviceId);
              setIsOpen(false);
            }}
          >
            {device.label || `Device ${device.deviceId.substring(0, 5)}...`}
            {activeDeviceId === device.deviceId && <Check className="h-3 w-3 ml-2" />}
          </DropdownMenuItem>
        ))}
        {devices.length === 0 && (
          <div className="p-2 text-xs text-zinc-500 italic">No devices found</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
