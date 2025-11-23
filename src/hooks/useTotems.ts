import { useState, useEffect, useCallback } from "react";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { createPublicClient, http } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, TOTEM_MANAGER_ABI, ERC721_ABI } from "@/utils/contracts";

export interface Totem {
  id: number;
  creator: string;
  power: bigint;
  artifactCount: number;
  artifactIds: bigint[];
}

export interface UseTotemsResult {
  totems: Totem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTotems(): UseTotemsResult {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const [totems, setTotems] = useState<Totem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTotems = useCallback(async () => {
    if (!isSignedIn || !evmAddress) {
      setTotems([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      // Get the next totem ID to know how many totems exist
      const nextTotemId = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
        abi: TOTEM_MANAGER_ABI,
        functionName: "nextTotemId",
      }).catch(() => 0n);

      const totemCount = Number(nextTotemId);
      const userTotems: Totem[] = [];

      // Iterate through all totem IDs to find user's totems
      for (let i = 1; i < totemCount; i++) {
        try {
          const [id, creator, power, artifactCount] = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
            abi: TOTEM_MANAGER_ABI,
            functionName: "getTotem",
            args: [BigInt(i)],
          });

          // Check if user is the creator
          if (creator.toLowerCase() === evmAddress.toLowerCase()) {
            // Fetch artifact IDs
            const artifactIds = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
              abi: TOTEM_MANAGER_ABI,
              functionName: "getTotemArtifactIds",
              args: [BigInt(i)],
            });

            userTotems.push({
              id: Number(id),
              creator,
              power,
              artifactCount: Number(artifactCount),
              artifactIds: artifactIds as bigint[],
            });
          }
        } catch (err) {
          // Totem might not exist or other error, skip
          console.warn(`Error fetching totem ${i}:`, err);
        }
      }

      setTotems(userTotems);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching totems:", err);
      setError(err instanceof Error ? err.message : "Failed to load totems");
      setIsLoading(false);
    }
  }, [evmAddress, isSignedIn]);

  useEffect(() => {
    fetchTotems();
  }, [fetchTotems]);

  return { totems, isLoading, error, refetch: fetchTotems };
}

export function useTotem(totemId: number | null): { totem: Totem | null; isLoading: boolean; error: string | null; refetch: () => Promise<void> } {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const [totem, setTotem] = useState<Totem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTotem = useCallback(async () => {
    if (!isSignedIn || !evmAddress || totemId === null) {
      setTotem(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      const [id, creator, power, artifactCount] = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
        abi: TOTEM_MANAGER_ABI,
        functionName: "getTotem",
        args: [BigInt(totemId)],
      });

      const artifactIds = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
        abi: TOTEM_MANAGER_ABI,
        functionName: "getTotemArtifactIds",
        args: [BigInt(totemId)],
      });

      setTotem({
        id: Number(id),
        creator,
        power,
        artifactCount: Number(artifactCount),
        artifactIds: artifactIds as bigint[],
      });
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching totem:", err);
      setError(err instanceof Error ? err.message : "Failed to load totem");
      setIsLoading(false);
    }
  }, [evmAddress, isSignedIn, totemId]);

  useEffect(() => {
    fetchTotem();
  }, [fetchTotem]);

  return { totem, isLoading, error, refetch: fetchTotem };
}

