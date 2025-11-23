import { useState, useEffect, useCallback } from "react";
import { createPublicClient, createWalletClient, http, custom, encodeFunctionData } from "viem";
import { useEvmAddress, useCurrentUser, useSignEvmTransaction } from "@coinbase/cdp-hooks";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_UNLOCK_ABI } from "@/utils/contracts";

export interface UnlockStatus {
  unlocked: boolean;
  isLoading: boolean;
}

export function useLocationUnlock() {
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { signEvmTransaction } = useSignEvmTransaction();
  const [unlockedLocationIds, setUnlockedLocationIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicClient = createPublicClient({
    chain: SAGA_CHAINLET as any,
    transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
  });

  // Fetch unlocked locations for the current player
  const fetchUnlockedLocations = useCallback(async () => {
    if (!evmAddress || CONTRACT_ADDRESSES.LOCATION_UNLOCK === "0x0000000000000000000000000000000000000000") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unlockedIds = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.LOCATION_UNLOCK as `0x${string}`,
        abi: LOCATION_UNLOCK_ABI,
        functionName: "getUnlockedLocations",
        args: [evmAddress as `0x${string}`],
      });

      // If user has no unlocked locations, automatically unlock Explorer's Main Path (location ID 1)
      // This ensures new players can always start the game
      if (unlockedIds.length === 0) {
        console.log("No unlocked locations found, unlocking Explorer's Main Path...");
        try {
          const response = await fetch("/api/unlock-intro-location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userAddress: evmAddress }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Explorer's Main Path unlocked:", data.transactionHash);
            
            // Poll for the unlock to be confirmed on-chain
            // The transaction should be fast, so we'll poll a few times
            let attempts = 0;
            const maxAttempts = 10;
            const pollInterval = 1000; // 1 second
            
            const pollForUnlock = async (): Promise<void> => {
              try {
                const updatedIds = await publicClient.readContract({
                  address: CONTRACT_ADDRESSES.LOCATION_UNLOCK as `0x${string}`,
                  abi: LOCATION_UNLOCK_ABI,
                  functionName: "getUnlockedLocations",
                  args: [evmAddress as `0x${string}`],
                });
                
                if (updatedIds.length > 0) {
                  setUnlockedLocationIds(updatedIds as bigint[]);
                } else if (attempts < maxAttempts) {
                  attempts++;
                  setTimeout(pollForUnlock, pollInterval);
                } else {
                  // Fallback: set Central Clearing as unlocked optimistically
                  // The transaction should have gone through, even if we can't confirm it yet
                  setUnlockedLocationIds([1n]);
                  console.warn("Could not confirm unlock, but setting optimistically");
                }
              } catch (pollError) {
                if (attempts < maxAttempts) {
                  attempts++;
                  setTimeout(pollForUnlock, pollInterval);
                } else {
                  // Fallback: set Central Clearing as unlocked optimistically
                  setUnlockedLocationIds([1n]);
                  console.warn("Polling failed, but setting optimistically");
                }
              }
            };
            
            // Start polling after a short delay to allow transaction to be mined
            setTimeout(pollForUnlock, 2000);
          } else {
            console.warn("Failed to unlock Central Clearing, but continuing...");
            setUnlockedLocationIds(unlockedIds as bigint[]);
          }
        } catch (unlockError) {
          console.error("Error auto-unlocking Central Clearing:", unlockError);
          // Don't fail the whole fetch if auto-unlock fails
          setUnlockedLocationIds(unlockedIds as bigint[]);
        }
      } else {
        setUnlockedLocationIds(unlockedIds as bigint[]);
      }
    } catch (err) {
      console.error("Error fetching unlocked locations:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch unlocked locations");
    } finally {
      setIsLoading(false);
    }
  }, [evmAddress, publicClient]);

  useEffect(() => {
    fetchUnlockedLocations();
  }, [fetchUnlockedLocations]);

  // Check if a location is unlocked
  const checkUnlocked = useCallback(
    async (locationId: bigint): Promise<boolean> => {
      if (!evmAddress || CONTRACT_ADDRESSES.LOCATION_UNLOCK === "0x0000000000000000000000000000000000000000") {
        return false;
      }

      // First check local state
      if (unlockedLocationIds.includes(locationId)) {
        return true;
      }

      // If not in local state, check on-chain
      try {
        const unlocked = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.LOCATION_UNLOCK as `0x${string}`,
          abi: LOCATION_UNLOCK_ABI,
          functionName: "canAccessLocation",
          args: [evmAddress as `0x${string}`, locationId],
        });

        // Update local state if unlocked
        if (unlocked && !unlockedLocationIds.includes(locationId)) {
          setUnlockedLocationIds((prev) => [...prev, locationId]);
        }

        return unlocked as boolean;
      } catch (err) {
        console.error("Error checking unlock status:", err);
        return false;
      }
    },
    [evmAddress, unlockedLocationIds, publicClient]
  );

  // Unlock a location
  const unlockLocation = useCallback(
    async (locationId: bigint): Promise<void> => {
      if (!evmAddress) {
        throw new Error("No wallet connected");
      }

      if (CONTRACT_ADDRESSES.LOCATION_UNLOCK === "0x0000000000000000000000000000000000000000") {
        throw new Error("LocationUnlock contract not deployed");
      }

      // Check if already unlocked
      if (unlockedLocationIds.includes(locationId)) {
        return;
      }

      const sendTransaction = async (data: `0x${string}`, to: `0x${string}`) => {
        const evmAccount = currentUser?.evmAccounts?.[0];
        if (evmAccount) {
          const gasPrice = await publicClient.getGasPrice();
          const nonce = await publicClient.getTransactionCount({
            address: evmAccount.address as `0x${string}`,
          });

          const gasEstimate = await publicClient.estimateGas({
            account: evmAccount.address as `0x${string}`,
            to,
            data,
            value: 0n,
          });

          const { signedTransaction } = await signEvmTransaction({
            evmAccount,
            transaction: {
              to,
              data,
              value: 0n,
              nonce,
              gas: gasEstimate,
              maxFeePerGas: gasPrice,
              maxPriorityFeePerGas: gasPrice / 2n,
              chainId: SAGA_CHAINLET.id,
              type: "eip1559",
            },
          });

          return await publicClient.sendRawTransaction({
            serializedTransaction: signedTransaction,
          });
        } else if (typeof window !== "undefined" && (window as any).ethereum) {
          const ethereum = (window as any).ethereum;
          const walletClient = createWalletClient({
            chain: SAGA_CHAINLET as any,
            transport: custom(ethereum),
          });

          const accounts = await ethereum.request({ method: "eth_requestAccounts" });
          const accountAddress = accounts[0] as `0x${string}`;

          const gasPrice = await publicClient.getGasPrice();
          const gasEstimate = await publicClient.estimateGas({
            account: accountAddress,
            to,
            data,
            value: 0n,
          });

          return await walletClient.sendTransaction({
            account: accountAddress,
            chain: SAGA_CHAINLET as any,
            to,
            data,
            value: 0n,
            gas: gasEstimate,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice / 2n,
          });
        } else {
          throw new Error("No wallet available");
        }
      };

      try {
        const unlockData = encodeFunctionData({
          abi: LOCATION_UNLOCK_ABI,
          functionName: "unlockLocation",
          args: [locationId],
        });

        await sendTransaction(unlockData, CONTRACT_ADDRESSES.LOCATION_UNLOCK as `0x${string}`);

        // Refresh unlocked locations
        await fetchUnlockedLocations();
      } catch (err) {
        console.error("Error unlocking location:", err);
        throw err;
      }
    },
    [evmAddress, currentUser, signEvmTransaction, publicClient, unlockedLocationIds, fetchUnlockedLocations]
  );

  // Get all unlocked location IDs
  const getUnlockedLocations = useCallback((): bigint[] => {
    return unlockedLocationIds;
  }, [unlockedLocationIds]);

  // Check if location is unlocked (synchronous check from local state)
  const isUnlocked = useCallback(
    (locationId: bigint): boolean => {
      return unlockedLocationIds.includes(locationId);
    },
    [unlockedLocationIds]
  );

  return {
    unlockedLocationIds,
    isLoading,
    error,
    checkUnlocked,
    unlockLocation,
    getUnlockedLocations,
    isUnlocked,
    refetch: fetchUnlockedLocations,
  };
}

