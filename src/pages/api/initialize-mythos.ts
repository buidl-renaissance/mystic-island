import type { NextApiRequest, NextApiResponse } from "next";
import { createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, ISLAND_MYTHOS_ABI } from "@/utils/contracts";

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

  const { islandName, shortTheme, artDirection, coreMyth, loreURI } = req.body;

  if (!islandName || !shortTheme || !artDirection || !coreMyth || !loreURI) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: islandName, shortTheme, artDirection, coreMyth, and loreURI",
    });
  }

  // Validate URI format
  if (
    !loreURI.startsWith("http://") &&
    !loreURI.startsWith("https://") &&
    !loreURI.startsWith("ipfs://")
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid URI format. Must start with http://, https://, or ipfs://",
    });
  }

  const islandMythosAddress = CONTRACT_ADDRESSES.ISLAND_MYTHOS as string;
  if (islandMythosAddress === "0x0000000000000000000000000000000000000000" || !islandMythosAddress) {
    return res.status(400).json({
      success: false,
      error: "IslandMythos contract not deployed yet. Please deploy contracts first.",
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
      abi: ISLAND_MYTHOS_ABI,
      functionName: "initializeMythos",
      args: [islandName, shortTheme, artDirection, coreMyth, loreURI],
    });

    // Send the transaction
    const hash = await client.sendTransaction({
      to: CONTRACT_ADDRESSES.ISLAND_MYTHOS as `0x${string}`,
      data: data as `0x${string}`,
      value: 0n,
    } as any); // Type assertion needed for custom chain

    console.log("Mythos initialization transaction sent:", hash);

    return res.status(200).json({
      success: true,
      transactionHash: hash,
    });
  } catch (error) {
    console.error("Error initializing mythos:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to initialize mythos. Make sure the contract exists and hasn't been initialized already.",
    });
  }
}

