import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, ISLAND_MYTHOS_ABI } from "@/utils/contracts";

export interface MythosData {
  islandName: string;
  shortTheme: string;
  artDirection: string;
  coreMyth: string;
  loreURI: string;
  initialized: boolean;
  locked: boolean;
}

export function useIslandMythos() {
  const [mythos, setMythos] = useState<MythosData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMythos = async () => {
    if (CONTRACT_ADDRESSES.ISLAND_MYTHOS === "0x0000000000000000000000000000000000000000") {
      setIsLoading(false);
      setMythos(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      console.log("Fetching mythos from:", CONTRACT_ADDRESSES.ISLAND_MYTHOS);

      const mythosData = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ISLAND_MYTHOS as `0x${string}`,
        abi: ISLAND_MYTHOS_ABI,
        functionName: "getMythos",
      })) as {
        islandName: string;
        shortTheme: string;
        artDirection: string;
        coreMyth: string;
        loreURI: string;
        initialized: boolean;
        locked: boolean;
      };

      console.log("Mythos data fetched:", mythosData);

      setMythos({
        islandName: mythosData.islandName,
        shortTheme: mythosData.shortTheme,
        artDirection: mythosData.artDirection,
        coreMyth: mythosData.coreMyth,
        loreURI: mythosData.loreURI,
        initialized: mythosData.initialized,
        locked: mythosData.locked,
      });
    } catch (err) {
      console.error("Error fetching mythos:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch mythos";
      setError(errorMessage);
      // Don't set mythos to null on error - keep previous state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMythos();
  }, []);

  return { mythos, isLoading, error, refetch: fetchMythos };
}

