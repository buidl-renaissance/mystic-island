import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { createPublicClient, http } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_REGISTRY_ABI } from "@/utils/contracts";
import Link from "next/link";
import type { Location } from "@/hooks/useLocationRegistry";

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
  max-width: 1000px;
  margin: 0 auto;
  animation: ${fadeIn} 0.6s ease-out;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 2rem;
  color: ${colors.textSecondary};
  text-decoration: none;
  transition: color 0.2s;
  font-size: 0.9rem;

  &:hover {
    color: ${colors.sunlitGold};
  }
`;

const Card = styled.div`
  background: rgba(45, 90, 61, 0.3);
  border: 1px solid rgba(232, 168, 85, 0.3);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${colors.sunlitGold};
  margin-bottom: 0.5rem;
  ${cinzel.variable}
  font-family: var(--font-cinzel);
  text-shadow: 0 0 20px rgba(232, 168, 85, 0.3);

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: ${colors.textSecondary};
  line-height: 1.8;
  margin-bottom: 2rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoLabel = styled.span`
  font-size: 0.85rem;
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const InfoValue = styled.span`
  font-size: 1.1rem;
  color: ${colors.textPrimary};
  font-weight: 600;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(232, 168, 85, 0.2);
  border: 1px solid rgba(232, 168, 85, 0.4);
  border-radius: 12px;
  font-size: 0.9rem;
  color: ${colors.sunlitGold};
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const URISection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(232, 168, 85, 0.2);
`;

const URITitle = styled.h3`
  font-size: 1.3rem;
  color: ${colors.sunlitGold};
  margin-bottom: 1rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
  font-weight: 600;
`;

const URILink = styled.a`
  display: inline-block;
  color: ${colors.jungleCyan};
  text-decoration: none;
  word-break: break-all;
  transition: color 0.2s;

  &:hover {
    color: ${colors.sunlitGold};
    text-decoration: underline;
  }
`;

const SceneImage = styled.img`
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  border: 2px solid rgba(232, 168, 85, 0.3);
  margin-top: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  object-fit: contain;
  display: block;
`;

const ImageContainer = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(232, 168, 85, 0.2);
`;

