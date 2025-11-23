/**
 * Standalone script to grant minter role on MagicToken
 * This uses viem directly and doesn't require Hardhat compilation
 * 
 * Usage:
 * SAGA_PRIVATE_KEY=0x... ADDRESS=0x... tsx scripts/grant-magic-minter-standalone.ts
 * 
 * Or to grant minter to the deployer (SAGA_PRIVATE_KEY address):
 * SAGA_PRIVATE_KEY=0x... tsx scripts/grant-magic-minter-standalone.ts
 */

import { createWalletClient, http, createPublicClient, encodeFunctionData, decodeFunctionResult } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// MagicToken contract address
const MAGIC_TOKEN_ADDRESS = "0xFb1586097811Cc5040191376ac680e6d8a73d8b2" as `0x${string}`;

// Saga Chainlet configuration
const SAGA_CHAINLET = {
  id: 2763823383026000,
  name: "Saga Chainlet",
  network: "saga-chainlet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io"],
    },
  },
} as const;

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

async function main() {
  const deployerPrivateKey = process.env.SAGA_PRIVATE_KEY;
  if (!deployerPrivateKey) {
    console.error("❌ Error: SAGA_PRIVATE_KEY environment variable is required");
    process.exit(1);
  }

  const account = privateKeyToAccount(deployerPrivateKey as `0x${string}`);
  const addressToGrant = (process.env.ADDRESS || account.address) as `0x${string}`;

  console.log("🔐 Granting MagicToken minter role...");
  console.log("=" .repeat(60));
  console.log("📍 MagicToken:", MAGIC_TOKEN_ADDRESS);
  console.log("👤 Deployer address:", account.address);
  console.log("🎯 Address to grant minter:", addressToGrant);
  console.log("");

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

  try {
    // Check if address already has minter role
    const isMinter = await publicClient.readContract({
      address: MAGIC_TOKEN_ADDRESS,
      abi: MAGIC_TOKEN_ABI,
      functionName: "isMinter",
      args: [addressToGrant],
    });

    if (isMinter) {
      console.log("✅ Address already has minter role");
      console.log("");
      console.log("=" .repeat(60));
      return;
    }

    // Check if deployer is owner
    const owner = await publicClient.readContract({
      address: MAGIC_TOKEN_ADDRESS,
      abi: MAGIC_TOKEN_ABI,
      functionName: "owner",
    });

    if (owner.toLowerCase() !== account.address.toLowerCase()) {
      console.error("❌ Error: Deployer address is not the owner of MagicToken");
      console.error("   Owner:", owner);
      console.error("   Deployer:", account.address);
      console.error("Only the owner can grant minter role");
      process.exit(1);
    }

    console.log("✅ Deployer is owner of MagicToken");
    console.log("⏳ Granting minter role...");

    // Encode the setMinter function call
    const data = encodeFunctionData({
      abi: MAGIC_TOKEN_ABI,
      functionName: "setMinter",
      args: [addressToGrant, true],
    });

    // Send the transaction
    const hash = await walletClient.sendTransaction({
      to: MAGIC_TOKEN_ADDRESS,
      data,
      value: 0n,
    } as any);

    console.log("📝 Transaction hash:", hash);
    console.log("⏳ Waiting for confirmation...");

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log("✅ Successfully granted minter role!");
    console.log("   Block number:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());

    // Verify the role was granted
    const isMinterAfter = await publicClient.readContract({
      address: MAGIC_TOKEN_ADDRESS,
      abi: MAGIC_TOKEN_ABI,
      functionName: "isMinter",
      args: [addressToGrant],
    });

    if (isMinterAfter) {
      console.log("✅ Verified: Address now has minter role");
    } else {
      console.log("⚠️  Warning: Minter role verification failed");
    }

    console.log("");
    console.log("=" .repeat(60));
  } catch (error) {
    console.error("❌ Error granting minter role:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

