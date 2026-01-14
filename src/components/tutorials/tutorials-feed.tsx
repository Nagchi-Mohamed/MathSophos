"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PlatformVideo } from "@prisma/client";
import { VideoPlayer } from "@/components/ui/video-player"; // We might reuse parts or just use standard video tag for feed
import { Heart, MessageCircle, Share2, MoreVertical, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TutorialsFeedProps {
  initialVideos: PlatformVideo[];
}

export function TutorialsFeed({ initialVideos }: TutorialsFeedProps) {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(initialVideos[0]?.id || null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const videoId = entry.target.getAttribute("data-id");
            if (videoId) {
              setCurrentVideoId(videoId);
            }
          }
        });
      },
      {
        threshold: 0.6, // Switch when 60% visible
      }
    );

    const elements = containerRef.current?.querySelectorAll(".snap-start");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [initialVideos]);

  if (initialVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-center p-4">
        <h2 className="text-2xl font-bold mb-2">Aucun tutoriel disponible</h2>
        <p className="text-muted-foreground">Revenez plus tard pour voir du nouveau contenu !</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-64px)] w-full overflow-y-scroll snap-y snap-mandatory bg-black text-white no-scrollbar"
    >
      {initialVideos.map((video) => (
        <TutorialItem
          key={video.id}
          video={video}
          isActive={currentVideoId === video.id}
        />
      ))}
    </div>
  );
}

function TutorialItem({ video, isActive }: { video: PlatformVideo; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted to allow autoplay
  const [hasInteracted, setHasInteracted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (isActive && videoRef.current) {
      console.log(`[TutorialItem] Attempting to play video:`, {
        id: video.id,
        url: video.url,
        filename: video.filename,
        hasVideoElement: !!videoRef.current
      });

      // Muted videos can autoplay
      videoRef.current.muted = true;
      videoRef.current.play()
        .then(() => {
          console.log(`[TutorialItem] Video playing successfully:`, video.id);
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error(`[TutorialItem] Autoplay prevented or error:`, error);
          setIsPlaying(false);
        });
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isActive, video.id, video.url, video.filename]);

  const togglePlay = () => {
    setHasInteracted(true);
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasInteracted(true);
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Interactive button states
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; text: string; author: string; time: string }>>([]);
  const [commentText, setCommentText] = useState("");

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked) {
      // Could save to backend here
      console.log("Liked video:", video.id);
    }
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handlePostComment = () => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      text: commentText,
      author: session?.user?.name || session?.user?.email?.split('@')[0] || "Utilisateur",
      time: "À l'instant"
    };

    setComments([newComment, ...comments]);
    setCommentText("");

    // Show success notification
    const notification = document.createElement('div');
    notification.textContent = '✓ Commentaire publié!';
    notification.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:16px 24px;border-radius:12px;z-index:9999;font-weight:500;';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/tutorials?v=${video.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Show a toast-style notification
      const notification = document.createElement('div');
      notification.textContent = '✓ Lien copié!';
      notification.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:16px 24px;border-radius:12px;z-index:9999;font-weight:500;';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      data-id={video.id}
      className="relative h-full w-full snap-start flex items-center justify-center bg-black"
    >
      {/* Video Content */}
      {!video.url ? (
        <div className="h-full w-full flex items-center justify-center bg-gray-900">
          <div className="text-center p-8">
            <p className="text-white/70 mb-2">Vidéo non disponible</p>
            <p className="text-white/50 text-sm">URL manquante</p>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={video.url}
          className="h-full w-full object-contain md:object-cover max-w-lg mx-auto"
          loop
          playsInline
          onClick={togglePlay}
          onLoadedMetadata={() => {
            console.log(`[TutorialItem] Video metadata loaded:`, {
              id: video.id,
              duration: videoRef.current?.duration,
              videoWidth: videoRef.current?.videoWidth,
              videoHeight: videoRef.current?.videoHeight
            });
          }}
          onError={(e) => {
            const videoElement = e.currentTarget;
            console.error(`[TutorialItem] Video playback error:`, {
              id: video.id,
              url: video.url,
              error: videoElement.error,
              errorCode: videoElement.error?.code,
              errorMessage: videoElement.error?.message,
              networkState: videoElement.networkState,
              readyState: videoElement.readyState
            });
          }}
        />
      )}

      {/* Play/Pause Overlay Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <Play className="w-16 h-16 text-white/50" />
        </div>
      )}

      {/* Tap to Unmute Hint (first time) */}
      {isPlaying && !hasInteracted && isMuted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 px-6 py-3 rounded-full backdrop-blur-sm animate-pulse">
            <p className="text-white text-sm font-medium">Appuyez pour activer le son 🔊</p>
          </div>
        </div>
      )}

      {/* Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleLike}
            className={cn(
              "rounded-full bg-black/40 hover:bg-black/60 text-white w-12 h-12 transition-all",
              isLiked && "bg-red-500/40 hover:bg-red-500/60"
            )}
          >
            <Heart className={cn("w-6 h-6", isLiked && "fill-red-500 text-red-500")} />
          </Button>
          <span className="text-xs font-semibold drop-shadow">J'aime</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleComment}
            className="rounded-full bg-black/40 hover:bg-black/60 text-white w-12 h-12"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
          <span className="text-xs font-semibold drop-shadow">Coment.</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleShare}
            className="rounded-full bg-black/40 hover:bg-black/60 text-white w-12 h-12"
          >
            <Share2 className="w-6 h-6" />
          </Button>
          <span className="text-xs font-semibold drop-shadow">Partager</span>
        </div>
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-lg mx-auto w-full pr-16 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg drop-shadow-md">{video.title || "Tutoriel MathSophos"}</h3>
          </div>
          {video.description && (
            <p className="text-sm text-white/90 line-clamp-2 drop-shadow-sm">
              {video.description}
            </p>
          )}
          <div className="flex items-center gap-2 pt-2">
            <p className="text-xs text-white/70 animate-pulse">♫ Son original - MathSophos</p>
          </div>
        </div>
      </div>

      {/* Mute Button (Volume) */}
      <button
        onClick={toggleMute}
        className="absolute top-20 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>

      {/* Comment Dialog */}
      {showComments && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50" onClick={() => setShowComments(false)}>
          <div className="w-full bg-gray-900 rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">Commentaires ({comments.length})</h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Comment Input */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                placeholder="Ajouter un commentaire..."
                className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handlePostComment}
                disabled={!commentText.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-medium transition-colors"
              >
                Publier
              </button>
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-white/70 text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun commentaire pour le moment</p>
                <p className="text-sm mt-2">Soyez le premier à commenter!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {comment.author[0]}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{comment.author}</p>
                        <p className="text-white/50 text-xs">{comment.time}</p>
                      </div>
                    </div>
                    <p className="text-white/90">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
