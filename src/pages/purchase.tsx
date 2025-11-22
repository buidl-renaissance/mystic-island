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
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ marginBottom: "8px", color: "#0a0b0d" }}>
            Game Item Shop
          </h1>
          <p style={{ color: "#5b616e", marginBottom: "40px" }}>
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
              price="0.001"
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
              price="0.001"
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
              price="0.001"
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
              padding: "24px",
              backgroundColor: "#eef0f3",
              borderRadius: "8px",
              marginTop: "40px",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
              How It Works
            </h2>
            <ol style={{ color: "#5b616e", lineHeight: "1.8" }}>
              <li>Click &quot;Purchase&quot; on any item</li>
              <li>
                If you&apos;re not signed in, you&apos;ll be prompted to sign in
                with your wallet
              </li>
              <li>
                The system makes a request to the API endpoint (which returns a
                402 Payment Required response)
              </li>
              <li>
                The x402 integration automatically detects the payment
                requirement
              </li>
              <li>
                You&apos;ll be prompted to approve the payment in your wallet
              </li>
              <li>
                Once approved, the request is retried with the payment header
              </li>
              <li>The purchase completes successfully!</li>
            </ol>
            <p style={{ marginTop: "16px", color: "#5b616e" }}>
              <strong>Note:</strong> This is a demo. To use with a real API,
              update the <code>apiEndpoint</code> prop to point to your x402-enabled
              API endpoint.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

