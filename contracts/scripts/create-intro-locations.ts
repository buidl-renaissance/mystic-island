/**
 * Script to create the Core Explorer Paths locations on-chain
 * Run with: npx hardhat run scripts/create-intro-locations.ts --network saga
 */

import { ethers } from "hardhat";
import { CONTRACT_ADDRESSES } from "../../src/utils/contracts";
import { MYSTIC_ISLAND_LOCATIONS } from "../../src/data/realm-content";
// @ts-ignore - JSON import
import locationScenes from "../../src/data/location-scenes.json";

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

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Creating locations with account:", deployer.address);
  console.log("LocationRegistry address:", CONTRACT_ADDRESSES.LOCATION_REGISTRY);
  console.log("");

  const locationRegistry = await ethers.getContractAt(
    "LocationRegistry",
    CONTRACT_ADDRESSES.LOCATION_REGISTRY
  );

  // Check if mythos is initialized
  try {
    const islandMythos = await ethers.getContractAt(
      "IslandMythos",
      CONTRACT_ADDRESSES.ISLAND_MYTHOS
    );
    const isInitialized = await islandMythos.isInitialized();
    if (!isInitialized) {
      console.error("ERROR: IslandMythos contract is not initialized!");
      console.error("Please initialize it first via /onboarding page");
      process.exit(1);
    }
    console.log("✓ IslandMythos is initialized");
  } catch (error) {
    console.error("ERROR: Could not check IslandMythos initialization:", error);
    process.exit(1);
  }

  // Check if deployer has LOCATION_EDITOR_ROLE
  try {
    const LOCATION_EDITOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("LOCATION_EDITOR_ROLE"));
    const hasRole = await locationRegistry.hasRole(LOCATION_EDITOR_ROLE, deployer.address);
    if (!hasRole) {
      console.error("ERROR: Deployer account does not have LOCATION_EDITOR_ROLE!");
      console.error(`Deployer address: ${deployer.address}`);
      console.error("Please ensure the deployer has the correct role on LocationRegistry");
      process.exit(1);
    }
    console.log("✓ Deployer has LOCATION_EDITOR_ROLE");
  } catch (error) {
    console.warn("Warning: Could not check LOCATION_EDITOR_ROLE:", error);
  }

  console.log("");

  // Create locations in order: parents before children
  // This matches the order in MYSTIC_ISLAND_LOCATIONS array
  const locations = MYSTIC_ISLAND_LOCATIONS;

  // Track created location IDs to map parent slugs to IDs
  const slugToId: Record<string, number> = {};

  for (const location of locations) {
    // Get IPFS data if available
    const ipfsData = locationScenesMap[location.slug] || {
      sceneURI: location.sceneURI || "",
      metadataURI: location.metadataURI || "",
    };

    // Map parent location ID to on-chain ID
    // parentLocationId in the data is the index in the array (1-indexed)
    let parentId = 0;
    if (location.parentLocationId > 0) {
      // Find parent location by index in the array
      const parentIndex = location.parentLocationId - 1; // Convert to 0-indexed
      if (parentIndex < locations.length) {
        const parentLocation = locations[parentIndex];
        if (slugToId[parentLocation.slug]) {
          parentId = slugToId[parentLocation.slug];
        } else {
          console.warn(
            `Warning: Parent location ${parentLocation.slug} (index ${parentIndex}) not yet created for ${location.slug}, using 0`
          );
          parentId = 0;
        }
      } else {
        console.warn(
          `Warning: Parent location index ${parentIndex} out of bounds for ${location.slug}, using 0`
        );
        parentId = 0;
      }
    }

    console.log(`Creating location: ${location.displayName} (${location.slug})`);
    console.log(`  Parent ID: ${parentId}`);
    console.log(`  Biome: ${location.biome}, Difficulty: ${location.difficulty}`);

    try {
      // Check if location already exists
      try {
        const existingId = await locationRegistry.getLocationIdBySlug(location.slug);
        if (existingId > 0) {
          slugToId[location.slug] = parseInt(existingId.toString());
          console.log(`  Location ${location.slug} already exists with ID: ${existingId}`);
          continue;
        }
      } catch (e) {
        // Location doesn't exist, proceed with creation
      }

      // Call the function and wait for the transaction
      const txResponse = await locationRegistry.createLocation(
        location.slug,
        location.displayName,
        location.description,
        location.biome,
        location.difficulty,
        parentId,
        ipfsData.sceneURI,
        location.controller,
        ipfsData.metadataURI
      );

      console.log(`  Transaction sent: ${txResponse.hash}`);
      const receipt = await txResponse.wait();
      console.log(`  Transaction confirmed in block: ${receipt.blockNumber}`);

      // The function returns the location ID, but we need to call it with a static call or query after
      // For now, query by slug which is more reliable
      const locationId = await locationRegistry.getLocationIdBySlug(location.slug);
      if (locationId === 0n) {
        throw new Error(`Location was created but ID is 0 - this shouldn't happen`);
      }
      slugToId[location.slug] = parseInt(locationId.toString());
      console.log(`  ✓ Created with ID: ${locationId}`);
    } catch (error: any) {
      const errorMessage = error.message || error.toString();
      if (errorMessage.includes("slug already exists") || errorMessage.includes("already exists")) {
        console.log(`  Location ${location.slug} already exists, getting ID...`);
        // Try to get existing location ID
        try {
          const existingId = await locationRegistry.getLocationIdBySlug(location.slug);
          if (existingId > 0) {
            slugToId[location.slug] = parseInt(existingId.toString());
            console.log(`  Existing ID: ${existingId}`);
          } else {
            console.warn(`  Location exists but ID is 0, this shouldn't happen`);
          }
        } catch (e: any) {
          console.error(`  Could not get existing location ID: ${e.message || e}`);
        }
      } else if (errorMessage.includes("mythos not initialized")) {
        console.error(`  ERROR: IslandMythos contract is not initialized. Please initialize it first via /onboarding`);
        throw error;
      } else if (errorMessage.includes("parent location does not exist")) {
        console.error(`  ERROR: Parent location does not exist. Make sure parent locations are created before children.`);
        console.error(`  Parent ID: ${parentId}, Location: ${location.slug}`);
        throw error;
      } else {
        console.error(`  Error creating location ${location.slug}:`, errorMessage);
        throw error;
      }
    }

    console.log("");
  }

  console.log("Location creation complete!");
  console.log("Slug to ID mapping:", slugToId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

