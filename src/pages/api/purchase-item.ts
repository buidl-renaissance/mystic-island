import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Generate JWT token for CDP API authentication
 * CDP requires JWT tokens signed with the API key secret
 */
async function generateCDPJWT(apiKeyId: string, apiKeySecret: string, requestPath: string): Promise<string> {
  try {
    // Dynamic import to avoid issues if package is not installed
    const { generateJwt } = await import("@coinbase/cdp-sdk/auth");
    
    const jwt = await generateJwt({
      apiKeyId,
      apiKeySecret,
      requestMethod: "POST",
      requestHost: "api.cdp.coinbase.com",
      requestPath,
      expiresIn: 120, // 2 minutes
    });
    
    return jwt;
  } catch (error) {
    console.error("Failed to import CDP SDK:", error);
    throw new Error(
      "CDP SDK not available. Please install @coinbase/cdp-sdk: yarn add @coinbase/cdp-sdk"
    );
  }
}

/**
 * Construct the resource URL for x402 payments
 * This must be consistent between the 402 response and verification
 * to ensure the facilitator can match the signed requirements
 */
function getResourceUrl(req: NextApiRequest): string {
  // In deployed environments, use x-forwarded-proto if available (set by Vercel, etc.)
  // Otherwise, check if localhost for http, default to https for production
  const protocol = req.headers['x-forwarded-proto'] || 
    (req.headers.host?.includes('localhost') ? 'http' : 'https');
  
  // Use the host header, which should be set correctly in both local and deployed environments
  const host = req.headers.host || 'localhost:3000';
  
  return `${protocol}://${host}/api/purchase-item`;
}

/**
 * Type for payment requirements in 402 response
 */
type PaymentRequirements = {
  scheme: "exact";
  network: "base-sepolia";
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxAmountRequired: string;
  maxTimeoutSeconds: number;
  asset: string;
};

/**
 * In-memory cache to store original 402 payment requirements
 * Keyed by a combination of resource URL and itemId to retrieve exact requirements
 * that were sent in the 402 response
 */
const original402Cache = new Map<string, { requirements: PaymentRequirements; timestamp: number }>();

/**
 * Generate a cache key from request details
 */
function getCacheKey(resourceUrl: string, itemId: string): string {
  return `${resourceUrl}:${itemId}`;
}

/**
 * Clean up old cache entries (older than 5 minutes)
 */
function cleanupCache(): void {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [key, value] of original402Cache.entries()) {
    if (value.timestamp < fiveMinutesAgo) {
      original402Cache.delete(key);
    }
  }
}

