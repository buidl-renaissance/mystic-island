import { useState, useEffect } from "react";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { createPublicClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * Hook to fetch and display USDC balance for the connected wallet
 */
export function useBalance() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!evmAddress || !isSignedIn) {
      setBalance(null);
      setError(null);
      return;
    }

    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // USDC token address on Base Sepolia
        const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as `0x${string}`;
        
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        // Get USDC balance
        const balance = await publicClient.readContract({
          address: usdcAddress,
          abi: [
            {
              inputs: [{ name: "account", type: "address" }],
              name: "balanceOf",
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function",
            },
            {
              inputs: [],
              name: "decimals",
              outputs: [{ name: "", type: "uint8" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "balanceOf",
          args: [evmAddress as `0x${string}`],
        });

        const decimals = await publicClient.readContract({
          address: usdcAddress,
          abi: [
            {
              inputs: [],
              name: "decimals",
              outputs: [{ name: "", type: "uint8" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "decimals",
        });

        const formattedBalance = formatUnits(balance as bigint, decimals);
        setBalance(formattedBalance);
      } catch (err) {
        console.error("Error fetching balance:", err);
        setError("Unable to load balance");
        setBalance(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [evmAddress, isSignedIn]);

  return { balance, isLoading, error, isSignedIn };
}

