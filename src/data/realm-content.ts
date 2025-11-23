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
    slug: "fountain-path-sanctuary",
    displayName: "The Fountain Path Sanctuary",
    description: "Statue at the entrance to a forest path. Overgrown stone with a lantern hanging from a tree. Activation sequence: key dropped → stone bridge rises from pond → statue may animate.",
    biome: 2, // Forest
    difficulty: 1, // Easy
    parentLocationId: 0,
    sceneURI: "", // Will be populated when image is uploaded
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "", // Will be populated when metadata is created
  },
  {
    slug: "planetarium-sunset-plains",
    displayName: "The Planetarium of the Sunset Plains",
    description: "Planetarium-like building surrounded by water. Explorer in tiger jacket approaches. Epic sunset sky with water reflecting light. Open plain rather than dense forest.",
    biome: 1, // Meadow (open plain)
    difficulty: 2, // Normal
    parentLocationId: 0,
    sceneURI: "", // Will be populated when image is uploaded
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "", // Will be populated when metadata is created
  },
  {
    slug: "meadow-lumen-tree",
    displayName: "The Meadow of the Lumen Tree",
    description: "Vast grassy meadow with a metallic Tree of Light (LED-inspired). Spiraling walkway leads to the tree. Star-pricked sky with purple–orange glow. Flowers and soft hills surround the area.",
    biome: 1, // Meadow
    difficulty: 1, // Easy
    parentLocationId: 0,
    sceneURI: "", // Will be populated when image is uploaded
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "", // Will be populated when metadata is created
  },
  {
    slug: "metal-flower-grove",
    displayName: "The Metal Flower Grove",
    description: "Inspired by the real-world metal flower sculpture. Set in a meadow with a pond. Trees and wildflowers surround the area. Distant tree line with soft forestry.",
    biome: 1, // Meadow
    difficulty: 1, // Easy
    parentLocationId: 0,
    sceneURI: "", // Will be populated when image is uploaded
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "", // Will be populated when metadata is created
  },
  {
    slug: "forest-entryway-deep-woods",
    displayName: "The Forest Entryway / Deep Woods",
    description: "A path that goes deep into the forest. Thick canopy and overgrowth create a dense, mysterious atmosphere. Heavy vegetation with hidden lanterns guiding the way.",
    biome: 2, // Forest
    difficulty: 2, // Normal
    parentLocationId: 0,
    sceneURI: "", // Will be populated when image is uploaded
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "", // Will be populated when metadata is created
  },
  {
    slug: "island-pond-sacred-water",
    displayName: "The Island Pond / Sacred Water Basin",
    description: "Appears in multiple scenes (fountain, planetarium, metal flower). Central water source in island lore. Used for magical activations and rituals. The sacred heart of the island's mystical energy.",
    biome: 3, // Marsh (water-based)
    difficulty: 1, // Easy
    parentLocationId: 0,
    sceneURI: "", // Will be populated when image is uploaded
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "", // Will be populated when metadata is created
  },
  {
    slug: "explorers-main-path",
    displayName: "The Explorer's Main Path",
    description: "Repeated motif of the tiger-jacket explorer walking along primary routes. Connects major landmarks across the island. Clean stone and dirt walkways form the backbone of island navigation.",
    biome: 1, // Meadow (path through various biomes)
    difficulty: 0, // None (entry point)
    parentLocationId: 0,
    sceneURI: "", // Will be populated when image is uploaded
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "", // Will be populated when metadata is created
  },
];

// Export all realms for easy access
export const REALMS = {
  MYSTIC_ISLAND: {
    mythos: MYSTIC_ISLAND_MYTHOS,
    locations: MYSTIC_ISLAND_LOCATIONS,
  },
} as const;

