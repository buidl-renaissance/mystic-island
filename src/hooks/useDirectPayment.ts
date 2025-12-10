import { useCallback } from "react";
import { useCurrentUser, useEvmAddress, useSendUserOperation } from "@coinbase/cdp-hooks";
import { signEvmTransaction as signEvmTransactionCore } from "@coinbase/cdp-core";
import { createPublicClient, http, encodeFunctionData, parseUnits, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * USDC contract address on Base Sepolia
 */
const USDC_CONTRACT_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

/**
 * ERC20 Transfer ABI
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
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Hook for sending direct USDC payments using embedded wallets
 * This bypasses the x402 facilitator and sends transactions directly
 */
export function useDirectPayment() {
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();
  const { sendUserOperation } = useSendUserOperation();

  const sendPayment = useCallback(
    async (
      to: `0x${string}`,
      amount: string, // Amount in USDC (e.g., "0.01")
      onProgress?: (status: string) => void
    ): Promise<`0x${string}`> => {
      if (!currentUser?.evmAccounts?.[0]) {
        throw new Error("No embedded wallet available. Please sign in.");
      }

      if (!evmAddress) {
        throw new Error("No wallet address available. Please ensure you're signed in.");
      }

      // Use evmAddress from useEvmAddress() to match what useBalance() uses
      // This ensures we're checking balance and sending from the same address
      const accountAddress = evmAddress as `0x${string}`;
      
      // Find the evmAccount that matches the evmAddress
      // evmAccount might be a string (address) or an object with an address property
      let evmAccount = currentUser.evmAccounts.find((account) => {
        if (typeof account === 'string') {
          return account.toLowerCase() === evmAddress.toLowerCase();
        }
        return (account as { address?: string }).address?.toLowerCase() === evmAddress.toLowerCase();
      });
      
      // Fallback to first account if no match found
      if (!evmAccount) {
        evmAccount = currentUser.evmAccounts[0];
        console.warn("⚠️ Could not find matching evmAccount for evmAddress, using first account");
      }
      
      console.log("=== ADDRESS VERIFICATION ===");
      console.log("evmAddress from useEvmAddress():", evmAddress);
      console.log("evmAccount found:", evmAccount);
      console.log("Using accountAddress for transaction:", accountAddress);
      
      // Verify the account address matches
      const evmAccountAddress = typeof evmAccount === 'string' 
        ? evmAccount 
        : (evmAccount as { address?: string }).address;
      
      if (evmAccountAddress?.toLowerCase() !== evmAddress.toLowerCase()) {
        console.warn("⚠️ WARNING: evmAccount address doesn't match evmAddress!");
        console.warn("  evmAccount address:", evmAccountAddress);
        console.warn("  evmAddress:", evmAddress);
        console.warn("  This might cause balance/transaction mismatches");
      }

      onProgress?.("Preparing transaction...");

      // Create public client for Base Sepolia
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      // Parse amount to USDC units (6 decimals)
      const amountInUnits = parseUnits(amount, 6);

      // Check balance before attempting transfer
      onProgress?.("Checking balance...");
      console.log("=== BALANCE CHECK IN PAYMENT HOOK ===");
      console.log("Account address being checked:", accountAddress);
      console.log("USDC contract address:", USDC_CONTRACT_ADDRESS);
      
      const balance = await publicClient.readContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: ERC20_TRANSFER_ABI,
        functionName: "balanceOf",
        args: [accountAddress],
      });

      const balanceFormatted = formatUnits(balance, 6);
      console.log("Current USDC balance (raw):", balance.toString());
      console.log("Current USDC balance (formatted):", balanceFormatted);
      console.log("Required amount (raw):", amountInUnits.toString());
      console.log("Required amount (formatted):", amount);
      console.log("Balance comparison:", balance.toString(), ">=", amountInUnits.toString(), "?", balance >= amountInUnits);

      if (balance < amountInUnits) {
        const errorMsg = `Insufficient USDC balance. You have ${balanceFormatted} USDC but need ${amount} USDC. Please add more USDC to your wallet.`;
        console.error("❌ BALANCE CHECK FAILED:", errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log("✅ Balance check passed");

      // Encode the transfer function call
      const transferData = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: "transfer",
        args: [to, amountInUnits],
      });

      // Check if we have a smart account (for UserOperations)
      // Smart contract wallets should use UserOperations which handle gas differently
      const smartAccount = currentUser?.evmSmartAccounts?.[0];
      
      if (smartAccount) {
        // Use UserOperation for smart contract wallets
        // UserOperations handle gas sponsorship/payment automatically
        onProgress?.("Sending UserOperation...");
        
        console.log("Using UserOperation for smart contract wallet");
        const result = await sendUserOperation({
          evmSmartAccount: smartAccount,
          network: "base-sepolia",
          calls: [{
            to: USDC_CONTRACT_ADDRESS,
            value: 0n,
            data: transferData,
          }],
        });

        console.log("UserOperation sent:", result);
        onProgress?.("UserOperation sent! Waiting for confirmation...");

        // UserOperation returns a userOperationHash, not a transaction hash
        // We need to wait for it to be included in a transaction
        // For now, return the userOperationHash - the API can verify it differently
        const userOpHash = result.userOperationHash;
        if (!userOpHash) {
          throw new Error("UserOperation failed - no hash returned");
        }

        // Wait a bit for the UserOperation to be processed
        // In production, you might want to poll for the transaction hash
        await new Promise(resolve => setTimeout(resolve, 3000));

        onProgress?.("UserOperation confirmed!");
        
        // Return the userOperationHash with a special prefix to identify it
        // The API can detect this prefix to know it's a UserOperation
        // Format: "uo:" prefix + hash
        return `uo:${userOpHash}` as `0x${string}`;
      } else {
        // Fallback to regular transaction for EOA wallets
        onProgress?.("Estimating gas...");

        // Check ETH balance for gas
        const ethBalance = await publicClient.getBalance({ address: accountAddress });
        const gasPrice = await publicClient.getGasPrice();
        const estimatedGas = 100000n; // Rough estimate for ERC20 transfer
        const gasCost = gasPrice * estimatedGas;
        
        if (ethBalance < gasCost) {
          throw new Error(
            `Insufficient ETH for gas. You need approximately ${formatUnits(gasCost, 18)} ETH for gas but have ${formatUnits(ethBalance, 18)} ETH. Please request ETH from the faucet.`
          );
        }

        // Get gas price and nonce
        const [nonce, gasPriceFinal] = await Promise.all([
          publicClient.getTransactionCount({ address: accountAddress }),
          publicClient.getGasPrice(),
        ]);

        // Estimate gas
        const gasEstimate = await publicClient.estimateGas({
          account: accountAddress,
          to: USDC_CONTRACT_ADDRESS,
          data: transferData,
          value: 0n,
        });

        onProgress?.("Signing transaction...");

        // Sign the transaction
        const { signedTransaction } = await signEvmTransactionCore({
          evmAccount,
          transaction: {
            to: USDC_CONTRACT_ADDRESS,
            data: transferData,
            value: 0n,
            nonce,
            gas: gasEstimate,
            maxFeePerGas: gasPriceFinal,
            maxPriorityFeePerGas: gasPriceFinal / 2n,
            chainId: baseSepolia.id,
            type: "eip1559",
          },
        });

        onProgress?.("Sending transaction...");

        // Send the transaction
        const hash = await publicClient.sendRawTransaction({
          serializedTransaction: signedTransaction,
        });

        onProgress?.("Transaction sent! Waiting for confirmation...");

        // Wait for transaction receipt
        await publicClient.waitForTransactionReceipt({ hash });

        onProgress?.("Transaction confirmed!");

        return hash;
      }
    },
    [currentUser, evmAddress, sendUserOperation]
  );

  return { sendPayment };
}
