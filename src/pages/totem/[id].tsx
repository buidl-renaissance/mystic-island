import Head from "next/head";
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress, useCurrentUser, useSignEvmTransaction } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, TOTEM_MANAGER_ABI, ERC20_ABI, ERC721_ABI } from "@/utils/contracts";
import { createPublicClient, createWalletClient, http, custom, encodeFunctionData, parseEther, formatEther } from "viem";
import { useRouter } from "next/router";
import { useTotem } from "@/hooks/useTotems";
import { useAvailableArtifacts } from "@/hooks/useAvailableArtifacts";
import { useUserStats } from "@/hooks/useUserStats";
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
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeIn} 0.6s ease-out;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
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

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: ${colors.sunlitGold};
  margin-bottom: 1.5rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
  font-weight: 600;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(232, 168, 85, 0.1);
  color: ${colors.textSecondary};
`;

const StatLabel = styled.span``;
const StatValue = styled.span`
  color: ${colors.textPrimary};
  font-weight: 600;
`;

const ArtifactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ArtifactCard = styled.div`
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
`;

const ArtifactId = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${colors.sunlitGold};
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${colors.textSecondary};
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.3);
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${colors.sunlitGold};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.3);
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${colors.sunlitGold};
  }
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

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  background: rgba(232, 168, 85, 0.2);
  border: 1px solid ${colors.sunlitGold};
  border-radius: 8px;
  color: ${colors.sunlitGold};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 0.5rem;

  &:hover {
    background: rgba(232, 168, 85, 0.3);
  }
`;

