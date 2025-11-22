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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { itemId } = req.body;
  
  // Check if payment header is present
  const paymentHeader = req.headers["x-payment"];

  // Log ALL headers to see what's actually being sent
  console.log("=== REQUEST HEADERS DEBUGGING ===");
  console.log("All request headers:", JSON.stringify(req.headers, null, 2));
  console.log("x-payment header (raw):", paymentHeader);
  console.log("x-payment header type:", typeof paymentHeader);
  console.log("x-payment is array:", Array.isArray(paymentHeader));
  if (Array.isArray(paymentHeader)) {
    console.log("x-payment array length:", paymentHeader.length);
    console.log("x-payment array contents:", paymentHeader);
  }

  console.log("Purchase request received:", {
    itemId,
    hasPaymentHeader: !!paymentHeader,
    paymentHeader: paymentHeader ? "present" : "missing",
    method: req.method,
  });

  if (!paymentHeader) {
    // Return 402 Payment Required with payment requirements
    // x402-fetch expects the response to have:
    // - x402Version: the protocol version
    // - accepts: an array of payment requirement objects with all required fields
    // In a real implementation, you would calculate the actual payment amount
    // based on the item being purchased
    
    // Construct the full URL for the resource
    // x402-fetch requires the resource to be a valid URL, not a relative path
    const protocol = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
    const host = req.headers.host || 'localhost:3000';
    const resourceUrl = `${protocol}://${host}/api/purchase-item/${itemId}`;
    
    // Payment requirements must include all required fields
    // x402 uses USDC, not ETH. USDC has 6 decimals (not 18 like ETH)
    // For 0.0000001 USDC = 0.0000001 * 10^6 = 0.1 base units (too small)
    // Using $0.01 USDC (1 cent) as a reasonable test amount = 0.01 * 10^6 = 10000 base units
    const priceInUSDC = 0.01; // $0.01 USDC for testing
    const maxAmountRequired = Math.floor(priceInUSDC * 1_000_000).toString(); // Convert to base units (6 decimals)
    
    const accepts = [
      {
        scheme: "exact" as const,
        network: "base-sepolia" as const, // Base Sepolia testnet
        resource: resourceUrl, // Resource identifier - must be a full URL
        description: `Purchase ${itemId}`, // Human-readable description
        mimeType: "application/json", // Expected response MIME type
        // Use a valid test address for Base Sepolia
        // In production, this should be your actual payment recipient address
        // For demo purposes, using a well-known test address
        payTo: process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006", // Base Sepolia test address
        maxAmountRequired, // Amount in smallest unit (USDC has 6 decimals)
        maxTimeoutSeconds: 300, // 5 minutes timeout
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC contract address on Base Sepolia
      },
    ];

    console.log("Returning 402 Payment Required:", {
      itemId,
      accepts,
    });

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

  // Decode and log the payment header to understand what's being sent
  // The x402 payment header is Base64-encoded JSON, not a plain JSON string
  // Next.js may convert headers to arrays, so handle both cases
  let paymentHeaderData = null;
  try {
    let headerValue = paymentHeader;
    if (Array.isArray(paymentHeader)) {
      headerValue = paymentHeader[0];
    }
    if (headerValue && typeof headerValue === 'string') {
      // The header is Base64-encoded, so decode it first
      // Remove any URL encoding, then decode Base64
      const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
      paymentHeaderData = JSON.parse(decoded);
    }
  } catch (error) {
    console.error("Error decoding payment header:", error);
    console.error("Payment header value (first 200 chars):", 
      typeof paymentHeader === 'string' ? paymentHeader.substring(0, 200) : paymentHeader);
    
    // Try alternative decoding methods
    try {
      const headerValue = Array.isArray(paymentHeader) ? paymentHeader[0] : paymentHeader;
      if (headerValue && typeof headerValue === 'string') {
        // Try URL decode first, then Base64
        const urlDecoded = decodeURIComponent(headerValue);
        const base64Decoded = Buffer.from(urlDecoded, 'base64').toString('utf-8');
        paymentHeaderData = JSON.parse(base64Decoded);
        console.log("Successfully decoded using URL decode + Base64 decode");
      }
    } catch (altError) {
      console.error("Alternative decoding also failed:", altError);
    }
  }

  console.log("=== PAYMENT HEADER DEBUGGING ===");
  const headerValue = Array.isArray(paymentHeader) ? paymentHeader[0] : paymentHeader;
  console.log("Payment header received, processing purchase:", {
    itemId,
    paymentHeaderLength: headerValue?.length || 0,
    paymentHeaderType: typeof paymentHeader,
    isArray: Array.isArray(paymentHeader),
    paymentHeaderPreview: headerValue ? (typeof headerValue === 'string' ? headerValue.substring(0, 200) : String(headerValue).substring(0, 200)) : 'null',
  });
  console.log("Decoded payment header data:", JSON.stringify(paymentHeaderData, null, 2));
  
  // Extract payment information from the decoded header structure
  // The x402 header structure has: x402Version, scheme, network, payload
  // The authorization is nested inside payload: payload.authorization
  const auth = paymentHeaderData?.payload?.authorization;
  const fromAddress = auth?.from;
  const toAddress = auth?.to;
  const paymentValue = auth?.value;
  const validAfter = auth?.validAfter;
  const validBefore = auth?.validBefore;
  const nonce = auth?.nonce;
  
  console.log("Payment from address:", fromAddress);
  console.log("Payment to address:", toAddress);
  console.log("Payment value (amount):", paymentValue);
  console.log("Payment valid after:", validAfter);
  console.log("Payment valid before:", validBefore);
  console.log("Payment nonce:", nonce);
  console.log("Payment scheme:", paymentHeaderData?.scheme);
  console.log("Payment network:", paymentHeaderData?.network);
  console.log("x402 Version:", paymentHeaderData?.x402Version);
  console.log("=== END PAYMENT HEADER DEBUGGING ===");

  // The x402 protocol requires the server to settle the payment with the facilitator
  // This actually executes the on-chain transaction and deducts the balance
  let transactionHash = null;
  
  if (paymentHeaderData) {
    const auth = paymentHeaderData.payload?.authorization;
    
    // Call the CDP facilitator to settle the payment on-chain
    // This is what actually executes the transaction and deducts the balance
    try {
      const apiKeyId = process.env.CDP_API_KEY_ID;
      const apiKeySecret = process.env.CDP_API_KEY_SECRET;
      
      if (apiKeyId && apiKeySecret) {
        console.log("Verifying and settling payment with CDP facilitator...");
        
        // Generate JWT for CDP API
        const { generateJwt } = await import("@coinbase/cdp-sdk/auth");
        
        // First verify the payment
        const verifyJwt = await generateJwt({
          apiKeyId,
          apiKeySecret,
          requestMethod: "POST",
          requestHost: "api.cdp.coinbase.com",
          requestPath: "/platform/v2/x402/verify",
          expiresIn: 120,
        });
        
        // CRITICAL: Reconstruct payment requirements to EXACTLY match the original 402 response
        // These must be identical to what was sent in the 402 response
        const protocol = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
        const host = req.headers.host || 'localhost:3000';
        const resourceUrl = `${protocol}://${host}/api/purchase-item/${itemId}`;
        const priceInUSDC = 0.01;
        const maxAmountRequired = Math.floor(priceInUSDC * 1_000_000).toString(); // 10000
        
        // Use the authorization's 'to' address - this is what the client actually signed
        // The client may have routed through a facilitator, so the 'to' might differ from
        // the original payTo. We need to use what was actually signed.
        const payToAddress = auth?.to || (process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006");
        
        console.log("=== PAYMENT REQUIREMENTS CONSTRUCTION ===");
        console.log("Authorization details:", {
          from: auth?.from,
          to: auth?.to,
          value: auth?.value,
        });
        console.log("Reconstructed requirements:", {
          scheme: paymentHeaderData.scheme,
          network: paymentHeaderData.network,
          maxAmountRequired,
          resource: resourceUrl,
          description: `Purchase ${itemId}`,
          mimeType: "application/json",
          payTo: payToAddress,
          maxTimeoutSeconds: 300,
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        });
        
        // Build payment requirements - MUST match what client signed
        const paymentRequirements = {
          scheme: paymentHeaderData.scheme,
          network: paymentHeaderData.network,
          maxAmountRequired: maxAmountRequired, // String, not number
          resource: resourceUrl,
          description: `Purchase ${itemId}`,
          mimeType: "application/json",
          payTo: payToAddress, // Use what client signed
          maxTimeoutSeconds: 300,
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        };
        
        console.log("Final payment requirements for verify:", JSON.stringify(paymentRequirements, null, 2));
        
        // Prepare verify request
        const verifyPayload = {
          x402Version: 1,
          paymentPayload: {
            x402Version: 1,
            scheme: paymentHeaderData.scheme,
            network: paymentHeaderData.network,
            payload: paymentHeaderData.payload,
          },
          paymentRequirements: paymentRequirements,
        };
        
        console.log("=== VERIFY REQUEST PAYLOAD ===");
        console.log(JSON.stringify(verifyPayload, null, 2));
        console.log("=== END VERIFY REQUEST ===");
        
        // Verify the payment first
        const verifyResponse = await fetch("https://api.cdp.coinbase.com/platform/v2/x402/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${verifyJwt}`,
          },
          body: JSON.stringify(verifyPayload),
        });
        
        const verifyData = await verifyResponse.json();
        console.log("Payment verification result:", verifyData);
        
        if (!verifyResponse.ok || !verifyData.valid) {
          console.error("❌ Payment verification failed:", verifyData);
          console.error("Cannot proceed to settlement without valid verification.");
          // Don't attempt settlement if verification failed
          throw new Error(`Payment verification failed: ${verifyData.invalidReason || verifyData.errorMessage || 'Unknown error'}`);
        }
        
        console.log("✅ Payment verification successful, proceeding to settlement...");
        
        // Now settle the payment
        const settleJwt = await generateJwt({
          apiKeyId,
          apiKeySecret,
          requestMethod: "POST",
          requestHost: "api.cdp.coinbase.com",
          requestPath: "/platform/v2/x402/settle",
          expiresIn: 120,
        });
        
        // Payment requirements already constructed above for verify
        // They use the original payTo address which must match the 402 response
        console.log("Payment requirements for settlement:", JSON.stringify(paymentRequirements, null, 2));
        console.log("Payment authorization details:", {
          from: auth?.from,
          to: auth?.to,
          value: auth?.value,
        });
        console.log("Using payTo from authorization:", payToAddress);
        console.log("Authorization 'to' address:", auth?.to);
        
        // Prepare settlement request payload
        const settlePayload = {
          x402Version: 1, // Must be number 1, not string "1.0"
          paymentPayload: {
            x402Version: 1, // Convert from "1.0" string to number
            scheme: paymentHeaderData.scheme,
            network: paymentHeaderData.network,
            payload: paymentHeaderData.payload,
          },
          paymentRequirements: paymentRequirements,
        };
        
        // Log the full request for debugging
        console.log("Settlement request payload:", JSON.stringify(settlePayload, null, 2));
        
        // Call facilitator settle endpoint
        const settleResponse = await fetch("https://api.cdp.coinbase.com/platform/v2/x402/settle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${settleJwt}`,
          },
          body: JSON.stringify(settlePayload),
        });
        
        const settleData = await settleResponse.json();
        
        if (settleResponse.ok && settleData.success) {
          transactionHash = settleData.transaction;
          console.log("Payment settled successfully:", {
            transactionHash,
            payer: settleData.payer,
            network: settleData.network,
          });
        } else {
          console.error("Payment settlement failed:", settleData);
          // Still proceed, but log the error
        }
      } else {
        console.warn("CDP API keys not configured. Payment will not be settled on-chain.");
        console.warn("Set CDP_API_KEY_ID and CDP_API_KEY_SECRET environment variables to enable settlement.");
      }
    } catch (error) {
      console.error("Error settling payment with facilitator:", error);
      // Continue anyway - in production you might want to fail here
    }
    
    // Set the x-payment-response header with payment details
    const paymentResponse = {
      from: auth?.from,
      to: auth?.to || (process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006"),
      amount: auth?.value,
      scheme: paymentHeaderData.scheme,
      network: paymentHeaderData.network,
      verified: true,
      txHash: transactionHash, // Include transaction hash if settlement succeeded
      settled: !!transactionHash, // Indicate if payment was actually settled
    };
    
    res.setHeader('x-payment-response', encodeURIComponent(JSON.stringify(paymentResponse)));
  }

  res.status(200).json({
    success: true,
    itemId,
    message: "Item purchased successfully",
    purchaseDate: new Date().toISOString(),
    // Include payment info in body for debugging
    paymentInfo: paymentHeaderData ? {
      from: paymentHeaderData.payload?.authorization?.from,
      to: paymentHeaderData.payload?.authorization?.to,
      amount: paymentHeaderData.payload?.authorization?.value,
      scheme: paymentHeaderData.scheme,
      network: paymentHeaderData.network,
      txHash: transactionHash,
      settled: !!transactionHash,
      // Value is in base units: 10000 = 0.01 USDC (with 6 decimals)
    } : null,
  });
}

