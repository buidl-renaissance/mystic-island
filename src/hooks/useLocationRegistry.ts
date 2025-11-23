import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_REGISTRY_ABI } from "@/utils/contracts";

export interface Location {
  id: bigint;
  slug: string;
  displayName: string;
  description: string;
  biome: number;
  difficulty: number;
  parentLocationId: bigint;
  isActive: boolean;
  sceneURI: string;
  controller: string;
  metadataURI: string;
}

export function useLocationRegistry() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [totalLocations, setTotalLocations] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      if (CONTRACT_ADDRESSES.LOCATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const total = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
          abi: LOCATION_REGISTRY_ABI,
          functionName: "totalLocations",
        });

        setTotalLocations(Number(total));

        // Fetch all locations
        if (Number(total) > 0) {
          const locationPromises: Promise<Location>[] = [];
          for (let i = 1; i <= Number(total); i++) {
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
                    id: location.id,
                    slug: location.slug,
                    displayName: location.displayName,
                    description: location.description,
                    biome: Number(location.biome),
                    difficulty: Number(location.difficulty),
                    parentLocationId: location.parentLocationId,
                    isActive: location.isActive,
                    sceneURI: location.sceneURI,
                    controller: location.controller as string,
                    metadataURI: location.metadataURI,
                  };
                })
            );
          }

          const fetchedLocations = await Promise.all(locationPromises);
          setLocations(fetchedLocations.filter((loc) => loc.isActive));
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch locations");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocations();
  }, []);

  return { locations, totalLocations, isLoading, error };
}

