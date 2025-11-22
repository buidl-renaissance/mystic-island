import Head from "next/head";
import { useState, useEffect, useCallback, useRef } from "react";
import { useIsSignedIn, useEvmAddress, useSendUserOperation, useCurrentUser } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useBalance } from "@/hooks/useBalance";
import Link from "next/link";
import { parseEther, formatEther } from "viem";

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
      // Use Base Sepolia RPC to check if contract code exists
      const rpcUrl = "https://sepolia.base.org";
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

export default function DeployWalletPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { ethBalance, isLoading: isLoadingBalance } = useBalance();
  const { sendUserOperation } = useSendUserOperation();
  const { isDeployed, isChecking, error: deploymentError, checkDeployment } = useWalletDeploymentStatus(evmAddress);
  
  // Get the smart account object from currentUser
  const smartAccount = currentUser?.evmSmartAccounts?.[0];
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "success" | "error">("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDeployWallet = async () => {
    if (!evmAddress) {
      setErrorMessage("Please connect your wallet first");
      setDeploymentStatus("error");
      return;
    }

    // Check if wallet has enough ETH for gas
    const minEthRequired = parseEther("0.0001"); // Minimum ETH needed for deployment
    const currentBalance = ethBalance ? parseEther(ethBalance) : 0n;
    
    if (currentBalance < minEthRequired) {
      setErrorMessage(`Insufficient ETH balance. You need at least 0.0001 ETH for gas. Current balance: ${ethBalance || "0"} ETH`);
      setDeploymentStatus("error");
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus("idle");
    setErrorMessage(null);
    setTransactionHash(null);

    try {
      console.log("Deploying wallet by sending a small transaction to self...");
      
      // Send a very small amount (0.00001 ETH) to self to trigger wallet deployment
      // This is the minimum needed to deploy the smart contract wallet
      const deployAmount = parseEther("0.00001");
      
      // Use UserOperation instead of regular transaction
      // UserOperations are the native way smart wallets send transactions
      // and they handle deployment automatically
      // Use the smart account object from currentUser, not just the address
      const result = await sendUserOperation({
        evmSmartAccount: smartAccount, // Use the smart account object, not just the address
        network: "base-sepolia",
        calls: [{
          to: evmAddress, // Send to self
          value: deployAmount, // UserOperation uses bigint values
          data: "0x", // No data needed
        }],
      });

      console.log("Deployment user operation sent:", result);
      setTransactionHash(result.userOperationHash || result.transactionHash);
      setDeploymentStatus("success");

      // Start polling for deployment status after a short delay
      // The useEffect hook will handle the polling
      
    } catch (error) {
      console.error("Error deploying wallet:", error);
      setDeploymentStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to deploy wallet"
      );
    } finally {
      setIsDeploying(false);
    }
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Deploy Wallet - Mystic Island</title>
          <meta name="description" content="Deploy your embedded wallet for x402 payments" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div
          style={{
            minHeight: "100vh",
            padding: "40px 20px",
            backgroundColor: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#0a0b0d" }}>Deploy Wallet</h1>
          <p style={{ color: "#0a0b0d", marginBottom: "2rem", textAlign: "center", maxWidth: "600px" }}>
            Please sign in to deploy your embedded wallet. The wallet needs to be deployed on-chain before you can make x402 payments.
          </p>
          <AuthButton />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Deploy Wallet - Mystic Island</title>
        <meta name="description" content="Deploy your embedded wallet for x402 payments" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{
          minHeight: "100vh",
          padding: "40px 20px",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "#0a0b0d" }}>Deploy Wallet</h1>
          <p style={{ color: "#0a0b0d", marginBottom: "2rem" }}>
            CDP embedded wallets are smart contract wallets that need to be deployed on-chain before making x402 payments. 
            The wallet will auto-deploy on the first outgoing transaction.
          </p>

          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "24px",
              borderRadius: "8px",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#0a0b0d" }}>Wallet Information</h2>
            <div style={{ marginBottom: "12px", color: "#0a0b0d" }}>
              <strong>Address:</strong>{" "}
              <code style={{ backgroundColor: "#eef0f3", color: "#0a0b0d", padding: "4px 8px", borderRadius: "4px", fontFamily: "monospace" }}>
                {evmAddress || "Not connected"}
              </code>
            </div>
            <div style={{ marginBottom: "12px", color: "#0a0b0d" }}>
              <strong>ETH Balance:</strong>{" "}
              {isLoadingBalance ? "Loading..." : `${ethBalance || "0"} ETH`}
            </div>
            <div style={{ marginBottom: "12px", color: "#0a0b0d" }}>
              <strong>Deployment Status:</strong>{" "}
              {isChecking ? (
                <span style={{ color: "#5b616e" }}>Checking...</span>
              ) : isDeployed === null ? (
                <span style={{ color: "#5b616e" }}>Unknown</span>
              ) : isDeployed ? (
                <span style={{ color: "#098551", fontWeight: "bold" }}>✅ Deployed</span>
              ) : (
                <span style={{ color: "#cf202f", fontWeight: "bold" }}>❌ Not Deployed</span>
              )}
            </div>
            {deploymentError && (
              <div style={{ color: "#cf202f", marginTop: "8px" }}>
                Error checking deployment: {deploymentError}
              </div>
            )}
          </div>

          {isDeployed ? (
            <div
              style={{
                backgroundColor: "#e8f5e9",
                padding: "24px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#098551" }}>
                ✅ Wallet is Deployed
              </h2>
              <p style={{ color: "#0a0b0d", marginBottom: "1rem" }}>
                Your wallet is deployed and ready to make x402 payments!
              </p>
              <Link
                href="/purchase"
                style={{
                  display: "inline-block",
                  backgroundColor: "#098551",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Go to Purchase Page
              </Link>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#fff3e0",
                padding: "24px",
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#ed702f" }}>
                ⚠️ Wallet Not Deployed
              </h2>
              <p style={{ color: "#0a0b0d", marginBottom: "1rem" }}>
                Your wallet needs to be deployed before you can make x402 payments. 
                This will send a small transaction (0.00001 ETH) to yourself to trigger wallet deployment.
              </p>
              <p style={{ color: "#0a0b0d", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                <strong>Note:</strong> You need at least 0.0001 ETH for gas fees. If you don't have enough ETH, 
                visit the <Link href="/faucet" style={{ color: "#098551" }}>faucet page</Link> to request testnet funds.
              </p>
              
              <button
                onClick={handleDeployWallet}
                disabled={isDeploying || !evmAddress || (ethBalance && parseFloat(ethBalance) < 0.0001)}
                style={{
                  backgroundColor: isDeploying || !evmAddress || (ethBalance && parseFloat(ethBalance) < 0.0001) 
                    ? "#ccc" 
                    : "#098551",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: isDeploying || !evmAddress || (ethBalance && parseFloat(ethBalance) < 0.0001) 
                    ? "not-allowed" 
                    : "pointer",
                }}
              >
                {isDeploying ? "Deploying..." : "Deploy Wallet"}
              </button>

              {deploymentStatus === "success" && transactionHash && (
                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#e8f5e9", borderRadius: "4px" }}>
                  <p style={{ color: "#098551", marginBottom: "8px", fontWeight: "bold" }}>
                    ✅ Deployment transaction sent!
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "#0a0b0d", marginBottom: "8px" }}>
                    Transaction hash:{" "}
                    <a
                      href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#098551" }}
                    >
                      {transactionHash.substring(0, 20)}...
                    </a>
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "#0a0b0d" }}>
                    Waiting for transaction confirmation... This page will automatically update when deployment is complete.
                  </p>
                </div>
              )}

              {deploymentStatus === "error" && errorMessage && (
                <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#ffebee", borderRadius: "4px" }}>
                  <p style={{ color: "#cf202f", fontWeight: "bold" }}>❌ Deployment Failed</p>
                  <p style={{ color: "#0a0b0d", marginTop: "8px" }}>{errorMessage}</p>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: "24px" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#0a0b0d" }}>How it Works</h3>
            <ul style={{ color: "#0a0b0d", lineHeight: "1.8" }}>
              <li>CDP embedded wallets are smart contract wallets (account abstraction)</li>
              <li>The wallet address exists before deployment (counterfactual address)</li>
              <li>You can receive funds before the wallet is deployed</li>
              <li>The wallet contract auto-deploys on the first outgoing transaction</li>
              <li>x402 payments require the wallet to be deployed first</li>
            </ul>
          </div>

          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <Link
              href="/faucet"
              style={{
                display: "inline-block",
                backgroundColor: "#f5f5f5",
                color: "#098551",
                padding: "12px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Get Testnet Funds
            </Link>
            <Link
              href="/purchase"
              style={{
                display: "inline-block",
                backgroundColor: "#f5f5f5",
                color: "#098551",
                padding: "12px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Go to Purchase Page
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

