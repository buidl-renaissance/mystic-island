import Head from "next/head";
import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { CONTRACT_ADDRESSES } from "@/utils/contracts";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";

// Fonts
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Color Palette
const colors = {
  emeraldSpirit: "#2D5A3D",
  deepForest: "#0A1410",
  sunlitGold: "#E8A855",
  skyDawn: "#4A7A9A",
  lotusPink: "#B85A8F",
  sunsetOrange: "#C76A2A",
  orchidPurple: "#5A3F8F",
  jungleCyan: "#4A9A7A",
  textPrimary: "#F5F5F5",
  textSecondary: "#D0D0D0",
  textMuted: "#A0A0A0",
};

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${colors.deepForest} 0%, #0f1a15 100%);
  color: ${colors.textPrimary};
  padding: 2rem;
  ${inter.variable}
  font-family: var(--font-inter);
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  ${cinzel.variable}
  font-family: var(--font-cinzel);
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: ${colors.sunlitGold};
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(232, 168, 85, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${colors.textSecondary};
  margin-top: 0.5rem;
`;

const Card = styled.div`
  background: rgba(45, 90, 61, 0.3);
  border: 1px solid rgba(232, 168, 85, 0.3);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 1rem;
  color: ${colors.textSecondary};
  margin-bottom: 0.5rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  font-family: monospace;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${colors.sunlitGold};
    box-shadow: 0 0 0 3px rgba(232, 168, 85, 0.1);
  }
  
  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  font-family: monospace;
  min-height: 100px;
  resize: vertical;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${colors.sunlitGold};
    box-shadow: 0 0 0 3px rgba(232, 168, 85, 0.1);
  }
  
  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const Button = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 1rem 2rem;
  background: ${(props) =>
    props.disabled
      ? "rgba(160, 160, 160, 0.2)"
      : `linear-gradient(135deg, ${colors.sunlitGold} 0%, ${colors.sunsetOrange} 100%)`};
  border: none;
  border-radius: 12px;
  color: ${colors.textPrimary};
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.3s ease;
  ${cinzel.variable}
  font-family: var(--font-cinzel);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
  }
`;

const InfoBox = styled.div`
  background: rgba(74, 122, 154, 0.2);
  border: 1px solid ${colors.skyDawn};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const InfoTitle = styled.h3`
  color: ${colors.skyDawn};
  margin-bottom: 0.5rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
  font-size: 1.2rem;
`;

const InfoText = styled.p`
  color: ${colors.textSecondary};
  line-height: 1.6;
  margin: 0.5rem 0;
`;

const ErrorMessage = styled.div`
  background: rgba(199, 106, 42, 0.2);
  border: 1px solid ${colors.sunsetOrange};
  border-radius: 12px;
  padding: 1rem;
  color: ${colors.sunsetOrange};
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.div`
  background: rgba(74, 154, 122, 0.2);
  border: 1px solid ${colors.jungleCyan};
  border-radius: 12px;
  padding: 1rem;
  color: ${colors.jungleCyan};
  margin-bottom: 1rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(232, 168, 85, 0.3);
  border-radius: 50%;
  border-top-color: ${colors.sunlitGold};
  animation: ${pulse} 1s linear infinite;
  margin-right: 0.5rem;
  vertical-align: middle;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 2rem;
  color: ${colors.textSecondary};
  text-decoration: none;
  transition: color 0.2s;
  
  &:hover {
    color: ${colors.sunlitGold};
  }