/**
 * API endpoint for purchasing game items
 * 
 * Following the x402 payment protocol sequence:
 * 1. Return 402 Payment Required if no payment header
 * 2. Verify payment with facilitator
 * 3. Do work (process purchase)
 * 4. Settle payment with facilitator
 * 5. Return response with X-PAYMENT-RESPONSE header
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

  console.log("=== API ROUTE HANDLER ===");
  console.log("Item ID:", itemId);
  console.log("Has X-PAYMENT header:", !!paymentHeader);

  // Step 1: If no payment header, return 402 Payment Required
  if (!paymentHeader) {
    const resourceUrl = getResourceUrl(req);
    const priceInUSDC = 0.01;
    const maxAmountRequired = Math.floor(priceInUSDC * 1_000_000).toString();
    
    const accepts = [
      {
        scheme: "exact" as const,
        network: "base-sepolia" as const,
        resource: resourceUrl,
        description: `Purchase ${itemId}`,
        mimeType: "application/json",
        payTo: process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006",
        maxAmountRequired,
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
      x402Version: "1.0",
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
  // The facilitator extracts payment requirements from the signature (which was based on the
  // original 402 response) and compares them to paymentRequirements. Any mismatch causes rejection.
  // We must use the EXACT same hardcoded values from the original 402 response, not client-provided values.
  const originalPayTo = process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006";
  
  console.log("=== PAYTO ADDRESS SELECTION ===");
  console.log("Authorization to (what client signed for):", auth?.to);
  console.log("Original payTo from env/default:", originalPayTo);
  console.log("Using payTo for requirements (original 402 value):", originalPayTo);

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
    paymentRequirements = { ...cachedRequirements.requirements };
    console.log("✅ Using cached original 402 requirements");
    console.log("Cached requirements:", JSON.stringify(paymentRequirements, null, 2));
  } else {
    console.warn("⚠️ No cached requirements found, reconstructing from current values");
    console.warn("⚠️ This may cause a mismatch if values differ from the original 402 response");
    // Fallback: reconstruct (should match original 402 exactly)
    paymentRequirements = {
      scheme: "exact", // Hardcoded to match original 402 response
      network: "base-sepolia", // Hardcoded to match original 402 response
      resource: resourceUrl, // Must match exactly what was in the 402 response
      description: `Purchase ${itemId}`, // Must match exactly what was in the 402 response
      mimeType: "application/json",
      payTo: originalPayTo, // Use original payTo from 402 response
      maxAmountRequired, // Must be a string matching the 402 response
      maxTimeoutSeconds: 300,
      asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    };
  }

  // Log comparison between original 402 and what we're sending
  console.log("=== ORIGINAL 402 vs PAYMENT REQUIREMENTS COMPARISON ===");
  const original402Accepts = {
    scheme: "exact",
    network: "base-sepolia",
    resource: resourceUrl,
    description: `Purchase ${itemId}`,
    mimeType: "application/json",
    payTo: originalPayTo,
    maxAmountRequired,
    maxTimeoutSeconds: 300,
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  };
  
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
  
  console.log("=== JSON STRING COMPARISON ===");
  const originalJson = JSON.stringify(original402Accepts);
  const currentJson = JSON.stringify(paymentRequirements);
  console.log("Original 402 JSON:", originalJson);
  console.log("Current JSON:     ", currentJson);
  console.log("Are they equal?", originalJson === currentJson);
  
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
    console.warn("⚠️ WARNING: Resource URL is localhost!");
    console.warn("⚠️ The facilitator might reject localhost URLs as invalid.");
    console.warn("⚠️ Consider using a publicly accessible URL for testing, or use the community facilitator.");
  }
  
  console.log("=== ADDITIONAL CONTEXT ===");
  console.log("Original 402 response payTo:", originalPayTo);
  console.log("Authorization to (what client signed for):", auth?.to);
  console.log("Using payTo in requirements (original 402 value):", originalPayTo);
  console.log("Resource URL:", resourceUrl);
  console.log("MaxAmountRequired:", maxAmountRequired, "(type:", typeof maxAmountRequired, ")");
  console.log("Authorization value:", auth?.value, "(type:", typeof auth?.value, ")");
  console.log("Item ID:", itemId);
  console.log("Description:", `Purchase ${itemId}`);
  
  // Check if payTo matches authorization.to
  if (originalPayTo.toLowerCase() !== auth?.to?.toLowerCase()) {
    console.warn("⚠️ WARNING: payTo in requirements doesn't match authorization.to!");
    console.warn("⚠️ This will cause signature verification to fail.");
    console.warn("⚠️ Consider using authorization.to for payTo in requirements.");
  }
  
  // Check if scheme/network match expected values
  if (paymentRequirements.scheme !== "exact") {
    console.warn(`⚠️ WARNING: scheme is "${paymentRequirements.scheme}" but expected "exact"`);
  }
  if (paymentRequirements.network !== "base-sepolia") {
    console.warn(`⚠️ WARNING: network is "${paymentRequirements.network}" but expected "base-sepolia"`);
  }
  
  console.log("=== SENDING VERIFICATION REQUEST ===");
  console.log("Verifying payment with facilitator...");
  console.log("⚠️ NOTE: Using CDP facilitator at:", TESTNET_FACILITATOR_URL);
  console.log("⚠️ NOTE: If using localhost, the facilitator might reject it.");
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
  
  let verifyData;
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
      verifyData = JSON.parse(responseTextV1);
    } else {
      throw new Error(`Facilitator returned non-JSON response: ${responseTextV1.substring(0, 100)}`);
    }
    console.log("Verification result (from v1):", verifyData);
  } else {
    // Check if response is JSON or plain text error
    if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
      verifyData = JSON.parse(responseText);
    } else {
      throw new Error(`Facilitator returned non-JSON response: ${responseText.substring(0, 100)}`);
    }
    console.log("Verification result (from v2):", verifyData);
  }

  console.log("=== VERIFICATION RESULT ANALYSIS ===");
  console.log("Response ok:", verifyResponse.ok);
  console.log("verifyData.isValid:", verifyData?.isValid);
  console.log("verifyData.invalidReason:", verifyData?.invalidReason);
  console.log("verifyData.payer:", verifyData?.payer);
  console.log("Full verifyData:", JSON.stringify(verifyData, null, 2));
  
  if (!verifyResponse.ok || !verifyData.isValid) {
    console.error("=== PAYMENT VERIFICATION FAILED ===");
    console.error("Status:", verifyResponse.status);
    console.error("Invalid reason:", verifyData.invalidReason);
    console.error("Payer:", verifyData.payer);
    console.error("Full error response:", JSON.stringify(verifyData, null, 2));
    
    // Log what we sent vs what might be expected
    console.error("=== WHAT WE SENT TO FACILITATOR ===");
    console.error("paymentRequirements:", JSON.stringify(paymentRequirements, null, 2));
    console.error("paymentPayload:", JSON.stringify(paymentPayload, null, 2));
    
    // Check if the error is due to undeployed smart wallet
    if (verifyData.invalidReason === 'invalid_exact_evm_payload_undeployed_smart_wallet') {
      console.warn("⚠️ Smart wallet not deployed according to facilitator.");
      console.warn("⚠️ Wallet address:", auth?.from);
      console.warn("⚠️ The facilitator is the authoritative source for deployment status.");
      console.warn("⚠️ Even if the CDP dashboard shows the account, it must be deployed on-chain for x402 payments.");
      console.warn("⚠️ The wallet will auto-deploy on the first outgoing transaction.");
      console.warn("⚠️ User needs to make an outgoing transaction (e.g., send a small amount to themselves) to deploy the wallet.");
      console.warn("⚠️ After deployment, wait a few seconds for the transaction to be mined before retrying.");
      
      return res.status(402).json({
        x402Version: "1.0",
        error: "Smart wallet contract not deployed on-chain. The facilitator requires the wallet to be deployed before processing x402 payments. Please use the 'Deploy Wallet' page to deploy your wallet, then wait a few seconds and retry the purchase.",
        errorCode: "UNDEPLOYED_WALLET",
        walletAddress: auth?.from,
        accepts: [paymentRequirements],
      });
    }
    
    // Handle invalid_payment_requirements error specifically
    if (verifyData.invalidReason === 'invalid_payment_requirements') {
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
      console.error("   8. LOCALHOST URL REJECTION: The CDP facilitator may reject localhost URLs");
      console.error("      even if all fields match. Try deploying to a public domain.");
      console.error("");
      
      // Check if resource URL is localhost
      if (paymentRequirements.resource?.includes('localhost') || paymentRequirements.resource?.includes('127.0.0.1')) {
        console.error("🚨 CRITICAL: Resource URL is localhost!");
        console.error("🚨 The CDP facilitator likely rejects localhost URLs for security reasons.");
        console.error("🚨 Even though all fields match exactly, the facilitator may reject localhost.");
        console.error("🚨 SOLUTION: Deploy to a public domain (e.g., Vercel, Netlify) and test again.");
        console.error("🚨 The resource URL must be publicly accessible: https://yourdomain.com/api/purchase-item");
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
          verifyData = strippedVerifyData;
          verifyResponse = strippedVerifyResponse;
          strippedSucceeded = true;
          // Break out of error handling - verification succeeded
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
        return res.status(402).json({
          x402Version: "1.0",
          error: "Payment verification failed. Both full and stripped paymentRequirements were rejected.",
          errorReason: verifyData.invalidReason,
          accepts: [paymentRequirements],
        });
      }
      // If strippedSucceeded is true, we break out here and continue to settlement
    }
    
    // Handle signature errors specifically (only if still failed after stripped attempt)
    if (!verifyResponse.ok || !verifyData.isValid && verifyData.invalidReason === 'invalid_exact_evm_payload_signature') {
      console.error("⚠️ Payment signature is invalid.");
      console.error("⚠️ This usually means the paymentRequirements don't match what was signed.");
      console.error("⚠️ Payment Requirements sent:", JSON.stringify(paymentRequirements, null, 2));
      console.error("⚠️ Payment Payload:", JSON.stringify(paymentPayload, null, 2));
      console.error("⚠️ The client signed based on the original 402 response.");
      console.error("⚠️ Make sure paymentRequirements match exactly (resource URL, payTo, amounts, etc.)");
      
      return res.status(402).json({
        x402Version: "1.0",
        error: "Payment signature verification failed. The payment requirements may not match what was originally signed.",
        errorReason: verifyData.invalidReason,
        accepts: [paymentRequirements],
      });
    }
    
    // If we get here and verification still failed, return generic error
    if (!verifyResponse.ok || !verifyData.isValid) {
      return res.status(402).json({
        x402Version: "1.0",
        error: "Payment verification failed",
        errorReason: verifyData.invalidReason,
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

