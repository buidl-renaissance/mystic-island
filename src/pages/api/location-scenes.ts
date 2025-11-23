import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";

// Path to the location scenes JSON file
const SCENES_FILE_PATH = path.join(process.cwd(), "src/data/location-scenes.json");

export interface LocationScene {
  slug: string;
  sceneURI: string;
  displayName: string;
  metadataURI?: string;
}

type ResponseData = {
  scenes?: Record<string, LocationScene>;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const fileContent = await fs.readFile(SCENES_FILE_PATH, "utf-8");
    const scenes = JSON.parse(fileContent);
    return res.status(200).json({ scenes });
  } catch (error) {
    // File doesn't exist yet, return empty object
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return res.status(200).json({ scenes: {} });
    }
    console.error("Error reading location scenes:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to read location scenes",
    });
  }
}

