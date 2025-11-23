import Head from "next/head";
import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress, useCurrentUser, useSignEvmTransaction } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, TOTEM_MANAGER_ABI } from "@/utils/contracts";
import { createPublicClient, createWalletClient, http, custom, encodeFunctionData, parseEther } from "viem";
import { useRouter } from "next/router";
import { useAvailableArtifacts } from "@/hooks/useAvailableArtifacts";
import MagicBalance from "@/components/MagicBalance";

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

const HeaderBar = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
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

const ArtifactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ArtifactCard = styled.div<{ selected: boolean }>`
  background: rgba(10, 20, 16, 0.5);
  border: 2px solid ${props => props.selected ? colors.sunlitGold : 'rgba(232, 168, 85, 0.2)'};
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.3);
    border-color: ${colors.sunlitGold};
  }
`;

const ArtifactId = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${colors.sunlitGold};
  margin-bottom: 0.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${colors.sunlitGold} 0%, ${colors.sunsetOrange} 100%);
  border: none;
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  background: rgba(45, 90, 61, 0.3);
  border: 1px solid ${colors.jungleCyan};
  border-radius: 12px;
  padding: 1rem;
  color: ${colors.jungleCyan};
  margin-bottom: 1rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: ${colors.textSecondary};
  padding: 2rem;
`;

export default function CreateTotemPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { signEvmTransaction } = useSignEvmTransaction();
  const router = useRouter();
  const { artifacts, isLoading: isLoadingArtifacts, error: artifactsError, refetch: refetchArtifacts } = useAvailableArtifacts();
  
  const [selectedArtifacts, setSelectedArtifacts] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const toggleArtifact = (artifactId: number) => {
    if (selectedArtifacts.includes(artifactId)) {
      setSelectedArtifacts(selectedArtifacts.filter(id => id !== artifactId));
    } else {
      setSelectedArtifacts([...selectedArtifacts, artifactId]);
    }
  };

  const handleCreateTotem = async () => {
    if (selectedArtifacts.length === 0) {
      setError("Please select at least one artifact");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      // Encode the function call
      const data = encodeFunctionData({
        abi: TOTEM_MANAGER_ABI,
        functionName: "createTotem",
        args: [selectedArtifacts.map(id => BigInt(id))],
      });

      let hash: string | undefined;

      // Try embedded wallet first
      const evmAccount = currentUser?.evmAccounts?.[0];
      if (evmAccount) {
        // Extract address - evmAccount might be an object with .address or just the address string
        const accountAddress = (typeof evmAccount === 'string' ? evmAccount : (evmAccount as any).address) as `0x${string}`;
        if (!accountAddress) {
          throw new Error("No EOA account address available. Please ensure you're properly connected.");
        }
        
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const gasPrice = await publicClient.getGasPrice();
        const nonce = await publicClient.getTransactionCount({
          address: accountAddress,
        });

        const gasEstimate = await publicClient.estimateGas({
          account: accountAddress,
          to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
        });

        const { signedTransaction } = await signEvmTransaction({
          evmAccount,
          transaction: {
            to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
            data: data as `0x${string}`,
            value: 0n,
            nonce,
            gas: gasEstimate,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice / 2n,
            chainId: SAGA_CHAINLET.id,
            type: "eip1559",
          },
        });

        hash = await publicClient.sendRawTransaction({
          serializedTransaction: signedTransaction,
        });
        console.log("Totem creation via embedded wallet:", hash);
      } else if (typeof window !== "undefined" && (window as any).ethereum) {
        // Fallback to MetaMask
        const ethereum = (window as any).ethereum;
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const walletClient = createWalletClient({
          chain: SAGA_CHAINLET as any,
          transport: custom(ethereum),
        });

        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const accountAddress = accounts[0] as `0x${string}`;

        const gasPrice = await publicClient.getGasPrice();
        const gasEstimate = await publicClient.estimateGas({
          account: accountAddress,
          to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
        });

        hash = await walletClient.sendTransaction({
          account: accountAddress,
          chain: SAGA_CHAINLET as any,
          to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
          gas: gasEstimate,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice / 2n,
        });
        console.log("Totem creation via MetaMask:", hash);
      } else {
        throw new Error("No wallet available. Please ensure you're properly connected.");
      }

      setTransactionHash(hash || "");
      setSuccess(true);

      // Wait a bit then redirect to totems page
      setTimeout(() => {
        router.push("/totems");
      }, 3000);
    } catch (error) {
      console.error("Error creating totem:", error);
      setError(error instanceof Error ? error.message : "Failed to create totem");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Create Totem - Mystic Island</title>
          <meta name="description" content="Create a totem by combining artifacts" />
        </Head>
        <PageContainer>
          <Container>
            <Header>
              <Title>Create Totem</Title>
              <Subtitle>Combine your artifacts into a powerful totem</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to create a totem
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
        <title>Create Totem - Mystic Island</title>
        <meta name="description" content="Create a totem by combining artifacts" />
      </Head>
      <PageContainer>
        <Container>
          <Header>
            <Title>Create Totem</Title>
            <Subtitle>Select artifacts to combine into a totem</Subtitle>
          </Header>

          <HeaderBar>
            <MagicBalance />
          </HeaderBar>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && (
            <SuccessMessage>
              Totem created successfully! Transaction: {transactionHash}
              <br />
              Redirecting to totems page...
            </SuccessMessage>
          )}

          <Card>
            <h2 style={{ color: colors.sunlitGold, marginBottom: "1rem", fontFamily: "var(--font-cormorant)" }}>
              Available Artifacts
            </h2>
            {isLoadingArtifacts ? (
              <LoadingMessage>Loading artifacts...</LoadingMessage>
            ) : artifactsError ? (
              <ErrorMessage>{artifactsError}</ErrorMessage>
            ) : artifacts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: colors.textSecondary }}>
                <p>You don't have any available artifacts.</p>
                <p style={{ marginTop: "1rem" }}>All your artifacts are already in totems, or you need to create some first.</p>
              </div>
            ) : (
              <>
                <ArtifactGrid>
                  {artifacts.map((artifact) => (
                    <ArtifactCard
                      key={artifact.id}
                      selected={selectedArtifacts.includes(artifact.id)}
                      onClick={() => toggleArtifact(artifact.id)}
                    >
                      <ArtifactId>#{artifact.id}</ArtifactId>
                      {selectedArtifacts.includes(artifact.id) && (
                        <div style={{ color: colors.jungleCyan, fontSize: "0.9rem" }}>✓ Selected</div>
                      )}
                    </ArtifactCard>
                  ))}
                </ArtifactGrid>
                <div style={{ color: colors.textSecondary, marginBottom: "1rem" }}>
                  Selected: {selectedArtifacts.length} artifact{selectedArtifacts.length !== 1 ? "s" : ""}
                </div>
                <Button
                  onClick={handleCreateTotem}
                  disabled={isCreating || selectedArtifacts.length === 0}
                >
                  {isCreating ? "Creating Totem..." : "Create Totem"}
                </Button>
              </>
            )}
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

