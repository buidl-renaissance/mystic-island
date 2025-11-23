import Head from "next/head";
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useLocationRegistry } from "@/hooks/useLocationRegistry";
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

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
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
  animation: ${float} 6s ease-in-out infinite;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
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
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(232, 168, 85, 0.6);
    box-shadow: 0 8px 32px rgba(232, 168, 85, 0.2);
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: ${colors.sunlitGold};
  margin-bottom: 1.5rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
  font-weight: 600;
`;

const LocationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const LocationCard = styled.div`
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(232, 168, 85, 0.5);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.2);
  }
`;

const LocationName = styled.h3`
  font-size: 1.3rem;
  color: ${colors.sunlitGold};
  margin-bottom: 0.5rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
  font-weight: 600;
`;

const LocationDescription = styled.p`
  font-size: 0.9rem;
  color: ${colors.textSecondary};
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const LocationMeta = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(232, 168, 85, 0.2);
  border: 1px solid rgba(232, 168, 85, 0.4);
  border-radius: 12px;
  font-size: 0.8rem;
  color: ${colors.sunlitGold};
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
  margin-bottom: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${colors.textSecondary};
`;

const ErrorMessage = styled.div`
  background: rgba(199, 106, 42, 0.2);
  border: 1px solid ${colors.sunsetOrange};
  border-radius: 12px;
  padding: 1rem;
  color: ${colors.sunsetOrange};
  margin-bottom: 1rem;
`;

// Biome type names
const BIOME_NAMES: Record<number, string> = {
  0: "Unknown",
  1: "Meadow",
  2: "Forest",
  3: "Marsh",
  4: "Mountain",
  5: "Beach",
  6: "Ruins",
  7: "Bazaar",
  8: "Shrine",
  9: "Cave",
  10: "Custom",
};

// Difficulty tier names
const DIFFICULTY_NAMES: Record<number, string> = {
  0: "None",
  1: "Easy",
  2: "Normal",
  3: "Hard",
  4: "Mythic",
};

export default function ExplorePage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { locations, isLoading, error } = useLocationRegistry();

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Explore the Island - Mystic Island</title>
          <meta name="description" content="Explore locations and discover the mysteries of Mystic Island" />
        </Head>
        <PageContainer>
          <Container>
            <Header>
              <Title>Explore the Island</Title>
              <Subtitle>Discover locations, tribes, and artifacts</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to explore the island
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
        <title>Explore the Island - Mystic Island</title>
        <meta name="description" content="Explore locations and discover the mysteries of Mystic Island" />
      </Head>
      <PageContainer className={`${cinzel.variable} ${cormorant.variable} ${inter.variable}`}>
        <Container>
          <Header>
            <Title>Explore the Island</Title>
            <Subtitle>
              Welcome, explorer {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}
            </Subtitle>
          </Header>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Card>
            <SectionTitle>Locations</SectionTitle>
            {isLoading ? (
              <>
                <LoadingSkeleton />
                <LoadingSkeleton />
                <LoadingSkeleton />
              </>
            ) : locations.length === 0 ? (
              <EmptyState>
                <p>No locations have been discovered yet.</p>
                <ActionButton href="/create-location">Create First Location</ActionButton>
              </EmptyState>
            ) : (
              <LocationsGrid>
                {locations.map((location) => (
                  <LocationCard key={location.id}>
                    <LocationName>{location.displayName}</LocationName>
                    <LocationDescription>{location.description}</LocationDescription>
                    <LocationMeta>
                      {BIOME_NAMES[location.biome] && (
                        <Badge>🏞️ {BIOME_NAMES[location.biome]}</Badge>
                      )}
                      {DIFFICULTY_NAMES[location.difficulty] && (
                        <Badge>⚔️ {DIFFICULTY_NAMES[location.difficulty]}</Badge>
                      )}
                    </LocationMeta>
                  </LocationCard>
                ))}
              </LocationsGrid>
            )}
          </Card>

          <Card>
            <SectionTitle>Quick Actions</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <ActionButton href="/dashboard">View Dashboard</ActionButton>
              <ActionButton href="/create-location">Create Location</ActionButton>
              <ActionButton href="/join-tribe">Join Tribe</ActionButton>
              <ActionButton href="/create-artifact">Create Artifact</ActionButton>
            </div>
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

