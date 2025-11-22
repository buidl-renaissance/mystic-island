import Head from "next/head";
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress, useSendUserOperation, useCurrentUser } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET } from "@/utils/contracts";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { useRouter } from "next/router";
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

const TribeSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${colors.sunlitGold};
    box-shadow: 0 0 0 3px rgba(232, 168, 85, 0.1);
  }
  
  option {
    background: ${colors.deepForest};
    color: ${colors.textPrimary};
  }
`;

// TribeManager ABI for reading tribes
const TRIBE_MANAGER_READ_ABI = [
  {
    inputs: [{ name: "tribeId", type: "uint256" }],
    name: "getTribe",
    outputs: [
      { name: "name", type: "string" },
      { name: "leader", type: "address" },
      { name: "requiresApproval", type: "bool" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextTribeId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface Tribe {
  id: number;
  name: string;
  leader: string;
  requiresApproval: boolean;
  active: boolean;
}

// TribeManager ABI for requestToJoinTribe function
const TRIBE_MANAGER_ABI = [
  {
    inputs: [
      { name: "tribeId", type: "uint256" },
      { name: "initiationArtifactUri", type: "string" },
    ],
    name: "requestToJoinTribe",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export default function JoinTribePage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { sendUserOperation } = useSendUserOperation();
  const router = useRouter();
  const smartAccount = currentUser?.evmSmartAccounts?.[0];

  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [isLoadingTribes, setIsLoadingTribes] = useState(true);
  const [selectedTribeId, setSelectedTribeId] = useState("");
  const [initiationArtifactUri, setInitiationArtifactUri] = useState("");
  const [artifactMetadata, setArtifactMetadata] = useState<{
    title: string;
    description: string;
    metadataIpfsUrl: string;
  } | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<"idle" | "success" | "error">("idle");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load tribes
  useEffect(() => {
    async function loadTribes() {

      try {
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const nextTribeId = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
          abi: TRIBE_MANAGER_READ_ABI,
          functionName: "nextTribeId",
        });

        const tribeCount = Number(nextTribeId);
        const loadedTribes: Tribe[] = [];

        for (let i = 1; i < tribeCount; i++) {
          try {
            const [name, leader, requiresApproval, active] = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
              abi: TRIBE_MANAGER_READ_ABI,
              functionName: "getTribe",
              args: [BigInt(i)],
            });

            loadedTribes.push({
              id: i,
              name: name as string,
              leader: leader as string,
              requiresApproval: requiresApproval as boolean,
              active: active as boolean,
            });
          } catch (err) {
            console.error(`Error loading tribe ${i}:`, err);
          }
        }

        setTribes(loadedTribes);
      } catch (error) {
        console.error("Error loading tribes:", error);
      } finally {
        setIsLoadingTribes(false);
      }
    }

    loadTribes();
  }, []);

  const handleJoinTribe = async () => {
    if (!isSignedIn || !evmAddress) {
      setErrorMessage("Please connect your wallet first");
      setJoinStatus("error");
      return;
    }

    if (!smartAccount) {
      setErrorMessage("Smart account not available. Please ensure you're properly connected.");
      setJoinStatus("error");
      return;
    }

    if (!selectedTribeId || !initiationArtifactUri) {
      setErrorMessage("Please select a tribe and upload an image");
      setJoinStatus("error");
      return;
    }

    setIsJoining(true);
    setJoinStatus("idle");
    setErrorMessage(null);
    setTransactionHash(null);

    try {
      console.log("Joining tribe...", {
        tribeId: selectedTribeId,
        uri: initiationArtifactUri,
        userAddress: evmAddress,
      });

      // Encode the function call
      const data = encodeFunctionData({
        abi: TRIBE_MANAGER_ABI,
        functionName: "requestToJoinTribe",
        args: [BigInt(selectedTribeId), initiationArtifactUri],
      });

      // Use sendUserOperation to execute with embedded wallet
      // Note: CDP might not support Saga chainlet yet, so we'll try base-sepolia
      // If it fails, we can fall back to the API endpoint
      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: "base-sepolia", // TODO: Update when Saga chainlet is supported
        calls: [
          {
            to: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
            data: data as `0x${string}`,
            value: 0n,
          },
        ],
      });

      console.log("Join tribe transaction sent:", result);
      setTransactionHash(result.userOperationHash || undefined);
      setJoinStatus("success");

      // Navigate to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error joining tribe:", error);
      setJoinStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to join tribe. Make sure the tribe exists and you haven't already initiated."
      );
    } finally {
      setIsJoining(false);
    }
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Join Tribe - Mystic Island</title>
          <meta name="description" content="Request to join a tribe and create your initiation artifact" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Join Tribe</Title>
              <Subtitle>Request to join a tribe and create your initiation artifact</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to join a tribe
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
        <title>Join Tribe - Mystic Island</title>
        <meta name="description" content="Request to join a tribe and create your initiation artifact" />
      </Head>
      <PageContainer>
        <Container>
          <BackLink href="/">← Back to Home</BackLink>

          <Header>
            <Title>Join Tribe</Title>
            <Subtitle>Request to join a tribe and create your initiation artifact</Subtitle>
          </Header>

          <InfoBox>
            <InfoTitle>ℹ️ About Tribe Initiation</InfoTitle>
            <InfoText>
              <strong>Initiation Artifact:</strong> When you request to join a tribe, you'll create your first artifact as part of the initiation process.
            </InfoText>
            <InfoText>
              <strong>One-Time Only:</strong> Each address can only create one initiation artifact. Choose your tribe wisely!
            </InfoText>
            <InfoText>
              <strong>Approval Required:</strong> After submitting your request, the tribe leader will review and approve or reject your application.
            </InfoText>
            <InfoText>
              <strong>Image Upload:</strong> Upload an image and AI will automatically generate a title and description for your initiation artifact
            </InfoText>
          </InfoBox>

          <Card>
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

            {joinStatus === "success" && (
              <SuccessMessage>
                ✅ Join request submitted successfully!
                {transactionHash && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                    Transaction: {transactionHash.slice(0, 10)}...
                  </div>
                )}
                <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                  Your initiation artifact has been created. Wait for the tribe leader to approve your request.
                </div>
              </SuccessMessage>
            )}

            <FormGroup>
              <Label htmlFor="tribe">Select Tribe</Label>
              {isLoadingTribes ? (
                <div style={{ color: colors.textMuted, padding: "1rem" }}>
                  Loading tribes...
                </div>
              ) : tribes.length === 0 ? (
                <div style={{ color: colors.textMuted, padding: "1rem" }}>
                  No tribes available. Tribes must be created by the contract owner.
                </div>
              ) : (
                <TribeSelect
                  id="tribe"
                  value={selectedTribeId}
                  onChange={(e) => setSelectedTribeId(e.target.value)}
                  disabled={isJoining}
                >
                  <option value="">-- Select a tribe --</option>
                  {tribes
                    .filter((tribe) => tribe.active)
                    .map((tribe) => (
                      <option key={tribe.id} value={tribe.id}>
                        {tribe.name} {tribe.requiresApproval ? "(Approval Required)" : ""}
                      </option>
                    ))}
                </TribeSelect>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="image">Initiation Artifact Image</Label>
              <ImageUpload
                onUploadComplete={(metadata) => {
                  setInitiationArtifactUri(metadata.metadataIpfsUrl);
                  setArtifactMetadata({
                    title: metadata.title,
                    description: metadata.description,
                    metadataIpfsUrl: metadata.metadataIpfsUrl,
                  });
                }}
                onError={(error) => {
                  setErrorMessage(error);
                  setJoinStatus("error");
                }}
                disabled={isJoining}
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
              onClick={handleJoinTribe}
              disabled={isJoining || !selectedTribeId || !initiationArtifactUri || tribes.length === 0 || !artifactMetadata}
            >
              {isJoining ? (
                <>
                  <LoadingSpinner />
                  Submitting Request...
                </>
              ) : (
                "Request to Join Tribe"
              )}
            </Button>

            {joinStatus === "success" && (
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

