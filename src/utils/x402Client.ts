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
    console.log("makePaidRequest: Starting request to", url);
    
    const response = await fetchWithPayment(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    console.log("makePaidRequest: Response received", {
      status: response.status,
      ok: response.ok,
      url: response.url,
    });
    
    // Log response headers for debugging
    const responseHeaders = Object.fromEntries(response.headers.entries());
    console.log("Response headers:", responseHeaders);
    console.log("x-payment-response header value:", response.headers.get("x-payment-response"));

    // Note: x402-fetch should automatically handle 402 responses by:
    // 1. Detecting the 402 response
    // 2. Processing the payment requirements
    // 3. Making the payment
    // 4. Retrying the request with the payment header
    // If we get a 402 back, it means the payment flow failed or was rejected
    
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
 * 
 * The x402-next middleware Base64-encodes the header value
 */
export function decodePaymentResponse(
  headerValue: string | null
): any | null {
  if (!headerValue) return null;
  try {
    // The middleware Base64-encodes the header value
    // Try Base64 decode first, then fall back to URL decode
    try {
      const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (base64Error) {
      // Fall back to URL decode (for backwards compatibility)
      const urlDecoded = decodeURIComponent(headerValue);
      return JSON.parse(urlDecoded);
    }
  } catch (error) {
    console.error("Error decoding payment response:", error);
    console.error("Header value (first 100 chars):", headerValue.substring(0, 100));
    return null;
  }
}

