import { useX402 } from "@coinbase/cdp-hooks";
import { useMemo } from "react";

/**
 * Custom hook that provides x402 payment-enabled fetch function
 * This integrates with CDP React embedded wallets to automatically handle
 * 402 Payment Required responses and process payments.
 */
export function useX402Payment() {
  const { fetchWithPayment } = useX402();

  // Return a memoized fetch function that handles payments automatically
  return useMemo(() => {
    return fetchWithPayment;
  }, [fetchWithPayment]);
}

