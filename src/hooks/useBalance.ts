import { useState, useEffect, useCallback } from "react";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { createPublicClient, http, formatUnits, formatEther } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * Hook to fetch and display both USDC and ETH balances for the connected wallet on Base Sepolia
 * USDC contract address on Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
 */
const USDC_CONTRACT_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const USDC_DECIMALS = 6; // USDC has 6 decimals

// ERC-20 balanceOf function ABI
const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useBalance() {
  const { isSignedIn, evmAddress } = useUnifiedAuth();
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!evmAddress || !isSignedIn) {
      setUsdcBalance(null);
      setEthBalance(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      // Fetch both balances in parallel
      const [usdcBalance, ethBalance] = await Promise.all([
        // Get USDC token balance using ERC-20 balanceOf
        publicClient.readContract({
          address: USDC_CONTRACT_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [evmAddress as `0x${string}`],
        }),
        // Get native ETH balance
        publicClient.getBalance({
          address: evmAddress as `0x${string}`,
        }),
      ]);

      // Format USDC balance (6 decimals for USDC)
      const formattedUsdcBalance = formatUnits(usdcBalance, USDC_DECIMALS);
      setUsdcBalance(formattedUsdcBalance);

      // Format ETH balance (18 decimals for native ETH)
      const formattedEthBalance = formatEther(ethBalance);
      setEthBalance(formattedEthBalance);
    } catch (err) {
      console.error("Error fetching balances:", err);
      setError("Unable to load balance");
      setUsdcBalance(null);
      setEthBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [evmAddress, isSignedIn]);

  useEffect(() => {
    fetchBalances();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return { 
    usdcBalance, 
    ethBalance,
    balance: usdcBalance, // Keep for backward compatibility
    isLoading, 
    error, 
    isSignedIn,
    refresh: fetchBalances, // Expose refresh function for manual balance updates
  };
}

