import type { NextApiRequest, NextApiResponse } from "next";
import { uploadToIPFS, uploadMetadataToIPFS, getIpfsUrl, getIpfsProtocolUrl } from "@/utils/ipfs";
import { createLocationMetadata } from "@/utils/locationMetadata";

type ResponseData = {
  success: boolean;
  imageIpfsHash?: string;
  imageIpfsUrl?: string;
  videoIpfsHash?: string;
  videoIpfsUrl?: string;
  metadataIpfsHash?: string;
  metadataIpfsUrl?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { image, video, locationName, locationDescription, biome, difficulty } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "No image provided",
      });
    }

    // Upload image to IPFS
    console.log("Uploading image to IPFS...");
    const imageBase64 = image.includes(",") ? image.split(",")[1] : image;
    const imageBuffer = Buffer.from(imageBase64, "base64");
    
    // Detect image type from base64 or default to jpeg
    let imageContentType = "image/jpeg";
    if (image.startsWith("data:image/")) {
      const match = image.match(/data:image\/([^;]+)/);
      if (match) {
        imageContentType = `image/${match[1]}`;
      }
    }
    
    const imageFileName = `location-image-${Date.now()}.${imageContentType.split("/")[1] || "jpg"}`;
    const imageIpfsHash = await uploadToIPFS(imageBuffer, imageFileName, imageContentType);
    const imageIpfsUrl = getIpfsUrl(imageIpfsHash);

    console.log("Image uploaded to IPFS:", imageIpfsHash);

    let videoIpfsHash: string | undefined;
    let videoIpfsUrl: string | undefined;

    // Upload video if provided
    if (video) {
      console.log("Uploading video to IPFS...");
      const videoBase64 = video.includes(",") ? video.split(",")[1] : video;
      const videoBuffer = Buffer.from(videoBase64, "base64");
      
      // Detect video type from base64 or default to mp4
      let videoContentType = "video/mp4";
      if (video.startsWith("data:video/")) {
        const match = video.match(/data:video\/([^;]+)/);
        if (match) {
          videoContentType = `video/${match[1]}`;
        }
      }
      
      const videoFileName = `location-video-${Date.now()}.${videoContentType.split("/")[1] || "mp4"}`;
      videoIpfsHash = await uploadToIPFS(videoBuffer, videoFileName, videoContentType);
      videoIpfsUrl = getIpfsUrl(videoIpfsHash);

      console.log("Video uploaded to IPFS:", videoIpfsHash);
    }

    // Create ERC721-style metadata
    const metadata = createLocationMetadata({
      name: locationName || "Mystic Island Location",
      description: locationDescription || "A location on Mystic Island",
      imageIpfsHash,
      videoIpfsHash,
      biome,
      difficulty,
      attributes: [
        {
          trait_type: "Type",
          value: "Location",
        },
      ],
    });

    // Upload metadata to IPFS
    console.log("Uploading metadata to IPFS...");
    const metadataIpfsHash = await uploadMetadataToIPFS(metadata as unknown as Record<string, unknown>, `location-metadata-${Date.now()}`);
    const metadataIpfsUrl = getIpfsProtocolUrl(metadataIpfsHash);

    console.log("Metadata uploaded to IPFS:", metadataIpfsHash);

    return res.status(200).json({
      success: true,
      imageIpfsHash,
      imageIpfsUrl,
      videoIpfsHash,
      videoIpfsUrl,
      metadataIpfsHash,
      metadataIpfsUrl,
    });
  } catch (error) {
    console.error("Error uploading location media:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload location media",
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb", // Larger limit for videos
    },
  },
};

