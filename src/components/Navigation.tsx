import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useBalance } from "@/hooks/useBalance";
import { AuthButton } from "@coinbase/cdp-react";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";

export default function Navigation() {
  const { isSignedIn } = useIsSignedIn();
  const { usdcBalance, ethBalance, isLoading, error } = useBalance();
  const { evmAddress } = useEvmAddress();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const copyAddress = async () => {
    if (!evmAddress) return;
    
    try {
      await navigator.clipboard.writeText(evmAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Close dropdown when clicking outside or pressing ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [showDropdown]);

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
          <Link
            href="/faucet"
            style={{
              color: "#0a0b0d",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            Faucet
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {isSignedIn && (
          <>
            {/* Balance Display */}
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
              {isLoading ? (
                <span style={{ color: "#5b616e", fontSize: "16px" }}>Loading...</span>
              ) : error ? (
                <span style={{ color: "#cf202f", fontSize: "14px" }}>{error}</span>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {usdcBalance !== null && (
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: parseFloat(usdcBalance) === 0 ? "#cf202f" : "#0a0b0d",
                      }}
                    >
                      ${parseFloat(usdcBalance).toFixed(2)} USDC
                    </span>
                  )}
                  {ethBalance !== null && (
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: parseFloat(ethBalance) === 0 ? "#cf202f" : "#0a0b0d",
                      }}
                    >
                      {parseFloat(ethBalance).toFixed(4)} ETH
                    </span>
                  )}
                  {usdcBalance === null && ethBalance === null && (
                    <span style={{ fontSize: "16px", color: "#5b616e" }}>N/A</span>
                  )}
                </div>
              )}
            </div>

            {/* Account Dropdown */}
            <div
              ref={dropdownRef}
              style={{
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  backgroundColor: showDropdown ? "#f1f5f9" : "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "var(--cdp-web-borderRadius-full)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: showDropdown ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
                onMouseEnter={(e) => {
                  if (!showDropdown) {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showDropdown) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }
                }}
                aria-label="Account menu"
                aria-expanded={showDropdown}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#098551",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {evmAddress ? (
                    evmAddress.slice(2, 4).toUpperCase()
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  )}
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    color: "#4a5568",
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    minWidth: "320px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                    zIndex: 1000,
                    overflow: "hidden",
                    animation: "fadeIn 0.15s ease-out",
                  }}
                >
                  <div
                    style={{
                      padding: "20px",
                      borderBottom: "1px solid #e2e8f0",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#64748b",
                        marginBottom: "16px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Account
                    </div>
                    {evmAddress && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: "#098551",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontSize: "14px",
                            fontWeight: "600",
                            flexShrink: 0,
                          }}
                        >
                          {evmAddress.slice(2, 4).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "13px",
                              fontFamily: "monospace",
                              color: "#0a0b0d",
                              wordBreak: "break-all",
                              lineHeight: "1.4",
                            }}
                          >
                            {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              marginTop: "4px",
                            }}
                          >
                            Wallet Address
                          </div>
                        </div>
                        <button
                          onClick={copyAddress}
                          title={copied ? "Copied!" : "Copy wallet address"}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "8px",
                            backgroundColor: copied ? "#098551" : "#f1f5f9",
                            color: copied ? "#ffffff" : "#4a5568",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            if (!copied) {
                              e.currentTarget.style.backgroundColor = "#e2e8f0";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!copied) {
                              e.currentTarget.style.backgroundColor = "#f1f5f9";
                            }
                          }}
                        >
                          {copied ? (
                            <span style={{ fontSize: "14px", fontWeight: "600" }}>
                              ✓
                            </span>
                          ) : (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px" }}>
                    <AuthButton />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {!isSignedIn && <AuthButton />}
      </div>
    </nav>
  );
}

