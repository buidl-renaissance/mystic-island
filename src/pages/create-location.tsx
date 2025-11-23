import Head from "next/head";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useIslandMythos } from "@/hooks/useIslandMythos";
import { useRouter } from "next/router";
import Link from "next/link";
import LocationForm from "@/components/LocationForm";
import { MYSTIC_ISLAND_LOCATIONS } from "@/data/realm-content";

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

const QuickFillSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 12px;
`;

const QuickFillTitle = styled.h3`
  font-size: 1.2rem;
  color: ${colors.sunlitGold};
  margin-bottom: 1rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
`;

const QuickFillGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const QuickFillButton = styled.button`
  padding: 0.75rem;
  background: rgba(74, 122, 154, 0.2);
  border: 1px solid ${colors.skyDawn};
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(74, 122, 154, 0.3);
    border-color: ${colors.sunlitGold};
    transform: translateY(-2px);
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

export default function CreateLocationPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { mythos, isLoading: mythosLoading, refetch: refetchMythos } = useIslandMythos();
  const router = useRouter();

  // Refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchMythos();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetchMythos]);

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Check if mythos is initialized
  useEffect(() => {
    if (!mythosLoading && mythos && !mythos.initialized) {
      // Mythos not initialized - could redirect to onboarding
    }
  }, [mythos, mythosLoading]);

  const handleQuickFill = (locationData: typeof MYSTIC_ISLAND_LOCATIONS[0]) => {
    setSelectedLocation(locationData.slug);
    // The form will be populated via initialData prop
  };

  const handleSuccess = () => {
    // Redirect after a short delay
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Create Location - Mystic Island</title>
          <meta name="description" content="Create a new location on the island" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Create Location</Title>
              <Subtitle>Add a new location to the island</Subtitle>
            </Header>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: colors.textSecondary, marginBottom: "2rem" }}>
                  Please sign in to create locations
                </p>
                <AuthButton />
              </div>
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  if (mythosLoading) {
    return (
      <>
        <Head>
          <title>Create Location - Mystic Island</title>
          <meta name="description" content="Create a new location on the island" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Create Location</Title>
              <Subtitle>Add a new location to the island</Subtitle>
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

  if (mythos && !mythos.initialized) {
    return (
      <>
        <Head>
          <title>Create Location - Mystic Island</title>
          <meta name="description" content="Create a new location on the island" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Create Location</Title>
              <Subtitle>Add a new location to the island</Subtitle>
            </Header>
            <Card>
              <ErrorMessage>
                The realm's mythos must be initialized before creating locations.{" "}
                <Link
                  href="/onboarding"
                  style={{ color: colors.sunlitGold, textDecoration: "underline" }}
                >
                  Go to onboarding
                </Link>
                <br />
                <br />
                <button
                  onClick={() => refetchMythos()}
                  style={{
                    padding: "0.5rem 1rem",
                    background: colors.skyDawn,
                    border: "none",
                    borderRadius: "8px",
                    color: colors.textPrimary,
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                >
                  Refresh Mythos Status
                </button>
                {mythosLoading && <span style={{ marginLeft: "1rem", color: colors.textSecondary }}>Refreshing...</span>}
              </ErrorMessage>
            </Card>
          </Container>
        </PageContainer>
      </>
    );
  }

  const selectedLocationData = selectedLocation
    ? MYSTIC_ISLAND_LOCATIONS.find((loc) => loc.slug === selectedLocation)
    : undefined;

  return (
    <>
      <Head>
        <title>Create Location - Mystic Island</title>
        <meta name="description" content="Create a new location on the island" />
      </Head>
      <PageContainer>
        <Container>
          <BackLink href="/dashboard">← Back to Dashboard</BackLink>
          <Header>
            <Title>Create Location</Title>
            <Subtitle>Add a new location to {mythos?.islandName || "the island"}</Subtitle>
          </Header>

          <Card>
            <QuickFillSection>
              <QuickFillTitle>Quick Fill: Pre-Generated Locations</QuickFillTitle>
              <p style={{ color: colors.textSecondary, marginBottom: "1rem", fontSize: "0.9rem" }}>
                Click a location below to pre-fill the form with its data:
              </p>
              <QuickFillGrid>
                {MYSTIC_ISLAND_LOCATIONS.map((location) => (
                  <QuickFillButton
                    key={location.slug}
                    onClick={() => handleQuickFill(location)}
                    type="button"
                  >
                    {location.displayName}
                  </QuickFillButton>
                ))}
              </QuickFillGrid>
            </QuickFillSection>
          </Card>

          <Card>
            <LocationForm
              onSuccess={handleSuccess}
              initialData={selectedLocationData}
            />
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

