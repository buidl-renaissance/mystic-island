import type { NextApiRequest, NextApiResponse } from "next";
import { createWalletClient, http, encodeFunctionData, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { keccak256, toBytes, stringToBytes } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_REGISTRY_ABI } from "@/utils/contracts";

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
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({
      success: false,
      error: "Invalid address format",
    });
  }

  const locationRegistryAddress = CONTRACT_ADDRESSES.LOCATION_REGISTRY as string;
  if (locationRegistryAddress === "0x0000000000000000000000000000000000000000" || !locationRegistryAddress) {
    return res.status(400).json({
      success: false,
      error: "LocationRegistry contract not deployed yet. Please deploy contracts first.",
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
    
    const walletClient = createWalletClient({
      account,
      chain: SAGA_CHAINLET as any,
      transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
    });

    const publicClient = createPublicClient({
      chain: SAGA_CHAINLET as any,
      transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
    });

    // Compute the LOCATION_EDITOR_ROLE hash (same as contract: keccak256("LOCATION_EDITOR_ROLE"))
    const LOCATION_EDITOR_ROLE = keccak256(stringToBytes("LOCATION_EDITOR_ROLE"));

    // Check if address already has the role
    const hasRole = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
      abi: LOCATION_REGISTRY_ABI,
      functionName: "hasRole",
      args: [LOCATION_EDITOR_ROLE, address as `0x${string}`],
    });

    if (hasRole) {
      return res.status(200).json({
        success: true,
        error: "Address already has LOCATION_EDITOR_ROLE",
      });
    }

    // Compute the DEFAULT_ADMIN_ROLE hash (OpenZeppelin AccessControl uses bytes32(0))
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

    const isAdmin = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
      abi: LOCATION_REGISTRY_ABI,
      functionName: "hasRole",
      args: [DEFAULT_ADMIN_ROLE, account.address],
    });

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Deployer address does not have ADMIN_ROLE. Only admins can grant LOCATION_EDITOR_ROLE.",
      });
    }

    // Encode the grantRole function call
    const data = encodeFunctionData({
      abi: LOCATION_REGISTRY_ABI,
      functionName: "grantRole",
      args: [LOCATION_EDITOR_ROLE, address as `0x${string}`],
    });

    // Send the transaction
    const hash = await walletClient.sendTransaction({
      to: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
      data: data as `0x${string}`,
      value: 0n,
    } as any); // Type assertion needed for custom chain

    console.log("Role grant transaction sent:", hash);

    return res.status(200).json({
      success: true,
      transactionHash: hash,
    });
  } catch (error) {
    console.error("Error granting role:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to grant LOCATION_EDITOR_ROLE. Make sure the contract exists and the deployer has admin permissions.",
    });
  }
}

