import Link from "next/link";
import { useBalance } from "@/hooks/useBalance";
import { AuthButton } from "@coinbase/cdp-react";
import { useIsSignedIn } from "@coinbase/cdp-hooks";

export default function Navigation() {
  const { isSignedIn } = useIsSignedIn();
  const { balance, isLoading, error } = useBalance();

  return (
    <nav
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #dcdfe4",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <Link
          href="/"
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "#098551",
            textDecoration: "none",
          }}
        >
          Mystic Island
        </Link>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link
            href="/"
            style={{
              color: "#0a0b0d",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            Home
          </Link>
          <Link
            href="/purchase"
            style={{
              color: "#0a0b0d",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            Shop
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {isSignedIn && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 16px",
              backgroundColor: "#eef0f3",
              borderRadius: "var(--cdp-web-borderRadius-full)",
            }}
          >
            <span style={{ fontSize: "14px", color: "#5b616e" }}>Balance:</span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: balance && parseFloat(balance) === 0 ? "#cf202f" : "#0a0b0d",
              }}
            >
              {isLoading ? (
                <span style={{ color: "#5b616e" }}>Loading...</span>
              ) : error ? (
                <span style={{ color: "#cf202f", fontSize: "14px" }}>{error}</span>
              ) : balance !== null ? (
                `${parseFloat(balance).toFixed(4)} USDC`
              ) : (
                "N/A"
              )}
            </span>
          </div>
        )}
        <AuthButton />
      </div>
    </nav>
  );
}

