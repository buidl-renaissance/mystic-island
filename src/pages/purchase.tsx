import Head from "next/head";
import PurchaseItem from "@/components/PurchaseItem";

/**
 * Example page demonstrating x402 paywall integration for purchasing game items
 * 
 * This page shows how to use the PurchaseItem component to handle payments
 * for game items that require payment via x402.
 * 
 * To use this with a real API:
 * 1. Set up an API endpoint that returns 402 Payment Required responses
 * 2. Update the apiEndpoint prop to point to your API
 * 3. Ensure your API implements the x402 payment protocol
 */
export default function PurchasePage() {
  return (
    <>
      <Head>
        <title>Purchase Items - Mystic Island</title>
        <meta name="description" content="Purchase game items with x402 payments" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{
          minHeight: "100vh",
          padding: "40px 20px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ marginBottom: "12px", color: "#0a0b0d", fontSize: "32px", fontWeight: "700" }}>
            Game Item Shop
          </h1>
          <p style={{ color: "#2d3748", marginBottom: "40px", fontSize: "16px", lineHeight: "1.6" }}>
            Purchase items using x402 payment integration. Payments are handled
            automatically when you make a purchase request.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
              marginBottom: "40px",
            }}
          >
            <PurchaseItem
              itemId="sword-001"
              itemName="Legendary Sword"
              apiEndpoint="/api/purchase-item"
              price="0.01"
              onPurchaseSuccess={(data) => {
                console.log("Purchase successful:", data);
              }}
              onPurchaseError={(error) => {
                console.error("Purchase failed:", error);
              }}
            />

            <PurchaseItem
              itemId="shield-001"
              itemName="Magic Shield"
              apiEndpoint="/api/purchase-item"
              price="0.01"
              onPurchaseSuccess={(data) => {
                console.log("Purchase successful:", data);
              }}
              onPurchaseError={(error) => {
                console.error("Purchase failed:", error);
              }}
            />

            <PurchaseItem
              itemId="potion-001"
              itemName="Health Potion"
              apiEndpoint="/api/purchase-item"
              price="0.01"
              onPurchaseSuccess={(data) => {
                console.log("Purchase successful:", data);
              }}
              onPurchaseError={(error) => {
                console.error("Purchase failed:", error);
              }}
            />
          </div>

          <div
            style={{
              padding: "28px",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              marginTop: "40px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#0a0b0d", fontSize: "24px", fontWeight: "600" }}>
              How It Works
            </h2>
            <ol style={{ color: "#2d3748", lineHeight: "1.8", fontSize: "15px", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "8px" }}>Click &quot;Purchase&quot; on any item</li>
              <li style={{ marginBottom: "8px" }}>
                If you&apos;re not signed in, you&apos;ll be prompted to sign in
                with your wallet
              </li>
              <li style={{ marginBottom: "8px" }}>
                The system makes a request to the API endpoint (which returns a
                402 Payment Required response)
              </li>
              <li style={{ marginBottom: "8px" }}>
                The x402 integration automatically detects the payment
                requirement
              </li>
              <li style={{ marginBottom: "8px" }}>
                You&apos;ll be prompted to approve the payment in your wallet
              </li>
              <li style={{ marginBottom: "8px" }}>
                Once approved, the request is retried with the payment header
              </li>
              <li>The purchase completes successfully!</li>
            </ol>
            <p style={{ marginTop: "20px", color: "#4a5568", fontSize: "14px", lineHeight: "1.6" }}>
              <strong style={{ color: "#0a0b0d" }}>Note:</strong> This is a demo. To use with a real API,
              update the <code style={{ backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontFamily: "monospace", fontSize: "13px", color: "#0a0b0d" }}>apiEndpoint</code> prop to point to your x402-enabled
              API endpoint.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

