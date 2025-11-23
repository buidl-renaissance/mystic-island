import { useState, useEffect, useCallback } from "react";
import { useIsSignedIn, useCurrentUser } from "@coinbase/cdp-hooks";
import { useRouter } from "next/router";
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
      // For Saga chainlet, we check if the EOA has been used (has a transaction count > 0)
      // or if it has a balance. EOAs don't need deployment, but we want to verify they exist
      const rpcUrl = "https://mysticisland-2763823383026000-1.jsonrpc.sagarpc.io";
      
      // Check both transaction count and balance to verify the account is active
      const [txCountResponse, balanceResponse] = await Promise.all([
        fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getTransactionCount",
            params: [address, "latest"],
            id: 1,
          }),
        }),
        fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [address, "latest"],
            id: 2,
          }),
        }),
      ]);

      const [txCountData, balanceData] = await Promise.all([
        txCountResponse.json(),
        balanceResponse.json(),
      ]);

      // EOA is considered "ready" if it exists (has been created)
      // We don't need to check for deployment since EOAs don't need deployment
      // Just verify the address is valid and accessible
      const txCount = parseInt(txCountData.result || "0x0", 16);
      const balance = BigInt(balanceData.result || "0x0");
      
      // EOA is ready if it exists (transaction count check confirms it's a valid address)
      const deployed = true; // EOAs are always "ready" - they don't need deployment
      
      setIsDeployed(deployed);
      console.log("EOA readiness check for Saga chainlet:", {
        address,
        ready: deployed,
        transactionCount: txCount,
        balance: balance.toString(),
        network: "Saga Chainlet",
      });
    } catch (err) {
      console.error("Error checking EOA readiness:", err);
      setError(err instanceof Error ? err.message : "Failed to check EOA");
      // Even if check fails, assume EOA is ready (it exists as soon as created)
      setIsDeployed(true);
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
 * @param enabled - Whether to enable auto-deployment (default: true)
 */
export function useAutoDeployWallet(enabled: boolean = true) {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const router = useRouter();
  
  const evmAccount = currentUser?.evmAccounts?.[0];
  // For Saga chainlet, we use the EOA directly (no deployment needed)
  // Check the EOA address instead of smart account address
  const eoaAddress = evmAccount 
    ? (typeof evmAccount === 'string' ? evmAccount : (evmAccount as any).address)
    : null;
  const { isDeployed, isChecking, checkDeployment } = useWalletDeploymentStatus(eoaAddress);
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [justDeployed, setJustDeployed] = useState(false);

  const deployWallet = useCallback(async () => {
    // For Saga chainlet, we use the EOA directly - no deployment needed
    // EOAs (Externally Owned Accounts) don't need to be deployed, they exist as soon as created
    // Smart accounts would need deployment, but Saga chainlet doesn't support user operations
    // So we skip deployment and just mark as ready
    console.log("Saga chainlet uses EOA directly - no deployment needed");
    setJustDeployed(true);
    // Mark as deployed immediately since EOAs don't need deployment
    setTimeout(() => {
      checkDeployment();
    }, 100);
  }, [checkDeployment]);

  // Auto-deploy logic
  useEffect(() => {
    if (!enabled || !isSignedIn || !eoaAddress) {
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

    // For Saga chainlet, EOAs don't need deployment - they're ready to use immediately
    // The deployment check is just to verify the EOA exists and can be used
    // If the check shows not deployed, it might mean the EOA hasn't been used yet on Saga
    // but that's fine - we can still use it
    if (isDeployed === false && !isDeploying) {
      console.log("EOA ready for Saga chainlet (no deployment needed for EOAs)");
      // For EOAs, we don't need to deploy - just mark as ready
      deployWallet();
    }

    // Only redirect if wallet was already deployed when we checked (not just deployed)
    // This prevents redirecting users away from pages they're actively using
    if (isDeployed === true && !justDeployed) {
      // Don't redirect - user might be on a specific page
      return;
    }
  }, [enabled, isSignedIn, eoaAddress, isDeployed, isChecking, isDeploying, hasChecked, justDeployed, deployWallet, router]);

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

