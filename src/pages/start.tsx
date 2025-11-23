import Head from "next/head";
import { useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useIslandMythos } from "@/hooks/useIslandMythos";
import { useRouter } from "next/router";
import { CONTRACT_ADDRESSES } from "@/utils/contracts";

// Fonts
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${colors.deepForest} 0%, #0f1a15 100%);
  color: ${colors.textPrimary};
  padding: 2rem;
  ${inter.variable}
  font-family: var(--font-inter);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  animation: ${fadeIn} 0.6s ease-out;
  text-align: center;
`;

const Header = styled.div`
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
  padding: 3rem;
  backdrop-filter: blur(10px);
  margin-bottom: 2rem;
`;

const LoadingText = styled.p`
  color: ${colors.textSecondary};
  font-size: 1.1rem;
`;

export default function StartPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { mythos, isLoading: mythosLoading } = useIslandMythos();
  const router = useRouter();

  // Check if mythos contract is deployed
  const isMythosDeployed = (CONTRACT_ADDRESSES.ISLAND_MYTHOS as string) !== "0x0000000000000000000000000000000000000000";

  // Compute checking state - we're done checking if we're signed in and not loading mythos
  const isChecking = isSignedIn && mythosLoading;

  useEffect(() => {
    // Only handle routing if we're signed in and done loading
    if (!isSignedIn || mythosLoading) {
      return;
    }

    // If mythos contract is not deployed, stay on this page (show message)
    if (!isMythosDeployed) {
      return;
    }

    // If mythos is not initialized, route to onboarding
    if (mythos && !mythos.initialized) {
      router.push("/onboarding");
      return;
    }

    // If mythos is initialized, route to dashboard
    if (mythos && mythos.initialized) {
      router.push("/dashboard");
      return;
    }
  }, [isSignedIn, mythos, mythosLoading, isMythosDeployed, router]);

  // Show loading state while checking
  if (isChecking || mythosLoading) {
    return (
      <>
        <Head>
          <title>Starting Your Journey - Mystic Island</title>
          <meta name="description" content="Begin your journey on Mystic Island" />
        </Head>
        <PageContainer>
          <Container>
            <Header>
              <Title>Starting Your Journey</Title>
            </Header>
            <Card>
              <LoadingText>Loading...</LoadingText>
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  // Not signed in - show auth
  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Start Your Journey - Mystic Island</title>
          <meta name="description" content="Sign in to begin your journey on Mystic Island" />
        </Head>
        <PageContainer>
          <Container>
            <Header>
              <Title>Welcome to Mystic Island</Title>
              <Subtitle>Sign in to begin your journey</Subtitle>
            </Header>
            <Card>
              <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                Connect your wallet to start building your realm
              </p>
              <AuthButton />
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  // Signed in but mythos contract not deployed
  if (isSignedIn && !isMythosDeployed) {
    return (
      <>
        <Head>
          <title>Contracts Not Deployed - Mystic Island</title>
          <meta name="description" content="Waiting for contracts to be deployed" />
        </Head>
        <PageContainer>
          <Container>
            <Header>
              <Title>Contracts Not Deployed</Title>
              <Subtitle>Welcome, {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}</Subtitle>
            </Header>
            <Card>
              <p style={{ color: colors.textSecondary, marginBottom: "1rem" }}>
                The IslandMythos contract has not been deployed yet.
              </p>
              <p style={{ color: colors.textMuted, fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                To get started:
              </p>
              <div style={{ textAlign: "left", color: colors.textSecondary, fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                <ol style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
                  <li>Deploy contracts using the new private key</li>
                  <li>Update contract addresses in <code style={{ color: colors.sunlitGold }}>src/utils/contracts.ts</code></li>
                  <li>Return here to begin onboarding</li>
                </ol>
              </div>
              <p style={{ color: colors.textMuted, fontSize: "0.85rem", fontStyle: "italic" }}>
                See <code style={{ color: colors.sunlitGold }}>contracts/DEPLOY_STEPS.md</code> for deployment instructions.
              </p>
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  // This should not be reached due to useEffect routing, but show a fallback
  return (
    <>
      <Head>
        <title>Starting Your Journey - Mystic Island</title>
        <meta name="description" content="Begin your journey on Mystic Island" />
      </Head>
      <PageContainer>
        <Container>
          <Header>
            <Title>Starting Your Journey</Title>
          </Header>
          <Card>
            <LoadingText>Redirecting...</LoadingText>
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

