/**
 * Generate ERC721-style metadata JSON for locations
 */
export interface LocationMetadata {
  name: string;
  description: string;
  image: string; // IPFS URL (ipfs://...)
  video?: string; // IPFS URL (ipfs://...) - optional, unlocked as user explores
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Create ERC721-style metadata for a location
 */
export function createLocationMetadata(params: {
  name: string;
  description: string;
  imageIpfsHash: string;
  videoIpfsHash?: string;
  biome?: string;
  difficulty?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}): LocationMetadata {
  const attributes: Array<{ trait_type: string; value: string | number }> = [
    ...(params.attributes || []),
  ];

  if (params.biome) {
    attributes.push({
      trait_type: "Biome",
      value: params.biome,
    });
  }

  if (params.difficulty) {
    attributes.push({
      trait_type: "Difficulty",
      value: params.difficulty,
    });
  }

  const metadata: LocationMetadata = {
    name: params.name,
    description: params.description,
    image: `ipfs://${params.imageIpfsHash}`,
    external_url: "https://mysticisland.xyz",
    attributes,
  };

  if (params.videoIpfsHash) {
    metadata.video = `ipfs://${params.videoIpfsHash}`;
  }

  return metadata;
}

