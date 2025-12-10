import type { NextApiRequest, NextApiResponse } from "next";
import { createPublicClient, http, decodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * USDC contract address on Base Sepolia
 */
const USDC_CONTRACT_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

/**
 * Payment recipient address
 */
const PAYMENT_RECIPIENT = (process.env.PAYMENT_RECIPIENT_ADDRESS || "0x4200000000000000000000000000000000000006") as `0x${string}`;

/**
 * ERC20 Transfer ABI for decoding
 */
const ERC20_TRANSFER_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * API endpoint for purchasing game items using direct embedded wallet transactions
 * 
 * This endpoint:
 * - Accepts transaction hashes from direct USDC transfers
 * - Verifies the transaction on-chain
 * - Processes the purchase if payment is valid
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { itemId, transactionHash, userOperationHash, fromAddress } = req.body;

  console.log("=== API ROUTE HANDLER (DIRECT PAYMENT) ===");
  console.log("Item ID:", itemId);
  console.log("Transaction hash:", transactionHash);
  console.log("UserOperation hash:", userOperationHash);
  console.log("From address:", fromAddress);

  // Validate required fields
  if (!itemId) {
    return res.status(400).json({ error: "itemId is required" });
  }

  if (!transactionHash && !userOperationHash) {
    return res.status(400).json({ error: "transactionHash or userOperationHash is required" });
  }

  if (!fromAddress) {
    return res.status(400).json({ error: "fromAddress is required" });
  }

  // If we have a UserOperation hash, we need to handle it differently
  // UserOperations are bundled into transactions, so we need to find the actual transaction
  const hashToVerify = transactionHash || userOperationHash;
  const isUserOperation = !!userOperationHash;

  try {
    // Create public client for Base Sepolia
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });

    console.log("Verifying transaction on-chain...");
    console.log("Hash type:", isUserOperation ? "UserOperation" : "Transaction");
    console.log("Hash to verify:", hashToVerify);

    // For UserOperations, skip transaction receipt check and go straight to event log verification
    if (isUserOperation) {
      // UserOperation hashes need different handling
      // They get bundled into transactions, so we can't directly verify them via transaction receipt
      // Instead, we verify by checking USDC Transfer events
      console.log("UserOperation hash detected - using event log verification");
      
      // For UserOperations, verify by checking recent USDC Transfer events
      // UserOperations get bundled into transactions, so we verify via event logs
      console.log("Checking for recent USDC Transfer events...");
      
      // Get the current block number to search backwards
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > 200n ? currentBlock - 200n : 0n; // Check last 200 blocks
      
      // Get Transfer events from USDC contract
      // Filter by from and to addresses
      const transferEvents = await publicClient.getLogs({
        address: USDC_CONTRACT_ADDRESS,
        event: {
          type: "event",
          name: "Transfer",
          inputs: [
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: false, name: "value", type: "uint256" },
          ],
        },
        args: {
          from: fromAddress as `0x${string}`,
          to: PAYMENT_RECIPIENT,
        },
        fromBlock,
        toBlock: "latest",
      });

      if (transferEvents.length === 0) {
        // Wait a bit and retry - UserOperation might still be pending
        console.log("No transfer events found, waiting 2 seconds and retrying...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const retryEvents = await publicClient.getLogs({
          address: USDC_CONTRACT_ADDRESS,
          event: {
            type: "event",
            name: "Transfer",
            inputs: [
              { indexed: true, name: "from", type: "address" },
              { indexed: true, name: "to", type: "address" },
              { indexed: false, name: "value", type: "uint256" },
            ],
          },
          args: {
            from: fromAddress as `0x${string}`,
            to: PAYMENT_RECIPIENT,
          },
          fromBlock: currentBlock - 50n, // Check last 50 blocks on retry
          toBlock: "latest",
        });

        if (retryEvents.length === 0) {
          return res.status(400).json({
            error: "Payment not found. The UserOperation may still be pending. Please wait a moment and try again.",
            userOperationHash: hashToVerify,
          });
        }

        // Use the most recent transfer event from retry
        const transferEvent = retryEvents[retryEvents.length - 1];
        const transferValue = transferEvent.args.value as bigint;
        const expectedAmount = BigInt(10000); // 0.01 USDC

        if (transferValue < expectedAmount) {
          return res.status(400).json({
            error: "Insufficient payment amount",
            expected: expectedAmount.toString(),
            received: transferValue.toString(),
          });
        }

        // Payment verified via event log
        console.log("✅ Payment verified via Transfer event (retry):", transferEvent);
        
        return res.status(200).json({
          success: true,
          itemId,
          message: "Item purchased successfully",
          purchaseDate: new Date().toISOString(),
          paymentInfo: {
            from: fromAddress,
            to: PAYMENT_RECIPIENT,
            amount: transferValue.toString(),
            userOperationHash: hashToVerify,
            blockNumber: transferEvent.blockNumber.toString(),
            verifiedVia: "event_log",
          },
        });
      }

      // Use the most recent transfer event
      const transferEvent = transferEvents[transferEvents.length - 1];
      const transferValue = transferEvent.args.value as bigint;
      const expectedAmount = BigInt(10000); // 0.01 USDC

      if (transferValue < expectedAmount) {
        return res.status(400).json({
          error: "Insufficient payment amount",
          expected: expectedAmount.toString(),
          received: transferValue.toString(),
        });
      }

      // Payment verified via event log
      console.log("✅ Payment verified via Transfer event:", transferEvent);
      
      return res.status(200).json({
        success: true,
        itemId,
        message: "Item purchased successfully",
        purchaseDate: new Date().toISOString(),
        paymentInfo: {
          from: fromAddress,
          to: PAYMENT_RECIPIENT,
          amount: transferValue.toString(),
          userOperationHash: hashToVerify,
          blockNumber: transferEvent.blockNumber.toString(),
          verifiedVia: "event_log",
        },
      });
    }

    // For regular transactions, verify via transaction receipt
    console.log("Regular transaction hash detected - verifying via transaction receipt");
    let receipt;
    try {
      receipt = await publicClient.getTransactionReceipt({
        hash: hashToVerify as `0x${string}`,
      });
    } catch (error) {
      // If transaction receipt not found, it might still be pending
      return res.status(400).json({
        error: `Transaction receipt not found. The transaction may still be pending. Please wait a moment and try again.`,
        transactionHash: hashToVerify,
        details: error instanceof Error ? error.message : String(error),
      });
    }

    if (!receipt || receipt.status !== "success") {
      return res.status(400).json({
        error: "Transaction failed or not found",
        transactionHash,
      });
    }

    console.log("Transaction confirmed:", {
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      from: receipt.from,
      to: receipt.to,
    });

    // Verify transaction is to USDC contract
    if (receipt.to?.toLowerCase() !== USDC_CONTRACT_ADDRESS.toLowerCase()) {
      return res.status(400).json({
        error: "Transaction is not a USDC transfer",
        expected: USDC_CONTRACT_ADDRESS,
        received: receipt.to,
      });
    }

    // Get transaction details to decode the transfer
    const tx = await publicClient.getTransaction({
      hash: transactionHash as `0x${string}`,
    });

    // Decode the function data
    let decodedData;
    try {
      decodedData = decodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        data: tx.input,
      });
    } catch (error) {
      return res.status(400).json({
        error: "Failed to decode transaction data",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Verify it's a transfer function
    if (decodedData.functionName !== "transfer") {
      return res.status(400).json({
        error: "Transaction is not a transfer function",
        functionName: decodedData.functionName,
      });
    }

    const [toAddress, amount] = decodedData.args as [`0x${string}`, bigint];

    // Verify payment recipient matches
    if (toAddress.toLowerCase() !== PAYMENT_RECIPIENT.toLowerCase()) {
      return res.status(400).json({
        error: "Payment recipient mismatch",
        expected: PAYMENT_RECIPIENT,
        received: toAddress,
      });
    }

    // Verify sender matches
    if (receipt.from.toLowerCase() !== fromAddress.toLowerCase()) {
      return res.status(400).json({
        error: "Sender address mismatch",
        expected: fromAddress,
        received: receipt.from,
      });
    }

    // Verify amount (0.01 USDC = 10000 units with 6 decimals)
    const expectedAmount = BigInt(10000); // 0.01 USDC
    if (amount < expectedAmount) {
      return res.status(400).json({
        error: "Insufficient payment amount",
        expected: expectedAmount.toString(),
        received: amount.toString(),
      });
    }

    console.log("✅ Payment verified:", {
      from: receipt.from,
      to: toAddress,
      amount: amount.toString(),
      transactionHash,
    });

    // Business logic: Process the purchase
    console.log("✅ Processing purchase...");
    
    // TODO: Add your business logic here:
    // - Update database
    // - Grant item to user
    // - Log purchase
    // - Send notifications
    // etc.

    // Return success response
    res.status(200).json({
      success: true,
      itemId,
      message: "Item purchased successfully",
      purchaseDate: new Date().toISOString(),
      paymentInfo: {
        from: receipt.from,
        to: toAddress,
        amount: amount.toString(),
        transactionHash,
        blockNumber: receipt.blockNumber.toString(),
      },
    });
  } catch (error) {
    console.error("Error processing purchase:", error);
    return res.status(500).json({
      error: "Failed to process purchase",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
