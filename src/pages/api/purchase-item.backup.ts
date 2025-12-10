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
    console.warn("⚠️ No payment header - middleware should have handled this");
    return res.status(402).json({
      x402Version: 1,
      error: "Payment required",
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

// OLD CODE BELOW - REMOVED BUT KEPT FOR REFERENCE
// The middleware now handles all of this:
// - 402 responses
// - Payment verification
// - Payment settlement
// - X-PAYMENT-RESPONSE header
/*
  // Step 1: If no payment header, return 402 Payment Required
  if (!paymentHeader) {
    const resourceUrl = getResourceUrl(req);
    const priceInUSDC = 0.01;
    const maxAmountRequired = Math.floor(priceInUSDC * 1_000_000).toString();
    
    // CRITICAL: Key order must match canonical encoding order for EIP-712 signature
    // Canonical order: scheme, network, maxAmountRequired, resource, description, mimeType, payTo, maxTimeoutSeconds, asset
    const accepts = [
      {
        scheme: "exact" as const,
        network: "base-sepolia" as const,
        maxAmountRequired, // Position 3 in canonical order (after network, before resource)
        resource: resourceUrl,
        description: `Purchase ${itemId}`,
        mimeType: "application/json",
        payTo: process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006",
        maxTimeoutSeconds: 300,
        asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      },
    ];

    console.log("=== RETURNING 402 PAYMENT REQUIRED ===");
    console.log("402 Response accepts:", JSON.stringify(accepts, null, 2));
    console.log("Resource URL in 402:", resourceUrl);
    console.log("PayTo in 402:", accepts[0].payTo);
    console.log("MaxAmountRequired in 402:", accepts[0].maxAmountRequired);
    
    // Store the original 402 requirements for later retrieval during verification
    // This ensures we use the EXACT same values that the client signed
    const cacheKey = getCacheKey(resourceUrl, itemId);
    original402Cache.set(cacheKey, {
      requirements: { ...accepts[0] }, // Store a copy
      timestamp: Date.now(),
    });
    console.log("Stored original 402 requirements in cache with key:", cacheKey);
    
    // Clean up old entries
    cleanupCache();
    
    return res.status(402).json({
      x402Version: 1, // Use number, not string, per x402 spec
      accepts,
    });
  }

  // Step 2: Decode and verify payment
  let paymentHeaderData = null;
  try {
    const headerValue = Array.isArray(paymentHeader) ? paymentHeader[0] : paymentHeader;
    if (headerValue && typeof headerValue === 'string') {
      const decoded = Buffer.from(headerValue, 'base64').toString('utf-8');
      paymentHeaderData = JSON.parse(decoded);
    }
  } catch (error) {
    console.error("Error decoding payment header:", error);
    return res.status(400).json({ error: "Invalid payment header" });
  }

  const auth = paymentHeaderData?.payload?.authorization;
  console.log("Payment from:", auth?.from);
  console.log("Payment to:", auth?.to);
  console.log("Payment amount:", auth?.value);
  
  // Log the full payment header data structure for debugging
  console.log("=== PAYMENT HEADER DATA ===");
  console.log("Full payment header data:", JSON.stringify(paymentHeaderData, null, 2));
  
  // DIAGNOSTIC: Analyze signature structure and extract requirements
  console.log("=== SIGNATURE ANALYSIS ===");
  const signature = paymentHeaderData?.payload?.signature;
  if (signature) {
    console.log("Signature present:", !!signature);
    console.log("Signature length:", signature?.length || 0, "characters");
    console.log("Signature (first 100 chars):", signature?.substring(0, 100));
    console.log("Signature (last 100 chars):", signature?.substring(Math.max(0, (signature?.length || 0) - 100)));
    
    // The signature encodes the authorization which includes:
    // - from (payer address)
    // - to (payTo address) - CRITICAL: This must match paymentRequirements.payTo
    // - value (amount)
    // - validAfter/validBefore (time window)
    // - nonce
    console.log("=== AUTHORIZATION FIELDS (encoded in signature) ===");
    console.log("authorization.from:", auth?.from, "(type:", typeof auth?.from, ")");
    console.log("authorization.to:", auth?.to, "(type:", typeof auth?.to, ")");
    console.log("authorization.value:", auth?.value, "(type:", typeof auth?.value, ")");
    console.log("authorization.validAfter:", auth?.validAfter, "(type:", typeof auth?.validAfter, ")");
    console.log("authorization.validBefore:", auth?.validBefore, "(type:", typeof auth?.validBefore, ")");
    console.log("authorization.nonce:", auth?.nonce, "(type:", typeof auth?.nonce, ")");
    
    // The facilitator extracts payment requirements from this signature
    // Key insight: authorization.to is what the client signed for, so payTo must match it
    console.log("=== KEY INSIGHT ===");
    console.log("The facilitator extracts requirements from the signature.");
    console.log("The signature includes authorization.to, which is the payTo address the client signed for.");
    console.log("Therefore, paymentRequirements.payTo MUST equal authorization.to");
    if (auth?.to) {
      console.log("Expected payTo in paymentRequirements:", auth.to);
    } else {
      console.warn("⚠️ WARNING: authorization.to is missing! Cannot determine expected payTo.");
    }
  } else {
    console.warn("⚠️ WARNING: No signature found in payment payload!");
  }

  // Check if wallet is deployed by checking contract code
  // Even if wallet has funds, the contract might not be deployed yet
  // CDP embedded wallets auto-deploy on first outgoing transaction
  const walletAddress = auth?.from;
  if (walletAddress) {
    try {
      // Use a public RPC to check if contract code exists
      const rpcUrl = "https://sepolia.base.org";
      const checkDeploymentResponse = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getCode",
          params: [walletAddress, "latest"],
          id: 1,
        }),
      });
      
      const deploymentData = await checkDeploymentResponse.json();
      const contractCode = deploymentData.result;
      // Check if contract code exists (not "0x" or "0x0")
      const isDeployed = contractCode && contractCode !== "0x" && contractCode !== "0x0" && contractCode.length > 2;
      
      console.log("Wallet deployment check:", {
        address: walletAddress,
        hasCode: isDeployed,
        codeLength: contractCode?.length || 0,
        codeValue: contractCode,
        rpcUrl: rpcUrl,
      });
      
      if (!isDeployed) {
        console.warn("⚠️ Wallet contract not deployed on-chain.");
        console.warn("⚠️ The CDP dashboard may show the account exists, but it needs to be deployed on-chain.");
        console.warn("⚠️ Deployment happens automatically on the first outgoing transaction.");
        console.warn("⚠️ The facilitator will also verify deployment status.");
      } else {
        console.log("✅ Wallet is deployed on-chain according to RPC check");
      }
    } catch (error) {
      console.warn("Could not check wallet deployment status:", error);
      // Continue anyway - facilitator will check
    }
  }

  // Step 3: Verify payment with facilitator
  // Use the CDP-hosted facilitator
  const TESTNET_FACILITATOR_URL = "https://api.cdp.coinbase.com/platform";
  // CRITICAL: Use the same resourceUrl construction as in the 402 response
  // This ensures the facilitator can match the signed requirements
  const resourceUrl = getResourceUrl(req);
  const priceInUSDC = 0.01;
  const maxAmountRequired = Math.floor(priceInUSDC * 1_000_000).toString();

  // Check for API keys for CDP facilitator authentication
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  
  if (!apiKeyId || !apiKeySecret) {
    console.error("CDP API keys not configured. Facilitator requires authentication.");
    return res.status(500).json({
      error: "CDP API keys not configured. Please set CDP_API_KEY_ID and CDP_API_KEY_SECRET environment variables.",
    });
  }
  
  // CRITICAL: The paymentRequirements MUST match EXACTLY what was in the original 402 response
  // However, the facilitator extracts payment requirements from the signature, which includes
  // the authorization.to address. The payTo in paymentRequirements MUST match authorization.to
  // because that's what the client actually signed for.
  const originalPayTo = process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006";
  
  // Use authorization.to for payTo if available, as that's what the client signed for
  // The facilitator extracts requirements from the signature and compares them, so payTo must match authorization.to
  const payToForRequirements = auth?.to || originalPayTo;
  
  console.log("=== PAYTO ADDRESS SELECTION ===");
  console.log("Authorization to (what client signed for):", auth?.to);
  console.log("Original payTo from env/default:", originalPayTo);
  console.log("Using payTo for requirements:", payToForRequirements);
  if (auth?.to && auth.to.toLowerCase() !== originalPayTo.toLowerCase()) {
    console.log("⚠️ NOTE: Using authorization.to instead of originalPayTo because facilitator extracts payTo from signature");
  }

  // Log what the client sent in paymentHeaderData
  console.log("=== PAYMENT HEADER DATA FROM CLIENT ===");
  console.log("paymentHeaderData.scheme:", paymentHeaderData.scheme, "(type:", typeof paymentHeaderData.scheme, ")");
  console.log("paymentHeaderData.network:", paymentHeaderData.network, "(type:", typeof paymentHeaderData.network, ")");
  console.log("paymentHeaderData.x402Version:", paymentHeaderData.x402Version, "(type:", typeof paymentHeaderData.x402Version, ")");
  console.log("Full paymentHeaderData structure:", JSON.stringify(paymentHeaderData, null, 2));

  // Try to retrieve the original 402 requirements from cache
  // This ensures we use the EXACT values that were in the 402 response the client signed
  const cacheKey = getCacheKey(resourceUrl, itemId);
  const cachedRequirements = original402Cache.get(cacheKey);
  
  console.log("=== PAYMENT REQUIREMENTS SOURCE ===");
  console.log("Cache key:", cacheKey);
  console.log("Found cached requirements:", !!cachedRequirements);
  
  let paymentRequirements;
  if (cachedRequirements) {
    // Use the exact requirements from the original 402 response
    // CRITICAL: Reconstruct in canonical order to ensure key order matches signature encoding
    // Canonical order: scheme, network, maxAmountRequired, resource, description, mimeType, payTo, maxTimeoutSeconds, asset
    const cached = cachedRequirements.requirements;
    paymentRequirements = {
      scheme: cached.scheme,
      network: cached.network,
      maxAmountRequired: cached.maxAmountRequired, // Position 3 in canonical order
      resource: cached.resource,
      description: cached.description,
      mimeType: cached.mimeType,
      payTo: auth?.to || cached.payTo, // Position 7 - Use authorization.to if available
      maxTimeoutSeconds: cached.maxTimeoutSeconds,
      asset: cached.asset,
    };
    
    // CRITICAL: Override payTo with authorization.to if available
    // The facilitator extracts payTo from the signature (which matches authorization.to),
    // so paymentRequirements.payTo must match authorization.to, not the original 402 payTo
    if (auth?.to) {
      console.log("✅ Using cached original 402 requirements with payTo overridden to match authorization.to");
      console.log("✅ Reconstructed in canonical key order for signature matching");
    } else {
      console.log("✅ Using cached original 402 requirements");
      console.log("✅ Reconstructed in canonical key order for signature matching");
    }
    console.log("Cached requirements (with payTo override if applicable):", JSON.stringify(paymentRequirements, null, 2));
  } else {
    console.warn("⚠️ No cached requirements found, reconstructing from current values");
    console.warn("⚠️ This may cause a mismatch if values differ from the original 402 response");
    // Fallback: reconstruct (should match original 402 exactly, except payTo which must match authorization.to)
    // CRITICAL: Key order must match canonical encoding order for EIP-712 signature
    // Canonical order: scheme, network, maxAmountRequired, resource, description, mimeType, payTo, maxTimeoutSeconds, asset
    paymentRequirements = {
      scheme: "exact", // Position 1 in canonical order
      network: "base-sepolia", // Position 2 in canonical order
      maxAmountRequired, // Position 3 in canonical order (CRITICAL: must be after network, before resource)
      resource: resourceUrl, // Position 4 in canonical order
      description: `Purchase ${itemId}`, // Position 5 in canonical order
      mimeType: "application/json", // Position 6 in canonical order
      payTo: payToForRequirements, // Position 7 in canonical order - Use authorization.to (what client signed for)
      maxTimeoutSeconds: 300, // Position 8 in canonical order
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Position 9 in canonical order
    };
  }
  
  // Ensure type consistency: maxAmountRequired must be string, maxTimeoutSeconds must be number
  paymentRequirements.maxAmountRequired = String(paymentRequirements.maxAmountRequired);
  paymentRequirements.maxTimeoutSeconds = Number(paymentRequirements.maxTimeoutSeconds);

  // Log comparison between original 402 and what we're sending
  // Note: payTo may differ because we use authorization.to instead of originalPayTo
  // CRITICAL: Use canonical key order for comparison object too
  console.log("=== ORIGINAL 402 vs PAYMENT REQUIREMENTS COMPARISON ===");
  const original402Accepts = {
    scheme: "exact",
    network: "base-sepolia",
    maxAmountRequired, // Position 3 in canonical order
    resource: resourceUrl,
    description: `Purchase ${itemId}`,
    mimeType: "application/json",
    payTo: originalPayTo,
    maxTimeoutSeconds: 300,
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  };
  
  // Validate resource URL consistency
  if (cachedRequirements && cachedRequirements.requirements.resource !== resourceUrl) {
    console.warn("⚠️ WARNING: Resource URL mismatch between cached requirements and current request!");
    console.warn("⚠️ Cached resource:", cachedRequirements.requirements.resource);
    console.warn("⚠️ Current resource:", resourceUrl);
    console.warn("⚠️ This may cause verification to fail if the client signed for a different resource URL");
  }
  
  // Check if paymentRequirements has any fields that original402Accepts doesn't have
  // or vice versa - this could indicate missing/extra fields issue
  console.log("=== FIELD PRESENCE COMPARISON ===");
  const originalFields = new Set(Object.keys(original402Accepts));
  const paymentFields = new Set(Object.keys(paymentRequirements));
  const fieldsOnlyInOriginal = [...originalFields].filter(f => !paymentFields.has(f));
  const fieldsOnlyInPayment = [...paymentFields].filter(f => !originalFields.has(f));
  
  if (fieldsOnlyInOriginal.length > 0) {
    console.warn("⚠️ Fields in original 402 but NOT in paymentRequirements:", fieldsOnlyInOriginal);
  }
  if (fieldsOnlyInPayment.length > 0) {
    console.warn("⚠️ Fields in paymentRequirements but NOT in original 402:", fieldsOnlyInPayment);
    console.warn("⚠️ These extra fields might cause the facilitator to reject the request!");
  }
  if (fieldsOnlyInOriginal.length === 0 && fieldsOnlyInPayment.length === 0) {
    console.log("✅ Field sets match exactly");
  }
  
  console.log("=== FIELD-BY-FIELD COMPARISON ===");
  const allKeys = new Set([...Object.keys(original402Accepts), ...Object.keys(paymentRequirements)]);
  allKeys.forEach(key => {
    const original = original402Accepts[key as keyof typeof original402Accepts];
    const current = paymentRequirements[key as keyof typeof paymentRequirements];
    const match = original === current;
    const matchSymbol = match ? "✅" : "❌";
    console.log(`${matchSymbol} ${key}:`);
    console.log(`   Original 402: "${original}" (type: ${typeof original})`);
    console.log(`   Current:      "${current}" (type: ${typeof current})`);
    if (!match) {
      console.log(`   ⚠️ MISMATCH DETECTED!`);
      if (typeof original === 'string' && typeof current === 'string') {
        // Show character-by-character differences for strings
        const maxLen = Math.max(original.length, current.length);
        for (let i = 0; i < maxLen; i++) {
          if (original[i] !== current[i]) {
            console.log(`   First difference at position ${i}:`);
            console.log(`     Original char ${i}: "${original[i]}" (code: ${original.charCodeAt(i)})`);
            console.log(`     Current char ${i}:  "${current[i]}" (code: ${current.charCodeAt(i)})`);
            break;
          }
        }
      }
    }
  });
  
  // DIAGNOSTIC: Exact JSON serialization comparison
  console.log("=== JSON SERIALIZATION COMPARISON ===");
  const originalJson = JSON.stringify(original402Accepts);
  const currentJson = JSON.stringify(paymentRequirements);
  console.log("Original 402 JSON:", originalJson);
  console.log("Current JSON:     ", currentJson);
  console.log("Are they equal?", originalJson === currentJson);
  
  // Detailed JSON comparison
  if (originalJson !== currentJson) {
    console.log("=== JSON DIFF DETAILED ANALYSIS ===");
    
    // Compare lengths
    console.log("JSON length comparison:");
    console.log("  Original 402:", originalJson.length, "characters");
    console.log("  Current:     ", currentJson.length, "characters");
    console.log("  Difference: ", Math.abs(originalJson.length - currentJson.length), "characters");
    
    // Find first difference
    const minLen = Math.min(originalJson.length, currentJson.length);
    let firstDiffIndex = -1;
    for (let i = 0; i < minLen; i++) {
      if (originalJson[i] !== currentJson[i]) {
        firstDiffIndex = i;
        break;
      }
    }
    
    if (firstDiffIndex >= 0) {
      console.log(`First difference at position ${firstDiffIndex}:`);
      const contextStart = Math.max(0, firstDiffIndex - 30);
      const contextEnd = Math.min(originalJson.length, firstDiffIndex + 30);
      console.log("  Original context:", originalJson.substring(contextStart, contextEnd));
      console.log("                   ", " ".repeat(firstDiffIndex - contextStart) + "^");
      console.log("  Current context: ", currentJson.substring(contextStart, contextEnd));
      console.log("                   ", " ".repeat(firstDiffIndex - contextStart) + "^");
    }
    
    // Check key ordering
    const originalKeys = Object.keys(original402Accepts);
    const currentKeys = Object.keys(paymentRequirements);
    const keyOrderMatch = JSON.stringify(originalKeys) === JSON.stringify(currentKeys);
    console.log("Key order match:", keyOrderMatch ? "✅" : "❌");
    if (!keyOrderMatch) {
      console.log("  Original key order:", originalKeys.join(", "));
      console.log("  Current key order: ", currentKeys.join(", "));
      console.log("  ⚠️ Key order matters for signature verification!");
    }
    
    // Compare with sorted keys (to ignore ordering)
    const sortedOriginal = JSON.stringify(original402Accepts, Object.keys(original402Accepts).sort());
    const sortedCurrent = JSON.stringify(paymentRequirements, Object.keys(paymentRequirements).sort());
    const sortedMatch = sortedOriginal === sortedCurrent;
    console.log("Content match (ignoring key order):", sortedMatch ? "✅" : "❌");
    if (!sortedMatch) {
      console.log("  ⚠️ Even ignoring key order, content differs!");
    }
  } else {
    console.log("✅ JSON strings match exactly (including key order)");
  }
  
  // Also compare the exact JSON that will be sent to facilitator
  const facilitatorJson = JSON.stringify(paymentRequirements);
  console.log("=== FACILITATOR REQUEST JSON ===");
  console.log("JSON that will be sent:", facilitatorJson);
  console.log("JSON length:", facilitatorJson.length, "characters");
  
  // Check for any whitespace or formatting issues
  const normalizedOriginal = JSON.stringify(JSON.parse(originalJson));
  const normalizedCurrent = JSON.stringify(JSON.parse(currentJson));
  const normalizedMatch = normalizedOriginal === normalizedCurrent;
  console.log("Normalized JSON match (after parse/stringify):", normalizedMatch ? "✅" : "❌");
  
  // Check key order - this matters for signature verification!
  console.log("=== KEY ORDER COMPARISON ===");
  const originalKeys = Object.keys(original402Accepts);
  const currentKeys = Object.keys(paymentRequirements);
  console.log("Original 402 key order:", originalKeys.join(" -> "));
  console.log("Current key order:     ", currentKeys.join(" -> "));
  console.log("Key order matches?", JSON.stringify(originalKeys) === JSON.stringify(currentKeys));
  
  if (JSON.stringify(originalKeys) !== JSON.stringify(currentKeys)) {
    console.warn("⚠️ KEY ORDER MISMATCH!");
    console.warn("⚠️ The order of keys in the JSON object matters for signature verification!");
    console.warn("⚠️ The client signed based on the original 402 response key order.");
    console.warn("⚠️ If the order differs, the facilitator's signature verification will fail.");
    
    // Show which keys are in different positions
    originalKeys.forEach((key, index) => {
      const currentIndex = currentKeys.indexOf(key);
      if (currentIndex !== index) {
        console.warn(`  Key "${key}": original position ${index}, current position ${currentIndex}`);
      }
    });
  }
  
  if (originalJson !== currentJson) {
    console.log("=== JSON DIFF ANALYSIS ===");
    // Find first difference
    const minLen = Math.min(originalJson.length, currentJson.length);
    for (let i = 0; i < minLen; i++) {
      if (originalJson[i] !== currentJson[i]) {
        console.log(`First JSON difference at position ${i}:`);
        console.log(`  Original: "${originalJson.substring(Math.max(0, i-20), i+20)}"`);
        console.log(`            ${' '.repeat(Math.max(0, 20-i))}^`);
        console.log(`  Current:  "${currentJson.substring(Math.max(0, i-20), i+20)}"`);
        console.log(`            ${' '.repeat(Math.max(0, 20-i))}^`);
        break;
      }
    }
  }
  
  console.log("=== SUMMARY ===");
  console.log("Original 402 accepts[0]:", JSON.stringify(original402Accepts, null, 2));
  console.log("Payment requirements being sent:", JSON.stringify(paymentRequirements, null, 2));

  // The paymentPayload structure must match what the client sent
  // Preserve the original x402Version format from the header
  const paymentPayload = {
    x402Version: typeof paymentHeaderData.x402Version === 'string' 
      ? parseInt(paymentHeaderData.x402Version) 
      : paymentHeaderData.x402Version || 1,
    scheme: paymentHeaderData.scheme,
    network: paymentHeaderData.network,
    payload: paymentHeaderData.payload,
  };

  console.log("=== VERIFICATION REQUEST DETAILS ===");
  
  // Some facilitators require a stripped-down paymentRequirements for verify/settle calls
  // that omits resource, description, and mimeType for privacy
  // Let's try both versions to see which one works
  const strippedPaymentRequirements = {
    scheme: paymentRequirements.scheme,
    network: paymentRequirements.network,
    payTo: paymentRequirements.payTo,
    maxAmountRequired: paymentRequirements.maxAmountRequired,
    maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds,
    asset: paymentRequirements.asset,
  };
  
  console.log("=== PAYMENT REQUIREMENTS VERSIONS ===");
  console.log("Full paymentRequirements (with resource, description, mimeType):");
  console.log(JSON.stringify(paymentRequirements, null, 2));
  console.log("Stripped paymentRequirements (privacy-enhanced, without resource/description/mimeType):");
  console.log(JSON.stringify(strippedPaymentRequirements, null, 2));
  
  // Try with full paymentRequirements first (as we've been doing)
  // If this fails, we can try the stripped version
  const verificationRequestBody = {
    x402Version: 1,
    paymentPayload,
    paymentRequirements, // Using full version
  };
  console.log("Full request body being sent to facilitator:", JSON.stringify(verificationRequestBody, null, 2));
  console.log("Request body size:", JSON.stringify(verificationRequestBody).length, "bytes");
  
  console.log("=== PAYMENT REQUIREMENTS BREAKDOWN ===");
  console.log("scheme:", paymentRequirements.scheme, "(expected: 'exact')");
  console.log("network:", paymentRequirements.network, "(expected: 'base-sepolia')");
  console.log("resource:", paymentRequirements.resource);
  console.log("description:", paymentRequirements.description);
  console.log("mimeType:", paymentRequirements.mimeType);
  console.log("payTo:", paymentRequirements.payTo);
  console.log("maxAmountRequired:", paymentRequirements.maxAmountRequired, "(type:", typeof paymentRequirements.maxAmountRequired, ")");
  console.log("maxTimeoutSeconds:", paymentRequirements.maxTimeoutSeconds, "(type:", typeof paymentRequirements.maxTimeoutSeconds, ")");
  console.log("asset:", paymentRequirements.asset);
  
  // Check for missing or extra fields
  console.log("=== FIELD COUNT CHECK ===");
  const allFields = Object.keys(paymentRequirements);
  console.log("Total fields in paymentRequirements:", allFields.length);
  console.log("Fields present:", allFields.join(", "));
  
  // Expected fields for exact scheme (based on x402 spec)
  const expectedFields = [
    "scheme",
    "network", 
    "resource",
    "description",
    "mimeType",
    "payTo",
    "maxAmountRequired",
    "maxTimeoutSeconds",
    "asset"
  ];
  
  // Optional fields that might be expected
  const optionalFields = ["outputSchema", "extra"];
  
  const missingFields = expectedFields.filter(field => !(field in paymentRequirements));
  const extraFields = allFields.filter(field => !expectedFields.includes(field) && !optionalFields.includes(field));
  const presentOptionalFields = optionalFields.filter(field => field in paymentRequirements);
  
  if (missingFields.length > 0) {
    console.error("❌ MISSING REQUIRED FIELDS:", missingFields);
  } else {
    console.log("✅ All required fields present");
  }
  
  if (extraFields.length > 0) {
    console.warn("⚠️ EXTRA FIELDS (not in spec):", extraFields);
    console.warn("⚠️ These extra fields might cause the facilitator to reject the request");
  } else {
    console.log("✅ No extra fields");
  }
  
  if (presentOptionalFields.length > 0) {
    console.log("ℹ️ Optional fields present:", presentOptionalFields);
  } else {
    console.log("ℹ️ No optional fields (outputSchema, extra)");
  }
  
  console.log("=== PAYMENT PAYLOAD BREAKDOWN ===");
  console.log("Original x402Version from header:", paymentHeaderData.x402Version, "(type:", typeof paymentHeaderData.x402Version, ")");
  console.log("Converted x402Version in payload:", paymentPayload.x402Version, "(type:", typeof paymentPayload.x402Version, ")");
  console.log("Top-level x402Version in request:", 1, "(type: number)");
  console.log("scheme:", paymentPayload.scheme, "(type:", typeof paymentPayload.scheme, ")");
  console.log("network:", paymentPayload.network, "(type:", typeof paymentPayload.network, ")");
  console.log("payload.authorization.from:", paymentPayload.payload?.authorization?.from);
  console.log("payload.authorization.to:", paymentPayload.payload?.authorization?.to);
  console.log("payload.authorization.value:", paymentPayload.payload?.authorization?.value);
  console.log("payload.authorization.nonce:", paymentPayload.payload?.authorization?.nonce);
  console.log("Full paymentPayload:", JSON.stringify(paymentPayload, null, 2));
  
  // Check if resource URL is localhost
  if (paymentRequirements.resource?.includes('localhost') || paymentRequirements.resource?.includes('127.0.0.1')) {
    console.warn("⚠️ NOTE: Resource URL is localhost");
    console.warn("⚠️ For localhost to work with CDP facilitator, you may need to:");
    console.warn("   1. Add localhost to allowed domains in CDP Portal (e.g., http://localhost:3000)");
    console.warn("   2. Ensure the resource URL matches exactly what was in the 402 response");
    console.warn("⚠️ For production, use a publicly accessible domain (Vercel, Netlify, etc.)");
    console.warn("⚠️ For testing without CDP Portal config, use a tunneling service (ngrok, Cloudflare Tunnel, etc.)");
  }
  
  console.log("=== ADDITIONAL CONTEXT ===");
  console.log("Original 402 response payTo:", originalPayTo);
  console.log("Authorization to (what client signed for):", auth?.to);
  console.log("Using payTo in requirements:", paymentRequirements.payTo);
  console.log("Resource URL:", resourceUrl);
  if (cachedRequirements) {
    console.log("Cached resource URL:", cachedRequirements.requirements.resource);
    if (cachedRequirements.requirements.resource !== resourceUrl) {
      console.warn("⚠️ Resource URL mismatch detected!");
    }
  }
  console.log("MaxAmountRequired:", maxAmountRequired, "(type:", typeof maxAmountRequired, ")");
  console.log("PaymentRequirements.maxAmountRequired:", paymentRequirements.maxAmountRequired, "(type:", typeof paymentRequirements.maxAmountRequired, ")");
  console.log("PaymentRequirements.maxTimeoutSeconds:", paymentRequirements.maxTimeoutSeconds, "(type:", typeof paymentRequirements.maxTimeoutSeconds, ")");
  console.log("Authorization value:", auth?.value, "(type:", typeof auth?.value, ")");
  console.log("Item ID:", itemId);
  console.log("Description:", `Purchase ${itemId}`);
  
  // DIAGNOSTIC: Detailed field-by-field comparison table
  console.log("=== DETAILED FIELD-BY-FIELD COMPARISON TABLE ===");
  const comparisonTable: Array<{
    field: string;
    paymentRequirements: unknown;
    authorization: unknown;
    original402: unknown;
    types: { pr: string; auth: string; orig: string };
    matches: { prVsAuth: boolean | null; prVsOrig: boolean };
    notes: string;
  }> = [];
  
  // Compare each field
  const fieldsToCompare = [
    { key: 'payTo', authKey: 'to', source: 'authorization' },
    { key: 'maxAmountRequired', authKey: 'value', source: 'authorization' },
    { key: 'scheme', authKey: null, source: 'header' },
    { key: 'network', authKey: null, source: 'header' },
    { key: 'resource', authKey: null, source: 'context' },
    { key: 'description', authKey: null, source: 'context' },
    { key: 'mimeType', authKey: null, source: 'context' },
    { key: 'maxTimeoutSeconds', authKey: null, source: 'context' },
    { key: 'asset', authKey: null, source: 'context' },
  ];
  
  fieldsToCompare.forEach(({ key, authKey, source }) => {
    const prValue = paymentRequirements[key as keyof typeof paymentRequirements];
    const authValue = authKey ? auth?.[authKey as keyof typeof auth] : null;
    const origValue = original402Accepts[key as keyof typeof original402Accepts];
    
    const comparison = {
      field: key,
      paymentRequirements: prValue,
      authorization: authValue,
      original402: origValue,
      types: {
        pr: typeof prValue,
        auth: typeof authValue,
        orig: typeof origValue,
      },
      matches: {
        prVsAuth: authValue !== null ? String(prValue).toLowerCase() === String(authValue).toLowerCase() : null,
        prVsOrig: String(prValue) === String(origValue),
      },
      notes: source === 'authorization' 
        ? (authValue !== null && String(prValue).toLowerCase() !== String(authValue).toLowerCase() 
          ? '⚠️ MISMATCH: paymentRequirements should match authorization' 
          : '✅ Match')
        : (String(prValue) === String(origValue) ? '✅ Match' : '⚠️ May differ from original 402'),
    };
    
    comparisonTable.push(comparison);
    
    // Log each field
    console.log(`\n${key}:`);
    console.log(`  paymentRequirements: ${JSON.stringify(prValue)} (${typeof prValue})`);
    if (authValue !== null) {
      console.log(`  authorization.${authKey}: ${JSON.stringify(authValue)} (${typeof authValue})`);
      console.log(`  Match with auth: ${comparison.matches.prVsAuth ? '✅' : '❌'}`);
    }
    console.log(`  original402: ${JSON.stringify(origValue)} (${typeof origValue})`);
    console.log(`  Match with orig: ${comparison.matches.prVsOrig ? '✅' : '❌'}`);
    console.log(`  Notes: ${comparison.notes}`);
  });
  
  // Summary
  console.log("\n=== COMPARISON SUMMARY ===");
  const criticalMismatches = comparisonTable.filter(c => {
    const prVsAuth = c.matches.prVsAuth;
    const hasAuthMismatch = prVsAuth === false;
    const isPayToWithIssue = c.field === 'payTo' && (prVsAuth === false || prVsAuth === null);
    return hasAuthMismatch || isPayToWithIssue;
  });
  if (criticalMismatches.length > 0) {
    console.error("❌ CRITICAL MISMATCHES DETECTED:");
    criticalMismatches.forEach(m => {
      console.error(`  ${m.field}: paymentRequirements (${m.paymentRequirements}) != authorization (${m.authorization})`);
    });
  } else {
    console.log("✅ No critical mismatches detected in field comparison");
  }
  
  // Check if payTo matches authorization.to (should match now after our fix)
  if (paymentRequirements.payTo.toLowerCase() !== auth?.to?.toLowerCase()) {
    console.warn("⚠️ WARNING: payTo in requirements doesn't match authorization.to!");
    console.warn("⚠️ This will cause signature verification to fail.");
    console.warn("⚠️ payTo in requirements:", paymentRequirements.payTo);
    console.warn("⚠️ authorization.to:", auth?.to);
  } else {
    console.log("✅ payTo matches authorization.to");
  }
  
  // DIAGNOSTIC: Network validation - ensure base-sepolia is used consistently
  console.log("=== NETWORK VALIDATION ===");
  const expectedNetwork = "base-sepolia";
  const networkChecks = {
    paymentRequirements: paymentRequirements.network,
    paymentPayload: paymentPayload.network,
    paymentHeaderData: paymentHeaderData.network,
    expected: expectedNetwork,
  };
  
  console.log("Network values across all objects:");
  console.log("  paymentRequirements.network:", networkChecks.paymentRequirements, "(type:", typeof networkChecks.paymentRequirements, ")");
  console.log("  paymentPayload.network:", networkChecks.paymentPayload, "(type:", typeof networkChecks.paymentPayload, ")");
  console.log("  paymentHeaderData.network:", networkChecks.paymentHeaderData, "(type:", typeof networkChecks.paymentHeaderData, ")");
  console.log("  Expected:", networkChecks.expected);
  
  const networkMatches = {
    prVsExpected: String(paymentRequirements.network) === expectedNetwork,
    payloadVsExpected: String(paymentPayload.network) === expectedNetwork,
    headerVsExpected: String(paymentHeaderData.network) === expectedNetwork,
    prVsPayload: String(paymentRequirements.network) === String(paymentPayload.network),
    prVsHeader: String(paymentRequirements.network) === String(paymentHeaderData.network),
  };
  
  console.log("Network consistency checks:");
  console.log("  paymentRequirements matches expected:", networkMatches.prVsExpected ? "✅" : "❌");
  console.log("  paymentPayload matches expected:", networkMatches.payloadVsExpected ? "✅" : "❌");
  console.log("  paymentHeaderData matches expected:", networkMatches.headerVsExpected ? "✅" : "❌");
  console.log("  paymentRequirements matches paymentPayload:", networkMatches.prVsPayload ? "✅" : "❌");
  console.log("  paymentRequirements matches paymentHeaderData:", networkMatches.prVsHeader ? "✅" : "❌");
  
  if (!networkMatches.prVsExpected) {
    console.error(`❌ CRITICAL: paymentRequirements.network is "${paymentRequirements.network}" but expected "${expectedNetwork}"`);
  }
  if (!networkMatches.payloadVsExpected) {
    console.error(`❌ CRITICAL: paymentPayload.network is "${paymentPayload.network}" but expected "${expectedNetwork}"`);
  }
  if (!networkMatches.prVsPayload) {
    console.error(`❌ CRITICAL: Network mismatch between paymentRequirements (${paymentRequirements.network}) and paymentPayload (${paymentPayload.network})`);
  }
  
  // Check if scheme/network match expected values
  if (paymentRequirements.scheme !== "exact") {
    console.warn(`⚠️ WARNING: scheme is "${paymentRequirements.scheme}" but expected "exact"`);
  }
  if (paymentRequirements.network !== "base-sepolia") {
    console.warn(`⚠️ WARNING: network is "${paymentRequirements.network}" but expected "base-sepolia"`);
  }
  
  // DIAGNOSTIC: Final pre-send validation check
  console.log("=== PRE-SEND VALIDATION CHECK ===");
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  
  // Critical validations
  if (!paymentRequirements.payTo) {
    validationErrors.push("payTo is missing in paymentRequirements");
  }
  if (!auth?.to) {
    validationErrors.push("authorization.to is missing");
  }
  if (paymentRequirements.payTo && auth?.to && paymentRequirements.payTo.toLowerCase() !== auth.to.toLowerCase()) {
    validationErrors.push(`payTo mismatch: paymentRequirements.payTo (${paymentRequirements.payTo}) != authorization.to (${auth.to})`);
  }
  if (paymentRequirements.network !== "base-sepolia") {
    validationErrors.push(`Network must be "base-sepolia", got "${paymentRequirements.network}"`);
  }
  if (paymentPayload.network !== "base-sepolia") {
    validationErrors.push(`paymentPayload.network must be "base-sepolia", got "${paymentPayload.network}"`);
  }
  if (paymentRequirements.network !== paymentPayload.network) {
    validationErrors.push(`Network mismatch: paymentRequirements.network (${paymentRequirements.network}) != paymentPayload.network (${paymentPayload.network})`);
  }
  if (paymentRequirements.scheme !== "exact") {
    validationErrors.push(`Scheme must be "exact", got "${paymentRequirements.scheme}"`);
  }
  if (typeof paymentRequirements.maxAmountRequired !== "string") {
    validationErrors.push(`maxAmountRequired must be string, got ${typeof paymentRequirements.maxAmountRequired}`);
  }
  if (typeof paymentRequirements.maxTimeoutSeconds !== "number") {
    validationErrors.push(`maxTimeoutSeconds must be number, got ${typeof paymentRequirements.maxTimeoutSeconds}`);
  }
  if (!paymentRequirements.resource) {
    validationErrors.push("resource is missing in paymentRequirements");
  }
  if (!paymentRequirements.asset) {
    validationErrors.push("asset is missing in paymentRequirements");
  }
  
  // Warnings
  if (paymentRequirements.resource?.includes('localhost') || paymentRequirements.resource?.includes('127.0.0.1')) {
    validationWarnings.push("Resource URL is localhost - ensure it's configured in CDP Portal");
  }
  if (String(paymentRequirements.maxAmountRequired) !== String(auth?.value)) {
    validationWarnings.push(`maxAmountRequired (${paymentRequirements.maxAmountRequired}) doesn't match authorization.value (${auth?.value})`);
  }
  
  // Report validation results
  if (validationErrors.length > 0) {
    console.error("❌ VALIDATION ERRORS (will cause verification to fail):");
    validationErrors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`);
    });
  } else {
    console.log("✅ No critical validation errors");
  }
  
  if (validationWarnings.length > 0) {
    console.warn("⚠️ VALIDATION WARNINGS:");
    validationWarnings.forEach((warning, index) => {
      console.warn(`  ${index + 1}. ${warning}`);
    });
  } else {
    console.log("✅ No validation warnings");
  }
  
  // Summary
  console.log("=== VALIDATION SUMMARY ===");
  console.log("Errors:", validationErrors.length);
  console.log("Warnings:", validationWarnings.length);
  if (validationErrors.length === 0 && validationWarnings.length === 0) {
    console.log("✅ All validations passed - ready to send to facilitator");
  } else if (validationErrors.length > 0) {
    console.error("❌ Validation failed - request will likely be rejected by facilitator");
  } else {
    console.warn("⚠️ Validation passed with warnings");
  }
  
  console.log("=== SENDING VERIFICATION REQUEST ===");
  console.log("Verifying payment with facilitator...");
  console.log("⚠️ NOTE: Using CDP facilitator at:", TESTNET_FACILITATOR_URL);
  console.log("⚠️ NOTE: If using localhost, ensure it's configured in CDP Portal or use a public domain.");
  console.log("⚠️ NOTE: The facilitator extracts requirements from the signature and compares them.");
  console.log("⚠️ NOTE: Any mismatch between signed requirements and paymentRequirements will fail.");
  // Try v2 endpoint first, fall back to v1 if it doesn't exist
  const verifyPath = "/platform/v2/x402/verify";
  const verifyUrl = `${TESTNET_FACILITATOR_URL}/v2/x402/verify`;
  console.log("Verifying at:", verifyUrl);
  console.log("Request method: POST");
  console.log("Request path for JWT:", verifyPath);
  
  // Generate JWT token for authentication
  // Note: requestPath for JWT should include /platform prefix
  const verifyJwt = await generateCDPJWT(apiKeyId, apiKeySecret, verifyPath);
  console.log("JWT token generated (length:", verifyJwt.length, "chars)");
  console.log("JWT token (first 50 chars):", verifyJwt.substring(0, 50) + "...");
  
  // Try with full paymentRequirements first
  const requestBody = {
    x402Version: 1,
    paymentPayload,
    paymentRequirements,
  };
  const requestBodyJson = JSON.stringify(requestBody);
  console.log("Request body JSON (length:", requestBodyJson.length, "chars):");
  console.log(requestBodyJson);
  
  console.log("Making fetch request with FULL paymentRequirements...");
  let verifyResponse = await fetch(verifyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${verifyJwt}`,
    },
    body: requestBodyJson,
  });

  console.log("=== VERIFICATION RESPONSE ===");
  console.log("Response status:", verifyResponse.status, verifyResponse.statusText);
  console.log("Response ok:", verifyResponse.ok);
  console.log("Response headers:", Object.fromEntries(verifyResponse.headers.entries()));
  
  let verifyData: FacilitatorVerifyResponse | null = null;
  const responseText = await verifyResponse.text();
  console.log("Response body length:", responseText.length, "chars");
  console.log("Response body (first 500 chars):", responseText.substring(0, 500));
  if (responseText.length > 500) {
    console.log("Response body (last 200 chars):", responseText.substring(responseText.length - 200));
  }
  
  if (!responseText || responseText.trim() === '' || verifyResponse.status === 404 || verifyResponse.status === 401) {
    if (verifyResponse.status === 401) {
      console.error("⚠️ 401 Unauthorized from facilitator. This may indicate an authentication issue.");
    } else {
      console.error("⚠️ Empty response or 404 from facilitator. Trying v1 endpoint...");
    }
    // Try the v1 endpoint as fallback
    const verifyPathV1 = "/platform/verify";
    const verifyJwtV1 = await generateCDPJWT(apiKeyId, apiKeySecret, verifyPathV1);
    verifyResponse = await fetch(`${TESTNET_FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${verifyJwtV1}`,
      },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload,
        paymentRequirements,
      }),
    });
    
    const responseTextV1 = await verifyResponse.text();
    console.log("V1 verify response status:", verifyResponse.status);
    console.log("V1 verify response body (first 500 chars):", responseTextV1.substring(0, 500));
    
    if (!responseTextV1 || responseTextV1.trim() === '') {
      throw new Error("Facilitator returned empty response for both v2 and v1 endpoints");
    }
    
    // Check if response is JSON or plain text error
    if (responseTextV1.trim().startsWith('{') || responseTextV1.trim().startsWith('[')) {
      verifyData = JSON.parse(responseTextV1) as FacilitatorVerifyResponse;
    } else {
      throw new Error(`Facilitator returned non-JSON response: ${responseTextV1.substring(0, 100)}`);
    }
    console.log("Verification result (from v1):", verifyData);
  } else {
    // Check if response is JSON or plain text error
    if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
      verifyData = JSON.parse(responseText) as FacilitatorVerifyResponse;
    } else {
      throw new Error(`Facilitator returned non-JSON response: ${responseText.substring(0, 100)}`);
    }
    console.log("Verification result (from v2):", verifyData);
  }

  // DIAGNOSTIC: Enhanced facilitator response analysis
  // Ensure verifyData is not null before proceeding
  if (!verifyData) {
    console.error("❌ CRITICAL: Facilitator returned null or undefined response data");
    console.error("Response text was:", responseText);
    throw new Error("Facilitator returned null or undefined response data");
  }
  
  // TypeScript now knows verifyData is not null
  const verifyResult: FacilitatorVerifyResponse = verifyData;
  
  console.log("=== VERIFICATION RESULT ANALYSIS ===");
  console.log("Response ok:", verifyResponse.ok);
  console.log("Response status:", verifyResponse.status, verifyResponse.statusText);
  console.log("verifyData.isValid:", verifyResult.isValid);
  console.log("verifyData.invalidReason:", verifyResult.invalidReason);
  console.log("verifyData.payer:", verifyResult.payer);
  
  // Extract ALL fields from the response - the facilitator might include additional diagnostic info
  console.log("=== COMPLETE FACILITATOR RESPONSE ===");
  console.log("All fields in verifyData response:");
  Object.keys(verifyResult).forEach(key => {
    const value = verifyResult[key as keyof typeof verifyResult];
    console.log(`  ${key}:`, typeof value === 'object' ? JSON.stringify(value, null, 2) : value, `(type: ${typeof value})`);
  });
  console.log("Full verifyData JSON:", JSON.stringify(verifyResult, null, 2));
  
  // Check for nested error objects or additional diagnostic fields
  if (typeof verifyResult === 'object') {
    const allKeys = Object.keys(verifyResult);
    console.log("=== SEARCHING FOR ADDITIONAL ERROR DETAILS ===");
    console.log("Total fields in response:", allKeys.length);
    console.log("Fields found:", allKeys.join(", "));
    
    // Look for common error detail field names
    const errorDetailFields = [
      'error', 'errorMessage', 'errorDetails', 'errorInfo', 'details', 
      'message', 'reason', 'description', 'hint', 'suggestion',
      'expected', 'actual', 'mismatch', 'field', 'fields',
      'extracted', 'requirements', 'signature', 'payload'
    ];
    
    errorDetailFields.forEach(fieldName => {
      if (fieldName in verifyResult) {
        const value = verifyResult[fieldName as keyof typeof verifyResult];
        console.log(`✅ Found additional field "${fieldName}":`, JSON.stringify(value, null, 2));
      }
    });
    
    // Check if there are any nested objects that might contain details
    allKeys.forEach(key => {
      const value = verifyResult[key as keyof typeof verifyResult];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        console.log(`  Nested object "${key}" contains:`, Object.keys(value).join(", "));
        if (Object.keys(value).length > 0) {
          console.log(`  Full "${key}" object:`, JSON.stringify(value, null, 2));
        }
      }
    });
  }
  
  // Analyze the response for diagnostic information
  console.log("=== FACILITATOR RESPONSE DIAGNOSTICS ===");
  
  // The facilitator might provide hints in the response
  if (verifyResult.invalidReason) {
      console.log("Invalid reason:", verifyResult.invalidReason);
      
      // Try to infer what the facilitator might have extracted
      console.log("=== INFERRED FACILITATOR EXTRACTION ===");
      console.log("The facilitator extracts requirements from the signature.");
      console.log("Based on the authorization in the signature, facilitator likely extracted:");
      console.log("  payTo:", auth?.to, "(from authorization.to)");
      console.log("  value:", auth?.value, "(from authorization.value)");
      console.log("  from:", auth?.from, "(from authorization.from)");
      console.log("  network:", paymentPayload.network, "(from paymentPayload.network)");
      console.log("  scheme:", paymentPayload.scheme, "(from paymentPayload.scheme)");
      console.log("");
      console.log("What we sent in paymentRequirements:");
      console.log("  payTo:", paymentRequirements.payTo);
      console.log("  maxAmountRequired:", paymentRequirements.maxAmountRequired);
      console.log("  network:", paymentRequirements.network);
      console.log("  scheme:", paymentRequirements.scheme);
      console.log("  resource:", paymentRequirements.resource);
      console.log("  description:", paymentRequirements.description);
      console.log("  mimeType:", paymentRequirements.mimeType);
      console.log("  maxTimeoutSeconds:", paymentRequirements.maxTimeoutSeconds);
      console.log("  asset:", paymentRequirements.asset);
      
      // Compare what facilitator likely extracted vs what we sent
      console.log("");
      console.log("=== COMPARISON: FACILITATOR EXTRACTED vs WE SENT ===");
      const comparisons = [
        {
          field: "payTo",
          facilitatorExtracted: auth?.to,
          weSent: paymentRequirements.payTo,
          match: auth?.to?.toLowerCase() === paymentRequirements.payTo?.toLowerCase(),
        },
        {
          field: "value/maxAmountRequired",
          facilitatorExtracted: auth?.value,
          weSent: paymentRequirements.maxAmountRequired,
          match: String(auth?.value) === String(paymentRequirements.maxAmountRequired),
        },
        {
          field: "network",
          facilitatorExtracted: paymentPayload.network,
          weSent: paymentRequirements.network,
          match: String(paymentPayload.network) === String(paymentRequirements.network),
        },
        {
          field: "scheme",
          facilitatorExtracted: paymentPayload.scheme,
          weSent: paymentRequirements.scheme,
          match: String(paymentPayload.scheme) === String(paymentRequirements.scheme),
        },
      ];
      
      comparisons.forEach(comp => {
        const matchSymbol = comp.match ? "✅" : "❌";
        console.log(`${matchSymbol} ${comp.field}:`);
        console.log(`  Facilitator extracted: ${comp.facilitatorExtracted}`);
        console.log(`  We sent:              ${comp.weSent}`);
        if (!comp.match) {
          console.log(`  ⚠️ MISMATCH DETECTED!`);
        }
      });
    }
  
  // Check for any additional error details - be thorough
  const possibleErrorFields = [
    'errorMessage', 'errorLink', 'errorType', 'error', 'message',
    'details', 'hint', 'suggestion', 'expected', 'actual',
    'mismatch', 'field', 'fields', 'extracted', 'requirements'
  ];
  
  console.log("=== CHECKING FOR ADDITIONAL ERROR FIELDS ===");
  possibleErrorFields.forEach(field => {
    if (field in verifyResult && verifyResult[field as keyof typeof verifyResult]) {
      const value = verifyResult[field as keyof typeof verifyResult];
      console.log(`✅ Found "${field}":`, typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
    }
  });
  
  // Also check response headers for any diagnostic information
  console.log("=== CHECKING RESPONSE HEADERS FOR DIAGNOSTICS ===");
  const diagnosticHeaders = [
    'x-error-details', 'x-error-message', 'x-error-code', 'x-debug-info',
    'x-trace-id', 'x-request-id', 'x-facilitator-version'
  ];
  diagnosticHeaders.forEach(headerName => {
    const headerValue = verifyResponse.headers.get(headerName);
    if (headerValue) {
      console.log(`✅ Found diagnostic header "${headerName}":`, headerValue);
    }
  });
  
  // Log trace-id if available (useful for support)
  const traceId = verifyResponse.headers.get('trace-id');
  if (traceId) {
    console.log("Trace ID (for support):", traceId);
  }
  
  // If verification failed, provide actionable diagnostics
  if (!verifyResult.isValid) {
    console.log("");
    console.log("=== DIAGNOSTIC RECOMMENDATIONS ===");
    console.log("Since verification failed, check:");
    console.log("1. payTo in paymentRequirements must match authorization.to");
    console.log("2. All field values must match exactly what was in the 402 response");
    console.log("3. Network must be 'base-sepolia' (not 'base' or any variant)");
    console.log("4. Field types must match (maxAmountRequired: string, maxTimeoutSeconds: number)");
    console.log("5. Resource URL must match exactly (including protocol, host, port, path)");
    console.log("6. If using localhost, ensure it's configured in CDP Portal");
  }
  
  if (!verifyResponse.ok || !verifyResult.isValid) {
    console.error("=== PAYMENT VERIFICATION FAILED ===");
    console.error("Status:", verifyResponse.status);
    console.error("Status text:", verifyResponse.statusText);
    console.error("Invalid reason:", verifyResult.invalidReason);
    console.error("Payer:", verifyResult.payer);
    
    // Enhanced error logging - show ALL available information
    console.error("=== COMPLETE ERROR RESPONSE ===");
    console.error("Full error response object:", JSON.stringify(verifyResult, null, 2));
    console.error("Error response keys:", Object.keys(verifyResult).join(", "));
    
    // If we have a trace-id, include it for support
    const traceId = verifyResponse.headers.get('trace-id');
    if (traceId) {
      console.error("Trace ID (include this when reporting issue):", traceId);
    }
    
    // Try to provide a more actionable error message
    let actionableError = `Payment verification failed: ${verifyResult.invalidReason || 'Unknown reason'}`;
    if (verifyResult.invalidReason === 'invalid_payment_requirements') {
      actionableError += "\n\nThe facilitator extracted payment requirements from the signature and compared them to what we sent.";
      actionableError += "\nOne or more fields don't match. Common issues:";
      actionableError += "\n- Key order mismatch (must be canonical: scheme, network, maxAmountRequired, resource, description, mimeType, payTo, maxTimeoutSeconds, asset)";
      actionableError += "\n- Field value mismatch (payTo, maxAmountRequired, network, scheme, resource, etc.)";
      actionableError += "\n- Field type mismatch (maxAmountRequired must be string, maxTimeoutSeconds must be number)";
      actionableError += "\n- Localhost URL rejection (CDP facilitator may reject localhost URLs)";
      
      // Add specific diagnostic info
      if (paymentRequirements.payTo !== auth?.to) {
        actionableError += `\n\n⚠️ CRITICAL: payTo mismatch detected!`;
        actionableError += `\n  paymentRequirements.payTo: ${paymentRequirements.payTo}`;
        actionableError += `\n  authorization.to: ${auth?.to}`;
      }
      
      if (paymentRequirements.resource?.includes('localhost')) {
        actionableError += `\n\n⚠️ Localhost URL detected: ${paymentRequirements.resource}`;
        actionableError += `\n  Ensure localhost is configured in CDP Portal or use a public domain.`;
      }
    }
    
    console.error("=== ACTIONABLE ERROR MESSAGE ===");
    console.error(actionableError);
    
    // Log what we sent vs what might be expected
    console.error("=== WHAT WE SENT TO FACILITATOR ===");
    console.error("paymentRequirements:", JSON.stringify(paymentRequirements, null, 2));
    console.error("paymentPayload:", JSON.stringify(paymentPayload, null, 2));
    
    // Check if the error is due to undeployed smart wallet
    if (verifyResult.invalidReason === 'invalid_exact_evm_payload_undeployed_smart_wallet') {
      console.warn("⚠️ Smart wallet not deployed according to facilitator.");
      console.warn("⚠️ Wallet address:", auth?.from);
      console.warn("⚠️ The facilitator is the authoritative source for deployment status.");
      console.warn("⚠️ Even if the CDP dashboard shows the account, it must be deployed on-chain for x402 payments.");
      console.warn("⚠️ The wallet will auto-deploy on the first outgoing transaction.");
      console.warn("⚠️ User needs to make an outgoing transaction (e.g., send a small amount to themselves) to deploy the wallet.");
      console.warn("⚠️ After deployment, wait a few seconds for the transaction to be mined before retrying.");
      
      return res.status(402).json({
        x402Version: 1,
        error: "Smart wallet contract not deployed on-chain. The facilitator requires the wallet to be deployed before processing x402 payments. Please use the 'Deploy Wallet' page to deploy your wallet, then wait a few seconds and retry the purchase.",
        errorCode: "UNDEPLOYED_WALLET",
        walletAddress: auth?.from,
        accepts: [paymentRequirements],
      });
    }
    
    // Handle invalid_payment_requirements error specifically
    if (verifyResult.invalidReason === 'invalid_payment_requirements') {
      console.error("=== INVALID PAYMENT REQUIREMENTS ERROR ===");
      console.error("⚠️ The facilitator rejected the payment requirements.");
      console.error("⚠️ This means one or more fields in paymentRequirements don't match what the facilitator expects.");
      console.error("⚠️ The facilitator extracts requirements from the signature and compares them to paymentRequirements.");
      console.error("⚠️ Common causes:");
      console.error("   1. scheme/network mismatch (should be 'exact' and 'base-sepolia')");
      console.error("   2. resource URL mismatch (protocol, host, or path)");
      console.error("   3. payTo address mismatch");
      console.error("   4. maxAmountRequired format/type mismatch");
      console.error("   5. asset address mismatch");
      console.error("   6. description mismatch");
      console.error("   7. Missing or extra fields");
      console.error("   8. LOCALHOST URL: If using localhost, ensure it's configured in CDP Portal");
      console.error("      (add http://localhost:PORT to allowed domains) or use a public domain.");
      console.error("");
      
      // Check if resource URL is localhost
      if (paymentRequirements.resource?.includes('localhost') || paymentRequirements.resource?.includes('127.0.0.1')) {
        console.error("⚠️ NOTE: Resource URL is localhost");
        console.error("⚠️ The CDP facilitator may require localhost to be configured in the CDP Portal.");
        console.error("⚠️ If localhost is not configured, the facilitator may reject the request.");
        console.error("");
        console.error("📋 POSSIBLE SOLUTIONS:");
        console.error("   1. Add localhost to allowed domains in CDP Portal (e.g., http://localhost:3000)");
        console.error("   2. Deploy to a public domain (Vercel, Netlify, Railway, etc.)");
        console.error("   3. Use a tunneling service (ngrok, Cloudflare Tunnel, etc.) for testing");
        console.error("");
        console.error("🔗 Current resource URL: " + paymentRequirements.resource);
        console.error("⚠️ Most likely issue: payTo mismatch (we fixed this) or other field mismatches");
        console.error("⚠️ Check that payTo matches authorization.to and all other fields match exactly");
        console.error("");
      }
      
      // Some facilitators require a stripped-down paymentRequirements for verify calls
      // Try with stripped version (without resource, description, mimeType)
      console.log("=== TRYING STRIPPED PAYMENT REQUIREMENTS ===");
      console.log("Some facilitators require a privacy-enhanced version without resource/description/mimeType");
      const strippedPaymentRequirements = {
        scheme: paymentRequirements.scheme,
        network: paymentRequirements.network,
        payTo: paymentRequirements.payTo,
        maxAmountRequired: paymentRequirements.maxAmountRequired,
        maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds,
        asset: paymentRequirements.asset,
      };
      console.log("Stripped paymentRequirements:", JSON.stringify(strippedPaymentRequirements, null, 2));
      
      const strippedRequestBody = {
        x402Version: 1,
        paymentPayload,
        paymentRequirements: strippedPaymentRequirements,
      };
      
      console.log("Retrying verification with stripped paymentRequirements...");
      const strippedVerifyJwt = await generateCDPJWT(apiKeyId, apiKeySecret, verifyPath);
      const strippedVerifyResponse = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${strippedVerifyJwt}`,
        },
        body: JSON.stringify(strippedRequestBody),
      });
      
      const strippedResponseText = await strippedVerifyResponse.text();
      console.log("Stripped verify response status:", strippedVerifyResponse.status);
      console.log("Stripped verify response body:", strippedResponseText);
      
      let strippedSucceeded = false;
      if (strippedResponseText && strippedResponseText.trim().startsWith('{')) {
        const strippedVerifyData = JSON.parse(strippedResponseText);
        if (strippedVerifyResponse.ok && strippedVerifyData.isValid) {
          console.log("✅ SUCCESS with stripped paymentRequirements!");
          console.log("✅ The facilitator requires a privacy-enhanced version without resource/description/mimeType");
          // Update verifyResult with the successful stripped response for continued use
          const successfulVerifyResult: FacilitatorVerifyResponse = strippedVerifyData as FacilitatorVerifyResponse;
          // Update verifyResponse for continued use
          verifyResponse = strippedVerifyResponse;
          // Update verifyResult to the successful response
          Object.assign(verifyResult, successfulVerifyResult);
          strippedSucceeded = true;
          // Break out of error handling - verification succeeded
          // Note: In this case, verification succeeded, so we'll continue to settlement
        } else {
          console.error("❌ Stripped version also failed:", strippedVerifyData);
          console.error("=== DETAILED COMPARISON ===");
          console.error("What we sent (full paymentRequirements):");
          console.error(JSON.stringify(paymentRequirements, null, 2));
          console.error("What we sent (stripped paymentRequirements):");
          console.error(JSON.stringify(strippedPaymentRequirements, null, 2));
        }
      } else {
        console.error("=== DETAILED COMPARISON ===");
        console.error("What we sent (paymentRequirements):");
        console.error(JSON.stringify(paymentRequirements, null, 2));
      }
      
      // If stripped version succeeded, break out of error handling entirely
      if (strippedSucceeded) {
        // Verification succeeded with stripped version, skip all remaining error handling
        // The code will continue to settlement below (outside this if block)
      } else {
        // Stripped version also failed, continue with detailed error logging
        console.error("");
        console.error("What was in original 402 response:");
        console.error(JSON.stringify(original402Accepts, null, 2));
        console.error("");
        console.error("Field-by-field check:");
        Object.keys(original402Accepts).forEach(key => {
          const original = original402Accepts[key as keyof typeof original402Accepts];
          const sent = paymentRequirements[key as keyof typeof paymentRequirements];
          const match = original === sent;
          console.error(`  ${key}: ${match ? '✅' : '❌'} "${original}" vs "${sent}"`);
        });
        console.error("");
        console.error("Payment payload that was signed:");
        console.error(JSON.stringify(paymentPayload, null, 2));
        
        // Return error if both full and stripped versions failed
        // Provide detailed error information to help debug
        const isLocalhost = paymentRequirements.resource?.includes('localhost') || paymentRequirements.resource?.includes('127.0.0.1');
        const payToMatches = paymentRequirements.payTo.toLowerCase() === auth?.to?.toLowerCase();
        
        let errorMessage = "Payment verification failed. The payment requirements don't match what the facilitator extracted from the signature.";
        if (!payToMatches) {
          errorMessage += " CRITICAL: payTo in requirements doesn't match authorization.to - this has been fixed in the code.";
        }
        if (isLocalhost) {
          errorMessage += " NOTE: Using localhost - ensure it's configured in CDP Portal or use a public domain.";
        }
        errorMessage += " Check that all fields match exactly: payTo (must match authorization.to), resource URL, and field types.";
        
        return res.status(402).json({
          x402Version: 1,
          error: errorMessage,
          errorReason: verifyResult.invalidReason,
          debugInfo: {
            payToInRequirements: paymentRequirements.payTo,
            authorizationTo: auth?.to,
            payToMatches,
            resourceUrl: paymentRequirements.resource,
            isLocalhost,
            note: isLocalhost ? "If using localhost, ensure it's added to allowed domains in CDP Portal" : undefined,
          },
          accepts: [paymentRequirements],
        });
      }
      // If strippedSucceeded is true, we break out here and continue to settlement
    }
    
    // Handle signature errors specifically (only if still failed after stripped attempt)
    if (!verifyResponse.ok || !verifyResult.isValid && verifyResult.invalidReason === 'invalid_exact_evm_payload_signature') {
      console.error("⚠️ Payment signature is invalid.");
      console.error("⚠️ This usually means the paymentRequirements don't match what was signed.");
      console.error("⚠️ Payment Requirements sent:", JSON.stringify(paymentRequirements, null, 2));
      console.error("⚠️ Payment Payload:", JSON.stringify(paymentPayload, null, 2));
      console.error("⚠️ The client signed based on the original 402 response.");
      console.error("⚠️ Make sure paymentRequirements match exactly (resource URL, payTo, amounts, etc.)");
      
      return res.status(402).json({
        x402Version: 1,
        error: "Payment signature verification failed. The payment requirements may not match what was originally signed.",
        errorReason: verifyResult.invalidReason,
        accepts: [paymentRequirements],
      });
    }
    
    // If we get here and verification still failed, return generic error
    if (!verifyResponse.ok || !verifyResult.isValid) {
      return res.status(402).json({
        x402Version: 1,
        error: "Payment verification failed",
        errorReason: verifyResult.invalidReason,
        accepts: [paymentRequirements],
      });
    }
  }

  console.log("✅ Payment verified, processing purchase...");

  // Step 4: Do work (process purchase)
  // In a real app: update database, grant item, etc.

  // Step 5: Settle payment with facilitator
  console.log("Settling payment with facilitator...");
  // Try v2 endpoint first, fall back to v1 if it doesn't exist
  const settlePath = "/platform/v2/x402/settle";
  const settleUrl = `${TESTNET_FACILITATOR_URL}/v2/x402/settle`;
  console.log("Settling at:", settleUrl);
  
  // Generate JWT token for authentication
  // Note: requestPath for JWT should include /platform prefix
  const settleJwt = await generateCDPJWT(apiKeyId, apiKeySecret, settlePath);
  
  let settleResponse = await fetch(settleUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settleJwt}`,
    },
    body: JSON.stringify({
      x402Version: 1,
      paymentPayload,
      paymentRequirements,
    }),
  });

  console.log("Settle response status:", settleResponse.status);
  
  let settleData;
  const settleResponseText = await settleResponse.text();
  console.log("Settle response body (first 500 chars):", settleResponseText.substring(0, 500));
  
  if (!settleResponseText || settleResponseText.trim() === '' || settleResponse.status === 404 || settleResponse.status === 401) {
    if (settleResponse.status === 401) {
      console.error("⚠️ 401 Unauthorized from facilitator settle. This may indicate an authentication issue.");
    } else {
      console.error("⚠️ Empty response or 404 from facilitator settle. Trying v1 endpoint...");
    }
    // Try the v1 endpoint as fallback
    const settlePathV1 = "/platform/settle";
    const settleJwtV1 = await generateCDPJWT(apiKeyId, apiKeySecret, settlePathV1);
    settleResponse = await fetch(`${TESTNET_FACILITATOR_URL}/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settleJwtV1}`,
      },
      body: JSON.stringify({
        x402Version: 1,
        paymentPayload,
        paymentRequirements,
      }),
    });
    
    const settleResponseTextV1 = await settleResponse.text();
    console.log("V1 settle response status:", settleResponse.status);
    console.log("V1 settle response body (first 500 chars):", settleResponseTextV1.substring(0, 500));
    
    if (!settleResponseTextV1 || settleResponseTextV1.trim() === '') {
      throw new Error("Facilitator returned empty response for both v2 and v1 settle endpoints");
    }
    
    // Check if response is JSON or plain text error
    if (settleResponseTextV1.trim().startsWith('{') || settleResponseTextV1.trim().startsWith('[')) {
      settleData = JSON.parse(settleResponseTextV1);
    } else {
      throw new Error(`Facilitator returned non-JSON response: ${settleResponseTextV1.substring(0, 100)}`);
    }
    console.log("Settlement result (from v1):", settleData);
  } else {
    // Check if response is JSON or plain text error
    if (settleResponseText.trim().startsWith('{') || settleResponseText.trim().startsWith('[')) {
      settleData = JSON.parse(settleResponseText);
    } else {
      throw new Error(`Facilitator returned non-JSON response: ${settleResponseText.substring(0, 100)}`);
    }
    console.log("Settlement result (from v2):", settleData);
  }

  let transactionHash = null;
  if (settleResponse.ok && settleData.success) {
    transactionHash = settleData.transaction;
    console.log("✅ Payment settled, transaction:", transactionHash);
  } else {
    console.error("Payment settlement failed:", settleData);
  }

  // Step 6: Return response with X-PAYMENT-RESPONSE header
  const paymentResponse = {
    success: true,
    transaction: transactionHash,
    network: settleData.network,
    payer: settleData.payer || auth?.from,
  };

  // Base64 encode the payment response (as middleware does)
  const encodedResponse = Buffer.from(JSON.stringify(paymentResponse)).toString('base64');
  res.setHeader('X-PAYMENT-RESPONSE', encodedResponse);

  res.status(200).json({
    success: true,
    itemId,
    message: "Item purchased successfully",
    purchaseDate: new Date().toISOString(),
    paymentInfo: {
      from: auth?.from,
      to: auth?.to,
      amount: auth?.value,
      txHash: transactionHash,
      settled: !!transactionHash,
    },
  });
}

