import { useState, useRef } from "react";
import styled, { keyframes } from "styled-components";

const colors = {
  emeraldSpirit: "#2D5A3D",
  deepForest: "#0A1410",
  sunlitGold: "#E8A855",
  skyDawn: "#4A7A9A",
  lotusPink: "#B85A8F",
  sunsetOrange: "#C76A2A",
  orchidPurple: "#5A3F8F",
  jungleCyan: "#4A9A7A",
  textPrimary: "#F5F5F5",
  textSecondary: "#D0D0D0",
  textMuted: "#A0A0A0",
};

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const UploadArea = styled.div<{ isDragging: boolean; hasMedia: boolean }>`
  border: 2px dashed
    ${(props) =>
      props.isDragging
        ? colors.sunlitGold
        : props.hasMedia
          ? colors.jungleCyan
          : "rgba(232, 168, 85, 0.3)"};
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${(props) =>
    props.isDragging
      ? "rgba(232, 168, 85, 0.1)"
      : props.hasMedia
        ? "rgba(74, 154, 122, 0.1)"
        : "rgba(10, 20, 16, 0.3)"};
  animation: ${fadeIn} 0.3s ease-out;

  &:hover {
    border-color: ${colors.sunlitGold};
    background: rgba(232, 168, 85, 0.1);
  }
`;

const MediaPreview = styled.div`
  margin-top: 1rem;
  position: relative;
  display: inline-block;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  border: 1px solid rgba(232, 168, 85, 0.3);
`;

const PreviewVideo = styled.video`
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  border: 1px solid rgba(232, 168, 85, 0.3);
`;

const RemoveButton = styled.button`
  position: absolute;
  top: -10px;
  right: -10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${colors.sunsetOrange};
  border: 2px solid ${colors.deepForest};
  color: ${colors.textPrimary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: ${colors.sunsetOrange};
    transform: scale(1.1);
  }
`;

const UploadText = styled.div`
  color: ${colors.textSecondary};
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(232, 168, 85, 0.3);
  border-radius: 50%;
  border-top-color: ${colors.sunlitGold};
  animation: ${pulse} 1s linear infinite;
  margin-right: 0.5rem;
  vertical-align: middle;
`;

const HiddenInput = styled.input`
  display: none;
`;

interface MediaUploadProps {
  accept?: string; // e.g., "image/*", "video/*"
  maxSize?: number; // in bytes, default 50MB for videos, 10MB for images
  onUploadComplete: (data: {
    ipfsHash: string;
    ipfsUrl: string;
    fileType: "image" | "video";
  }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  label?: string;
}

export default function MediaUpload({
  accept = "image/*",
  maxSize,
  onUploadComplete,
  onError,
  disabled = false,
  label,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = accept.includes("image");
  const isVideo = accept.includes("video");
  const defaultMaxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
  const sizeLimit = maxSize || defaultMaxSize;

  const handleFile = async (file: File) => {
    const isImageFile = file.type.startsWith("image/");
    const isVideoFile = file.type.startsWith("video/");

    if (!isImageFile && !isVideoFile) {
      onError?.("Please upload an image or video file");
      return;
    }

    if (isImage && !isImageFile) {
      onError?.("Please upload an image file");
      return;
    }

    if (isVideo && !isVideoFile) {
      onError?.("Please upload a video file");
      return;
    }

    if (file.size > sizeLimit) {
      const sizeMB = Math.round(sizeLimit / (1024 * 1024));
      onError?.(`File size must be less than ${sizeMB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setMediaType(isImageFile ? "image" : "video");
    };
    reader.readAsDataURL(file);

    // Upload to IPFS
    setIsUploading(true);
    setUploadProgress("Reading file...");

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress("Uploading to IPFS...");

      // Call upload API
      const response = await fetch("/api/upload-location-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [isImageFile ? "image" : "video"]: base64,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload media");
      }

      const hash = isImageFile ? data.imageIpfsHash : data.videoIpfsHash;
      const url = isImageFile ? data.imageIpfsUrl : data.videoIpfsUrl;

      if (!hash || !url) {
        throw new Error("Invalid response from upload API");
      }

      // Callback with results
      onUploadComplete({
        ipfsHash: hash,
        ipfsUrl: url,
        fileType: isImageFile ? "image" : "video",
      });

      setUploadProgress("Complete!");
    } catch (error) {
      console.error("Error uploading media:", error);
      onError?.(error instanceof Error ? error.message : "Failed to upload media");
      setPreview(null);
      setMediaType(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(""), 2000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getIcon = () => {
    if (isVideo) return "🎬";
    if (isImage) return "📸";
    return "📁";
  };

  const getAcceptText = () => {
    if (isVideo) return "MP4, WebM (max 50MB)";
    if (isImage) return "JPG, PNG, GIF (max 10MB)";
    return "Image or video files";
  };

  return (
    <div>
      {label && (
        <div style={{ color: colors.textSecondary, marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
          {label}
        </div>
      )}
      <UploadArea
        isDragging={isDragging}
        hasMedia={!!preview}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{ cursor: disabled || isUploading ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
      >
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div>
            <LoadingSpinner />
            <div style={{ color: colors.textSecondary, marginTop: "1rem" }}>
              {uploadProgress}
            </div>
          </div>
        ) : preview ? (
          <MediaPreview>
            {mediaType === "image" ? (
              <PreviewImage src={preview} alt="Preview" />
            ) : (
              <PreviewVideo src={preview} controls />
            )}
            <RemoveButton
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              title="Remove media"
            >
              ×
            </RemoveButton>
          </MediaPreview>
        ) : (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{getIcon()}</div>
            <div style={{ color: colors.textPrimary, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Click or drag to upload {isVideo ? "video" : isImage ? "image" : "media"}
            </div>
            <UploadText>
              Supports {getAcceptText()}
            </UploadText>
          </>
        )}
      </UploadArea>
    </div>
  );
}

