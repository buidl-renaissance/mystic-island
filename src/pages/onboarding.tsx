import Head from "next/head";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useIslandMythos } from "@/hooks/useIslandMythos";
import { useRouter } from "next/router";
import Link from "next/link";
import OnboardingWizard from "@/components/OnboardingWizard";
import { CONTRACT_ADDRESSES } from "@/utils/contracts";

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
  max-width: 900px;
  margin: 0 auto;
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

export default function OnboardingPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { mythos, isLoading, refetch } = useIslandMythos();
  const router = useRouter();

  // Refetch when page becomes visible (in case user initialized in another tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetch]);

  // Redirect if already initialized or if contract not deployed
  useEffect(() => {
    if (!isLoading) {
      // If contract not deployed, redirect to start
      const islandMythosAddress = CONTRACT_ADDRESSES.ISLAND_MYTHOS as string;
      if (islandMythosAddress === "0x0000000000000000000000000000000000000000" || !islandMythosAddress) {
        router.push("/start");
        return;
      }
      // If already initialized, redirect to dashboard
      if (mythos?.initialized) {
        router.push("/dashboard");
      }
    }
  }, [mythos, isLoading, router]);

  const handleComplete = () => {
    router.push("/dashboard");
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Onboarding - Mystic Island</title>
          <meta name="description" content="Initialize your realm's mythos" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Realm Onboarding</Title>
              <Subtitle>Initialize your realm's mythos</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to begin onboarding
                </p>
                <AuthButton />
              </div>
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Onboarding - Mystic Island</title>
          <meta name="description" content="Initialize your realm's mythos" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Realm Onboarding</Title>
              <Subtitle>Initialize your realm's mythos</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem", color: colors.textSecondary }}>
                Loading...
              </div>
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  if (mythos?.initialized) {
    return (
      <>
        <Head>
          <title>Onboarding - Mystic Island</title>
          <meta name="description" content="Realm already initialized" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Realm Already Initialized</Title>
              <Subtitle>The mythos has already been set for this realm</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  This realm's mythos has already been initialized.
                </p>
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-block",
                    padding: "0.75rem 1.5rem",
                    background: `linear-gradient(135deg, ${colors.sunlitGold} 0%, ${colors.sunsetOrange} 100%)`,
                    borderRadius: "8px",
                    color: colors.textPrimary,
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Go to Dashboard
                </Link>
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
        <title>Onboarding - Mystic Island</title>
        <meta name="description" content="Initialize your realm's mythos" />
      </Head>
      <PageContainer>
        <Container>
          <BackLink href="/">← Back to Home</BackLink>
          <Header>
            <Title>Realm Onboarding</Title>
            <Subtitle>Welcome, {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}</Subtitle>
          </Header>
          <Card>
            <OnboardingWizard onComplete={handleComplete} />
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

