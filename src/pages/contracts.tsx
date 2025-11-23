import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useContractData } from "@/hooks/useContractData";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET } from "@/utils/contracts";
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

const NetworkInfo = styled.div`
  background: rgba(45, 90, 61, 0.3);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
`;

const NetworkTitle = styled.h2`
  font-size: 1.5rem;
  color: ${colors.sunlitGold};
  margin-bottom: 1rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
`;

const NetworkDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  font-size: 0.9rem;
`;

const NetworkDetail = styled.div`
  color: ${colors.textSecondary};
`;

const NetworkLabel = styled.span`
  color: ${colors.textMuted};
  display: block;
  margin-bottom: 0.25rem;
`;

const NetworkValue = styled.span`
  color: ${colors.textPrimary};
  font-weight: 600;
  word-break: break-all;
`;

const ContractsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ContractCard = styled.div`
  background: rgba(45, 90, 61, 0.2);
  border: 1px solid rgba(232, 168, 85, 0.3);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    border-color: ${colors.sunlitGold};
    box-shadow: 0 8px 32px rgba(232, 168, 85, 0.2);
    transform: translateY(-4px);
  }
`;

const ContractHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1.5rem;
  ${cormorant.variable}
  font-family: var(--font-cormorant);
`;

const ContractName = styled.h3`
  font-size: 1.8rem;
  color: ${colors.sunlitGold};
  margin: 0;
  font-weight: 600;
`;

const ContractType = styled.span`
  font-size: 0.85rem;
  color: ${colors.textMuted};
  background: rgba(232, 168, 85, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(232, 168, 85, 0.2);
`;

