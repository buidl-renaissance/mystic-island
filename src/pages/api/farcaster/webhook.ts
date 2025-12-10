import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Farcaster Mini App Webhook Endpoint
 * 
 * This endpoint receives events from Farcaster when users interact with your mini app.
 * You can use this to track analytics, handle notifications, or perform server-side actions.
 * 
 * For more information, see: https://docs.farcaster.xyz/miniapps/webhooks
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract webhook data from Farcaster
    const { type, data } = req.body;

    console.log("Farcaster webhook received:", { type, data });

    // Handle different webhook event types
    switch (type) {
      case "user.connected":
        // User connected to your mini app
        console.log("User connected:", data);
        break;
      case "user.disconnected":
        // User disconnected from your mini app
        console.log("User disconnected:", data);
        break;
      case "frame.action":
        // User interacted with a frame
        console.log("Frame action:", data);
        break;
      default:
        console.log("Unknown webhook type:", type);
    }

    // Return success response
    res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error("Error processing Farcaster webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
