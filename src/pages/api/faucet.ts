import type { NextApiRequest, NextApiResponse } from "next";

/**
 * API endpoint to request testnet funds from CDP Faucet
 * 
 * This endpoint calls the CDP Faucets API to fund the user's embedded wallet
 * with testnet tokens (ETH, USDC, etc.) on Base Sepolia.
 * 
 * Requires CDP API keys to be set in environment variables:
 * - CDP_API_KEY_ID
 * - CDP_API_KEY_SECRET
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address, token, network } = req.body;

  // Validate required fields
  if (!address || !token || !network) {
    return res.status(400).json({ 
      error: "Missing required fields: address, token, and network are required" 
    });
  }

  // Validate token
  const validTokens = ["eth", "usdc", "eurc", "cbbtc"];
  if (!validTokens.includes(token.toLowerCase())) {
    return res.status(400).json({ 
      error: `Invalid token. Must be one of: ${validTokens.join(", ")}` 
    });
  }

  // Validate network
  const validNetworks = ["base-sepolia", "ethereum-sepolia", "ethereum-hoodi"];
  if (!validNetworks.includes(network.toLowerCase())) {
    return res.status(400).json({ 
      error: `Invalid network. Must be one of: ${validNetworks.join(", ")}` 
    });
  }

  // Check for API keys
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;

  if (!apiKeyId || !apiKeySecret) {
    return res.status(500).json({ 
      error: "CDP API keys not configured. Please set CDP_API_KEY_ID and CDP_API_KEY_SECRET environment variables." 
    });
  }

  try {
    // Generate JWT bearer token for CDP API authentication
    // CDP uses JWT tokens signed with the API key secret
    const jwt = await generateCDPJWT(apiKeyId, apiKeySecret);

    // Call CDP Faucets API
    const response = await fetch("https://api.cdp.coinbase.com/platform/v2/evm/faucet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        network: network.toLowerCase(),
        address: address,
        token: token.toLowerCase(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("CDP Faucet API error:", data);
      return res.status(response.status).json({
        error: data.errorMessage || "Failed to request funds from faucet",
        errorType: data.errorType,
      });
    }

    // Success - return transaction hash
    return res.status(200).json({
      success: true,
      transactionHash: data.transactionHash,
      message: `Successfully requested ${token.toUpperCase()} from faucet`,
    });
  } catch (error) {
    console.error("Error calling CDP Faucet API:", error);
    return res.status(500).json({
      error: "Internal server error while requesting funds",
    });
  }
}

/**
 * Generate JWT token for CDP API authentication
 * CDP requires JWT tokens signed with the API key secret
 */
async function generateCDPJWT(apiKeyId: string, apiKeySecret: string): Promise<string> {
  // Use CDP SDK to generate JWT
  // Note: You may need to install @coinbase/cdp-sdk if not already installed
  try {
    // Dynamic import to avoid issues if package is not installed
    const { generateJwt } = await import("@coinbase/cdp-sdk/auth");
    
    const jwt = await generateJwt({
      apiKeyId,
      apiKeySecret,
      requestMethod: "POST",
      requestHost: "api.cdp.coinbase.com",
      requestPath: "/platform/v2/evm/faucet",
      expiresIn: 120, // 2 minutes
    });
    
    return jwt;
  } catch (error) {
    // Fallback: If CDP SDK is not available, provide helpful error
    console.error("Failed to import CDP SDK:", error);
    throw new Error(
      "CDP SDK not available. Please install @coinbase/cdp-sdk: yarn add @coinbase/cdp-sdk"
    );
  }
}

