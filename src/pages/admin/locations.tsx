import Head from "next/head";
import { useState } from "react";
import styled from "styled-components";
import { Cinzel, Inter } from "next/font/google";
import { useIsSignedIn } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useRouter } from "next/router";
import Link from "next/link";
import LocationForm from "@/components/LocationForm";
import { MYSTIC_ISLAND_LOCATIONS, type LocationData } from "@/data/realm-content";

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

const LocationCard = styled.div`
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const LocationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(232, 168, 85, 0.2);
`;

const LocationTitle = styled.h3`
  font-size: 1.5rem;
  color: ${colors.sunlitGold};
  margin: 0;
  ${cinzel.variable}
  font-family: var(--font-cinzel);
`;

const StatusBadge = styled.span<{ created: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${(props) =>
    props.created
      ? "rgba(74, 154, 122, 0.3)"
      : "rgba(199, 106, 42, 0.3)"};
  color: ${(props) =>
    props.created ? colors.jungleCyan : colors.sunsetOrange};
  border: 1px solid
    ${(props) =>
      props.created ? colors.jungleCyan : colors.sunsetOrange};
`;

const LocationDescription = styled.p`
  color: ${colors.textSecondary};
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(10, 20, 16, 0.3);
  border-radius: 8px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.85rem;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  color: ${colors.textPrimary};
  font-weight: 600;
`;

export default function AdminLocationsPage() {
  const { isSignedIn } = useIsSignedIn();
  const router = useRouter();
  const [createdLocations, setCreatedLocations] = useState<Set<string>>(new Set());

  const handleLocationCreated = (slug: string) => {
    setCreatedLocations((prev) => new Set(prev).add(slug));
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Admin - Locations - Mystic Island</title>
          <meta name="description" content="Admin page for managing locations" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Admin - Locations</Title>
              <Subtitle>Manage island locations</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to access the admin panel
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
        <title>Admin - Locations - Mystic Island</title>
        <meta name="description" content="Admin page for managing locations" />
      </Head>
      <PageContainer>
        <Container>
          <BackLink href="/dashboard">← Back to Dashboard</BackLink>
          <Header>
            <Title>Admin - Locations</Title>
            <Subtitle>Upload and create locations with images and videos</Subtitle>
          </Header>

          <Card>
            <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
              Upload images and videos for each location, then create them onchain. Images are stored in sceneURI, videos are included in metadata JSON.
            </p>
          </Card>

          {MYSTIC_ISLAND_LOCATIONS.map((location) => {
            const isCreated = createdLocations.has(location.slug);
            const biomeLabels: Record<number, string> = {
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
            const difficultyLabels: Record<number, string> = {
              0: "None",
              1: "Easy",
              2: "Normal",
              3: "Hard",
              4: "Mythic",
            };

            return (
              <LocationCard key={location.slug}>
                <LocationHeader>
                  <LocationTitle>{location.displayName}</LocationTitle>
                  <StatusBadge created={isCreated}>
                    {isCreated ? "✓ Created" : "Pending"}
                  </StatusBadge>
                </LocationHeader>

                <LocationDescription>{location.description}</LocationDescription>

                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Slug</InfoLabel>
                    <InfoValue>{location.slug}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Biome</InfoLabel>
                    <InfoValue>{biomeLabels[location.biome] || "Unknown"}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Difficulty</InfoLabel>
                    <InfoValue>{difficultyLabels[location.difficulty] || "None"}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Parent Location ID</InfoLabel>
                    <InfoValue>{location.parentLocationId || "Root"}</InfoValue>
                  </InfoItem>
                </InfoGrid>

                <LocationForm
                  initialData={location}
                  onSuccess={() => handleLocationCreated(location.slug)}
                />
              </LocationCard>
            );
          })}
        </Container>
      </PageContainer>
    </>
  );
}

