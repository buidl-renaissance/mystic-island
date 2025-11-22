import { useState } from "react";
import { useX402Payment } from "@/hooks/useX402Payment";
import { makePaidRequest, decodePaymentResponse } from "@/utils/x402Client";
import { useIsSignedIn } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useBalance } from "@/hooks/useBalance";

interface PurchaseItemProps {
  itemId: string;
  itemName: string;
  apiEndpoint: string;
  price?: string; // Price in USDC (e.g., "0.001" for 0.001 USDC)
  onPurchaseSuccess?: (data: any) => void;
  onPurchaseError?: (error: Error) => void;
}

export default function PurchaseItem({
  itemId,
  itemName,
  apiEndpoint,
  price = "0.001", // Default price in USDC
  onPurchaseSuccess,
  onPurchaseError,
}: PurchaseItemProps) {
  const fetchWithPayment = useX402Payment();
  const { isSignedIn } = useIsSignedIn();
  const { balance, isLoading: isLoadingBalance } = useBalance();
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
      setErrorMessage(`Insufficient balance. You need ${price} USDC but only have ${balanceAmount.toFixed(6)} USDC.`);
      setPurchaseStatus("error");
      return;
    }

    setIsPurchasing(true);
    setPurchaseStatus("processing");
    setErrorMessage(null);

    try {
      const response = await makePaidRequest(
        fetchWithPayment,
        apiEndpoint,
        {
          method: "POST",
          body: JSON.stringify({ itemId }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const paymentResponse = decodePaymentResponse(
          response.headers.get("x-payment-response")
        );

        setPurchaseStatus("success");
        console.log("Purchase successful:", data);
        console.log("Payment details:", paymentResponse);

        if (onPurchaseSuccess) {
          onPurchaseSuccess(data);
        }
      } else if (response.status === 402) {
        // 402 Payment Required - this should be handled by x402-fetch automatically
        // If we reach here, it means the payment flow didn't complete properly
        // This could happen if payment requirements are invalid or payment was rejected
        throw new Error("Payment is required to complete this purchase. Please approve the payment in your wallet.");
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
              .map((err: any) => {
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
        
        // Handle different types of errors with user-friendly messages
        if (originalMessage.includes("Payment amount exceeds maximum allowed")) {
          errorMsg = "The payment amount exceeds the maximum allowed. Please contact support.";
        } else if (originalMessage.includes("Payment already attempted")) {
          errorMsg = "A payment attempt is already in progress. Please wait for it to complete.";
        } else if (originalMessage.includes("402") || 
                   originalMessage.includes("Payment Required") ||
                   originalMessage.includes("Payment is required")) {
          errorMsg = "Payment is required to complete this purchase. Please approve the payment in your wallet.";
        } else if (originalMessage.includes("network") || originalMessage.includes("Network")) {
          errorMsg = "Network error. Please check your connection and try again.";
        } else if (originalMessage.includes("insufficient") || originalMessage.includes("balance")) {
          errorMsg = "Insufficient balance. Please add funds to your wallet.";
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
      setIsPurchasing(false);
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
        padding: "20px",
        border: "1px solid #dcdfe4",
        borderRadius: "8px",
        maxWidth: "400px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "12px" }}>{itemName}</h3>
      <p style={{ color: "#5b616e", marginBottom: "8px" }}>
        Item ID: {itemId}
      </p>
      <p style={{ color: "#0a0b0d", marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>
        Price: {price} USDC
      </p>

      {/* Insufficient Balance Warning */}
      {isInsufficientBalance && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px", color: "#856404" }}>
            Insufficient Balance
          </div>
          <div style={{ fontSize: "14px", color: "#856404" }}>
            You need {price} USDC but only have {balanceAmount.toFixed(6)} USDC.
            <br />
            Please add funds to your wallet to complete this purchase.
          </div>
        </div>
      )}

      {purchaseStatus === "success" && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f5e9",
            color: "#098551",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          Purchase successful!
        </div>
      )}

      {purchaseStatus === "error" && errorMessage && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#ffebee",
            color: "#cf202f",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px" }}>Error</div>
          <div style={{ fontSize: "14px" }}>{errorMessage}</div>
        </div>
      )}

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
    </div>
  );
}

