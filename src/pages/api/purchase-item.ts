import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Simplified API endpoint for purchasing game items using x402-next middleware
 * 
 * The x402-next middleware handles:
 * - 402 Payment Required responses (when no X-PAYMENT header)
 * - Payment verification with CDP facilitator
 * - Payment settlement (after this handler completes)
 * - X-PAYMENT-RESPONSE header (added automatically)
 * 
 * This API route only handles:
 * - Business logic (processing the purchase)
 * - Response formatting
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { itemId } = req.body;
  const paymentHeader = req.headers["x-payment"];

  console.log("=== API ROUTE HANDLER (INTEGRATED WITH MIDDLEWARE) ===");
  console.log("Item ID:", itemId);
  console.log("Has X-PAYMENT header:", !!paymentHeader);

  // If we reach here, the middleware has already:
  // 1. Returned 402 if no payment header
  // 2. Verified the payment if payment header exists
  // So we can assume payment is verified

  if (!paymentHeader) {
    // This shouldn't happen if middleware is working correctly
    // But handle it gracefully as a fallback
    // IMPORTANT: x402-fetch expects an 'accepts' array in 402 responses
    console.warn("⚠️ No payment header - middleware should have handled this");
    
    // Build payment requirements (matching middleware config)
    const resourceUrl = `${req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https')}://${req.headers.host || 'localhost:3000'}/api/purchase-item`;
    const priceInUSDC = 0.01;
    const maxAmountRequired = Math.floor(priceInUSDC * 1_000_000).toString();
    
    const accepts = [
      {
        scheme: "exact" as const,
        network: "base-sepolia" as const,
        maxAmountRequired,
        resource: resourceUrl,
        description: `Purchase ${itemId || 'item'}`,
        mimeType: "application/json",
        payTo: process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006",
        maxTimeoutSeconds: 300,
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on base-sepolia
      },
    ];
    
    return res.status(402).json({
      x402Version: 1,
      error: "Payment required",
      accepts, // Required by x402-fetch
    });
  }

  // Decode payment header to get payment info for business logic
  let paymentData;
  try {
    const headerValue = Array.isArray(paymentHeader) ? paymentHeader[0] : paymentHeader;
    if (headerValue && typeof headerValue === 'string') {
      const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
      paymentData = JSON.parse(decoded);
    }
  } catch (error) {
    console.error("Error decoding payment header:", error);
    return res.status(400).json({ error: "Invalid payment header" });
  }

  const auth = paymentData?.payload?.authorization;
  console.log("Payment from:", auth?.from);
  console.log("Payment to:", auth?.to);
  console.log("Payment amount:", auth?.value);

  // Business logic: Process the purchase
  console.log("✅ Payment verified by middleware, processing purchase...");
  
  // TODO: Add your business logic here:
  // - Update database
  // - Grant item to user
  // - Log purchase
  // - Send notifications
  // etc.

  // Example: Validate itemId
  if (!itemId) {
    return res.status(400).json({ error: "itemId is required" });
  }

  // The middleware will handle:
  // - Payment settlement (after this response is sent)
  // - Adding X-PAYMENT-RESPONSE header with settlement info

  // Return response
  // Note: The middleware will automatically:
  // 1. Settle the payment after this response
  // 2. Add X-PAYMENT-RESPONSE header with settlement details
  res.status(200).json({
    success: true,
    itemId,
    message: "Item purchased successfully",
    purchaseDate: new Date().toISOString(),
    paymentInfo: {
      from: auth?.from,
      to: auth?.to,
      amount: auth?.value,
      // Note: transaction hash will be in X-PAYMENT-RESPONSE header set by middleware
    },
  });
}
