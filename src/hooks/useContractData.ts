import { useState, useEffect } from "react";
import { createPublicClient, http, formatEther, formatUnits } from "viem";
import {
  CONTRACT_ADDRESSES,
  SAGA_CHAINLET,
  ERC20_ABI,
  ERC721_ABI,
  TOTEM_MANAGER_ABI,
  QUEST_MANAGER_ABI,
  TRIBE_MANAGER_ABI,
  ISLAND_MYTHOS_ABI,
  LOCATION_REGISTRY_ABI,
} from "@/utils/contracts";

interface ContractData {
  magicToken: {
    name: string | null;
    symbol: string | null;
    totalSupply: string | null;
  };
  artifactCollection: {
    name: string | null;
    symbol: string | null;
    nextTokenId: string | null;
  };
  tribeManager: {
    nextTribeId: string | null;
    nextJoinRequestId: string | null;
  };
  totemManager: {
    nextTotemId: string | null;
  };
  questManager: {
    attestor: string | null;
  };
  islandMythos: {
    initialized: boolean | null;
    locked: boolean | null;
    islandName: string | null;
  };
  locationRegistry: {
    totalLocations: string | null;
  };
}

export function useContractData() {
  const [data, setData] = useState<ContractData>({
    magicToken: { name: null, symbol: null, totalSupply: null },
    artifactCollection: { name: null, symbol: null, nextTokenId: null },
    tribeManager: { nextTribeId: null, nextJoinRequestId: null },
    totemManager: { nextTotemId: null },
    questManager: { attestor: null },
    islandMythos: { initialized: null, locked: null, islandName: null },
    locationRegistry: { totalLocations: null },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        // Extract addresses as strings for comparison
        const islandMythosAddress = CONTRACT_ADDRESSES.ISLAND_MYTHOS as string;
        const locationRegistryAddress = CONTRACT_ADDRESSES.LOCATION_REGISTRY as string;
        const isIslandMythosDeployed = islandMythosAddress !== "0x0000000000000000000000000000000000000000" && islandMythosAddress;
        const isLocationRegistryDeployed = locationRegistryAddress !== "0x0000000000000000000000000000000000000000" && locationRegistryAddress;

        // Fetch all contract data in parallel
        const [
          magicName,
          magicSymbol,
          magicSupply,
          artifactName,
          artifactSymbol,
          artifactNextId,
          tribeNextId,
          tribeNextRequestId,
          totemNextId,
          questAttestor,
          mythosInitialized,
          mythosLocked,
          mythosIslandName,
          locationTotal,
        ] = await Promise.all([
          // MagicToken
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.MAGIC_TOKEN,
              abi: ERC20_ABI,
              functionName: "name",
            })
            .catch(() => null),
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.MAGIC_TOKEN,
              abi: ERC20_ABI,
              functionName: "symbol",
            })
            .catch(() => null),
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.MAGIC_TOKEN,
              abi: ERC20_ABI,
              functionName: "totalSupply",
            })
            .catch(() => null),
          // ArtifactCollection
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION,
              abi: ERC721_ABI,
              functionName: "name",
            })
            .catch(() => null),
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION,
              abi: ERC721_ABI,
              functionName: "symbol",
            })
            .catch(() => null),
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION,
              abi: ERC721_ABI,
              functionName: "nextTokenId",
            })
            .catch(() => null),
          // TribeManager
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.TRIBE_MANAGER,
              abi: TRIBE_MANAGER_ABI,
              functionName: "nextTribeId",
            })
            .catch(() => null),
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.TRIBE_MANAGER,
              abi: TRIBE_MANAGER_ABI,
              functionName: "nextJoinRequestId",
            })
            .catch(() => null),
          // TotemManager
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.TOTEM_MANAGER,
              abi: TOTEM_MANAGER_ABI,
              functionName: "nextTotemId",
            })
            .catch(() => null),
          // QuestManager
          publicClient
            .readContract({
              address: CONTRACT_ADDRESSES.QUEST_MANAGER,
              abi: QUEST_MANAGER_ABI,
              functionName: "attestor",
            })
            .catch(() => null),
          // IslandMythos (only if deployed)
          isIslandMythosDeployed
            ? publicClient
                .readContract({
                  address: CONTRACT_ADDRESSES.ISLAND_MYTHOS as `0x${string}`,
                  abi: ISLAND_MYTHOS_ABI,
                  functionName: "isInitialized",
                })
                .catch(() => null)
            : Promise.resolve(null),
          isIslandMythosDeployed
            ? publicClient
                .readContract({
                  address: CONTRACT_ADDRESSES.ISLAND_MYTHOS as `0x${string}`,
                  abi: ISLAND_MYTHOS_ABI,
                  functionName: "isLocked",
                })
                .catch(() => null)
            : Promise.resolve(null),
          isIslandMythosDeployed
            ? publicClient
                .readContract({
                  address: CONTRACT_ADDRESSES.ISLAND_MYTHOS as `0x${string}`,
                  abi: ISLAND_MYTHOS_ABI,
                  functionName: "islandName",
                })
                .catch(() => null)
            : Promise.resolve(null),
          // LocationRegistry (only if deployed)
          isLocationRegistryDeployed
            ? publicClient
                .readContract({
                  address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
                  abi: LOCATION_REGISTRY_ABI,
                  functionName: "totalLocations",
                })
                .catch(() => null)
            : Promise.resolve(null),
        ]);

        setData({
          magicToken: {
            name: magicName as string | null,
            symbol: magicSymbol as string | null,
            totalSupply:
              magicSupply !== null
                ? formatEther(magicSupply as bigint)
                : null,
          },
          artifactCollection: {
            name: artifactName as string | null,
            symbol: artifactSymbol as string | null,
            nextTokenId:
              artifactNextId !== null
                ? (artifactNextId as bigint).toString()
                : null,
          },
          tribeManager: {
            nextTribeId:
              tribeNextId !== null ? (tribeNextId as bigint).toString() : null,
            nextJoinRequestId:
              tribeNextRequestId !== null
                ? (tribeNextRequestId as bigint).toString()
                : null,
          },
          totemManager: {
            nextTotemId:
              totemNextId !== null ? (totemNextId as bigint).toString() : null,
          },
          questManager: {
            attestor: questAttestor as string | null,
          },
          islandMythos: {
            initialized: mythosInitialized as boolean | null,
            locked: mythosLocked as boolean | null,
            islandName: mythosIslandName as string | null,
          },
          locationRegistry: {
            totalLocations:
              locationTotal !== null ? (locationTotal as bigint).toString() : null,
          },
        });
      } catch (err) {
        console.error("Error fetching contract data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, isLoading, error };
}

