/**
 * Pre-generated content for Lord Smearingon's Gallery realm
 * This file contains the mythos and location data for the gallery chainlet
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

export const LORD_SMEARINGON_GALLERY_MYTHOS: MythosData = {
  islandName: "Lord Smearingon's Gallery",
  shortTheme: "An absurd and surreal gallery realm where reality bends and art comes to life. A collection of impossible spaces curated by the enigmatic Lord Smearingon.",
  artDirection: "Surrealist, absurdist, Dada-inspired. Impossible architecture, floating objects, distorted perspectives. Rich, saturated colors with dramatic lighting. Whimsical yet unsettling atmosphere.",
  coreMyth: "Lord Smearingon's Gallery exists in a pocket dimension accessible only through the portal in the Planetarium. The Gallery defies conventional physics and logic, housing a collection of impossible artworks and surreal installations. Lord Smearingon, a mysterious curator of the absurd, watches over this realm, adding new pieces as explorers discover and interact with the space. The Gallery grows and evolves, each visitor's experience unique and unpredictable.",
  loreURI: "ipfs://QmPlaceholderForLordSmearingonGalleryLore", // TODO: Replace with actual IPFS hash
};

export const LORD_SMEARINGON_GALLERY_LOCATIONS: LocationData[] = [
  {
    slug: "gallery-entrance",
    displayName: "The Gallery Entrance",
    description: "A grand, impossible entrance hall. The doorways shift position, paintings watch you pass, and the floor seems to tilt at impossible angles. A sign reads 'Welcome to the Absurd - Mind Your Step, Reality is Optional.' This is the entry point from the portal, where visitors first experience the surreal nature of Lord Smearingon's domain.",
    biome: 10, // Custom (surreal gallery space)
    difficulty: 0, // None (entry point from portal)
    parentLocationId: 0, // Root location on gallery chainlet
    sceneURI: "", // Will be populated when image is uploaded
    controller: "0x0000000000000000000000000000000000000000",
    metadataURI: "", // Will be populated when metadata is created
  },
];

// Export all gallery realm data for easy access
export const GALLERY_REALM = {
  mythos: LORD_SMEARINGON_GALLERY_MYTHOS,
  locations: LORD_SMEARINGON_GALLERY_LOCATIONS,
} as const;

