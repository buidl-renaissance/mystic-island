import type { NextApiRequest, NextApiResponse } from "next";
import { readFile } from "fs/promises";
import { join } from "path";
import { uploadToIPFS, getIpfsProtocolUrl, getIpfsUrl } from "@/utils/ipfs";
import OpenAI from "openai";

type ResponseData = {
  success: boolean;
  imageIpfsHash?: string;
  imageIpfsUrl?: string;
  imagePreviewUrl?: string; // HTTP gateway URL for preview
  error?: string;
};

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Get the base64-encoded reference image
 */
async function getReferenceImageBase64(): Promise<string> {
  try {
    const referenceImagePath = join(process.cwd(), "public", "images", "explore-main-path.png");
    const imageBuffer = await readFile(referenceImagePath);
    const imageBase64 = imageBuffer.toString("base64");
    return imageBase64;
  } catch (error) {
    console.error("Error reading reference image:", error);
    throw new Error("Could not read reference image file");
  }
}

/**
 * Use GPT-4 Vision to create a style-matching prompt based on the reference image
 */
async function createStyleMatchingPrompt(
  openai: OpenAI,
  imageBase64: string,
  locationDescription: string,
  locationName: string,
  biome: string,
  difficulty: string
): Promise<string> {
  try {
    console.log("Creating style-matching prompt with GPT-4 Vision...");

    // Use GPT-4 Vision to create a direct prompt that will generate a similar image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating image generation prompts. Your task is to analyze a reference image and create a concise, effective prompt that will generate a similar image in the same style. Focus on the visual style, not extracting details.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Look at this reference image. It defines the visual style for a fantasy game world.

I need to generate a NEW image that:
- Depicts: ${locationDescription}
- Location: ${locationName} (${biome}, ${difficulty})
- Must match the EXACT visual style of the reference image

Create a concise DALL-E prompt (under 3500 characters) that will generate an image in the SAME style as the reference. The prompt should:
1. Describe the new location content (${locationDescription})
2. Reference the visual style of the reference image (colors, lighting, composition, technique, mood)
3. Be specific enough that DALL-E will match the reference style exactly

Focus on visual style matching - same color palette, lighting quality, artistic technique, composition style, and mood. Make it clear the new image should look like it was painted by the same artist in the same style.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const prompt = response.choices[0]?.message?.content || "";
    if (!prompt) {
      throw new Error("No prompt returned from GPT-4 Vision");
    }
    
    // Validate length
    if (prompt.length > 4000) {
      console.warn(`Generated prompt is ${prompt.length} characters, truncating to 4000...`);
      return prompt.substring(0, 3997) + "...";
    }
    
    console.log("Style-matching prompt created");
    return prompt;
  } catch (error) {
    console.error("Error creating style-matching prompt:", error);
    // Fallback to a basic prompt
    const fallbackPrompt = `Create a fantastical landscape painting depicting: ${locationDescription} (${locationName}, ${biome}, ${difficulty}). 

Style: Magical realism fantasy landscape. Deep forest greens, sunlit golds, sky blues transitioning to warm golden-orange in sunset/sunrise sky. Vibrant flowers in orange-red and purple-blue. Warm, soft dusk lighting creating ethereal atmosphere. Lush verdant valleys, majestic mountains, winding paths, dense vegetation. Realistic yet dreamlike, classical landscape painting technique with fantasy elements. Match this exact style.`;
    
    return fallbackPrompt.length > 4000 
      ? fallbackPrompt.substring(0, 3997) + "..."
      : fallbackPrompt;
  }
}


/**
 * Generate an image using OpenAI DALL-E based on location details and reference image style
 */
async function generateLocationImage(
  locationName: string,
  locationDescription: string,
  biome: string,
  difficulty: string
): Promise<Buffer> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  // Get the base64-encoded reference image
  const referenceImageBase64 = await getReferenceImageBase64();
  
  // Use GPT-4 Vision to create a style-matching prompt based on the reference image
  const finalPrompt = await createStyleMatchingPrompt(
    openai,
    referenceImageBase64,
    locationDescription,
    locationName,
    biome,
    difficulty
  );
  
  console.log("Generating image with OpenAI DALL-E...");
  console.log(`Prompt length: ${finalPrompt.length} characters`);
  console.log("Prompt:", finalPrompt);

  try {
    // Use DALL-E 3 to generate the image
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    const imageData = response.data?.[0];
    const imageUrl = imageData?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    console.log("Image generated, downloading from OpenAI...");

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download generated image: ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    return imageBuffer;
  } catch (error) {
    console.error("Error generating image with OpenAI:", error);
    throw error;
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
    const { locationName, locationDescription, biome, difficulty } = req.body;

    if (!locationName || !locationDescription) {
      return res.status(400).json({
        success: false,
        error: "Location name and description are required",
      });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "OpenAI API key not configured",
      });
    }

    // Generate image using OpenAI
    console.log("Generating location image...");
    const imageBuffer = await generateLocationImage(
      locationName,
      locationDescription,
      biome || "Unknown",
      difficulty || "None"
    );

    // Upload generated image to IPFS
    console.log("Uploading generated image to IPFS...");
    const fileName = `location-generated-${Date.now()}.png`;
    const imageIpfsHash = await uploadToIPFS(imageBuffer, fileName, "image/png");
    const imageIpfsUrl = getIpfsProtocolUrl(imageIpfsHash);
    const imagePreviewUrl = getIpfsUrl(imageIpfsHash); // HTTP gateway URL for preview

    console.log("Image uploaded to IPFS:", imageIpfsHash);

    return res.status(200).json({
      success: true,
      imageIpfsHash,
      imageIpfsUrl,
      imagePreviewUrl,
    });
  } catch (error) {
    console.error("Error generating location image:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate location image",
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

