import type { NextApiRequest, NextApiResponse } from "next";
import { createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET } from "@/utils/contracts";

// MagicToken ABI for mint function
const MAGIC_TOKEN_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

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

  const { locationId, address, rewardAmount } = req.body;

  if (!locationId || !address || !rewardAmount) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: locationId, address, and rewardAmount",
    });
  }

  // Validate address format
  if (!address.startsWith("0x") || address.length !== 42) {
    return res.status(400).json({
      success: false,
      error: "Invalid address format",
    });
  }

  // Validate reward amount
  try {
    const amount = BigInt(rewardAmount);
    if (amount <= 0n) {
      return res.status(400).json({
        success: false,
        error: "Reward amount must be greater than zero",
      });
    }
  } catch {
    return res.status(400).json({
      success: false,
      error: "Invalid reward amount format",
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
      chain: SAGA_CHAINLET as any,
      transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
    });

    // Encode the mint function call
    const data = encodeFunctionData({
      abi: MAGIC_TOKEN_ABI,
      functionName: "mint",
      args: [address as `0x${string}`, BigInt(rewardAmount)],
    });

    // Send the transaction
    const hash = await client.sendTransaction({
      to: CONTRACT_ADDRESSES.MAGIC_TOKEN as `0x${string}`,
      data: data as `0x${string}`,
      value: 0n,
    } as any);

    console.log("Location visit Magic mint transaction sent:", hash);

    return res.status(200).json({
      success: true,
      transactionHash: hash,
    });
  } catch (error) {
    console.error("Error minting Magic for location visit:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mint Magic. Make sure the server has minter permissions.",
    });
  }
}

