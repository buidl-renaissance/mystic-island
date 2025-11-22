import type { NextApiRequest, NextApiResponse } from "next";
import { createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET } from "@/utils/contracts";

// TribeManager ABI for requestToJoinTribe function
const TRIBE_MANAGER_ABI = [
  {
    inputs: [
      { name: "tribeId", type: "uint256" },
      { name: "initiationArtifactUri", type: "string" },
    ],
    name: "requestToJoinTribe",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

type ResponseData = {
  success: boolean;
  transactionHash?: string;
  requestId?: string;
  artifactId?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { tribeId, initiationArtifactUri, userAddress } = req.body;

  if (!tribeId || !initiationArtifactUri || !userAddress) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: tribeId, initiationArtifactUri, and userAddress",
    });
  }

  // Validate address format
  if (!userAddress.startsWith("0x") || userAddress.length !== 42) {
    return res.status(400).json({
      success: false,
      error: "Invalid user address format",
    });
  }

  // Validate URI format
  if (
    !initiationArtifactUri.startsWith("http://") &&
    !initiationArtifactUri.startsWith("https://") &&
    !initiationArtifactUri.startsWith("ipfs://")
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid URI format. Must start with http://, https://, or ipfs://",
    });
  }

  // Validate tribeId
  const tribeIdNum = parseInt(tribeId);
  if (isNaN(tribeIdNum) || tribeIdNum < 1) {
    return res.status(400).json({
      success: false,
      error: "Invalid tribe ID",
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

    // Encode the function call
    const data = encodeFunctionData({
      abi: TRIBE_MANAGER_ABI,
      functionName: "requestToJoinTribe",
      args: [BigInt(tribeIdNum), initiationArtifactUri],
    });

    // Send the transaction
    const hash = await client.sendTransaction({
      to: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
      data: data as `0x${string}`,
      value: 0n,
    } as any); // Type assertion needed for custom chain

    console.log("Join tribe transaction sent:", hash);

    // Note: We can't easily get the requestId and artifactId from the transaction receipt
    // The user can check the block explorer or we could listen for events
    // For now, we'll just return the transaction hash

    return res.status(200).json({
      success: true,
      transactionHash: hash,
    });
  } catch (error) {
    console.error("Error joining tribe:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to join tribe. Make sure the tribe exists and you haven't already initiated.",
    });
  }
}

