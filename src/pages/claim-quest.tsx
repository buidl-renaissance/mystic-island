import Head from "next/head";
import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress, useCurrentUser, useSignEvmTransaction } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, QUEST_MANAGER_ABI } from "@/utils/contracts";
import { createPublicClient, createWalletClient, http, custom, encodeFunctionData } from "viem";
import { useRouter } from "next/router";
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
  font-family: monospace;

  &:focus {
    outline: none;
    border-color: ${colors.sunlitGold};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.3);
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  font-family: monospace;
  min-height: 120px;
  resize: vertical;

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

const InfoBox = styled.div`
  background: rgba(74, 122, 154, 0.2);
  border: 1px solid ${colors.skyDawn};
  border-radius: 12px;
  padding: 1rem;
  color: ${colors.textSecondary};
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

export default function ClaimQuestPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { signEvmTransaction } = useSignEvmTransaction();
  const router = useRouter();

  const [questId, setQuestId] = useState("");
  const [amount, setAmount] = useState("");
  const [signature, setSignature] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const sendTransaction = async (data: `0x${string}`, to: `0x${string}`) => {
    const evmAccount = currentUser?.evmAccounts?.[0];
    if (evmAccount) {
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      const gasPrice = await publicClient.getGasPrice();
      const nonce = await publicClient.getTransactionCount({
        address: evmAccount.address as `0x${string}`,
      });

      const gasEstimate = await publicClient.estimateGas({
        account: evmAccount.address as `0x${string}`,
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

  const handleClaimReward = async () => {
    if (!questId || !amount || !signature) {
      setError("Please fill in all fields");
      return;
    }

    if (!evmAddress) {
      setError("Please connect your wallet");
      return;
    }

    setIsClaiming(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert signature from hex string to bytes
      let signatureBytes: `0x${string}`;
      if (signature.startsWith("0x")) {
        signatureBytes = signature as `0x${string}`;
      } else {
        signatureBytes = `0x${signature}` as `0x${string}`;
      }

      const claimData = encodeFunctionData({
        abi: QUEST_MANAGER_ABI,
        functionName: "claimReward",
        args: [
          evmAddress as `0x${string}`,
          BigInt(questId),
          BigInt(amount),
          signatureBytes,
        ],
      });

      const hash = await sendTransaction(claimData, CONTRACT_ADDRESSES.QUEST_MANAGER as `0x${string}`);
      setTransactionHash(hash);
      setSuccess(`Quest reward claimed! Transaction: ${hash}`);
      
      // Clear form
      setQuestId("");
      setAmount("");
      setSignature("");
    } catch (error) {
      console.error("Error claiming quest reward:", error);
      setError(error instanceof Error ? error.message : "Failed to claim quest reward");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Claim Quest Reward - Mystic Island</title>
          <meta name="description" content="Claim your quest rewards" />
        </Head>
        <PageContainer>
          <Container>
            <Header>
              <Title>Claim Quest Reward</Title>
              <Subtitle>Claim Magic tokens for completing quests</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to claim quest rewards
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
        <title>Claim Quest Reward - Mystic Island</title>
        <meta name="description" content="Claim your quest rewards" />
      </Head>
      <PageContainer>
        <Container>
          <Header>
            <Title>Claim Quest Reward</Title>
            <Subtitle>Claim Magic tokens for completing quests</Subtitle>
          </Header>

          <HeaderBar>
            <MagicBalance />
          </HeaderBar>

          <InfoBox>
            <strong>Note:</strong> You need a valid signature from the quest attestor to claim rewards.
            The signature must be generated off-chain by the game backend or AI agent.
            Enter the quest ID, reward amount, and signature provided to you.
          </InfoBox>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Card>
            <FormGroup>
              <Label>Quest ID</Label>
              <Input
                type="number"
                value={questId}
                onChange={(e) => setQuestId(e.target.value)}
                placeholder="123"
              />
            </FormGroup>

            <FormGroup>
              <Label>Reward Amount (in wei)</Label>
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000000000000000000"
              />
              <div style={{ fontSize: "0.85rem", color: colors.textMuted, marginTop: "0.5rem" }}>
                Example: 1000000000000000000 = 1 MAGIC (18 decimals)
              </div>
            </FormGroup>

            <FormGroup>
              <Label>Signature (hex string, with or without 0x prefix)</Label>
              <Textarea
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="0x1234..."
              />
            </FormGroup>

            <Button onClick={handleClaimReward} disabled={isClaiming || !questId || !amount || !signature}>
              {isClaiming ? "Claiming..." : "Claim Reward"}
            </Button>
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

