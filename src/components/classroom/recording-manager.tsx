"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Video,
  Download,
  Trash2,
  Play,
  Pause,
  Eye,
  Share2,
  Edit,
  X,
  Clock,
  HardDrive,
  Cloud,
  FileVideo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Recording {
  id: string;
  title: string;
  description?: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  format: string;
  quality: string;
  createdAt: Date;
  thumbnailUrl?: string;
  fileUrl: string;
  viewCount: number;
  downloadCount: number;
  isPublic: boolean;
}

interface RecordingManagerProps {
  classroomId: string;
  onClose: () => void;
}

export function RecordingManager({ classroomId, onClose }: RecordingManagerProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Load recordings (in production, fetch from API)
  useEffect(() => {
    loadRecordings();
  }, [classroomId]);

  const loadRecordings = async () => {
    // Simulated data - in production, fetch from API
    const mockRecordings: Recording[] = [
      {
        id: "1",
        title: "Cours de Mathématiques - Algèbre",
        description: "Introduction aux équations du second degré",
        duration: 3600,
        fileSize: 524288000, // 500 MB
        format: "mp4",
        quality: "HD",
        createdAt: new Date(Date.now() - 86400000),
        fileUrl: "/recordings/1.mp4",
        viewCount: 45,
        downloadCount: 12,
        isPublic: true,
      },
      {
        id: "2",
        title: "Session de révision",
        duration: 2700,
        fileSize: 367001600, // 350 MB
        format: "webm",
        quality: "FHD",
        createdAt: new Date(Date.now() - 172800000),
        fileUrl: "/recordings/2.webm",
        viewCount: 23,
        downloadCount: 5,
        isPublic: false,
      },
    ];
    setRecordings(mockRecordings);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    const gb = bytes / (1024 * 1024 * 1024);

    if (gb >= 1) {
      return `${gb.toFixed(2)} GB`;
    } else {
      return `${mb.toFixed(2)} MB`;
    }
  };

  const handleEdit = (recording: Recording) => {
    setSelectedRecording(recording);
    setEditForm({
      title: recording.title,
      description: recording.description || "",
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecording) return;

    // In production, send to API
    setRecordings((prev) =>
      prev.map((r) =>
        r.id === selectedRecording.id
          ? { ...r, title: editForm.title, description: editForm.description }
          : r
      )
    );

    setIsEditing(false);
    setSelectedRecording(null);
    toast.success("Enregistrement mis à jour");
  };

  const handleDelete = async (recordingId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement ?")) {
      return;
    }

    // In production, send to API
    setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
    toast.success("Enregistrement supprimé");
  };

  const handleDownload = async (recording: Recording) => {
    // In production, download from cloud storage
    toast.success("Téléchargement démarré");

    // Update download count
    setRecordings((prev) =>
      prev.map((r) =>
        r.id === recording.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
      )
    );
  };

  const handleShare = async (recording: Recording) => {
    const shareUrl = `${window.location.origin}/recordings/${recording.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Lien copié dans le presse-papiers");
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulated upload - in production, upload to cloud storage
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);

          // Add to recordings list
          const newRecording: Recording = {
            id: Date.now().toString(),
            title: file.name.replace(/\.[^/.]+$/, ""),
            duration: 0,
            fileSize: file.size,
            format: file.name.split(".").pop() || "mp4",
            quality: "HD",
            createdAt: new Date(),
            fileUrl: URL.createObjectURL(file),
            viewCount: 0,
            downloadCount: 0,
            isPublic: false,
          };

          setRecordings((prev) => [newRecording, ...prev]);
          toast.success("Enregistrement téléversé avec succès");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const totalSize = recordings.reduce((sum, r) => sum + r.fileSize, 0);
  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="bg-[#1a1a1a] border-zinc-800 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Video className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Gestion des enregistrements
              </h2>
              <p className="text-sm text-zinc-400">
                {recordings.length} enregistrement{recordings.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Cloud className="h-4 w-4 mr-2" />
              Téléverser
            </Button>
            <input
              id="file-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-zinc-800 bg-zinc-900/50">
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Total</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {recordings.length}
                </p>
              </div>
              <FileVideo className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Durée totale</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatDuration(totalDuration)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Espace utilisé</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatFileSize(totalSize)}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="p-6 border-b border-zinc-800 bg-blue-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white font-medium">
                Téléversement en cours...
              </span>
              <span className="text-sm text-zinc-400">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Recordings List */}
        <ScrollArea className="flex-1 p-6">
          {recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Video className="h-12 w-12 text-zinc-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Aucun enregistrement
              </h3>
              <p className="text-zinc-400 max-w-md mb-6">
                Les enregistrements de vos sessions apparaîtront ici.
              </p>
              <Button
                onClick={() => document.getElementById("file-upload")?.click()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Cloud className="h-4 w-4 mr-2" />
                Téléverser un enregistrement
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recordings.map((recording) => (
                <Card
                  key={recording.id}
                  className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-zinc-950 relative group">
                    {recording.thumbnailUrl ? (
                      <img
                        src={recording.thumbnailUrl}
                        alt={recording.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-12 w-12 text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="lg"
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                      >
                        <Play className="h-6 w-6" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                      {formatDuration(recording.duration)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">
                      {recording.title}
                    </h3>
                    {recording.description && (
                      <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                        {recording.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mb-3 text-xs text-zinc-500">
                      <Badge
                        variant="outline"
                        className="bg-zinc-800 border-zinc-700"
                      >
                        {recording.quality}
                      </Badge>
                      <span>•</span>
                      <span>{formatFileSize(recording.fileSize)}</span>
                      <span>•</span>
                      <span>
                        {recording.createdAt.toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {recording.viewCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {recording.downloadCount}
                        </div>
                      </div>
                      {recording.isPublic && (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-400 border-green-500/20"
                        >
                          Public
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-zinc-700"
                        onClick={() => handleDownload(recording)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700"
                        onClick={() => handleShare(recording)}
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700"
                        onClick={() => handleEdit(recording)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(recording.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-[#1a1a1a] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Modifier l'enregistrement</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Modifiez les informations de l'enregistrement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="bg-zinc-900 border-zinc-800 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="border-zinc-700"
            >
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
