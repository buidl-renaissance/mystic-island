import { useState, useEffect, useCallback } from "react";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { createPublicClient, http } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, TOTEM_MANAGER_ABI, ERC721_ABI } from "@/utils/contracts";

export interface Artifact {
  id: number;
  tokenURI: string;
}

export interface UseAvailableArtifactsResult {
  artifacts: Artifact[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAvailableArtifacts(): UseAvailableArtifactsResult {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArtifacts = useCallback(async () => {
    if (!isSignedIn || !evmAddress) {
      setArtifacts([]);
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

      // Get artifact balance
      const balance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
        abi: ERC721_ABI,
        functionName: "balanceOf",
        args: [evmAddress as `0x${string}`],
      }).catch(() => 0n);

      // Get nextTokenId to know the range
      const nextTokenId = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
        abi: ERC721_ABI,
        functionName: "nextTokenId",
      }).catch(() => 0n);

      const availableArtifacts: Artifact[] = [];
      const tokenCount = Number(nextTokenId);

      // Iterate through all token IDs to find owned artifacts
      for (let i = 0; i < tokenCount; i++) {
        try {
          const owner = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
            abi: ERC721_ABI,
            functionName: "ownerOf",
            args: [BigInt(i)],
          });

          // Check if user owns this artifact
          if (owner.toLowerCase() === evmAddress.toLowerCase()) {
            // Check if artifact is not in a totem
            const totemId = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
              abi: TOTEM_MANAGER_ABI,
              functionName: "artifactToTotem",
              args: [BigInt(i)],
            }).catch(() => 0n);

            // If totemId is 0, artifact is not in a totem
            if (totemId === 0n) {
              // Fetch token URI
              const tokenURI = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
                abi: ERC721_ABI,
                functionName: "tokenURI",
                args: [BigInt(i)],
              }).catch(() => "");

              availableArtifacts.push({
                id: i,
                tokenURI: tokenURI as string,
              });
            }
          }
        } catch (err) {
          // Token might not exist or other error, skip
          // This is expected for tokens that don't exist yet
        }
      }

      setArtifacts(availableArtifacts);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching available artifacts:", err);
      setError(err instanceof Error ? err.message : "Failed to load artifacts");
      setIsLoading(false);
    }
  }, [evmAddress, isSignedIn]);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  return { artifacts, isLoading, error, refetch: fetchArtifacts };
}

