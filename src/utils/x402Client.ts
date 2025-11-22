import { useX402Payment } from "@/hooks/useX402Payment";

/**
 * API client utility for making paid API requests with automatic x402 payment handling.
 * 
 * This client automatically:
 * 1. Makes the initial request
 * 2. Detects 402 Payment Required responses
 * 3. Parses payment requirements
 * 4. Authorizes payment using the embedded wallet
 * 5. Retries the request with payment header
 * 
 * Usage:
 * ```ts
 * const fetchWithPayment = useX402Payment();
 * const response = await fetchWithPayment('https://api.example.com/purchase-item', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ itemId: '123' })
 * });
 * ```
 */

export type PaidRequestOptions = RequestInit & {
  url: string;
};

/**
 * Helper function to make a paid API request
 * Note: This should be used within a React component that has access to useX402Payment hook
 */
export async function makePaidRequest(
  fetchWithPayment: ReturnType<typeof useX402Payment>,
  url: string,
  options?: RequestInit
): Promise<Response> {
  try {
    const response = await fetchWithPayment(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok && response.status !== 402) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Error making paid request:", error);
    throw error;
  }
}

/**
 * Helper function to decode x-payment-response header
 * This header contains information about the payment that was made
 */
export function decodePaymentResponse(
  headerValue: string | null
): any | null {
  if (!headerValue) return null;
  try {
    return JSON.parse(decodeURIComponent(headerValue));
  } catch (error) {
    console.error("Error decoding payment response:", error);
    return null;
  }
}