const ContractAddress = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(10, 20, 16, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(232, 168, 85, 0.1);
`;

const AddressLabel = styled.div`
  font-size: 0.75rem;
  color: ${colors.textMuted};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const AddressValue = styled.div`
  font-family: monospace;
  font-size: 0.9rem;
  color: ${colors.jungleCyan};
  word-break: break-all;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover {
    color: ${colors.sunlitGold};
  }
`;

const ContractStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Stat = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(10, 20, 16, 0.3);
  border-radius: 8px;
`;

const StatLabel = styled.span`
  color: ${colors.textSecondary};
  font-size: 0.9rem;
`;

const StatValue = styled.span`
  color: ${colors.textPrimary};
  font-weight: 600;
  font-size: 1rem;
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
  padding: 1.5rem;
  color: ${colors.sunsetOrange};
  text-align: center;
  margin: 2rem 0;
`;

const ExplorerLink = styled.a`
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(232, 168, 85, 0.1);
  border: 1px solid ${colors.sunlitGold};
  border-radius: 8px;
  color: ${colors.sunlitGold};
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: rgba(232, 168, 85, 0.2);
    transform: translateY(-2px);
  }
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

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ContractsPage() {
  const { data, isLoading, error } = useContractData();
  const explorerUrl = SAGA_CHAINLET.blockExplorers.default.url;

  return (
    <>
      <Head>
        <title>Mystic Island - Contracts</title>
        <meta name="description" content="View deployed Mystic Island smart contracts" />
      </Head>
      <PageContainer>
        <Container>
          <BackLink href="/">← Back to Home</BackLink>
          
          <Header>
            <Title>Smart Contracts</Title>
            <Subtitle>Deployed on Saga Chainlet</Subtitle>
          </Header>

          <NetworkInfo>
            <NetworkTitle>Network Information</NetworkTitle>
            <NetworkDetails>
              <NetworkDetail>
                <NetworkLabel>Chainlet ID</NetworkLabel>
                <NetworkValue>mysticisland_2763823383026000-1</NetworkValue>
              </NetworkDetail>
              <NetworkDetail>
                <NetworkLabel>Chain ID</NetworkLabel>
                <NetworkValue>{SAGA_CHAINLET.id}</NetworkValue>
              </NetworkDetail>
              <NetworkDetail>
                <NetworkLabel>RPC Endpoint</NetworkLabel>
                <NetworkValue style={{ fontSize: "0.8rem" }}>
                  {SAGA_CHAINLET.rpcUrls.default.http[0]}
                </NetworkValue>
              </NetworkDetail>
            </NetworkDetails>
            <ExplorerLink
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Block Explorer →
            </ExplorerLink>
          </NetworkInfo>

          {error && (
            <ErrorMessage>
              Error loading contract data: {error}
            </ErrorMessage>
          )}

          <ContractsGrid>
            {/* MagicToken */}
            <ContractCard>
              <ContractHeader>
                <ContractName>Magic Token</ContractName>
                <ContractType>ERC20</ContractType>
              </ContractHeader>
              <ContractAddress>
                <AddressLabel>Contract Address</AddressLabel>
                <AddressValue
                  onClick={() =>
                    navigator.clipboard.writeText(CONTRACT_ADDRESSES.MAGIC_TOKEN)
                  }
                  title="Click to copy"
                >
                  {formatAddress(CONTRACT_ADDRESSES.MAGIC_TOKEN)}
                </AddressValue>
              </ContractAddress>
              <ContractStats>
                {isLoading ? (
                  <>
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                  </>
                ) : (
                  <>
                    <Stat>
                      <StatLabel>Name</StatLabel>
                      <StatValue>{data.magicToken.name || "—"}</StatValue>
                    </Stat>
                    <Stat>
                      <StatLabel>Symbol</StatLabel>
                      <StatValue>{data.magicToken.symbol || "—"}</StatValue>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Supply</StatLabel>
                      <StatValue>
                        {data.magicToken.totalSupply
                          ? `${parseFloat(data.magicToken.totalSupply).toLocaleString()} MAGIC`
                          : "—"}
                      </StatValue>
                    </Stat>
                  </>
                )}
              </ContractStats>
              <ExplorerLink
                href={`${explorerUrl}/address/${CONTRACT_ADDRESSES.MAGIC_TOKEN}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Explorer →
              </ExplorerLink>
            </ContractCard>

            {/* ArtifactCollection */}
            <ContractCard>
              <ContractHeader>
                <ContractName>Artifact Collection</ContractName>
                <ContractType>ERC721</ContractType>
              </ContractHeader>
              <ContractAddress>
                <AddressLabel>Contract Address</AddressLabel>
                <AddressValue
                  onClick={() =>
                    navigator.clipboard.writeText(
                      CONTRACT_ADDRESSES.ARTIFACT_COLLECTION
                    )
                  }
                  title="Click to copy"
                >
                  {formatAddress(CONTRACT_ADDRESSES.ARTIFACT_COLLECTION)}
                </AddressValue>
              </ContractAddress>
              <ContractStats>
                {isLoading ? (
                  <>
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                  </>
                ) : (
                  <>
                    <Stat>
                      <StatLabel>Name</StatLabel>
                      <StatValue>{data.artifactCollection.name || "—"}</StatValue>
                    </Stat>
                    <Stat>
                      <StatLabel>Symbol</StatLabel>
                      <StatValue>
                        {data.artifactCollection.symbol || "—"}
                      </StatValue>
                    </Stat>
                    <Stat>
                      <StatLabel>Total Artifacts</StatLabel>
                      <StatValue>
                        {data.artifactCollection.nextTokenId
                          ? `${data.artifactCollection.nextTokenId} minted`
                          : "—"}
                      </StatValue>
                    </Stat>
                  </>
                )}
              </ContractStats>
              <ExplorerLink
                href={`${explorerUrl}/address/${CONTRACT_ADDRESSES.ARTIFACT_COLLECTION}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Explorer →
              </ExplorerLink>
            </ContractCard>

            {/* TribeManager */}
            <ContractCard>
                <ContractHeader>
                  <ContractName>Tribe Manager</ContractName>
                  <ContractType>Manager</ContractType>
                </ContractHeader>
                <ContractAddress>
                  <AddressLabel>Contract Address</AddressLabel>
                  <AddressValue
                    onClick={() =>
                      navigator.clipboard.writeText(CONTRACT_ADDRESSES.TRIBE_MANAGER)
                    }
                    title="Click to copy"
                  >
                    {formatAddress(CONTRACT_ADDRESSES.TRIBE_MANAGER)}
                  </AddressValue>
                </ContractAddress>
                <ContractStats>
                  {isLoading ? (
                    <>
                      <LoadingSkeleton />
                      <LoadingSkeleton />
                    </>
                  ) : (
                    <>
                      <Stat>
                        <StatLabel>Total Tribes</StatLabel>
                        <StatValue>
                          {data.tribeManager.nextTribeId
                            ? `${parseInt(data.tribeManager.nextTribeId) - 1} created`
                            : "—"}
                        </StatValue>
                      </Stat>
                      <Stat>
                        <StatLabel>Join Requests</StatLabel>
                        <StatValue>
                          {data.tribeManager.nextJoinRequestId
                            ? `${parseInt(data.tribeManager.nextJoinRequestId) - 1} total`
                            : "—"}
                        </StatValue>
                      </Stat>
                    </>
                  )}
                </ContractStats>
                <ExplorerLink
                  href={`${explorerUrl}/address/${CONTRACT_ADDRESSES.TRIBE_MANAGER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Explorer →
                </ExplorerLink>
              </ContractCard>

            {/* TotemManager */}
            <ContractCard>
              <ContractHeader>
                <ContractName>Totem Manager</ContractName>
                <ContractType>Manager</ContractType>
              </ContractHeader>
              <ContractAddress>
                <AddressLabel>Contract Address</AddressLabel>
                <AddressValue
                  onClick={() =>
                    navigator.clipboard.writeText(CONTRACT_ADDRESSES.TOTEM_MANAGER)
                  }
                  title="Click to copy"
                >
                  {formatAddress(CONTRACT_ADDRESSES.TOTEM_MANAGER)}
                </AddressValue>
              </ContractAddress>
              <ContractStats>
                {isLoading ? (
                  <>
                    <LoadingSkeleton />
                  </>
                ) : (
                  <Stat>
                    <StatLabel>Total Totems</StatLabel>
                    <StatValue>
                      {data.totemManager.nextTotemId
                        ? `${parseInt(data.totemManager.nextTotemId) - 1} created`
                        : "—"}
                    </StatValue>
                  </Stat>
                )}
              </ContractStats>
              <ExplorerLink
                href={`${explorerUrl}/address/${CONTRACT_ADDRESSES.TOTEM_MANAGER}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Explorer →
              </ExplorerLink>
            </ContractCard>

            {/* QuestManager */}
            <ContractCard>
              <ContractHeader>
                <ContractName>Quest Manager</ContractName>
                <ContractType>Manager</ContractType>
              </ContractHeader>
              <ContractAddress>
                <AddressLabel>Contract Address</AddressLabel>
                <AddressValue
                  onClick={() =>
                    navigator.clipboard.writeText(CONTRACT_ADDRESSES.QUEST_MANAGER)
                  }
                  title="Click to copy"
                >
                  {formatAddress(CONTRACT_ADDRESSES.QUEST_MANAGER)}
                </AddressValue>
              </ContractAddress>
              <ContractStats>
                {isLoading ? (
                  <>
                    <LoadingSkeleton />
                  </>
                ) : (
                  <Stat>
                    <StatLabel>Attestor Address</StatLabel>
                    <StatValue style={{ fontSize: "0.85rem" }}>
                      {data.questManager.attestor
                        ? formatAddress(data.questManager.attestor)
                        : "—"}
                    </StatValue>
                  </Stat>
                )}
              </ContractStats>
              <ExplorerLink
                href={`${explorerUrl}/address/${CONTRACT_ADDRESSES.QUEST_MANAGER}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Explorer →
              </ExplorerLink>
            </ContractCard>

            {/* IslandMythos */}
            {CONTRACT_ADDRESSES.ISLAND_MYTHOS !== "0x0000000000000000000000000000000000000000" && (
              <ContractCard>
                <ContractHeader>
                  <ContractName>Island Mythos</ContractName>
                  <ContractType>Registry</ContractType>
                </ContractHeader>
                <ContractAddress>
                  <AddressLabel>Contract Address</AddressLabel>
                  <AddressValue
                    onClick={() =>
                      navigator.clipboard.writeText(CONTRACT_ADDRESSES.ISLAND_MYTHOS)
                    }
                    title="Click to copy"
                  >
                    {formatAddress(CONTRACT_ADDRESSES.ISLAND_MYTHOS)}
                  </AddressValue>
                </ContractAddress>
                <ContractStats>
                  {isLoading ? (
                    <>
                      <LoadingSkeleton />
                      <LoadingSkeleton />
                    </>
                  ) : (
                    <>
                      <Stat>
                        <StatLabel>Status</StatLabel>
                        <StatValue>
                          {data.islandMythos.initialized
                            ? data.islandMythos.locked
                              ? "✓ Initialized & Locked"
                              : "✓ Initialized"
                            : "Not Initialized"}
                        </StatValue>
                      </Stat>
                      <Stat>
                        <StatLabel>Island Name</StatLabel>
                        <StatValue>
                          {data.islandMythos.islandName || "—"}
                        </StatValue>
                      </Stat>
                    </>
                  )}
                </ContractStats>
                <ExplorerLink
                  href={`${explorerUrl}/address/${CONTRACT_ADDRESSES.ISLAND_MYTHOS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Explorer →
                </ExplorerLink>
              </ContractCard>
            )}

            {/* LocationRegistry */}
            {CONTRACT_ADDRESSES.LOCATION_REGISTRY !== "0x0000000000000000000000000000000000000000" && (
              <ContractCard>
                <ContractHeader>
                  <ContractName>Location Registry</ContractName>
                  <ContractType>Registry</ContractType>
                </ContractHeader>
                <ContractAddress>
                  <AddressLabel>Contract Address</AddressLabel>
                  <AddressValue
                    onClick={() =>
                      navigator.clipboard.writeText(CONTRACT_ADDRESSES.LOCATION_REGISTRY)
                    }
                    title="Click to copy"
                  >
                    {formatAddress(CONTRACT_ADDRESSES.LOCATION_REGISTRY)}
                  </AddressValue>
                </ContractAddress>
                <ContractStats>
                  {isLoading ? (
                    <>
                      <LoadingSkeleton />
                    </>
                  ) : (
                    <Stat>
                      <StatLabel>Total Locations</StatLabel>
                      <StatValue>
                        {data.locationRegistry.totalLocations
                          ? `${data.locationRegistry.totalLocations} created`
                          : "—"}
                      </StatValue>
                    </Stat>
                  )}
                </ContractStats>
                <ExplorerLink
                  href={`${explorerUrl}/address/${CONTRACT_ADDRESSES.LOCATION_REGISTRY}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Explorer →
                </ExplorerLink>
              </ContractCard>
            )}
          </ContractsGrid>
        </Container>
      </PageContainer>
    </>
  );
}

