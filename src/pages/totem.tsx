import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import Link from "next/link";
import { useTotems } from "@/hooks/useTotems";
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

const spin = keyframes`
  0% { transform: rotateY(0deg); }
  60% { transform: rotateY(1080deg); }
  70% { transform: rotateY(1120deg); }
  80% { transform: rotateY(1060deg); }
  90% { transform: rotateY(1090deg); }
  100% { transform: rotateY(1080deg); }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(232, 168, 85, 0.5), 0 0 40px rgba(232, 168, 85, 0.3), 0 0 60px rgba(232, 168, 85, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(232, 168, 85, 0.8), 0 0 60px rgba(232, 168, 85, 0.5), 0 0 90px rgba(232, 168, 85, 0.3);
  }
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
  max-width: 420px;
  margin: 0 auto;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 4rem;
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
  margin-bottom: 2rem;
`;

const Card = styled.div`
  background: rgba(45, 90, 61, 0.3);
  border: 1px solid rgba(232, 168, 85, 0.3);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  margin-bottom: 2rem;
`;

const ErrorMessage = styled.div`
  background: rgba(199, 106, 42, 0.2);
  border: 1px solid ${colors.sunsetOrange};
  border-radius: 12px;
  padding: 1rem;
  color: ${colors.sunsetOrange};
  margin-bottom: 1rem;
`;

const CommunityTotemCard = styled.div`
  /* background: rgba(45, 90, 61, 0.3);
  border: 2px solid rgba(232, 168, 85, 0.5);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  margin-bottom: 2rem; */
  padding: 2rem;
  text-align: center;
`;

const TotemLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: ${colors.textMuted};
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  ${inter.variable}
  font-family: var(--font-inter);
`;

const CommunityTotemTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${colors.sunlitGold};
  margin-bottom: 0.5rem;
  text-shadow: 0 0 20px rgba(232, 168, 85, 0.3);
  ${cinzel.variable}
  font-family: var(--font-cinzel);
`;

const CommunityTotemSubtitle = styled.p`
  font-size: 1rem;
  color: ${colors.textSecondary};
  margin-bottom: 2.5rem;
  ${cinzel.variable}
  font-family: var(--font-cinzel);
`;

const TotemImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const TotemImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  border: 2px solid rgba(232, 168, 85, 0.3);
  animation: ${spin} 2.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), ${glow} 3s ease-in-out infinite;
  transform-style: preserve-3d;
`;

const ExploreButton = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${colors.sunlitGold} 0%, ${colors.sunsetOrange} 100%);
  border: none;
  border-radius: 8px;
  color: ${colors.textPrimary};
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.3);
  }
`;

export default function TotemsPage() {
  const { isSignedIn } = useIsSignedIn();
  const { totems, isLoading, error, refetch } = useTotems();

  // if (!isSignedIn) {
  //   return (
  //     <>
  //       <Head>
  //         <title>My Totems - Mystic Island</title>
  //         <meta name="description" content="View your totems" />
  //       </Head>
  //       <PageContainer>
  //         <Container>
  //           <Header>
  //             <Title>My Totems</Title>
  //             <Subtitle>View and manage your totems</Subtitle>
  //           </Header>
  //           <Card>
  //             <div style={{ textAlign: "center", padding: "2rem" }}>
  //               <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
  //                 Please sign in to view your totems
  //               </p>
  //               <AuthButton />
  //             </div>
  //           </Card>
  //         </Container>
  //       </PageContainer>
  //     </>
  //   );
  // }

  return (
    <>
      <Head>
        <title>My Totems - Mystic Island</title>
        <meta name="description" content="View your totems" />
      </Head>
      <PageContainer>
        <Container>
          {/* <Header>
            <Title>My Totems</Title>
            <Subtitle>View and manage your totems</Subtitle>
          </Header>

          <HeaderBar>
            <MagicBalance />
          </HeaderBar> */}

          <CommunityTotemCard>
            <TotemLabel>COMMUNITY TOTEM</TotemLabel>
            <CommunityTotemTitle>The Spirit of Luma</CommunityTotemTitle>
            <CommunityTotemSubtitle>Mystic Island</CommunityTotemSubtitle>
            <TotemImageContainer>
              <TotemImage 
                src="/images/mystic-island-origin.jpg" 
                alt="The Spirit of Luma"
              />
            </TotemImageContainer>
            <ExploreButton href="/explore">
              Explore the Island
            </ExploreButton>
          </CommunityTotemCard>

          {/* <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <ActionButton href="/create-totem">Create New Totem</ActionButton>
          </div> */}

          {error && <ErrorMessage>{error}</ErrorMessage>}

          {/* <Card>
            {isLoading ? (
              <LoadingMessage>Loading totems...</LoadingMessage>
            ) : totems.length === 0 ? (
              <EmptyState>
                <p>You don&apos;t have any totems yet.</p>
                <ActionButton href="/create-totem">Create Your First Totem</ActionButton>
              </EmptyState>
            ) : (
              <TotemGrid>
                {totems.map((totem) => (
                  <TotemCard key={totem.id} href={`/totem/${totem.id}`}>
                    <TotemId>Totem #{totem.id}</TotemId>
                    <TotemStat>
                      <span>Power:</span>
                      <StatValue>{totem.power.toString()}</StatValue>
                    </TotemStat>
                    <TotemStat>
                      <span>Artifacts:</span>
                      <StatValue>{totem.artifactCount}</StatValue>
                    </TotemStat>
                    <TotemStat>
                      <span>Creator:</span>
                      <StatValue style={{ fontSize: "0.8rem" }}>
                        {totem.creator.slice(0, 6)}...{totem.creator.slice(-4)}
                      </StatValue>
                    </TotemStat>
                  </TotemCard>
                ))}
              </TotemGrid>
            )}
          </Card> */}
        </Container>
      </PageContainer>
    </>
  );
}

