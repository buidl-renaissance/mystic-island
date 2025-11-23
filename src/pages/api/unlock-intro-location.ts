import type { NextApiRequest, NextApiResponse } from "next";
import { createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_UNLOCK_ABI } from "@/utils/contracts";

type ResponseData = {
  success: boolean;
  transactionHash?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { userAddress } = req.body;

  if (!userAddress) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: userAddress",
    });
  }

  // Validate address format
  if (!userAddress.startsWith("0x") || userAddress.length !== 42) {
    return res.status(400).json({
      success: false,
      error: "Invalid user address format",
    });
  }

  try {
    const deployerPrivateKey = process.env.SAGA_PRIVATE_KEY;
    if (!deployerPrivateKey) {
      return res.status(500).json({
        success: false,
        error: "Server configuration error: SAGA_PRIVATE_KEY not set",
      });
    }

    const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
    
    const client = createWalletClient({
      account,
      chain: SAGA_CHAINLET,
      transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
    });

    // Explorer's Main Path location ID is 1 (root location, unlocked by first artifact)
    const explorersMainPathId = 1n;

    // Encode the adminUnlockLocation function call
    const data = encodeFunctionData({
      abi: LOCATION_UNLOCK_ABI,
      functionName: "adminUnlockLocation",
      args: [userAddress as `0x${string}`, explorersMainPathId],
    });

    // Send the transaction
    const hash = await client.sendTransaction({
      to: CONTRACT_ADDRESSES.LOCATION_UNLOCK as `0x${string}`,
      data: data as `0x${string}`,
      value: 0n,
    } as any);

    console.log("Intro location unlock transaction sent:", hash);

    return res.status(200).json({
      success: true,
      transactionHash: hash,
    });
  } catch (error) {
    console.error("Error unlocking intro location:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to unlock intro location",
    });
  }
}

