import type { NextApiRequest, NextApiResponse } from "next";
import { createClient, Errors } from '@farcaster/quick-auth';

const client = createClient();

/**
 * API endpoint to verify Farcaster JWT tokens
 * Extracts and returns the FID (Farcaster ID) from a valid token
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: "Token is required" });
    }

    // Get domain from environment or request
    const domain = process.env.NEXT_PUBLIC_FARCASTER_DOMAIN || 
                   process.env.FARCASTER_DOMAIN || 
                   (req.headers.host ? new URL(`https://${req.headers.host}`).hostname : 'localhost');

    // Verify the JWT token
    const payload = await client.verifyJwt({ token, domain });
    
    // Extract FID from the token payload
    // The FID is in the 'sub' field (may be string or number)
    const fid = payload.sub ? (typeof payload.sub === 'string' ? parseInt(payload.sub) : payload.sub) : null;

    if (!fid) {
      return res.status(400).json({ error: "Invalid token: FID not found" });
    }

    // Return verified user info
    res.status(200).json({
      success: true,
      fid,
      verified: true,
      payload: {
        ...payload,
        // Don't expose sensitive token data
      },
    });
  } catch (error) {
    console.error("Farcaster token verification error:", error);

    if (error instanceof Errors.InvalidTokenError) {
      return res.status(401).json({ 
        error: "Invalid token",
        message: error.message,
      });
    }

    res.status(500).json({ 
      error: "Token verification failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