export default function TotemDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const totemId = id ? parseInt(id as string, 10) : null;
  
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { signEvmTransaction } = useSignEvmTransaction();
  const { totem, isLoading: isLoadingTotem, error: totemError, refetch: refetchTotem } = useTotem(totemId);
  const { artifacts: availableArtifacts, isLoading: isLoadingArtifacts } = useAvailableArtifacts();
  const { magicBalance, refetch: refetchStats } = useUserStats();

  const [powerUpAmount, setPowerUpAmount] = useState("");
  const [selectedArtifactId, setSelectedArtifactId] = useState<number | "">("");
  const [isPoweringUp, setIsPoweringUp] = useState(false);
  const [isAddingArtifact, setIsAddingArtifact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
        refetchTotem();
        refetchStats();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, refetchTotem, refetchStats]);

  const sendTransaction = async (data: `0x${string}`, to: `0x${string}`) => {
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
        to,
        data,
        value: 0n,
      });

      const { signedTransaction } = await signEvmTransaction({
        evmAccount,
        transaction: {
          to,
          data,
          value: 0n,
          nonce,
          gas: gasEstimate,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice / 2n,
          chainId: SAGA_CHAINLET.id,
          type: "eip1559",
        },
      });

      return await publicClient.sendRawTransaction({
        serializedTransaction: signedTransaction,
      });
    } else if (typeof window !== "undefined" && (window as any).ethereum) {
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
        to,
        data,
        value: 0n,
      });

      return await walletClient.sendTransaction({
        account: accountAddress,
        chain: SAGA_CHAINLET as any,
        to,
        data,
        value: 0n,
        gas: gasEstimate,
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice / 2n,
      });
    } else {
      throw new Error("No wallet available");
    }
  };

  const handlePowerUp = async () => {
    if (!totemId || !powerUpAmount) {
      setError("Please enter an amount");
      return;
    }

    const amount = parseEther(powerUpAmount);
    if (amount <= 0n) {
      setError("Amount must be greater than zero");
      return;
    }

    if (magicBalance && parseFloat(magicBalance) < parseFloat(powerUpAmount)) {
      setError("Insufficient Magic balance");
      return;
    }

    setIsPoweringUp(true);
    setError(null);
    setSuccess(null);

    try {
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      // Check allowance
      if (!evmAddress) throw new Error("No address");
      
      const allowance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MAGIC_TOKEN as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [evmAddress as `0x${string}`, CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`],
      });

      // Approve if needed
      if (allowance < amount) {
        const approveData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`, amount],
        });

        await sendTransaction(approveData, CONTRACT_ADDRESSES.MAGIC_TOKEN as `0x${string}`);
      }

      // Power up
      const powerUpData = encodeFunctionData({
        abi: TOTEM_MANAGER_ABI,
        functionName: "powerUp",
        args: [BigInt(totemId), amount],
      });

      const hash = await sendTransaction(powerUpData, CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`);
      setSuccess(`Totem powered up! Transaction: ${hash}`);
      setPowerUpAmount("");
    } catch (error) {
      console.error("Error powering up totem:", error);
      setError(error instanceof Error ? error.message : "Failed to power up totem");
    } finally {
      setIsPoweringUp(false);
    }
  };

  const handleAddArtifact = async () => {
    if (!totemId || selectedArtifactId === "") {
      setError("Please select an artifact");
      return;
    }

    setIsAddingArtifact(true);
    setError(null);
    setSuccess(null);

    try {
      const addArtifactData = encodeFunctionData({
        abi: TOTEM_MANAGER_ABI,
        functionName: "addArtifact",
        args: [BigInt(totemId), BigInt(selectedArtifactId as number)],
      });

      const hash = await sendTransaction(addArtifactData, CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`);
      setSuccess(`Artifact added! Transaction: ${hash}`);
      setSelectedArtifactId("");
    } catch (error) {
      console.error("Error adding artifact:", error);
      setError(error instanceof Error ? error.message : "Failed to add artifact");
    } finally {
      setIsAddingArtifact(false);
    }
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Totem #{totemId} - Mystic Island</title>
        </Head>
        <PageContainer>
          <Container>
            <Header>
              <Title>Totem #{totemId}</Title>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to view this totem
                </p>
                <AuthButton />
              </div>
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  if (isLoadingTotem) {
    return (
      <>
        <Head>
          <title>Totem #{totemId} - Mystic Island</title>
        </Head>
        <PageContainer>
          <Container>
            <LoadingMessage>Loading totem...</LoadingMessage>
          </Container>
        </PageContainer>
      </>
    );
  }

  if (totemError || !totem) {
    return (
      <>
        <Head>
          <title>Totem #{totemId} - Mystic Island</title>
        </Head>
        <PageContainer>
          <Container>
            <ErrorMessage>
              {totemError || "Totem not found"}
            </ErrorMessage>
          </Container>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Totem #{totem.id} - Mystic Island</title>
      </Head>
      <PageContainer>
        <Container>
          <Header>
            <Title>Totem #{totem.id}</Title>
            <Subtitle>Power: {totem.power.toString()}</Subtitle>
          </Header>

          <HeaderBar>
            <ActionButton onClick={() => router.push("/totems")}>← Back to Totems</ActionButton>
            <MagicBalance />
          </HeaderBar>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Card>
            <SectionTitle>Totem Information</SectionTitle>
            <StatRow>
              <StatLabel>ID</StatLabel>
              <StatValue>#{totem.id}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Power</StatLabel>
              <StatValue>{totem.power.toString()}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Artifacts</StatLabel>
              <StatValue>{totem.artifactCount}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Creator</StatLabel>
              <StatValue style={{ fontSize: "0.9rem" }}>
                {totem.creator.slice(0, 6)}...{totem.creator.slice(-4)}
              </StatValue>
            </StatRow>
          </Card>

          <Card>
            <SectionTitle>Artifacts</SectionTitle>
            {totem.artifactIds.length === 0 ? (
              <div style={{ color: colors.textSecondary }}>No artifacts in this totem yet.</div>
            ) : (
              <ArtifactGrid>
                {totem.artifactIds.map((artifactId) => (
                  <ArtifactCard key={artifactId.toString()}>
                    <ArtifactId>#{artifactId.toString()}</ArtifactId>
                  </ArtifactCard>
                ))}
              </ArtifactGrid>
            )}
          </Card>

          <Card>
            <SectionTitle>Power Up</SectionTitle>
            <div style={{ color: colors.textSecondary, marginBottom: "1rem" }}>
              Magic Balance: {magicBalance || "0"} MAGIC
            </div>
            <FormGroup>
              <Label>Amount (MAGIC)</Label>
              <Input
                type="number"
                step="0.000000000000000001"
                min="0"
                value={powerUpAmount}
                onChange={(e) => setPowerUpAmount(e.target.value)}
                placeholder="0.0"
              />
            </FormGroup>
            <Button onClick={handlePowerUp} disabled={isPoweringUp || !powerUpAmount}>
              {isPoweringUp ? "Powering Up..." : "Power Up Totem"}
            </Button>
          </Card>

          <Card>
            <SectionTitle>Add Artifact</SectionTitle>
            {isLoadingArtifacts ? (
              <LoadingMessage>Loading available artifacts...</LoadingMessage>
            ) : availableArtifacts.length === 0 ? (
              <div style={{ color: colors.textSecondary }}>
                No available artifacts. All your artifacts are already in totems.
              </div>
            ) : (
              <>
                <FormGroup>
                  <Label>Select Artifact</Label>
                  <Select
                    value={selectedArtifactId}
                    onChange={(e) => setSelectedArtifactId(e.target.value ? parseInt(e.target.value, 10) : "")}
                  >
                    <option value="">-- Select an artifact --</option>
                    {availableArtifacts.map((artifact) => (
                      <option key={artifact.id} value={artifact.id}>
                        Artifact #{artifact.id}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                <Button onClick={handleAddArtifact} disabled={isAddingArtifact || selectedArtifactId === ""}>
                  {isAddingArtifact ? "Adding..." : "Add Artifact to Totem"}
                </Button>
              </>
            )}
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

