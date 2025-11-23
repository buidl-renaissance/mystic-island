/**
 * Pre-generated content for realms
 * This file contains the initial mythos and location data for the first realms
 */

export interface MythosData {
  islandName: string;
  shortTheme: string;
  artDirection: string;
  coreMyth: string;
  loreURI: string;
}

export interface LocationData {
  slug: string;
  displayName: string;
  description: string;
  biome: number; // BiomeType enum value
  difficulty: number; // DifficultyTier enum value
  parentLocationId: number;
  sceneURI: string;
  controller: string; // address or "0x0000000000000000000000000000000000000000"
  metadataURI: string;
}

export const MYSTIC_ISLAND_MYTHOS: MythosData = {
  islandName: "Mystic Island",
  shortTheme: "A collaborative myth-forging island where artifacts awaken dormant totems and tribes shape the narrative through their collective creativity.",
  artDirection: "Magical realism, bioluminescent nature, soft dusk lighting, ethereal atmosphere with organic forms and mystical elements.",
  coreMyth: "Mystic Island is a living realm where the boundary between story and reality blurs. Artifacts created by players carry the essence of their creators' intentions, and when combined into totems, they awaken ancient powers. Tribes form around shared visions, each contributing to the island's evolving mythology. The island itself responds to the collective imagination of its inhabitants, growing and changing as new stories are woven into its fabric.",
  loreURI: "ipfs://QmPlaceholderForMysticIslandLore", // TODO: Replace with actual IPFS hash
};

export const MYSTIC_ISLAND_LOCATIONS: LocationData[] = [
  {
    slug: "fountain-path",
    displayName: "Fountain Path Sanctuary",
    description: "Overgrown stone statue guarding a path into the forest. A hidden mechanism raises a stone bridge from the pond when a key is offered.",
    biome: 2, // Forest
    difficulty: 1, // Easy
    parentLocationId: 0,
    sceneURI: "ipfs://QmPlaceholderForFountainPathScene", // TODO: Replace with actual IPFS hash
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "ipfs://QmPlaceholderForFountainPathMetadata", // TODO: Replace with actual IPFS hash
  },
  {
    slug: "sunset-planetarium",
    displayName: "Sunset Planetarium",
    description: "An island-bound planetarium bathed in dusk light, surrounded by still water. The tiger-clad explorer approaches along a curved path.",
    biome: 6, // Ruins
    difficulty: 2, // Normal
    parentLocationId: 0,
    sceneURI: "ipfs://QmPlaceholderForPlanetariumScene", // TODO: Replace with actual IPFS hash
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "ipfs://QmPlaceholderForPlanetariumMetadata", // TODO: Replace with actual IPFS hash
  },
  {
    slug: "lord-smearingtons-gallery",
    displayName: "Lord Smearington's Absurd Gallery",
    description: "A secret, whimsical gallery hidden within the island's depths. Lord Smearington's collection of absurd artifacts defies all conventional understanding of reality.",
    biome: 10, // Custom
    difficulty: 3, // Hard
    parentLocationId: 0,
    sceneURI: "ipfs://QmPlaceholderForGalleryScene", // TODO: Replace with actual IPFS hash
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "ipfs://QmPlaceholderForGalleryMetadata", // TODO: Replace with actual IPFS hash
  },
];

// Export all realms for easy access
export const REALMS = {
  MYSTIC_ISLAND: {
    mythos: MYSTIC_ISLAND_MYTHOS,
    locations: MYSTIC_ISLAND_LOCATIONS,
  },
} as const;

