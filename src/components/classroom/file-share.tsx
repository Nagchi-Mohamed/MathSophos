"use client";

import { useState, useRef } from "react";
import {
  Paperclip,
  File,
  FileText,
  Image as ImageIcon,
  Download,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: number;
}

interface FileShareProps {
  onFileSelect: (file: FileAttachment) => void;
  maxSizeMB?: number;
}

export function FileShare({ onFileSelect, maxSizeMB = 10 }: FileShareProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress (in real app, this would be actual upload to server/S3)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Convert file to base64 or upload to server
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.readAsDataURL(file);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const attachment: FileAttachment = {
        id: `file-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileData,
        uploadedBy: "current-user", // Would be actual user ID
        uploadedAt: Date.now(),
      };

      onFileSelect(attachment);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {uploading && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <File className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Uploading...</span>
          </div>
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}
    </div>
  );
}

export function FileAttachmentCard({ attachment, onDownload, onPreview }: {
  attachment: FileAttachment;
  onDownload: () => void;
  onPreview?: () => void;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    if (attachment.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-600" />;
    }
    if (attachment.type.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <File className="h-5 w-5 text-zinc-600" />;
  };

  const isImage = attachment.type.startsWith("image/");
  const isPDF = attachment.type.includes("pdf");

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
      <div className="flex-shrink-0">
        {getFileIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.name}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatFileSize(attachment.size)}
        </p>
      </div>

      <div className="flex gap-1">
        {(isImage || isPDF) && onPreview && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onPreview}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function FilePreviewModal({ attachment, onClose }: {
  attachment: FileAttachment;
  onClose: () => void;
}) {
  const isImage = attachment.type.startsWith("image/");
  const isPDF = attachment.type.includes("pdf");

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold truncate flex-1">{attachment.name}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {isImage ? (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-w-full h-auto mx-auto"
            />
          ) : isPDF ? (
            <iframe
              src={attachment.url}
              className="w-full h-[600px] border-0"
              title={attachment.name}
            />
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <File className="h-16 w-16 mx-auto mb-4 text-zinc-400" />
              <p>Preview not available for this file type</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = attachment.url;
                  a.download = attachment.name;
                  a.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