`;

export default function CreateArtifactPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();

  const [recipientAddress, setRecipientAddress] = useState("");
  const [artifactUri, setArtifactUri] = useState("");
  const [artifactMetadata, setArtifactMetadata] = useState<{
    title: string;
    description: string;
    metadataIpfsUrl: string;
  } | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<"idle" | "success" | "error">("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);

  const handleMint = async () => {
    if (!isSignedIn || !evmAddress) {
      setErrorMessage("Please connect your wallet first");
      setMintStatus("error");
      return;
    }

    if (!recipientAddress || !artifactUri) {
      setErrorMessage("Please fill in recipient address and upload an image");
      setMintStatus("error");
      return;
    }

    // Basic address validation
    if (!recipientAddress.startsWith("0x") || recipientAddress.length !== 42) {
      setErrorMessage("Invalid recipient address. Must be a valid Ethereum address.");
      setMintStatus("error");
      return;
    }

    setIsMinting(true);
    setMintStatus("idle");
    setErrorMessage(null);
    setTransactionHash(null);
    setMintedTokenId(null);

    try {
      console.log("Minting artifact...", {
        to: recipientAddress,
        uri: artifactUri,
        contract: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION,
      });

      // Call the API endpoint which handles the transaction on Saga chainlet
      const response = await fetch("/api/mint-artifact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientAddress,
          artifactUri,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mint artifact");
      }

      console.log("Mint transaction sent:", data);
      setTransactionHash(data.transactionHash || null);
      setMintStatus("success");
    } catch (error) {
      console.error("Error minting artifact:", error);
      setMintStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to mint artifact. Make sure you're the contract owner."
      );
    } finally {
      setIsMinting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Create Artifact - Mystic Island</title>
          <meta name="description" content="Mint a new artifact NFT" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Create Artifact</Title>
              <Subtitle>Mint a new artifact NFT</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to create artifacts
                </p>
                <AuthButton />
              </div>
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Create Artifact - Mystic Island</title>
        <meta name="description" content="Mint a new artifact NFT" />
      </Head>
      <PageContainer>
        <Container>
          <BackLink href="/">← Back to Home</BackLink>

          <Header>
            <Title>Create Artifact</Title>
            <Subtitle>Mint a new artifact NFT</Subtitle>
          </Header>

          <InfoBox>
            <InfoTitle>ℹ️ Important Information</InfoTitle>
            <InfoText>
              <strong>Owner Only:</strong> Only the contract owner can mint artifacts.
            </InfoText>
            <InfoText>
              <strong>Contract Address:</strong> {CONTRACT_ADDRESSES.ARTIFACT_COLLECTION}
            </InfoText>
            <InfoText>
              <strong>Your Address:</strong> {evmAddress || "Not connected"}
            </InfoText>
            <InfoText>
              <strong>Image Upload:</strong> Upload an image and AI will automatically generate a title and description for your artifact
            </InfoText>
          </InfoBox>

          <Card>
            {errorMessage && (
              <ErrorMessage>{errorMessage}</ErrorMessage>
            )}

            {mintStatus === "success" && (
              <SuccessMessage>
                ✅ Artifact minted successfully!
                {transactionHash && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                    Transaction: {transactionHash.slice(0, 10)}...
                  </div>
                )}
              </SuccessMessage>
            )}

            <FormGroup>
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                disabled={isMinting}
              />
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: colors.textMuted }}>
                The address that will receive the artifact NFT
              </div>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="image">Artifact Image</Label>
              <ImageUpload
                onUploadComplete={(metadata) => {
                  setArtifactUri(metadata.metadataIpfsUrl);
                  setArtifactMetadata({
                    title: metadata.title,
                    description: metadata.description,
                    metadataIpfsUrl: metadata.metadataIpfsUrl,
                  });
                }}
                onError={(error) => {
                  setErrorMessage(error);
                  setMintStatus("error");
                }}
                disabled={isMinting}
              />
              {artifactMetadata && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "rgba(74, 154, 122, 0.1)",
                    border: "1px solid rgba(74, 154, 122, 0.3)",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ color: colors.jungleCyan, fontWeight: 600, marginBottom: "0.5rem" }}>
                    ✨ Generated Metadata
                  </div>
                  <div style={{ color: colors.textPrimary, fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                    <strong>{artifactMetadata.title}</strong>
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
                    {artifactMetadata.description}
                  </div>
                </div>
              )}
            </FormGroup>

            <Button
              onClick={handleMint}
              disabled={isMinting || !recipientAddress || !artifactUri || !artifactMetadata}
            >
              {isMinting ? (
                <>
                  <LoadingSpinner />
                  Minting Artifact...
                </>
              ) : (
                "Mint Artifact"
              )}
            </Button>

            {mintStatus === "success" && (
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <Link
                  href="/contracts"
                  style={{
                    color: colors.jungleCyan,
                    textDecoration: "none",
                  }}
                >
                  View Contracts →
                </Link>
              </div>
            )}
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

