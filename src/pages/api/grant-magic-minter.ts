import type { NextApiRequest, NextApiResponse } from "next";
import { createWalletClient, http, createPublicClient, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET } from "@/utils/contracts";

// MagicToken ABI (minimal - just what we need)
const MAGIC_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "isMinter",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "allowed", type: "bool" },
    ],
    name: "setMinter",
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

  const { address } = req.body;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: address",
    });
  }

  // Validate address format
  if (!address.startsWith("0x") || address.length !== 42) {
    return res.status(400).json({
      success: false,
      error: "Invalid address format",
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
    const addressToGrant = address as `0x${string}`;

    // Create clients
    const publicClient = createPublicClient({
      chain: SAGA_CHAINLET as any,
      transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
    });

    const walletClient = createWalletClient({
      account,
      chain: SAGA_CHAINLET as any,
      transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
    });

    // Check if address already has minter role
    const isMinter = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.MAGIC_TOKEN as `0x${string}`,
      abi: MAGIC_TOKEN_ABI,
      functionName: "isMinter",
      args: [addressToGrant],
    });

    if (isMinter) {
      return res.status(200).json({
        success: true,
        error: "Address already has minter role",
      });
    }

    // Check if deployer is owner
    const owner = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.MAGIC_TOKEN as `0x${string}`,
      abi: MAGIC_TOKEN_ABI,
      functionName: "owner",
    });

    if (owner.toLowerCase() !== account.address.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: `Deployer address (${account.address}) is not the owner of MagicToken. Owner: ${owner}`,
      });
    }

    // Encode the setMinter function call
    const data = encodeFunctionData({
      abi: MAGIC_TOKEN_ABI,
      functionName: "setMinter",
      args: [addressToGrant, true],
    });

    // Send the transaction
    const hash = await walletClient.sendTransaction({
      to: CONTRACT_ADDRESSES.MAGIC_TOKEN as `0x${string}`,
      data,
      value: 0n,
    } as any);

    console.log("Granted MagicToken minter role:", {
      address: addressToGrant,
      transactionHash: hash,
    });

    return res.status(200).json({
      success: true,
      transactionHash: hash,
    });
  } catch (error) {
    console.error("Error granting minter role:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to grant minter role",
    });
  }
}

