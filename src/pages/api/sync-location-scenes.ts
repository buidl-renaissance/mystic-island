import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_REGISTRY_ABI } from "@/utils/contracts";
import { promises as fs } from "fs";
import path from "path";

type ResponseData = {
  success: boolean;
  synced?: number;
  scenes?: Record<string, string>;
  error?: string;
};

// Path to the location scenes JSON file
const SCENES_FILE_PATH = path.join(process.cwd(), "src/data/location-scenes.json");

interface LocationScene {
  slug: string;
  sceneURI: string;
  displayName: string;
  metadataURI?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  if (CONTRACT_ADDRESSES.LOCATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
    return res.status(400).json({
      success: false,
      error: "LocationRegistry contract not deployed yet.",
    });
  }

  try {
    const publicClient = createPublicClient({
      chain: SAGA_CHAINLET as any,
      transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
    });

    // Get total number of locations
    const total = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
      abi: LOCATION_REGISTRY_ABI,
      functionName: "totalLocations",
    });

    const totalLocations = Number(total);
    console.log(`Found ${totalLocations} locations on-chain`);

    if (totalLocations === 0) {
      // Create empty file if no locations exist
      await fs.writeFile(
        SCENES_FILE_PATH,
        JSON.stringify({}, null, 2),
        "utf-8"
      );
      return res.status(200).json({
        success: true,
        synced: 0,
        scenes: {},
      });
    }

    // Fetch all locations
    const locationPromises: Promise<LocationScene>[] = [];
    for (let i = 1; i <= totalLocations; i++) {
      locationPromises.push(
        publicClient
          .readContract({
            address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
            abi: LOCATION_REGISTRY_ABI,
            functionName: "getLocation",
            args: [BigInt(i)],
          })
          .then((data) => {
            const location = data as unknown as {
              id: bigint;
              slug: string;
              displayName: string;
              description: string;
              biome: bigint;
              difficulty: bigint;
              parentLocationId: bigint;
              isActive: boolean;
              sceneURI: string;
              controller: string;
              metadataURI: string;
            };

            return {
              slug: location.slug,
              sceneURI: location.sceneURI,
              displayName: location.displayName,
              metadataURI: location.metadataURI || undefined,
            };
          })
      );
    }

    const locations = await Promise.all(locationPromises);

    // Filter to only active locations with sceneURIs
    const scenes: Record<string, LocationScene> = {};
    locations.forEach((location) => {
      if (location.sceneURI && location.sceneURI !== "" && location.sceneURI !== "0x") {
        scenes[location.slug] = {
          slug: location.slug,
          sceneURI: location.sceneURI,
          displayName: location.displayName,
          metadataURI: location.metadataURI,
        };
      }
    });

    // Save to JSON file
    await fs.writeFile(
      SCENES_FILE_PATH,
      JSON.stringify(scenes, null, 2),
      "utf-8"
    );

    console.log(`Synced ${Object.keys(scenes).length} location scenes to ${SCENES_FILE_PATH}`);

    return res.status(200).json({
      success: true,
      synced: Object.keys(scenes).length,
      scenes,
    });
  } catch (error) {
    console.error("Error syncing location scenes:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to sync location scenes from contract.",
    });
  }
}

