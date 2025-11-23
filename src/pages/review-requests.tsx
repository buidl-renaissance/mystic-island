import Head from "next/head";
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress, useCurrentUser } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { signEvmTransaction } from "@coinbase/cdp-core";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET } from "@/utils/contracts";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { useRouter } from "next/router";
import Link from "next/link";

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
  max-width: 1200px;
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

const RequestCard = styled.div`
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${colors.sunlitGold};
    box-shadow: 0 4px 16px rgba(232, 168, 85, 0.2);
  }
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
`;

const RequestTitle = styled.h3`
  font-size: 1.3rem;
  color: ${colors.sunlitGold};
  margin: 0;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${(props) => {
    if (props.status === "approved") return "rgba(74, 154, 122, 0.3)";
    if (props.status === "rejected") return "rgba(199, 106, 42, 0.3)";
    return "rgba(74, 122, 154, 0.3)";
  }};
  color: ${(props) => {
    if (props.status === "approved") return colors.jungleCyan;
    if (props.status === "rejected") return colors.sunsetOrange;
    return colors.skyDawn;
  }};
  border: 1px solid ${(props) => {
    if (props.status === "approved") return colors.jungleCyan;
    if (props.status === "rejected") return colors.sunsetOrange;
    return colors.skyDawn;
  }};
`;

const RequestInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const InfoItem = styled.div`
  color: ${colors.textSecondary};
`;

const InfoLabel = styled.span`
  color: ${colors.textMuted};
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
`;

const InfoValue = styled.span`
  color: ${colors.textPrimary};
  font-weight: 600;
  word-break: break-all;
`;

const VoteSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(232, 168, 85, 0.2);
`;

const VoteButton = styled.button<{ approve?: boolean; disabled?: boolean }>`
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: ${(props) =>
    props.disabled
      ? "rgba(160, 160, 160, 0.2)"
      : props.approve
        ? `linear-gradient(135deg, ${colors.jungleCyan} 0%, ${colors.skyDawn} 100%)`
        : `linear-gradient(135deg, ${colors.sunsetOrange} 0%, ${colors.lotusPink} 100%)`};
  border: none;
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(232, 168, 85, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
  }
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

const ErrorMessage = styled.div`
  background: rgba(199, 106, 42, 0.2);
  border: 1px solid ${colors.sunsetOrange};
  border-radius: 12px;
  padding: 1rem;
  color: ${colors.sunsetOrange};
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${colors.textSecondary};
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

const QuorumProgress = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(74, 122, 154, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(74, 122, 154, 0.3);
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 8px;
  background: rgba(10, 20, 16, 0.5);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
  
  &::after {
    content: "";
    display: block;
    width: ${(props) => Math.min(props.progress, 100)}%;
    height: 100%;
    background: linear-gradient(90deg, ${colors.jungleCyan} 0%, ${colors.skyDawn} 100%);
    transition: width 0.3s ease;
  }
`;

