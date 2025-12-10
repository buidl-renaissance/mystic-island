import { useState, useEffect, useCallback } from "react";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { createPublicClient, http, formatEther } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, ERC721_ABI, ERC20_ABI } from "@/utils/contracts";

export interface UserStats {
  artifactCount: number | null;
  magicBalance: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserStats() {
  const { isSignedIn, evmAddress } = useUnifiedAuth();
  const [stats, setStats] = useState<UserStats>({
    artifactCount: null,
    magicBalance: null,
    isLoading: false,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    if (!isSignedIn || !evmAddress) {
      setStats({
        artifactCount: null,
        magicBalance: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setStats((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      // Fetch both balances in parallel
      const [artifactBalance, magicBalance] = await Promise.all([
        // Get artifact count (ERC721 balanceOf)
        publicClient
          .readContract({
            address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
            abi: ERC721_ABI,
            functionName: "balanceOf",
            args: [evmAddress as `0x${string}`],
          })
          .catch(() => 0n),
        // Get magic token balance (ERC20 balanceOf)
        publicClient
          .readContract({
            address: CONTRACT_ADDRESSES.MAGIC_TOKEN as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [evmAddress as `0x${string}`],
          })
          .catch(() => 0n),
      ]);

      setStats({
        artifactCount: Number(artifactBalance),
        magicBalance: formatEther(magicBalance),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setStats({
        artifactCount: null,
        magicBalance: null,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load stats",
      });
    }
  }, [evmAddress, isSignedIn]);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { ...stats, refetch: fetchStats };
}

