"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Image as ImageIcon, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BackgroundEffectsProps {
  videoTrack: MediaStreamTrack | null;
  onClose: () => void;
}

type EffectType = "none" | "blur" | "image";

export function BackgroundEffects({ videoTrack, onClose }: BackgroundEffectsProps) {
  const [effectType, setEffectType] = useState<EffectType>("none");
  const [blurAmount, setBlurAmount] = useState(10);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Predefined background images
  const presetBackgrounds = [
    "/backgrounds/office.jpg",
    "/backgrounds/library.jpg",
    "/backgrounds/classroom.jpg",
    "/backgrounds/nature.jpg",
  ];

  useEffect(() => {
    if (!videoTrack) return;

    const mediaStream = new MediaStream([videoTrack]);
    setStream(mediaStream);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoTrack]);

  const applyEffect = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    setIsProcessing(true);

    try {
      if (effectType === "none") {
        // No effect, just pass through
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else if (effectType === "blur") {
        // Simple blur effect using canvas filter
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";

        // Draw person in focus (this is simplified - real implementation would use BodyPix)
        ctx.globalCompositeOperation = "destination-over";
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
      } else if (effectType === "image" && backgroundImage) {
        // Replace background with image
        const img = new Image();
        img.src = backgroundImage;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Draw person on top (simplified - real implementation would use segmentation)
        ctx.globalAlpha = 0.8;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      }

      toast.success("Background effect applied!");
    } catch (error) {
      console.error("Error applying effect:", error);
      toast.error("Failed to apply effect");
    } finally {
      setIsProcessing(false);
    }
  }, [effectType, blurAmount, backgroundImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string);
      setEffectType("image");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Background Effects
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Preview */}
            <div className="space-y-4">
              <Label>Preview</Label>
              <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: effectType !== "none" ? "block" : "none" }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Effect Type</Label>
                <RadioGroup value={effectType} onValueChange={(value) => setEffectType(value as EffectType)}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="flex-1 cursor-pointer">
                      No Effect
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                    <RadioGroupItem value="blur" id="blur" />
                    <Label htmlFor="blur" className="flex-1 cursor-pointer">
                      Blur Background
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image" className="flex-1 cursor-pointer">
                      Virtual Background
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {effectType === "blur" && (
                <div>
                  <Label className="mb-3 block">Blur Intensity</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[blurAmount]}
                      onValueChange={([value]) => setBlurAmount(value)}
                      min={5}
                      max={25}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-8">{blurAmount}</span>
                  </div>
                </div>
              )}

              {effectType === "image" && (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-3 block">Choose Background</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {presetBackgrounds.map((bg, index) => (
                        <button
                          key={index}
                          onClick={() => setBackgroundImage(bg)}
                          className={cn(
                            "aspect-video rounded-lg border-2 overflow-hidden transition-all",
                            backgroundImage === bg
                              ? "border-blue-600 ring-2 ring-blue-600 ring-offset-2"
                              : "border-zinc-300 dark:border-zinc-700 hover:border-blue-400"
                          )}
                        >
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-zinc-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="upload" className="mb-2 block">
                      Or Upload Custom Image
                    </Label>
                    <div className="relative">
                      <input
                        id="upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById("upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  onClick={applyEffect}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? "Applying..." : "Apply Effect"}
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> For best results with background effects, ensure good lighting and a simple background.
                Advanced AI-powered segmentation requires additional processing power.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Note: For production-quality background blur/replacement, you would need to:
// 1. Install @tensorflow/tfjs and @tensorflow-models/body-pix
// 2. Load the BodyPix model
// 3. Use it to segment the person from the background
// 4. Apply blur or replacement only to the background pixels
//
// This simplified version demonstrates the UI and basic canvas manipulation.
// The full implementation would be:
//
// import * as bodyPix from '@tensorflow-models/body-pix';
// import '@tensorflow/tfjs';
//
// const net = await bodyPix.load();
// const segmentation = await net.segmentPerson(video);
// const backgroundBlurAmount = 6;
// const edgeBlurAmount = 3;
// const flipHorizontal = false;
//
// bodyPix.drawBokehEffect(
//   canvas, video, segmentation, backgroundBlurAmount,
//   edgeBlurAmount, flipHorizontal
// );
