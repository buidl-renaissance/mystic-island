import { useX402, useEvmAddress, useCurrentUser } from "@coinbase/cdp-hooks";
import { useMemo, useCallback } from "react";
import { createPublicClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { useUnifiedAuth } from "./useUnifiedAuth";

/**
 * Custom hook that provides x402 payment-enabled fetch function
 * This integrates with CDP React embedded wallets to automatically handle
 * 402 Payment Required responses and process payments.
 * 
 * IMPORTANT: x402 payments use regular transactions (not UserOperations yet),
 * so smart contract wallets need ETH for gas. This hook checks for ETH and
 * provides helpful error messages if needed.
 * 
 * This hook explicitly uses the embedded wallet's address to ensure
 * payments are made from the correct wallet and balance is decremented.
 */
export function useX402Payment() {
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { authType, evmAddress: unifiedEvmAddress } = useUnifiedAuth();
  
  // Use unified address if available
  const walletAddress = unifiedEvmAddress || evmAddress;
  const isFarcaster = authType === 'farcaster';
  
  // For Farcaster, x402 might not work the same way - we may need to handle differently
  // For now, use CDP x402 if not Farcaster, otherwise return a no-op or error
  const { fetchWithPayment: baseFetchWithPayment } = useX402({
    // Explicitly pass the embedded wallet address to ensure payments
    // are made from the correct wallet and balance is decremented
    address: (!isFarcaster ? walletAddress : undefined) || undefined,
  });

  // Wrap fetchWithPayment to check ETH balance for smart contract wallets
  const fetchWithPayment = useCallback(
    async (url: string, options?: RequestInit) => {
      // For Farcaster, x402 payments may not be supported yet
      // Return the request without x402 handling for now
      if (isFarcaster) {
        console.warn("x402 payments not yet fully supported for Farcaster wallets");
        return fetch(url, options);
      }
      
      // Check if this is a smart contract wallet
      const isSmartWallet = currentUser?.evmSmartAccounts?.[0] !== undefined;
      
      if (isSmartWallet && walletAddress) {
        // x402 payments use regular transactions (not UserOperations yet)
        // Smart contract wallets need ETH for gas
        try {
          const publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http(),
          });

          const ethBalance = await publicClient.getBalance({
            address: walletAddress as `0x${string}`,
          });

          // Check if balance is sufficient for gas (roughly 0.0001 ETH should be enough)
          const minEthRequired = BigInt("100000000000000"); // 0.0001 ETH
          
          if (ethBalance < minEthRequired) {
            const balanceFormatted = formatUnits(ethBalance, 18);
            throw new Error(
              `Insufficient ETH for gas. Your smart contract wallet needs ETH to pay for gas when making x402 payments. ` +
              `You have ${balanceFormatted} ETH but need at least 0.0001 ETH. ` +
              `Please request ETH from the faucet first.`
            );
          }

          console.log("✅ Smart wallet has sufficient ETH for x402 payment");
        } catch (error) {
          // If it's our custom error, throw it
          if (error instanceof Error && error.message.includes("Insufficient ETH")) {
            throw error;
          }
          // Otherwise, log and continue (might be network error)
          console.warn("Could not check ETH balance, proceeding anyway:", error);
        }
      }

      // Proceed with x402 payment
      return baseFetchWithPayment(url, options);
    },
    [baseFetchWithPayment, currentUser, walletAddress, isFarcaster]
  );

  // Return a memoized fetch function that handles payments automatically
  return useMemo(() => {
    return fetchWithPayment;
  }, [fetchWithPayment]);
}