// TribeManager ABIs
const TRIBE_MANAGER_ABI = [
  {
    inputs: [{ name: "tribeId", type: "uint256" }],
    name: "getTribe",
    outputs: [
      { name: "name", type: "string" },
      { name: "leader", type: "address" },
      { name: "requiresApproval", type: "bool" },
      { name: "active", type: "bool" },
      { name: "quorumThreshold", type: "uint256" },
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
  {
    inputs: [],
    name: "nextJoinRequestId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "getJoinRequest",
    outputs: [
      { name: "tribeId", type: "uint256" },
      { name: "applicant", type: "address" },
      { name: "initiationArtifactId", type: "uint256" },
      { name: "approved", type: "bool" },
      { name: "processed", type: "bool" },
      { name: "approvalCount", type: "uint256" },
      { name: "rejectionCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "requestId", type: "uint256" },
      { name: "approved", type: "bool" },
    ],
    name: "voteOnJoinRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "tribeId", type: "uint256" },
      { name: "account", type: "address" },
    ],
    name: "isTribeMember",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "requestId", type: "uint256" },
      { name: "voter", type: "address" },
    ],
    name: "hasVotedOnRequest",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface JoinRequest {
  id: number;
  tribeId: number;
  applicant: string;
  initiationArtifactId: bigint;
  approved: boolean;
  processed: boolean;
  approvalCount: bigint;
  rejectionCount: bigint;
  tribeName: string;
  quorumThreshold: bigint;
  hasVoted: boolean;
}

export default function ReviewRequestsPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const router = useRouter();

  const [selectedTribeId, setSelectedTribeId] = useState<string>("");
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [tribes, setTribes] = useState<Array<{ id: number; name: string; quorumThreshold: bigint }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingRequestId, setVotingRequestId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load user's tribes
  useEffect(() => {
    async function loadTribes() {
      if (!isSignedIn || !evmAddress) {
        setIsLoading(false);
        return;
      }

      try {
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const nextTribeId = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
          abi: TRIBE_MANAGER_ABI,
          functionName: "nextTribeId",
        });

        const tribeCount = Number(nextTribeId);
        const userTribes: Array<{ id: number; name: string; quorumThreshold: bigint }> = [];

        for (let i = 1; i < tribeCount; i++) {
          try {
            // Check if user is a member
            const isMember = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
              abi: TRIBE_MANAGER_ABI,
              functionName: "isTribeMember",
              args: [BigInt(i), evmAddress as `0x${string}`],
            });

            if (isMember) {
              const [name, , , , quorumThreshold] = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
                abi: TRIBE_MANAGER_ABI,
                functionName: "getTribe",
                args: [BigInt(i)],
              });

              userTribes.push({
                id: i,
                name: name as string,
                quorumThreshold: quorumThreshold as bigint,
              });
            }
          } catch (err) {
            console.error(`Error loading tribe ${i}:`, err);
          }
        }

        setTribes(userTribes);
        if (userTribes.length > 0 && !selectedTribeId) {
          setSelectedTribeId(userTribes[0].id.toString());
        }
      } catch (error) {
        console.error("Error loading tribes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTribes();
  }, [isSignedIn, evmAddress, selectedTribeId]);

  // Load join requests for selected tribe
  useEffect(() => {
    async function loadRequests() {
      if (!isSignedIn || !evmAddress || !selectedTribeId) {
        setRequests([]);
        return;
      }

      try {
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const nextRequestId = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
          abi: TRIBE_MANAGER_ABI,
          functionName: "nextJoinRequestId",
        });

        const requestCount = Number(nextRequestId);
        const loadedRequests: JoinRequest[] = [];
        const selectedTribe = tribes.find((t) => t.id.toString() === selectedTribeId);

        for (let i = 1; i < requestCount; i++) {
          try {
            const [
              tribeId,
              applicant,
              initiationArtifactId,
              approved,
              processed,
              approvalCount,
              rejectionCount,
            ] = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
              abi: TRIBE_MANAGER_ABI,
              functionName: "getJoinRequest",
              args: [BigInt(i)],
            });

            // Only show requests for selected tribe
            if (Number(tribeId) === parseInt(selectedTribeId)) {
              const hasVoted = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
                abi: TRIBE_MANAGER_ABI,
                functionName: "hasVotedOnRequest",
                args: [BigInt(i), evmAddress as `0x${string}`],
              });

              loadedRequests.push({
                id: i,
                tribeId: Number(tribeId),
                applicant: applicant as string,
                initiationArtifactId: initiationArtifactId as bigint,
                approved: approved as boolean,
                processed: processed as boolean,
                approvalCount: approvalCount as bigint,
                rejectionCount: rejectionCount as bigint,
                tribeName: selectedTribe?.name || "Unknown",
                quorumThreshold: selectedTribe?.quorumThreshold || 0n,
                hasVoted: hasVoted as boolean,
              });
            }
          } catch (err) {
            console.error(`Error loading request ${i}:`, err);
          }
        }

        // Sort: pending first, then by approval count
        loadedRequests.sort((a, b) => {
          if (a.processed !== b.processed) return a.processed ? 1 : -1;
          return Number(b.approvalCount) - Number(a.approvalCount);
        });

        setRequests(loadedRequests);
      } catch (error) {
        console.error("Error loading requests:", error);
      }
    }

    if (selectedTribeId) {
      loadRequests();
    }
  }, [selectedTribeId, tribes, isSignedIn, evmAddress]);

  const handleVote = async (requestId: number, approved: boolean) => {
    if (!isSignedIn || !evmAddress) {
      setErrorMessage("Please connect your wallet first");
      return;
    }

    const evmAccount = currentUser?.evmAccounts?.[0];
    if (!evmAccount) {
      setErrorMessage("Embedded wallet not available. Please ensure you're properly connected.");
      return;
    }

    setVotingRequestId(requestId);
    setErrorMessage(null);

    try {
      // Encode the vote function call
      const data = encodeFunctionData({
        abi: TRIBE_MANAGER_ABI,
        functionName: "voteOnJoinRequest",
        args: [BigInt(requestId), approved],
      });

      // Extract address - evmAccount might be an object with .address or just the address string
      const accountAddress = (typeof evmAccount === 'string' ? evmAccount : (evmAccount as any).address) as `0x${string}`;
      if (!accountAddress) {
        throw new Error("No EOA account address available. Please ensure you're properly connected.");
      }

      // Create public client for Saga chainlet
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      // Get the current nonce and gas estimates from Saga chainlet
      const [nonce, gasPrice] = await Promise.all([
        publicClient.getTransactionCount({ address: accountAddress }),
        publicClient.getGasPrice(),
      ]);

      // Estimate gas for the transaction
      const gasEstimate = await publicClient.estimateGas({
        account: accountAddress,
        to: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
        data: data as `0x${string}`,
        value: 0n,
      });

      // Sign the transaction with the embedded wallet
      const { signedTransaction } = await signEvmTransaction({
        evmAccount,
        transaction: {
          to: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
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

      // Broadcast the signed transaction to Saga chainlet
      const hash = await publicClient.sendRawTransaction({
        serializedTransaction: signedTransaction,
      });

      console.log("Vote transaction sent via embedded wallet:", hash);

      // Reload requests after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error voting:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to vote. Make sure you're a tribe member."
      );
    } finally {
      setVotingRequestId(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Review Requests - Mystic Island</title>
          <meta name="description" content="Review and vote on tribe join requests" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/dashboard">← Back to Dashboard</BackLink>
            <Header>
              <Title>Review Requests</Title>
              <Subtitle>Review and vote on tribe join requests</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to review requests
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
        <title>Review Requests - Mystic Island</title>
        <meta name="description" content="Review and vote on tribe join requests" />
      </Head>
      <PageContainer>
        <Container>
          <BackLink href="/dashboard">← Back to Dashboard</BackLink>

          <Header>
            <Title>Review Requests</Title>
            <Subtitle>Vote on join requests for your tribes</Subtitle>
          </Header>

          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

          <Card>
            <label style={{ display: "block", marginBottom: "1rem", color: colors.textSecondary }}>
              Select Tribe:
            </label>
            <select
              value={selectedTribeId}
              onChange={(e) => setSelectedTribeId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "rgba(10, 20, 16, 0.5)",
                border: "1px solid rgba(232, 168, 85, 0.2)",
                borderRadius: "8px",
                color: colors.textPrimary,
                fontSize: "1rem",
              }}
            >
              <option value="">-- Select a tribe --</option>
              {tribes.map((tribe) => (
                <option key={tribe.id} value={tribe.id}>
                  {tribe.name} {tribe.quorumThreshold > 0n ? `(Quorum: ${tribe.quorumThreshold})` : "(Leader only)"}
                </option>
              ))}
            </select>
          </Card>

          {isLoading ? (
            <Card>
              <div style={{ textAlign: "center", padding: "2rem", color: colors.textSecondary }}>
                Loading requests...
              </div>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <EmptyState>
                <p>No join requests found for this tribe.</p>
                {tribes.length === 0 && (
                  <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                    You need to be a member of a tribe to review requests.
                  </p>
                )}
              </EmptyState>
            </Card>
          ) : (
            requests.map((request) => {
              const quorumProgress =
                request.quorumThreshold > 0n
                  ? (Number(request.approvalCount) / Number(request.quorumThreshold)) * 100
                  : 0;
              const canVote = !request.hasVoted && !request.processed;

              return (
                <RequestCard key={request.id}>
                  <RequestHeader>
                    <div>
                      <RequestTitle>Request #{request.id}</RequestTitle>
                      <div style={{ fontSize: "0.9rem", color: colors.textMuted, marginTop: "0.25rem" }}>
                        {request.tribeName}
                      </div>
                    </div>
                    <StatusBadge
                      status={
                        request.processed
                          ? request.approved
                            ? "approved"
                            : "rejected"
                          : "pending"
                      }
                    >
                      {request.processed
                        ? request.approved
                          ? "✓ Approved"
                          : "✗ Rejected"
                        : "⏳ Pending"}
                    </StatusBadge>
                  </RequestHeader>

                  <RequestInfo>
                    <InfoItem>
                      <InfoLabel>Applicant</InfoLabel>
                      <InfoValue>{formatAddress(request.applicant)}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Initiation Artifact ID</InfoLabel>
                      <InfoValue>#{request.initiationArtifactId.toString()}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Approvals</InfoLabel>
                      <InfoValue style={{ color: colors.jungleCyan }}>
                        {request.approvalCount.toString()}
                      </InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Rejections</InfoLabel>
                      <InfoValue style={{ color: colors.sunsetOrange }}>
                        {request.rejectionCount.toString()}
                      </InfoValue>
                    </InfoItem>
                  </RequestInfo>

                  {request.quorumThreshold > 0n && (
                    <QuorumProgress>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
                          Quorum Progress
                        </span>
                        <span style={{ color: colors.jungleCyan, fontWeight: 600 }}>
                          {request.approvalCount.toString()} / {request.quorumThreshold.toString()}
                        </span>
                      </div>
                      <ProgressBar progress={quorumProgress} />
                      {quorumProgress >= 100 && (
                        <div style={{ marginTop: "0.5rem", color: colors.jungleCyan, fontSize: "0.9rem" }}>
                          ✓ Quorum reached! Request will be approved.
                        </div>
                      )}
                    </QuorumProgress>
                  )}

                  {canVote && (
                    <VoteSection>
                      <VoteButton
                        approve
                        onClick={() => handleVote(request.id, true)}
                        disabled={votingRequestId === request.id}
                      >
                        {votingRequestId === request.id ? (
                          <>
                            <LoadingSpinner />
                            Voting...
                          </>
                        ) : (
                          "✓ Approve"
                        )}
                      </VoteButton>
                      <VoteButton
                        onClick={() => handleVote(request.id, false)}
                        disabled={votingRequestId === request.id}
                      >
                        {votingRequestId === request.id ? (
                          <>
                            <LoadingSpinner />
                            Voting...
                          </>
                        ) : (
                          "✗ Reject"
                        )}
                      </VoteButton>
                    </VoteSection>
                  )}

                  {request.hasVoted && !request.processed && (
                    <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(74, 122, 154, 0.1)", borderRadius: "8px", color: colors.skyDawn, fontSize: "0.9rem" }}>
                      You have already voted on this request
                    </div>
                  )}
                </RequestCard>
              );
            })
          )}
        </Container>
      </PageContainer>
    </>
  );
}

