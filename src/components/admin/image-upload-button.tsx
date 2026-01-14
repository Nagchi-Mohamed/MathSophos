"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadButtonProps {
  onImageUploaded: (latexCode: string) => void;
  folder?: string;
  className?: string;
}

export function ImageUploadButton({ onImageUploaded, folder = "misc", className }: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      const latexCode = `\\figure{${data.url}}{width=50%, align=center}`;
      onImageUploaded(latexCode);
      toast.success("Image uploadée avec succès");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-2"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
        Insérer une image
      </Button>
    </div>
  );
}
