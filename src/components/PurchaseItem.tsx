import { useState } from "react";
import { useX402Payment } from "@/hooks/useX402Payment";
import { makePaidRequest, decodePaymentResponse } from "@/utils/x402Client";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useBalance } from "@/hooks/useBalance";

interface PurchaseItemProps {
  itemId: string;
  itemName: string;
  apiEndpoint: string;
  price?: string; // Price in USDC (e.g., "0.01" for $0.01 USDC)
  onPurchaseSuccess?: (data: unknown) => void;
  onPurchaseError?: (error: Error) => void;
}

export default function PurchaseItem({
  itemId,
  itemName,
  apiEndpoint,
  price = "0.01", // Default price in USDC ($0.01)
  onPurchaseSuccess,
  onPurchaseError,
}: PurchaseItemProps) {
  const fetchWithPayment = useX402Payment();
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { balance, isLoading: isLoadingBalance, refresh: refreshBalance } = useBalance();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Check if balance is sufficient
  const priceAmount = parseFloat(price);
  const balanceAmount = balance ? parseFloat(balance) : 0;
  const isInsufficientBalance = balance !== null && !isLoadingBalance && balanceAmount < priceAmount;

  const handlePurchase = async () => {
    if (!isSignedIn) {
      setErrorMessage("Please sign in to purchase items");
      return;
    }

    // Check balance before attempting purchase
    if (isInsufficientBalance) {
      setErrorMessage(`Insufficient balance. You need $${price} USDC but only have $${balanceAmount.toFixed(2)} USDC.`);
      setPurchaseStatus("error");
      return;
    }

    setIsPurchasing(true);
    setPurchaseStatus("processing");
    setErrorMessage(null);

    try {
      const balanceBefore = balance;
      console.log("=== STARTING PURCHASE ===");
      console.log("Item ID:", itemId);
      console.log("Price:", price, "USDC");
      console.log("Balance before purchase:", balanceBefore, "USDC");
      console.log("Embedded wallet address:", evmAddress);
      
      const response = await makePaidRequest(
        fetchWithPayment,
        apiEndpoint,
        {
          method: "POST",
          body: JSON.stringify({ itemId }),
        }
      );

      console.log("Purchase response received:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const data = await response.json();
        const paymentResponse = decodePaymentResponse(
          response.headers.get("x-payment-response")
        );

        setPurchaseStatus("success");
        console.log("Purchase successful:", data);
        
        // ===== DETAILED PAYMENT DEBUGGING =====
        console.log("=== PAYMENT DEBUGGING ===");
        console.log("Payment response full object:", JSON.stringify(paymentResponse, null, 2));
        console.log("Payment from address:", paymentResponse?.from);
        console.log("Payment to address:", paymentResponse?.to);
        console.log("Payment transaction hash:", paymentResponse?.txHash);
        console.log("Payment amount:", paymentResponse?.amount);
        console.log("Payment facilitator:", paymentResponse?.facilitator);
        console.log("Payment scheme:", paymentResponse?.scheme);
        console.log("Payment network:", paymentResponse?.network);
        console.log("Embedded wallet address:", evmAddress);
        
        // Verify payment address matches embedded wallet
        if (paymentResponse?.from && evmAddress) {
          const paymentFrom = paymentResponse.from.toLowerCase();
          const walletAddress = evmAddress.toLowerCase();
          const addressesMatch = paymentFrom === walletAddress;
          
          console.log("=== ADDRESS VERIFICATION ===");
          console.log("Payment from:", paymentFrom);
          console.log("Wallet address:", walletAddress);
          console.log("Addresses match:", addressesMatch);
          
          if (!addressesMatch) {
            console.warn("⚠️ WARNING: Payment is NOT from the embedded wallet!");
            console.warn("This could mean:");
            console.warn("1. Payment is going through a facilitator");
            console.warn("2. Payment is using a different address");
            console.warn("3. Balance won't decrement from embedded wallet");
          } else {
            console.log("✅ Payment is from embedded wallet - balance should decrement");
          }
        }
        
        // Check for transaction hash
        if (paymentResponse?.txHash) {
          console.log("=== TRANSACTION INFO ===");
          console.log("Transaction hash:", paymentResponse.txHash);
          console.log("View on Base Sepolia Explorer:", 
            `https://sepolia.basescan.org/tx/${paymentResponse.txHash}`);
        } else {
          console.warn("⚠️ No transaction hash found - payment might be off-chain or batched");
        }
        
        console.log("=== END PAYMENT DEBUGGING ===");

        // Refresh balance after successful payment with retries
        // x402 payments might use facilitators or batching, so we need to wait longer
        let retries = 0;
        const maxRetries = 5;
        const checkBalance = async () => {
          console.log(`Refreshing balance (attempt ${retries + 1}/${maxRetries})...`);
          const balanceBeforeRefresh = balance;
          await refreshBalance();
          
          // Note: balance state might not update immediately, so we'll check in the next attempt
          if (retries === 0) {
            console.log("Balance before refresh:", balanceBeforeRefresh, "USDC");
          }
          
          retries++;
          if (retries < maxRetries) {
            setTimeout(checkBalance, 3000); // Check every 3 seconds
          } else {
            console.log("=== BALANCE CHECK COMPLETE ===");
            console.log("Final balance:", balance, "USDC");
            console.log("Balance before purchase:", balanceBefore, "USDC");
            const balanceDiff = balanceBefore ? parseFloat(balanceBefore) - (balance ? parseFloat(balance) : 0) : 0;
            console.log("Balance difference:", balanceDiff, "USDC");
            if (balanceDiff === 0) {
              console.warn("⚠️ Balance did not change - payment may not have been deducted from wallet");
            } else {
              console.log("✅ Balance changed by:", balanceDiff, "USDC");
            }
          }
        };
        
        // Start checking balance after 5 seconds (to allow for transaction confirmation)
        setTimeout(checkBalance, 5000);

        if (onPurchaseSuccess) {
          onPurchaseSuccess(data);
        }
      } else if (response.status === 402) {
        // 402 Payment Required - could be initial payment request or error
        try {
          const errorData = await response.json();
          
          // Check if it's an undeployed wallet error
          if (errorData.errorCode === "UNDEPLOYED_WALLET" || 
              errorData.error?.includes("not deployed") ||
              errorData.error?.includes("undeployed")) {
            setErrorMessage(
              "Your wallet needs to be deployed first. Please make a small transaction (e.g., request funds from the faucet) to deploy your wallet, then try again."
            );
            setPurchaseStatus("error");
            setIsPurchasing(false);
            if (onPurchaseError) {
              onPurchaseError(new Error("Wallet not deployed"));
            }
            return;
          }
          
          // Otherwise, it's a normal 402 - keep the button in loading state
          // The payment flow should be handled by x402-fetch automatically
          console.log("Payment required - keeping button in loading state");
          return; // Exit early, keep isPurchasing true
        } catch {
          // If we can't parse the error, treat it as a normal 402
          console.log("Payment required - keeping button in loading state");
          return;
        }
      } else {
        // Try to get error message from response body
        let errorText = "";
        try {
          const responseText = await response.text();
          errorText = responseText;
          
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(responseText);
            if (errorJson.error) {
              errorText = errorJson.error;
            } else if (errorJson.message) {
              errorText = errorJson.message;
            }
          } catch {
            // Not JSON, use text as-is
          }
        } catch {
          errorText = `Request failed with status ${response.status}`;
        }
        
        throw new Error(errorText || `Purchase failed with status ${response.status}`);
      }
    } catch (error) {
      let errorMsg = "An unexpected error occurred. Please try again.";
      
      // Helper function to extract user-friendly error from JSON
      const extractUserFriendlyError = (jsonString: string): string | null => {
        try {
          const parsed = JSON.parse(jsonString);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Extract meaningful error messages from validation errors
            const errors = parsed
              .map((err: { path?: string[]; message?: string }) => {
                if (err.path && err.path.length > 0) {
                  const field = err.path[err.path.length - 1];
                  const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1").trim();
                  if (err.message) {
                    // Clean up common validation messages
                    let message = err.message;
                    if (message.includes("Required")) {
                      message = "is required";
                    } else if (message.includes("Invalid")) {
                      message = "is invalid";
                    }
                    return `${fieldName} ${message}`;
                  }
                  return `${fieldName} is invalid`;
                }
                return err.message || "Invalid input";
              })
              .filter((msg: string) => msg && !msg.includes("undefined") && !msg.includes("Expected"));
            
            if (errors.length > 0) {
              return errors[0]; // Show the first meaningful error
            }
          }
        } catch {
          // Not valid JSON
        }
        return null;
      };
      
      if (error instanceof Error) {
        const originalMessage = error.message;

        console.log("Original message:", originalMessage);
        
        // Handle different types of errors with user-friendly messages
        if (originalMessage.includes("Payment amount exceeds maximum allowed")) {
          errorMsg = "The payment amount exceeds the maximum allowed. Please contact support.";
        } else if (originalMessage.includes("Payment already attempted")) {
          errorMsg = "A payment attempt is already in progress. Please wait for it to complete.";
        } else if (originalMessage.includes("402") || 
                   originalMessage.includes("Payment Required") ||
                   originalMessage.includes("Payment is required")) {
          // Don't show error for payment required - keep loading state
          setIsPurchasing(true);
          setPurchaseStatus("processing");
          setErrorMessage(null);
          return; // Exit early, keep button in loading state
        } else if (originalMessage.includes("network") || originalMessage.includes("Network")) {
          errorMsg = "Network error. Please check your connection and try again.";
        } else if (originalMessage.includes("insufficient") || originalMessage.includes("balance")) {
          errorMsg = "Insufficient balance. Please add USDC to your wallet.";
        } else if (originalMessage.includes("scheme") || originalMessage.includes("network") || originalMessage.includes("payTo")) {
          // Payment requirements validation errors
          errorMsg = "Payment configuration error. Please try again or contact support if the issue persists.";
        } else {
          // Check if the entire message is a JSON array
          const trimmed = originalMessage.trim();
          if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || 
              (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
            const friendly = extractUserFriendlyError(trimmed);
            if (friendly) {
              errorMsg = friendly;
            } else {
              errorMsg = "Invalid payment configuration. Please try again or contact support.";
            }
          } else {
            // Try to find JSON arrays/objects within the message
            const jsonArrayMatch = originalMessage.match(/\[[\s\S]*\]/);
            if (jsonArrayMatch) {
              const friendly = extractUserFriendlyError(jsonArrayMatch[0]);
              if (friendly) {
                errorMsg = friendly;
              }
            } else {
              // Check if message contains JSON-like content
              const jsonObjectMatch = originalMessage.match(/\{[\s\S]*\}/);
              if (jsonObjectMatch) {
                const friendly = extractUserFriendlyError(jsonObjectMatch[0]);
                if (friendly) {
                  errorMsg = friendly;
                }
              } else if (originalMessage.length < 200 && !originalMessage.includes("{")) {
                // If it's a short, clean message, use it directly
                errorMsg = originalMessage
                  .replace(/Error:|error:/g, "")
                  .replace(/Purchase failed with status \d+:/g, "")
                  .trim();
              }
            }
          }
        }
      } else if (typeof error === "string") {
        // Handle string errors
        const friendly = extractUserFriendlyError(error);
        if (friendly) {
          errorMsg = friendly;
        } else if (error.length < 200) {
          errorMsg = error;
        }
      }
      
      setPurchaseStatus("error");
      setErrorMessage(errorMsg);
      console.error("Purchase error:", error);

      if (onPurchaseError) {
        onPurchaseError(
          error instanceof Error ? error : new Error(errorMsg)
        );
      }
    } finally {
      // Don't reset loading state if we're waiting for payment (402)
      // Keep the button in loading state until payment is approved
      if (purchaseStatus !== "processing") {
        setIsPurchasing(false);
      }
    }
  };

  if (!isSignedIn) {
    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #dcdfe4",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <p style={{ marginBottom: "16px" }}>
          Please sign in to purchase items
        </p>
        <AuthButton />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        maxWidth: "400px",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "12px", color: "#0a0b0d", fontSize: "20px", fontWeight: "600" }}>{itemName}</h3>
      <p style={{ color: "#4a5568", marginBottom: "8px", fontSize: "14px" }}>
        Item ID: {itemId}
      </p>
      <p style={{ color: "#0a0b0d", marginBottom: "16px", fontSize: "20px", fontWeight: "700" }}>
        Price: ${price} USDC
      </p>

      <button
        onClick={handlePurchase}
        disabled={isPurchasing || purchaseStatus === "processing" || isInsufficientBalance}
        style={{
          width: "100%",
          padding: "12px 24px",
          backgroundColor: purchaseStatus === "success" ? "#098551" : "#098551",
          color: "#ffffff",
          border: "none",
          borderRadius: "var(--cdp-web-borderRadius-full)",
          fontSize: "16px",
          fontWeight: "600",
          cursor:
            isPurchasing || purchaseStatus === "processing" || isInsufficientBalance
              ? "not-allowed"
              : "pointer",
          opacity:
            isPurchasing || purchaseStatus === "processing" || isInsufficientBalance ? 0.6 : 1,
        }}
      >
        {isPurchasing || purchaseStatus === "processing"
          ? "Processing Payment..."
          : purchaseStatus === "success"
          ? "Purchased"
          : `Purchase ${itemName}`}
      </button>

      {/* All messages appear below the button */}
      {isInsufficientBalance && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "4px",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px", color: "#856404" }}>
            Insufficient Balance
          </div>
          <div style={{ fontSize: "14px", color: "#856404" }}>
            You need ${price} USDC but only have ${balanceAmount.toFixed(2)} USDC.
            <br />
            Please add USDC to your wallet to complete this purchase.
          </div>
        </div>
      )}

      {purchaseStatus === "processing" && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "4px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#856404",
              margin: 0,
              fontWeight: "600",
            }}
          >
            Payment Required
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#856404",
              margin: "4px 0 0 0",
            }}
          >
            Please approve the payment in your wallet to complete the purchase.
          </p>
        </div>
      )}

      {purchaseStatus === "success" && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "#e8f5e9",
            color: "#098551",
            borderRadius: "4px",
          }}
        >
          Purchase successful!
        </div>
      )}

      {purchaseStatus === "error" && errorMessage && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "#ffebee",
            color: "#cf202f",
            borderRadius: "4px",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>Error</div>
          <div style={{ fontSize: "14px" }}>{errorMessage}</div>
        </div>
      )}
    </div>
  );
}

