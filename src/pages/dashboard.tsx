import Head from "next/head";
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET } from "@/utils/contracts";
import { createPublicClient, http } from "viem";
import Link from "next/link";
import { useTotems } from "@/hooks/useTotems";
import { useUserStats } from "@/hooks/useUserStats";

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

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
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

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: ${colors.sunlitGold};
  margin-bottom: 1.5rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${colors.sunlitGold};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${colors.textSecondary};
`;

const LoadingSkeleton = styled.div`
  background: linear-gradient(
    90deg,
    rgba(45, 90, 61, 0.3) 0%,
    rgba(45, 90, 61, 0.5) 50%,
    rgba(45, 90, 61, 0.3) 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite;
  height: 20px;
  border-radius: 4px;
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

const ActionButton = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${colors.sunlitGold} 0%, ${colors.sunsetOrange} 100%);
  border: none;
  border-radius: 8px;
  color: ${colors.textPrimary};
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  margin: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.3);
  }
`;

// ABIs for reading contract data
const ERC721_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const TRIBE_MANAGER_ABI = [
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
    inputs: [],
    name: "nextTribeId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface DashboardData {
  artifactCount: number | null;
  tribeMemberships: number[];
  isLoading: boolean;
  error: string | null;
}

export default function DashboardPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { totems, isLoading: isLoadingTotems } = useTotems();
  const { magicBalance, isLoading: isLoadingMagic } = useUserStats();
  const [data, setData] = useState<DashboardData>({
    artifactCount: null,
    tribeMemberships: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!isSignedIn || !evmAddress) {
        setData({ artifactCount: null, tribeMemberships: [], isLoading: false, error: null });
        return;
      }

      setData((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        // Get artifact balance
        const artifactBalance = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
          abi: ERC721_ABI,
          functionName: "balanceOf",
          args: [evmAddress as `0x${string}`],
        }).catch(() => 0n);

        // Get tribe memberships
        const nextTribeId = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
          abi: TRIBE_MANAGER_ABI,
          functionName: "nextTribeId",
        }).catch(() => 0n);

        const tribeCount = Number(nextTribeId);
        const memberships: number[] = [];

        for (let i = 1; i < tribeCount; i++) {
          try {
            const isMember = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.TRIBE_MANAGER as `0x${string}`,
              abi: TRIBE_MANAGER_ABI,
              functionName: "isTribeMember",
              args: [BigInt(i), evmAddress as `0x${string}`],
            });

            if (isMember) {
              memberships.push(i);
            }
          } catch (err) {
            // Tribe might not exist, skip
          }
        }

        setData({
          artifactCount: Number(artifactBalance),
          tribeMemberships: memberships,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setData({
          artifactCount: null,
          tribeMemberships: [],
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load data",
        });
      }
    }

    loadDashboardData();
  }, [isSignedIn, evmAddress]);

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Dashboard - Mystic Island</title>
          <meta name="description" content="Your Mystic Island dashboard" />
        </Head>
        <PageContainer>
          <Container>
            <Header>
              <Title>Dashboard</Title>
              <Subtitle>View your artifacts, tribes, and totems</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to view your dashboard
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
        <title>Dashboard - Mystic Island</title>
        <meta name="description" content="Your Mystic Island dashboard" />
      </Head>
      <PageContainer>
        <Container>
          <Header>
            <Title>Dashboard</Title>
            <Subtitle>Welcome back, {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}</Subtitle>
          </Header>

          {data.error && <ErrorMessage>{data.error}</ErrorMessage>}

          <StatsGrid>
            <StatCard>
              {data.isLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <StatValue>{data.artifactCount ?? 0}</StatValue>
                  <StatLabel>Artifacts</StatLabel>
                </>
              )}
            </StatCard>
            <StatCard>
              {data.isLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <StatValue>{data.tribeMemberships.length}</StatValue>
                  <StatLabel>Tribe Memberships</StatLabel>
                </>
              )}
            </StatCard>
            <StatCard>
              {isLoadingTotems ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <StatValue>{totems.length}</StatValue>
                  <StatLabel>Totems</StatLabel>
                </>
              )}
            </StatCard>
            <StatCard>
              {isLoadingMagic ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <StatValue>{magicBalance ? parseFloat(magicBalance).toFixed(2) : "0"}</StatValue>
                  <StatLabel>Magic Balance</StatLabel>
                </>
              )}
            </StatCard>
          </StatsGrid>

          <Card>
            <SectionTitle>Your Artifacts</SectionTitle>
            {data.isLoading ? (
              <LoadingSkeleton />
            ) : data.artifactCount === 0 ? (
              <EmptyState>
                <p>You don't have any artifacts yet.</p>
                <ActionButton href="/join-tribe">Join a Tribe</ActionButton>
                <ActionButton href="/create-artifact">Create Artifact</ActionButton>
              </EmptyState>
            ) : (
              <div style={{ color: colors.textSecondary }}>
                You own {data.artifactCount} artifact{data.artifactCount !== 1 ? "s" : ""}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Your Tribes</SectionTitle>
            {data.isLoading ? (
              <LoadingSkeleton />
            ) : data.tribeMemberships.length === 0 ? (
              <EmptyState>
                <p>You're not a member of any tribes yet.</p>
                <ActionButton href="/join-tribe">Join a Tribe</ActionButton>
              </EmptyState>
            ) : (
              <div style={{ color: colors.textSecondary }}>
                You are a member of {data.tribeMemberships.length} tribe{data.tribeMemberships.length !== 1 ? "s" : ""}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Your Totems</SectionTitle>
            {isLoadingTotems ? (
              <LoadingSkeleton />
            ) : totems.length === 0 ? (
              <EmptyState>
                <p>You don't have any totems yet.</p>
                <ActionButton href="/create-totem">Create Totem</ActionButton>
              </EmptyState>
            ) : (
              <div style={{ color: colors.textSecondary }}>
                You have {totems.length} totem{totems.length !== 1 ? "s" : ""}
                <div style={{ marginTop: "1rem" }}>
                  <ActionButton href="/totems">View All Totems</ActionButton>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Quick Actions</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <ActionButton href="/create-artifact">Create Artifact</ActionButton>
              <ActionButton href="/create-totem">Create Totem</ActionButton>
              <ActionButton href="/totems">View Totems</ActionButton>
              <ActionButton href="/join-tribe">Join Tribe</ActionButton>
              <ActionButton href="/claim-quest">Claim Quest</ActionButton>
              <ActionButton href="/review-requests">Review Requests</ActionButton>
              <ActionButton href="/create-location">Create Location</ActionButton>
              <ActionButton href="/explore">Explore</ActionButton>
            </div>
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

