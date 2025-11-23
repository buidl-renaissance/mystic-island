import type { NextApiRequest, NextApiResponse } from "next";
import { uploadMetadataToIPFS, getIpfsProtocolUrl } from "@/utils/ipfs";
import { createLocationMetadata } from "@/utils/locationMetadata";

type ResponseData = {
  success: boolean;
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
    const { imageIpfsHash, videoIpfsHash, locationName, locationDescription, biome, difficulty } = req.body;

    if (!imageIpfsHash) {
      return res.status(400).json({
        success: false,
        error: "Image IPFS hash is required",
      });
    }

    if (!locationName || !locationDescription) {
      return res.status(400).json({
        success: false,
        error: "Location name and description are required",
      });
    }

    // Create ERC721-style metadata
    const metadata = createLocationMetadata({
      name: locationName,
      description: locationDescription,
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
    const metadataIpfsHash = await uploadMetadataToIPFS(metadata, `location-metadata-${Date.now()}`);
    const metadataIpfsUrl = getIpfsProtocolUrl(metadataIpfsHash);

    console.log("Metadata uploaded to IPFS:", metadataIpfsHash);

    return res.status(200).json({
      success: true,
      metadataIpfsHash,
      metadataIpfsUrl,
    });
  } catch (error) {
    console.error("Error generating location metadata:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate location metadata",
    });
  }
}

