import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { AuthButton } from "@coinbase/cdp-react";

export default function AccountDropdown() {
  const { isSignedIn, evmAddress, authType, isLoading: authLoading } = useUnifiedAuth();
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

  // Show loading state while Farcaster auth is initializing (prevents flash of "sign in")
  if (authLoading && authType === 'farcaster') {
    return (
      <div style={{ 
        padding: "8px 16px", 
        color: "#E8A855", 
        fontSize: "0.9rem",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        <span>Authenticating...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    // Show CDP AuthButton only for CDP auth (Farcaster auth is automatic)
    if (authType === 'cdp') {
      return <AuthButton />;
    }
    // For Farcaster, show nothing or a loading state
    return null;
  }

  return (
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
          backgroundColor: showDropdown ? "rgba(45, 90, 61, 0.5)" : "rgba(45, 90, 61, 0.3)",
          border: "1px solid rgba(232, 168, 85, 0.3)",
          borderRadius: "var(--cdp-web-borderRadius-full)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: showDropdown ? "0 2px 4px rgba(0, 0, 0, 0.3)" : "0 1px 2px rgba(0, 0, 0, 0.2)",
        }}
        onMouseEnter={(e) => {
          if (!showDropdown) {
            e.currentTarget.style.backgroundColor = "rgba(45, 90, 61, 0.4)";
          }
        }}
        onMouseLeave={(e) => {
          if (!showDropdown) {
            e.currentTarget.style.backgroundColor = "rgba(45, 90, 61, 0.3)";
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
            backgroundColor: "#E8A855",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0A1410",
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
            color: "#E8A855",
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
            backgroundColor: "#0A1410",
            border: "1px solid rgba(232, 168, 85, 0.3)",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid rgba(232, 168, 85, 0.2)",
              backgroundColor: "rgba(45, 90, 61, 0.2)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#D0D0D0",
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
                    backgroundColor: "rgba(10, 20, 16, 0.5)",
                    borderRadius: "8px",
                    border: "1px solid rgba(232, 168, 85, 0.2)",
                  }}
                >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#E8A855",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0A1410",
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
                      color: "#F5F5F5",
                      wordBreak: "break-all",
                      lineHeight: "1.4",
                    }}
                  >
                    {evmAddress.slice(0, 6)}...{evmAddress.slice(-4)}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#D0D0D0",
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
                    backgroundColor: copied ? "#E8A855" : "rgba(45, 90, 61, 0.3)",
                    color: copied ? "#0A1410" : "#E8A855",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) {
                      e.currentTarget.style.backgroundColor = "rgba(45, 90, 61, 0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) {
                      e.currentTarget.style.backgroundColor = "rgba(45, 90, 61, 0.3)";
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
          
          {/* Menu Links */}
          <div style={{ padding: "8px" }}>
            <DropdownLink href="/dashboard" onClick={() => setShowDropdown(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </DropdownLink>
            <DropdownLink href="/faucet" onClick={() => setShowDropdown(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Faucet
            </DropdownLink>
            <DropdownLink href="/contracts" onClick={() => setShowDropdown(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Contracts
            </DropdownLink>
          </div>

          {/* Sign out section - only show for CDP auth */}
          {authType === 'cdp' && (
            <div style={{ padding: "12px", borderTop: "1px solid rgba(232, 168, 85, 0.2)" }}>
              <AuthButton />
            </div>
          )}
          {/* For Farcaster, show auth type indicator */}
          {authType === 'farcaster' && (
            <div style={{ padding: "12px", borderTop: "1px solid rgba(232, 168, 85, 0.2)", fontSize: "11px", color: "#D0D0D0", textAlign: "center" }}>
              Authenticated via Farcaster
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DropdownLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        color: "#F5F5F5",
        textDecoration: "none",
        fontSize: "14px",
        borderRadius: "8px",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(45, 90, 61, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </Link>
  );
}

