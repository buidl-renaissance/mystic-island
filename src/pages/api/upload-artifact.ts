import type { NextApiRequest, NextApiResponse } from "next";
import FormData from "form-data";
import axios from "axios";

// For Next.js file uploads, we'll accept base64 encoded images

type ResponseData = {
  success: boolean;
  imageIpfsHash?: string;
  imageIpfsUrl?: string;
  metadataIpfsHash?: string;
  metadataIpfsUrl?: string;
  title?: string;
  description?: string;
  error?: string;
};

// Pinata IPFS configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY || "e5523ec6f4884aa69033";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud";

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Upload file to IPFS using Pinata
 */
async function uploadToIPFS(file: Buffer, fileName: string): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error("Pinata API credentials not configured");
  }

  // Use form-data package for Node.js
  const formData = new FormData();
  
  // Append file buffer
  formData.append("file", file, {
    filename: fileName,
    contentType: "image/jpeg",
  });

  // Append metadata as JSON string
  const metadata = JSON.stringify({
    name: fileName,
  });
  formData.append("pinataMetadata", metadata);

  // Append options as JSON string
  const options = JSON.stringify({
    cidVersion: 0,
  });
  formData.append("pinataOptions", options);

  // Use axios which handles form-data better in Node.js
  const headers = {
    ...formData.getHeaders(),
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_KEY,
  };

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data || error.message;
      throw new Error(`Pinata upload failed: ${JSON.stringify(errorMessage)}`);
    }
    throw error;
  }
}

/**
 * Upload JSON metadata to IPFS
 */
async function uploadMetadataToIPFS(metadata: Record<string, unknown>): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error("Pinata API credentials not configured");
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: {
        name: "artifact-metadata",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata metadata upload failed: ${error}`);
  }

  const data = await response.json();
  return data.IpfsHash;
}

/**
 * Generate title and description from image using OpenAI Vision API
 */
async function generateMetadataFromImage(imageBase64: string): Promise<{ title: string; description: string }> {
  if (!OPENAI_API_KEY) {
    // Fallback to generic metadata if OpenAI is not configured
    return {
      title: "Mystic Artifact",
      description: "A mysterious artifact from the Mystic Island realm.",
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a creative writer for a fantasy game called Mystic Island. Generate a short, evocative title (max 30 characters) and a vivid description (2-3 sentences) for magical artifacts based on images. Make them feel mysterious, powerful, and fitting for a fantasy realm.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate a title and description for this artifact image. Title should be max 30 characters, description should be 2-3 sentences describing the artifact's appearance and mystical properties.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      // Fallback to generic metadata
      return {
        title: "Mystic Artifact",
        description: "A mysterious artifact from the Mystic Island realm.",
      };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // Parse the response to extract title and description
    // Expected format: "Title: ...\nDescription: ..."
    const lines = content.split("\n").filter((line: string) => line.trim());
    let title = "Mystic Artifact";
    let description = "A mysterious artifact from the Mystic Island realm.";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith("title:")) {
        title = line.substring(6).trim();
      } else if (line.toLowerCase().startsWith("description:")) {
        description = line.substring(12).trim();
      } else if (i === 0 && !line.toLowerCase().includes("title") && !line.toLowerCase().includes("description")) {
        // If first line doesn't have "title", assume it's the title
        title = line;
        if (lines[i + 1]) {
          description = lines.slice(i + 1).join(" ");
        }
        break;
      }
    }

    // Clean up title (remove quotes, etc.)
    title = title.replace(/^["']|["']$/g, "").trim();
    if (title.length > 30) {
      title = title.substring(0, 27) + "...";
    }

    return { title, description };
  } catch (error) {
    console.error("Error generating metadata with OpenAI:", error);
    // Fallback to generic metadata
    return {
      title: "Mystic Artifact",
      description: "A mysterious artifact from the Mystic Island realm.",
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Get the image file from the request
    const formData = req.body;
    
    if (!formData || !formData.image) {
      return res.status(400).json({
        success: false,
        error: "No image provided",
      });
    }

    // Convert base64 image to buffer
    const imageBase64 = formData.image;
    const imageBuffer = Buffer.from(imageBase64.split(",")[1] || imageBase64, "base64");
    const fileName = formData.fileName || `artifact-${Date.now()}.jpg`;

    // Step 1: Upload image to IPFS
    console.log("Uploading image to IPFS...");
    const imageIpfsHash = await uploadToIPFS(imageBuffer, fileName);
    const imageIpfsUrl = `${PINATA_GATEWAY}/ipfs/${imageIpfsHash}`;

    console.log("Image uploaded to IPFS:", imageIpfsHash);

    // Step 2: Generate metadata using AI
    console.log("Generating metadata with AI...");
    const { title, description } = await generateMetadataFromImage(imageBase64);

    // Step 3: Create metadata JSON following ERC721 metadata standard
    const metadata = {
      name: title,
      description: description,
      image: `ipfs://${imageIpfsHash}`,
      external_url: "https://mysticisland.xyz",
      attributes: [
        {
          trait_type: "Type",
          value: "Artifact",
        },
        {
          trait_type: "Rarity",
          value: "Common",
        },
      ],
    };

    // Step 4: Upload metadata to IPFS
    console.log("Uploading metadata to IPFS...");
    const metadataIpfsHash = await uploadMetadataToIPFS(metadata);
    const metadataIpfsUrl = `ipfs://${metadataIpfsHash}`;

    console.log("Metadata uploaded to IPFS:", metadataIpfsHash);

    return res.status(200).json({
      success: true,
      imageIpfsHash,
      imageIpfsUrl,
      metadataIpfsHash,
      metadataIpfsUrl,
      title,
      description,
    });
  } catch (error) {
    console.error("Error uploading artifact:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload artifact",
    });
  }
}

// Disable body parsing, we'll handle it manually
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

