import { useX402, useEvmAddress } from "@coinbase/cdp-hooks";
import { useMemo } from "react";

/**
 * Custom hook that provides x402 payment-enabled fetch function
 * This integrates with CDP React embedded wallets to automatically handle
 * 402 Payment Required responses and process payments.
 * 
 * This hook explicitly uses the embedded wallet's address to ensure
 * payments are made from the correct wallet and balance is decremented.
 */
export function useX402Payment() {
  const { evmAddress } = useEvmAddress();
  const { fetchWithPayment } = useX402({
    // Explicitly pass the embedded wallet address to ensure payments
    // are made from the correct wallet and balance is decremented
    address: evmAddress || undefined,
  });

  // Return a memoized fetch function that handles payments automatically
  return useMemo(() => {
    return fetchWithPayment;
  }, [fetchWithPayment]);
}

