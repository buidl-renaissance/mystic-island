import Head from "next/head";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { Cinzel, Inter } from "next/font/google";
import { useIsSignedIn } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useRouter } from "next/router";
import Link from "next/link";
import LocationForm from "@/components/LocationForm";
import { useLocationRegistry } from "@/hooks/useLocationRegistry";
import { createPublicClient, http } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_REGISTRY_ABI } from "@/utils/contracts";
import { clearLocationScenesCache } from "@/utils/location-scenes";

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

const LocationDescription = styled.p`
  color: ${colors.textSecondary};
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: ${colors.sunlitGold};
  margin-bottom: 1rem;
  ${cinzel.variable}
  font-family: var(--font-cinzel);
  font-weight: 600;
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

const SyncButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${colors.skyDawn} 0%, ${colors.orchidPurple} 100%);
  border: none;
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(74, 122, 154, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function AdminLocationsPage() {
  const { isSignedIn } = useIsSignedIn();
  const router = useRouter();
  const { locations: existingLocations, isLoading: locationsLoading, refetch: refetchLocations } = useLocationRegistry();
  const [isSyncingScenes, setIsSyncingScenes] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleLocationCreated = () => {
    // Refetch locations to update the list
    refetchLocations();
    // Clear cache so new scenes can be loaded
    clearLocationScenesCache();
    // Hide the create form
    setShowCreateForm(false);
  };

  const handleSyncScenes = async () => {
    setIsSyncingScenes(true);
    setSyncStatus("Syncing location scenes from contract...");
    
    try {
      const response = await fetch("/api/sync-location-scenes", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync scenes");
      }

      setSyncStatus(`✅ Successfully synced ${data.synced || 0} location scenes!`);
      clearLocationScenesCache();
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setSyncStatus(null);
      }, 3000);
    } catch (error) {
      console.error("Error syncing scenes:", error);
      setSyncStatus(`❌ Error: ${error instanceof Error ? error.message : "Failed to sync scenes"}`);
    } finally {
      setIsSyncingScenes(false);
    }
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
            <p style={{ color: colors.textSecondary, marginBottom: "1rem" }}>
              Create locations in the order you want. Select a parent location that must be visited before this location unlocks.
              Images are stored in sceneURI, videos are included in metadata JSON.
            </p>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
              <SyncButton 
                onClick={handleSyncScenes} 
                disabled={isSyncingScenes || locationsLoading}
              >
                {isSyncingScenes ? "Syncing..." : "🔄 Sync Scenes from Contract"}
              </SyncButton>
              <SyncButton
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={locationsLoading}
                style={{ background: showCreateForm ? `linear-gradient(135deg, ${colors.jungleCyan} 0%, ${colors.skyDawn} 100%)` : undefined }}
              >
                {showCreateForm ? "✕ Cancel" : "➕ Create New Location"}
              </SyncButton>
              {syncStatus && (
                <p style={{ color: syncStatus.includes("✅") ? colors.jungleCyan : colors.sunsetOrange, margin: 0 }}>
                  {syncStatus}
                </p>
              )}
            </div>
          </Card>

          {showCreateForm && (
            <Card>
              <LocationHeader>
                <LocationTitle>Create New Location</LocationTitle>
              </LocationHeader>
              <LocationForm
                onSuccess={handleLocationCreated}
              />
            </Card>
          )}

          {locationsLoading ? (
            <Card>
              <p style={{ color: colors.textSecondary, textAlign: "center" }}>
                Loading existing locations...
              </p>
            </Card>
          ) : existingLocations.length === 0 ? (
            <Card>
              <p style={{ color: colors.textSecondary, textAlign: "center" }}>
                No locations have been created yet. Use the "Create New Location" button above to get started.
              </p>
            </Card>
          ) : (
            <>
              <Card>
                <SectionTitle>Existing Locations ({existingLocations.length})</SectionTitle>
                <p style={{ color: colors.textSecondary, marginBottom: "1rem" }}>
                  These locations are already created on-chain. Children of visited locations will automatically unlock.
                </p>
              </Card>
              {existingLocations.map((location) => {
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

                const parentLocation = location.parentLocationId !== 0n
                  ? existingLocations.find((loc) => loc.id === location.parentLocationId)
                  : null;

                return (
                  <LocationCard key={location.id.toString()}>
                    <LocationHeader>
                      <LocationTitle>{location.displayName}</LocationTitle>
                      <InfoValue>ID: {location.id.toString()}</InfoValue>
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
                        <InfoLabel>Parent Location</InfoLabel>
                        <InfoValue>
                          {parentLocation 
                            ? `${parentLocation.displayName} (ID: ${parentLocation.id.toString()})`
                            : location.parentLocationId === 0n 
                            ? "Root (No Parent)"
                            : `ID: ${location.parentLocationId.toString()} (not found)`}
                        </InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Scene URI</InfoLabel>
                        <InfoValue style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>
                          {location.sceneURI || "Not set"}
                        </InfoValue>
                      </InfoItem>
                    </InfoGrid>
                  </LocationCard>
                );
              })}
            </>
          )}
        </Container>
      </PageContainer>
    </>
  );
}