const LoadingSkeleton = styled.div`
  background: rgba(45, 90, 61, 0.3);
  height: 100px;
  border-radius: 8px;
  animation: ${fadeIn} 1s ease-in-out infinite alternate;
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

export default function LocationDetailPage() {
  const { isSignedIn } = useIsSignedIn();
  const router = useRouter();
  const { id } = router.query;
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentLocation, setParentLocation] = useState<Location | null>(null);

  useEffect(() => {
    async function fetchLocation() {
      if (!id || typeof id !== "string") {
        setIsLoading(false);
        return;
      }

      if (CONTRACT_ADDRESSES.LOCATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
        setError("LocationRegistry contract not deployed yet.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const locationId = BigInt(id);
        const locationData = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
          abi: LOCATION_REGISTRY_ABI,
          functionName: "getLocation",
          args: [locationId],
        });

        const loc = locationData as unknown as {
          id: bigint;
          slug: string;
          displayName: string;
          description: string;
          biome: bigint;
          difficulty: bigint;
          parentLocationId: bigint;
          isActive: boolean;
          sceneURI: string;
          controller: string;
          metadataURI: string;
        };

        const locationObj: Location = {
          id: loc.id,
          slug: loc.slug,
          displayName: loc.displayName,
          description: loc.description,
          biome: Number(loc.biome),
          difficulty: Number(loc.difficulty),
          parentLocationId: loc.parentLocationId,
          isActive: loc.isActive,
          sceneURI: loc.sceneURI,
          controller: loc.controller as string,
          metadataURI: loc.metadataURI,
        };

        setLocation(locationObj);

        // Fetch parent location if it exists
        if (locationObj.parentLocationId !== 0n) {
          try {
            const parentData = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
              abi: LOCATION_REGISTRY_ABI,
              functionName: "getLocation",
              args: [locationObj.parentLocationId],
            });

            const parent = parentData as unknown as {
              id: bigint;
              slug: string;
              displayName: string;
              description: string;
              biome: bigint;
              difficulty: bigint;
              parentLocationId: bigint;
              isActive: boolean;
              sceneURI: string;
              controller: string;
              metadataURI: string;
            };

            setParentLocation({
              id: parent.id,
              slug: parent.slug,
              displayName: parent.displayName,
              description: parent.description,
              biome: Number(parent.biome),
              difficulty: Number(parent.difficulty),
              parentLocationId: parent.parentLocationId,
              isActive: parent.isActive,
              sceneURI: parent.sceneURI,
              controller: parent.controller as string,
              metadataURI: parent.metadataURI,
            });
          } catch (err) {
            console.error("Error fetching parent location:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching location:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch location");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocation();
  }, [id]);

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Location Details - Mystic Island</title>
          <meta name="description" content="View location details" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/explore">← Back to Explore</BackLink>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to view location details
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
          <title>Loading Location - Mystic Island</title>
          <meta name="description" content="Loading location details" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/explore">← Back to Explore</BackLink>
            <Card>
              <LoadingSkeleton />
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  if (error || !location) {
    return (
      <>
        <Head>
          <title>Location Not Found - Mystic Island</title>
          <meta name="description" content="Location not found" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/explore">← Back to Explore</BackLink>
            <Card>
              <ErrorMessage>
                {error || "Location not found. Please check the location ID."}
              </ErrorMessage>
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  // Convert IPFS URLs to gateway URLs for display
  const convertIpfsUrl = (uri: string) => {
    if (uri.startsWith("ipfs://")) {
      const hash = uri.replace("ipfs://", "");
      return `https://ipfs.io/ipfs/${hash}`;
    }
    return uri;
  };

  return (
    <>
      <Head>
        <title>{location.displayName} - Mystic Island</title>
        <meta name="description" content={location.description} />
      </Head>
      <PageContainer className={`${cinzel.variable} ${cormorant.variable} ${inter.variable}`}>
        <Container>
          <BackLink href="/explore">← Back to Explore</BackLink>

          <Card>
            <Title>{location.displayName}</Title>
            <Description>{location.description}</Description>

            {/* Display scene image if available */}
            {location.sceneURI && (
              <ImageContainer>
                <URITitle>Scene Image</URITitle>
                <SceneImage
                  src={convertIpfsUrl(location.sceneURI)}
                  alt={location.displayName}
                  onError={(e) => {
                    // Fallback to another gateway if first one fails
                    const target = e.target as HTMLImageElement;
                    if (location.sceneURI.startsWith("ipfs://")) {
                      const hash = location.sceneURI.replace("ipfs://", "");
                      target.src = `https://gateway.pinata.cloud/ipfs/${hash}`;
                    }
                  }}
                />
                <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: colors.textMuted }}>
                  <URILink href={convertIpfsUrl(location.sceneURI)} target="_blank" rel="noopener noreferrer">
                    View full size
                  </URILink>
                </div>
              </ImageContainer>
            )}

            <InfoGrid>
              <InfoItem>
                <InfoLabel>Location ID</InfoLabel>
                <InfoValue>#{location.id.toString()}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>Slug</InfoLabel>
                <InfoValue>{location.slug}</InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>Biome</InfoLabel>
                <InfoValue>
                  <Badge>🏞️ {BIOME_NAMES[location.biome] || "Unknown"}</Badge>
                </InfoValue>
              </InfoItem>

              <InfoItem>
                <InfoLabel>Difficulty</InfoLabel>
                <InfoValue>
                  <Badge>⚔️ {DIFFICULTY_NAMES[location.difficulty] || "None"}</Badge>
                </InfoValue>
              </InfoItem>

              {parentLocation && (
                <InfoItem>
                  <InfoLabel>Parent Location</InfoLabel>
                  <InfoValue>
                    <Link
                      href={`/location/${parentLocation.id}`}
                      style={{ color: colors.jungleCyan, textDecoration: "none" }}
                    >
                      {parentLocation.displayName}
                    </Link>
                  </InfoValue>
                </InfoItem>
              )}

              <InfoItem>
                <InfoLabel>Status</InfoLabel>
                <InfoValue>
                  <Badge>{location.isActive ? "✅ Active" : "❌ Inactive"}</Badge>
                </InfoValue>
              </InfoItem>
            </InfoGrid>

            {location.metadataURI && (
              <URISection>
                <URITitle>Metadata URI</URITitle>
                <URILink href={convertIpfsUrl(location.metadataURI)} target="_blank" rel="noopener noreferrer">
                  {location.metadataURI}
                </URILink>
              </URISection>
            )}

            {location.controller !== "0x0000000000000000000000000000000000000000" && (
              <InfoItem style={{ marginTop: "2rem" }}>
                <InfoLabel>Controller Contract</InfoLabel>
                <InfoValue style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                  {location.controller}
                </InfoValue>
              </InfoItem>
            )}
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

