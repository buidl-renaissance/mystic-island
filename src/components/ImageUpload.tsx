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

const UploadArea = styled.div<{ isDragging: boolean; hasImage: boolean }>`
  border: 2px dashed
    ${(props) =>
      props.isDragging
        ? colors.sunlitGold
        : props.hasImage
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
      : props.hasImage
        ? "rgba(74, 154, 122, 0.1)"
        : "rgba(10, 20, 16, 0.3)"};
  animation: ${fadeIn} 0.3s ease-out;

  &:hover {
    border-color: ${colors.sunlitGold};
    background: rgba(232, 168, 85, 0.1);
  }
`;

const ImagePreview = styled.div`
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

interface ImageUploadProps {
  onUploadComplete: (metadata: {
    imageIpfsHash: string;
    imageIpfsUrl: string;
    metadataIpfsHash: string;
    metadataIpfsUrl: string;
    title: string;
    description: string;
  }) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  onUploadComplete,
  onError,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      onError?.("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      onError?.("Image size must be less than 10MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to IPFS
    setIsUploading(true);
    setUploadProgress("Reading image...");

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/...;base64, prefix if present
          const base64Data = result.includes(",") ? result.split(",")[1] : result;
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress("Uploading to IPFS...");

      // Call upload API
      const response = await fetch("/api/upload-artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64,
          fileName: file.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setUploadProgress("Generating metadata...");

      // Callback with results
      onUploadComplete({
        imageIpfsHash: data.imageIpfsHash,
        imageIpfsUrl: data.imageIpfsUrl,
        metadataIpfsHash: data.metadataIpfsHash,
        metadataIpfsUrl: data.metadataIpfsUrl,
        title: data.title,
        description: data.description,
      });

      setUploadProgress("Complete!");
    } catch (error) {
      console.error("Error uploading image:", error);
      onError?.(error instanceof Error ? error.message : "Failed to upload image");
      setPreview(null);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <UploadArea
        isDragging={isDragging}
        hasImage={!!preview}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{ cursor: disabled || isUploading ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
      >
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
          <ImagePreview>
            <PreviewImage src={preview} alt="Preview" />
            <RemoveButton
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              title="Remove image"
            >
              ×
            </RemoveButton>
          </ImagePreview>
        ) : (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📸</div>
            <div style={{ color: colors.textPrimary, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Click or drag to upload image
            </div>
            <UploadText>
              Supports JPG, PNG, GIF (max 10MB)
              <br />
              AI will generate title and description
            </UploadText>
          </>
        )}
      </UploadArea>
    </div>
  );
}

