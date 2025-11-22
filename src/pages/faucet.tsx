import Head from "next/head";
import { useState } from "react";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useBalance } from "@/hooks/useBalance";
import Link from "next/link";

type TokenType = "eth" | "usdc" | "eurc" | "cbbtc";
type NetworkType = "base-sepolia" | "ethereum-sepolia";

interface FaucetRequest {
  token: TokenType;
  network: NetworkType;
}

const TOKEN_INFO: Record<TokenType, { name: string; amount: string; limit: string }> = {
  eth: { name: "ETH", amount: "0.0001 ETH", limit: "0.1 ETH per 24h" },
  usdc: { name: "USDC", amount: "1 USDC", limit: "10 USDC per 24h" },
  eurc: { name: "EURC", amount: "1 EURC", limit: "10 EURC per 24h" },
  cbbtc: { name: "cbBTC", amount: "0.0001 cbBTC", limit: "0.001 cbBTC per 24h" },
};

export default function FaucetPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { usdcBalance, ethBalance, isLoading: isLoadingBalance } = useBalance();
  const [selectedToken, setSelectedToken] = useState<TokenType>("eth");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>("base-sepolia");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"idle" | "success" | "error">("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestFunds = async () => {
    if (!evmAddress) {
      setErrorMessage("Please connect your wallet first");
      setRequestStatus("error");
      return;
    }

    setIsRequesting(true);
    setRequestStatus("idle");
    setErrorMessage(null);
    setTransactionHash(null);

    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: evmAddress,
          token: selectedToken,
          network: selectedNetwork,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request funds from faucet");
      }

      setRequestStatus("success");
      setTransactionHash(data.transactionHash);
      
      // Refresh balance after a short delay to allow transaction to settle
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setRequestStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Faucet - Mystic Island</title>
          <meta name="description" content="Get testnet funds for your wallet" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div
          style={{
            minHeight: "100vh",
            padding: "40px 20px",
            backgroundColor: "#ffffff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "40px",
              border: "1px solid #dcdfe4",
              borderRadius: "8px",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            <h1 style={{ marginTop: 0, marginBottom: "16px", color: "#0a0b0d" }}>Faucet</h1>
            <p style={{ color: "#0a0b0d", marginBottom: "24px" }}>
              Please sign in to request testnet funds
            </p>
            <AuthButton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Faucet - Mystic Island</title>
        <meta name="description" content="Get testnet funds for your wallet" />
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
          <h1 style={{ marginBottom: "8px", color: "#0a0b0d", fontWeight: "700" }}>Testnet Faucet</h1>
          <p style={{ color: "#0a0b0d", marginBottom: "40px", fontSize: "16px" }}>
            Request testnet funds for your embedded wallet. Funds are provided by the
            Coinbase Developer Platform faucet for testing purposes.
          </p>

          {/* Current Balance */}
          <div
            style={{
              padding: "24px",
              backgroundColor: "#eef0f3",
              borderRadius: "8px",
              marginBottom: "32px",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", color: "#0a0b0d", fontWeight: "600" }}>
              Current Balance
            </h2>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {isLoadingBalance ? (
                <span style={{ color: "#0a0b0d" }}>Loading...</span>
              ) : (
                <>
                  {usdcBalance !== null && (
                    <div>
                      <span style={{ color: "#0a0b0d", fontSize: "14px", fontWeight: "500" }}>USDC: </span>
                      <span style={{ fontWeight: "600", fontSize: "16px", color: "#0a0b0d" }}>
                        ${parseFloat(usdcBalance).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {ethBalance !== null && (
                    <div>
                      <span style={{ color: "#0a0b0d", fontSize: "14px", fontWeight: "500" }}>ETH: </span>
                      <span style={{ fontWeight: "600", fontSize: "16px", color: "#0a0b0d" }}>
                        {parseFloat(ethBalance).toFixed(4)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Faucet Request Form */}
          <div
            style={{
              padding: "24px",
              border: "1px solid #dcdfe4",
              borderRadius: "8px",
              marginBottom: "32px",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "18px", color: "#0a0b0d", fontWeight: "600" }}>
              Request Funds
            </h2>

            {/* Network Selection */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#0a0b0d",
                }}
              >
                Network
              </label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value as NetworkType)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #dcdfe4",
                  borderRadius: "var(--cdp-web-borderRadius-lg)",
                  fontSize: "16px",
                  backgroundColor: "#ffffff",
                  color: "#0a0b0d",
                  cursor: "pointer",
                }}
              >
                <option value="base-sepolia">Base Sepolia</option>
                <option value="ethereum-sepolia">Ethereum Sepolia</option>
              </select>
            </div>

            {/* Token Selection */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#0a0b0d",
                }}
              >
                Token
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                {(Object.keys(TOKEN_INFO) as TokenType[]).map((token) => {
                  const info = TOKEN_INFO[token];
                  const isSelected = selectedToken === token;
                  return (
                    <button
                      key={token}
                      onClick={() => setSelectedToken(token)}
                      style={{
                        padding: "16px",
                        border: `2px solid ${isSelected ? "#098551" : "#dcdfe4"}`,
                        borderRadius: "var(--cdp-web-borderRadius-lg)",
                        backgroundColor: isSelected ? "#e8f5e9" : "#ffffff",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                        color: "#0a0b0d",
                      }}
                    >
                      <div style={{ fontWeight: "600", marginBottom: "4px", color: "#0a0b0d" }}>
                        {info.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#0a0b0d" }}>
                        {info.amount}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wallet Address Display */}
            {evmAddress && (
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0a0b0d",
                  }}
                >
                  Wallet Address
                </label>
                <div
                  style={{
                    padding: "12px",
                    backgroundColor: "#eef0f3",
                    borderRadius: "var(--cdp-web-borderRadius-lg)",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    wordBreak: "break-all",
                    color: "#0a0b0d",
                    border: "1px solid #dcdfe4",
                  }}
                >
                  {evmAddress}
                </div>
              </div>
            )}

            {/* Status Messages */}
            {requestStatus === "success" && transactionHash && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#e8f5e9",
                  border: "1px solid #098551",
                  borderRadius: "4px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "4px", color: "#098551" }}>
                  Funds Requested Successfully!
                </div>
                <div style={{ fontSize: "14px", color: "#098551" }}>
                  Transaction:{" "}
                  <a
                    href={`https://sepolia.basescan.org/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#098551", textDecoration: "underline" }}
                  >
                    {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                  </a>
                </div>
              </div>
            )}

            {requestStatus === "error" && errorMessage && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#ffebee",
                  border: "1px solid #cf202f",
                  borderRadius: "4px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "4px", color: "#cf202f" }}>
                  Error
                </div>
                <div style={{ fontSize: "14px", color: "#cf202f" }}>{errorMessage}</div>
              </div>
            )}

            {/* Request Button */}
            <button
              onClick={handleRequestFunds}
              disabled={isRequesting || !evmAddress}
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor: isRequesting ? "#5b616e" : "#098551",
                color: "#ffffff",
                border: "none",
                borderRadius: "var(--cdp-web-borderRadius-full)",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isRequesting || !evmAddress ? "not-allowed" : "pointer",
                opacity: isRequesting || !evmAddress ? 0.6 : 1,
              }}
            >
              {isRequesting
                ? "Requesting Funds..."
                : `Request ${TOKEN_INFO[selectedToken].amount}`}
            </button>
          </div>

          {/* Rate Limits Info */}
          <div
            style={{
              padding: "24px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dcdfe4",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px", color: "#0a0b0d", fontWeight: "600" }}>
              Rate Limits
            </h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#0a0b0d" }}>
              To prevent abuse, faucet requests are rate-limited per wallet address and
              per user. Limits apply within a rolling 24-hour window:
            </p>
            <ul style={{ margin: "12px 0 0 0", paddingLeft: "20px", color: "#0a0b0d" }}>
              {(Object.keys(TOKEN_INFO) as TokenType[]).map((token) => {
                const info = TOKEN_INFO[token];
                return (
                  <li key={token} style={{ marginBottom: "4px", fontSize: "14px", color: "#0a0b0d" }}>
                    <strong style={{ color: "#0a0b0d" }}>{info.name}:</strong> {info.limit}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

