import type { NextApiRequest, NextApiResponse } from "next";
import { createWalletClient, http, encodeFunctionData } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET } from "@/utils/contracts";

// ArtifactCollection ABI for mintArtifact function
const ARTIFACT_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "uri", type: "string" },
    ],
    name: "mintArtifact",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

type ResponseData = {
  success: boolean;
  transactionHash?: string;
  tokenId?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { recipientAddress, artifactUri, signature } = req.body;

  if (!recipientAddress || !artifactUri) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: recipientAddress and artifactUri",
    });
  }

  // Validate address format
  if (!recipientAddress.startsWith("0x") || recipientAddress.length !== 42) {
    return res.status(400).json({
      success: false,
      error: "Invalid recipient address format",
    });
  }

  // Validate URI format
  if (
    !artifactUri.startsWith("http://") &&
    !artifactUri.startsWith("https://") &&
    !artifactUri.startsWith("ipfs://")
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid URI format. Must start with http://, https://, or ipfs://",
    });
  }

  // TODO: Verify signature to ensure the request is from an authorized user
  // For now, we'll use the deployer's private key
  // In production, you should verify the signature and check if the user is the owner

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
      abi: ARTIFACT_ABI,
      functionName: "mintArtifact",
      args: [recipientAddress as `0x${string}`, artifactUri],
    });

    // Send the transaction
    const hash = await client.sendTransaction({
      to: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
      data: data as `0x${string}`,
      value: 0n,
    } as any); // Type assertion needed for custom chain

    console.log("Artifact mint transaction sent:", hash);

    // Wait for transaction receipt to get the tokenId from events
    // For now, just return the transaction hash
    // The frontend can poll for the event or check the block explorer

    return res.status(200).json({
      success: true,
      transactionHash: hash,
    });
  } catch (error) {
    console.error("Error minting artifact:", error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mint artifact. Make sure you're the contract owner.",
    });
  }
}

