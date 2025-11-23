import { useState, useEffect, useCallback } from "react";
import { useIsSignedIn, useEvmAddress, useSendUserOperation, useCurrentUser } from "@coinbase/cdp-hooks";
import { useRouter } from "next/router";
import { parseEther } from "viem";
import { useBalance } from "./useBalance";

/**
 * Hook to check if a wallet is deployed on-chain
 */
function useWalletDeploymentStatus(address: string | null) {
  const [isDeployed, setIsDeployed] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDeployment = useCallback(async () => {
    if (!address) {
      setIsDeployed(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Use Saga Chainlet RPC to check if contract code exists
      const rpcUrl = "https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io";
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getCode",
          params: [address, "latest"],
          id: 1,
        }),
      });

      const data = await response.json();
      const contractCode = data.result;
      const deployed = contractCode && contractCode !== "0x" && contractCode !== "0x0";
      
      setIsDeployed(deployed);
      console.log("Wallet deployment check:", {
        address,
        deployed,
        codeLength: contractCode?.length || 0,
        network: "Saga Chainlet",
      });
    } catch (err) {
      console.error("Error checking wallet deployment:", err);
      setError(err instanceof Error ? err.message : "Failed to check deployment");
      setIsDeployed(null);
    } finally {
      setIsChecking(false);
    }
  }, [address]);

  useEffect(() => {
    checkDeployment();
  }, [checkDeployment]);

  return { isDeployed, isChecking, error, checkDeployment };
}

/**
 * Hook to automatically deploy wallet if not deployed after authentication
 * Redirects to /explore after successful deployment
 */
export function useAutoDeployWallet() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { ethBalance } = useBalance();
  const { sendUserOperation } = useSendUserOperation();
  const router = useRouter();
  const { isDeployed, isChecking, checkDeployment } = useWalletDeploymentStatus(evmAddress);
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [justDeployed, setJustDeployed] = useState(false);

  const smartAccount = currentUser?.evmSmartAccounts?.[0];

  const deployWallet = useCallback(async () => {
    if (!evmAddress || !smartAccount) {
      return;
    }

    // Check if wallet has enough ETH for gas
    const minEthRequired = parseEther("0.0001");
    const currentBalance = ethBalance ? parseEther(ethBalance) : 0n;
    
    if (currentBalance < minEthRequired) {
      console.warn("Insufficient ETH balance for deployment. Need at least 0.0001 ETH.");
      return;
    }

    setIsDeploying(true);

    try {
      console.log("Auto-deploying wallet by sending a small transaction to self...");
      
      // Note: CDP embedded wallet only supports specific networks like base-sepolia
      // The wallet will be deployed on base-sepolia, but we check deployment on Saga chainlet
      // This means the wallet might exist on base-sepolia but not on Saga chainlet
      // For Saga chainlet transactions, we use API endpoints that execute server-side
      const deployAmount = parseEther("0.00001");
      
      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: "base-sepolia", // CDP doesn't support Saga chainlet yet
        calls: [{
          to: evmAddress,
          value: deployAmount,
          data: "0x",
        }],
      });

      console.log("Deployment user operation sent:", result);
      setJustDeployed(true);
      
      // Wait a bit then check deployment status
      setTimeout(() => {
        checkDeployment();
      }, 3000);
      
    } catch (error) {
      console.error("Error auto-deploying wallet:", error);
    } finally {
      setIsDeploying(false);
    }
  }, [evmAddress, smartAccount, ethBalance, sendUserOperation, checkDeployment]);

  // Auto-deploy logic
  useEffect(() => {
    if (!isSignedIn || !evmAddress) {
      setHasChecked(false);
      return;
    }

    // Wait for deployment check to complete
    if (isChecking) {
      return;
    }

    // Only check once per session
    if (hasChecked) {
      return;
    }

    setHasChecked(true);

    // If wallet is not deployed, deploy it automatically
    if (isDeployed === false && !isDeploying) {
      console.log("Wallet not deployed, auto-deploying...");
      deployWallet();
    }

    // Only redirect if wallet was already deployed when we checked (not just deployed)
    // This prevents redirecting users away from pages they're actively using
    if (isDeployed === true && !justDeployed) {
      // Don't redirect - user might be on a specific page
      return;
    }
  }, [isSignedIn, evmAddress, isDeployed, isChecking, isDeploying, hasChecked, justDeployed, deployWallet, router]);

  // Poll for deployment status after deployment attempt
  useEffect(() => {
    if (isDeploying || !hasChecked) {
      return;
    }

    if (isDeployed === false) {
      // Poll every 3 seconds to check if deployment completed
      const interval = setInterval(() => {
        checkDeployment();
      }, 3000);

      return () => clearInterval(interval);
    }

    // Once deployed (after our deployment), redirect to explore
    if (isDeployed === true && justDeployed && router.pathname !== "/explore") {
      router.push("/explore");
    }
  }, [isDeployed, isDeploying, hasChecked, justDeployed, checkDeployment, router]);

  return {
    isDeployed,
    isChecking,
    isDeploying,
    hasChecked,
  };
}

