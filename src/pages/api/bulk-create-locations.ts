import type { NextApiRequest, NextApiResponse } from "next";
import { createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_REGISTRY_ABI } from "@/utils/contracts";
import { MYSTIC_ISLAND_LOCATIONS } from "@/data/realm-content";
import locationScenes from "@/data/location-scenes.json";

type ResponseData = {
  success: boolean;
  created?: number;
  skipped?: number;
  errors?: string[];
  transactionHashes?: string[];
  error?: string;
};

// Map location slugs to their IPFS data
const locationScenesMap: Record<string, { sceneURI: string; metadataURI: string }> = {
  "explorers-main-path": {
    sceneURI: locationScenes["explorers-main-path"].sceneURI,
    metadataURI: locationScenes["explorers-main-path"].metadataURI,
  },
  "metal-flower-grove": {
    sceneURI: locationScenes["metal-flower-grove"].sceneURI,
    metadataURI: locationScenes["metal-flower-grove"].metadataURI,
  },
  "planetarium-sunset-plains": {
    sceneURI: locationScenes["planetarium-sunset-plains"].sceneURI,
    metadataURI: locationScenes["planetarium-sunset-plains"].metadataURI,
  },
  "meadow-lumen-tree": {
    sceneURI: locationScenes["meadow-lumen-tree"].sceneURI,
    metadataURI: locationScenes["meadow-lumen-tree"].metadataURI,
  },
  "forest-entryway-deep-woods": {
    sceneURI: locationScenes["forest-entryway-deep-woods"].sceneURI,
    metadataURI: locationScenes["forest-entryway-deep-woods"].metadataURI,
  },
  "sanctuary-gate": {
    // Use fountain-path-sanctuary scene for the Sanctuary Gate
    sceneURI: locationScenes["fountain-path-sanctuary"]?.sceneURI || "",
    metadataURI: locationScenes["fountain-path-sanctuary"]?.metadataURI || "",
  },
  "island-pond-sacred-water": {
    sceneURI: locationScenes["island-pond-sacred-water"].sceneURI,
    metadataURI: locationScenes["island-pond-sacred-water"].metadataURI,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const deployerPrivateKey = process.env.SAGA_PRIVATE_KEY;
    if (!deployerPrivateKey) {
      return res.status(500).json({
        success: false,
        error: "Server configuration error: SAGA_PRIVATE_KEY not set",
      });
    }

    const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
    
    const client = createWalletClient({
      account,
      chain: SAGA_CHAINLET as any,
      transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
    });

    const locations = MYSTIC_ISLAND_LOCATIONS;
    const slugToId: Record<string, number> = {};
    const transactionHashes: string[] = [];
    const errors: string[] = [];
    let created = 0;
    let skipped = 0;

    for (const location of locations) {
      // Get IPFS data if available
      const ipfsData = locationScenesMap[location.slug] || {
        sceneURI: location.sceneURI || "",
        metadataURI: location.metadataURI || "",
      };

      // Map parent location ID to on-chain ID
      let parentId = 0;
      if (location.parentLocationId > 0) {
        const parentIndex = location.parentLocationId - 1;
        if (parentIndex < locations.length) {
          const parentLocation = locations[parentIndex];
          if (slugToId[parentLocation.slug]) {
            parentId = slugToId[parentLocation.slug];
          }
        }
      }

      try {
        // Encode the createLocation function call
        const data = encodeFunctionData({
          abi: LOCATION_REGISTRY_ABI,
          functionName: "createLocation",
          args: [
            location.slug,
            location.displayName,
            location.description,
            location.biome,
            location.difficulty,
            BigInt(parentId),
            ipfsData.sceneURI,
            location.controller as `0x${string}`,
            ipfsData.metadataURI,
          ],
        });

        // Send the transaction
        const hash = await client.sendTransaction({
          to: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
        } as any);

        transactionHashes.push(hash);
        created++;
        console.log(`Created location: ${location.slug} (tx: ${hash})`);

        // Note: We can't easily get the location ID from the transaction without waiting for receipt
        // For now, we'll assume the locations are created in order and IDs are sequential
        // In production, you might want to wait for receipts and extract IDs from events
      } catch (error: any) {
        if (error.message?.includes("slug already exists") || error.message?.includes("already exists")) {
          skipped++;
          console.log(`Location ${location.slug} already exists, skipping`);
        } else {
          errors.push(`${location.slug}: ${error.message || "Unknown error"}`);
          console.error(`Error creating location ${location.slug}:`, error);
        }
      }
    }

    return res.status(200).json({
      success: true,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      transactionHashes,
    });
  } catch (error) {
    console.error("Error in bulk location creation:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create locations",
    });
  }
}

