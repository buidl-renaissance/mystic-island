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
  // Unlock requirements metadata
  isIntroductionPath?: boolean; // Unlocked by first artifact
  grantsKey?: boolean; // Grants a key when visited
  requiresKey?: boolean; // Requires key to unlock
  requiresTotemPower?: number; // Minimum totem power required
  unlockRequirement?: string; // Custom requirement description
}

export const MYSTIC_ISLAND_MYTHOS: MythosData = {
  islandName: "Mystic Island",
  shortTheme: "A collaborative myth-forging island where artifacts awaken dormant totems and tribes shape the narrative through their collective creativity.",
  artDirection: "Magical realism, bioluminescent nature, soft dusk lighting, ethereal atmosphere with organic forms and mystical elements.",
  coreMyth: "Mystic Island is a living realm where the boundary between story and reality blurs. Artifacts created by players carry the essence of their creators' intentions, and when combined into totems, they awaken ancient powers. Tribes form around shared visions, each contributing to the island's evolving mythology. The island itself responds to the collective imagination of its inhabitants, growing and changing as new stories are woven into its fabric.",
  loreURI: "ipfs://QmPlaceholderForMysticIslandLore", // TODO: Replace with actual IPFS hash
};

export const MYSTIC_ISLAND_LOCATIONS: LocationData[] = [
  // ROOT NODE - The Explorer's Main Path
  {
    slug: "explorers-main-path",
    displayName: "The Explorer's Main Path",
    description: "Primary navigational spine of Mystic Island. Stone–dirt hybrid path repeatedly depicted with the tiger-jacket explorer walking toward major landmarks. Connects all other starting regions.",
    biome: 1, // Meadow
    difficulty: 0, // None (entry point)
    parentLocationId: 0,
    sceneURI: "", // Will be populated from location-scenes.json
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "",
    isIntroductionPath: true,
  },
  
  // PATH A — Metal Flower Branch
  {
    slug: "metal-flower-grove",
    displayName: "The Metal Flower Grove",
    description: "Grove of giant metallic flower sculptures set around a reflective pond. Inspired by the real-world steel blossom. Meadow grasses, wildflowers, and a distant tree line set the tone.",
    biome: 1, // Meadow
    difficulty: 1, // Easy
    parentLocationId: 1, // Explorer's Main Path
    sceneURI: "", // Will be populated from location-scenes.json
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "",
  },
  
  // A1. The Planetarium of the Sunset Plains
  {
    slug: "planetarium-sunset-plains",
    displayName: "The Planetarium of the Sunset Plains",
    description: "A luminous planetarium-like structure surrounded by shallow water. The tiger-jacket explorer approaches as the sky burns with purples, oranges, and late-evening gold. Wide plains instead of dense forest.",
    biome: 1, // Meadow
    difficulty: 2, // Normal
    parentLocationId: 2, // Metal Flower Grove
    sceneURI: "", // Will be populated from location-scenes.json
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "",
  },
  
  // PATH B — Lumen Meadow Branch
  {
    slug: "meadow-lumen-tree",
    displayName: "The Meadow of the Lumen Tree",
    description: "A vast open meadow illuminated by a towering metallic Tree of Light with glowing magenta branches. A spiraling walkway rises around its trunk. Soft hills and bioluminescent flora surround the area.",
    biome: 1, // Meadow
    difficulty: 1, // Easy
    parentLocationId: 1, // Explorer's Main Path
    sceneURI: "", // Will be populated from location-scenes.json
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "",
  },
  
  // PATH C — Forest Branch
  {
    slug: "forest-entryway-deep-woods",
    displayName: "The Forest Entryway / Deep Woods",
    description: "A shadowy forest path descending into overgrowth. Lanterns dangle from branches. Hidden clearings and trails lead deeper into unknown regions of the island.",
    biome: 2, // Forest
    difficulty: 1, // Easy (early section), scalable later
    parentLocationId: 1, // Explorer's Main Path
    sceneURI: "", // Will be populated from location-scenes.json
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "",
  },
  
  // C1. The Statue at the Forest Path Entrance (The Sanctuary Gate)
  {
    slug: "sanctuary-gate",
    displayName: "The Statue at the Forest Path Entrance",
    description: "Overgrown stone guardian with a lantern hanging from a nearby branch. Partially submerged in pondwater. Acts as a ritual initiation point. Activation sequence: Explorer drops a key-shaped artifact into the basin. Stones rumble. A submerged stone bridge rises from the pond. The statue's eyes glow; slight animation possible post-activation.",
    biome: 3, // Marsh / Forest Edge
    difficulty: 1, // Easy
    parentLocationId: 5, // Forest Entryway
    sceneURI: "", // Will use fountain-path-sanctuary scene URI
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "",
  },
  
  // PATH D — Central Waters
  {
    slug: "island-pond-sacred-water",
    displayName: "The Island Pond / Sacred Water Basin",
    description: "Recurring body of water that appears in the planetarium, grove, and sanctuary scenes. It is the central magical reservoir of the island—source of rituals, activation sequences, and elemental unlocking.",
    biome: 3, // Marsh
    difficulty: 1, // Easy
    parentLocationId: 1, // Explorer's Main Path
    sceneURI: "", // Will be populated from location-scenes.json
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "",
  },
];

// Export all realms for easy access
export const REALMS = {
  MYSTIC_ISLAND: {
    mythos: MYSTIC_ISLAND_MYTHOS,
    locations: MYSTIC_ISLAND_LOCATIONS,
  },
} as const;

