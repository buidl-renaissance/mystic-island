import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Example API endpoint that demonstrates x402 payment requirements
 * 
 * This endpoint returns a 402 Payment Required response with payment requirements.
 * In a real implementation, you would:
 * 1. Verify the payment header if present
 * 2. Process the purchase if payment is valid
 * 3. Return the purchased item data
 * 
 * For now, this is a simple example that always returns 402 to demonstrate
 * the payment flow.
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if payment header is present
  const paymentHeader = req.headers["x-payment"];

  if (!paymentHeader) {
    // Return 402 Payment Required with payment requirements
    // x402-fetch expects the response to have:
    // - x402Version: the protocol version
    // - accepts: an array of payment requirement objects with all required fields
    // In a real implementation, you would calculate the actual payment amount
    // based on the item being purchased
    
    const { itemId } = req.body;
    
    // Payment requirements must include all required fields
    const accepts = [
      {
        scheme: "exact" as const,
        network: "base-sepolia" as const, // Base Sepolia testnet
        resource: `/api/purchase-item/${itemId}`, // Resource identifier
        description: `Purchase ${itemId}`, // Human-readable description
        mimeType: "application/json", // Expected response MIME type
        payTo: "0x0000000000000000000000000000000000000000", // Replace with your payment address
        maxAmountRequired: "1000000", // Amount in smallest unit (0.001 USDC = 1000000 for 6 decimals)
        maxTimeoutSeconds: 300, // 5 minutes timeout
        asset: "USDC", // Payment asset
      },
    ];

    res.status(402).json({
      x402Version: "1.0",
      accepts,
    });
    return;
  }

  // If payment header is present, verify it and process the purchase
  // In a real implementation, you would:
  // 1. Verify the payment signature
  // 2. Check that payment was actually made on-chain
  // 3. Process the purchase
  // 4. Return the purchased item

  const { itemId } = req.body;

  // For demo purposes, we'll just return success
  // In production, you MUST verify the payment before processing
  res.status(200).json({
    success: true,
    itemId,
    message: "Item purchased successfully",
    purchaseDate: new Date().toISOString(),
    // Include payment response header for client to decode
    // This is typically set in the response header, but we're including it
    // in the body for demo purposes
  });
}

