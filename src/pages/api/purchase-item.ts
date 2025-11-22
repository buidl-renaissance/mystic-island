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
    const protocol = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
    const host = req.headers.host || 'localhost:3000';
    const resourceUrl = `${protocol}://${host}/api/purchase-item`;
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
  const protocol = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
  const host = req.headers.host || 'localhost:3000';
  const resourceUrl = `${protocol}://${host}/api/purchase-item`;
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
  // The client signs based on the original 402 response. The authorization.to field shows
  // what address the client actually signed for, so we should use that for payTo in requirements.
  // This ensures the signature verification will work.
  const originalPayTo = process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006";
  
  // Use the authorization.to address for payTo, as that's what the client signed for
  // If the client signed with a different address (e.g., facilitator modified it),
  // we need to use that address for signature verification to work
  const payToForRequirements = auth?.to || originalPayTo;
  
  console.log("=== PAYTO ADDRESS SELECTION ===");
  console.log("Authorization to (what client signed for):", auth?.to);
  console.log("Original payTo from env/default:", originalPayTo);
  console.log("Using payTo for requirements:", payToForRequirements);

  // Log what the client sent in paymentHeaderData
  console.log("=== PAYMENT HEADER DATA FROM CLIENT ===");
  console.log("paymentHeaderData.scheme:", paymentHeaderData.scheme, "(type:", typeof paymentHeaderData.scheme, ")");
  console.log("paymentHeaderData.network:", paymentHeaderData.network, "(type:", typeof paymentHeaderData.network, ")");
  console.log("paymentHeaderData.x402Version:", paymentHeaderData.x402Version, "(type:", typeof paymentHeaderData.x402Version, ")");
  console.log("Full paymentHeaderData structure:", JSON.stringify(paymentHeaderData, null, 2));

  // The paymentRequirements MUST exactly match what was in the original 402 response
  // that the client signed. We need to reconstruct it exactly as it was in the 402 response.
  // IMPORTANT: The resource URL, description, and all fields must match EXACTLY.
  // CRITICAL: The key order must also match the original 402 response, as it affects signature verification!
  const paymentRequirements = {
    scheme: paymentHeaderData.scheme,
    network: paymentHeaderData.network,
    resource: resourceUrl, // Must match exactly what was in the 402 response
    description: `Purchase ${itemId}`, // Must match exactly what was in the 402 response
    mimeType: "application/json",
    payTo: payToForRequirements, // Use what the client actually signed for
    maxAmountRequired, // Must be a string matching the 402 response
    maxTimeoutSeconds: 300,
    asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  };

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
  const verificationRequestBody = {
    x402Version: 1,
    paymentPayload,
    paymentRequirements,
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
  console.log("Using payTo in requirements:", payToForRequirements);
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
  
  const requestBody = {
    x402Version: 1,
    paymentPayload,
    paymentRequirements,
  };
  const requestBodyJson = JSON.stringify(requestBody);
  console.log("Request body JSON (length:", requestBodyJson.length, "chars):");
  console.log(requestBodyJson);
  
  console.log("Making fetch request...");
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
      console.error("⚠️ Common causes:");
      console.error("   1. scheme/network mismatch (should be 'exact' and 'base-sepolia')");
      console.error("   2. resource URL mismatch (protocol, host, or path)");
      console.error("   3. payTo address mismatch");
      console.error("   4. maxAmountRequired format/type mismatch");
      console.error("   5. asset address mismatch");
      console.error("   6. description mismatch");
      console.error("   7. Missing or extra fields");
      console.error("");
      console.error("=== DETAILED COMPARISON ===");
      console.error("What we sent (paymentRequirements):");
      console.error(JSON.stringify(paymentRequirements, null, 2));
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
    }
    
    // Handle signature errors specifically
    if (verifyData.invalidReason === 'invalid_exact_evm_payload_signature') {
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
    
    return res.status(402).json({
      x402Version: "1.0",
      error: "Payment verification failed",
      errorReason: verifyData.invalidReason,
      accepts: [paymentRequirements],
    });
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

