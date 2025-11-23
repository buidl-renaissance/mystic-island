import Head from "next/head";
import { useState, useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import { useIsSignedIn, useEvmAddress, useCurrentUser, useSignEvmTransaction } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { useRouter } from "next/router";
import Link from "next/link";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, TOTEM_MANAGER_ABI, ERC721_ABI } from "@/utils/contracts";
import { createPublicClient, createWalletClient, http, custom, encodeFunctionData } from "viem";
import { Totem } from "@/hooks/useTotems";

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

const TotemCard = styled.div`
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const TotemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(232, 168, 85, 0.2);
`;

const TotemTitle = styled.h3`
  font-size: 1.5rem;
  color: ${colors.sunlitGold};
  margin: 0;
  ${cinzel.variable}
  font-family: var(--font-cinzel);
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

const ArtifactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ArtifactCard = styled.div<{ selected: boolean }>`
  background: rgba(10, 20, 16, 0.5);
  border: 2px solid ${props => props.selected ? colors.sunlitGold : 'rgba(232, 168, 85, 0.2)'};
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.3);
    border-color: ${colors.sunlitGold};
  }
`;

const ArtifactId = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${colors.sunlitGold};
  margin-bottom: 0.5rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${colors.sunlitGold} 0%, ${colors.sunsetOrange} 100%);
  border: none;
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AdminButton = styled(Button)`
  background: linear-gradient(135deg, ${colors.orchidPurple} 0%, ${colors.lotusPink} 100%);
  margin-left: 0.5rem;
`;

const ToggleButton = styled(Button)`
  background: linear-gradient(135deg, ${colors.skyDawn} 0%, ${colors.orchidPurple} 100%);
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.div`
  background: rgba(199, 106, 42, 0.2);
  border: 1px solid ${colors.sunsetOrange};
  border-radius: 12px;
  padding: 1rem;
  color: ${colors.sunsetOrange};
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.div`
  background: rgba(45, 90, 61, 0.3);
  border: 1px solid ${colors.jungleCyan};
  border-radius: 12px;
  padding: 1rem;
  color: ${colors.jungleCyan};
  margin-bottom: 1rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: ${colors.textSecondary};
  padding: 2rem;
`;

const PowerInput = styled.input`
  padding: 0.5rem;
  border: 1px solid rgba(232, 168, 85, 0.3);
  border-radius: 8px;
  background: rgba(10, 20, 16, 0.5);
  color: ${colors.textPrimary};
  font-size: 1rem;
  margin-right: 0.5rem;
  width: 150px;
`;

const PowerForm = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1rem;
`;

export default function AdminTotemsPage() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { signEvmTransaction } = useSignEvmTransaction();
  const router = useRouter();
  
  const [transactionAccount, setTransactionAccount] = useState<`0x${string}` | null>(null);
  const [artifacts, setArtifacts] = useState<Array<{ id: number; tokenURI: string }>>([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  const [artifactsError, setArtifactsError] = useState<string | null>(null);
  
  const [allTotems, setAllTotems] = useState<Totem[]>([]);
  const [isLoadingTotems, setIsLoadingTotems] = useState(false);
  const [selectedArtifacts, setSelectedArtifacts] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [editingPower, setEditingPower] = useState<number | null>(null);
  const [newPower, setNewPower] = useState<string>("");

  // Determine transaction account and fetch artifacts for it
  useEffect(() => {
    const determineAccount = async () => {
      if (!isSignedIn) {
        setTransactionAccount(null);
        setArtifacts([]);
        return;
      }

      let account: `0x${string}` | null = null;

      // Try embedded wallet first
      const evmAccount = currentUser?.evmAccounts?.[0];
      if (evmAccount) {
        account = (typeof evmAccount === 'string' ? evmAccount : (evmAccount as any).address) as `0x${string}`;
      } else if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum;
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            account = accounts[0] as `0x${string}`;
          }
        } catch (err) {
          console.warn("Error getting MetaMask accounts:", err);
        }
      }

      setTransactionAccount(account);
    };

    determineAccount();
  }, [isSignedIn, currentUser]);

  // Fetch artifacts for the transaction account
  useEffect(() => {
    const fetchArtifactsForAccount = async () => {
      if (!transactionAccount) {
        setArtifacts([]);
        setIsLoadingArtifacts(false);
        setArtifactsError(null);
        return;
      }

      setIsLoadingArtifacts(true);
      setArtifactsError(null);

      try {
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const nextTokenId = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
          abi: ERC721_ABI,
          functionName: "nextTokenId",
        }).catch(() => 0n);

        const tokenCount = Number(nextTokenId);
        const availableArtifacts: Array<{ id: number; tokenURI: string }> = [];

        for (let i = 0; i < tokenCount; i++) {
          try {
            const owner = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
              abi: ERC721_ABI,
              functionName: "ownerOf",
              args: [BigInt(i)],
            });

            if (owner.toLowerCase() === transactionAccount.toLowerCase()) {
              const totemId = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
                abi: TOTEM_MANAGER_ABI,
                functionName: "artifactToTotem",
                args: [BigInt(i)],
              }).catch(() => 0n);

              if (totemId === 0n) {
                const tokenURI = await publicClient.readContract({
                  address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
                  abi: ERC721_ABI,
                  functionName: "tokenURI",
                  args: [BigInt(i)],
                }).catch(() => "");

                availableArtifacts.push({
                  id: i,
                  tokenURI: tokenURI as string,
                });
              }
            }
          } catch (err) {
            // Token might not exist, skip
          }
        }

        setArtifacts(availableArtifacts);
        setIsLoadingArtifacts(false);
      } catch (err) {
        console.error("Error fetching artifacts:", err);
        setArtifactsError(err instanceof Error ? err.message : "Failed to load artifacts");
        setIsLoadingArtifacts(false);
      }
    };

    fetchArtifactsForAccount();
  }, [transactionAccount]);

  // Fetch all totems
  const fetchAllTotems = useCallback(async () => {
    setIsLoadingTotems(true);
    setError(null);

    try {
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      const nextTotemId = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
        abi: TOTEM_MANAGER_ABI,
        functionName: "nextTotemId",
      }).catch(() => 0n);

      const totemCount = Number(nextTotemId);
      const totems: Totem[] = [];

      for (let i = 1; i < totemCount; i++) {
        try {
          const [id, creator, power, artifactCount] = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
            abi: TOTEM_MANAGER_ABI,
            functionName: "getTotem",
            args: [BigInt(i)],
          });

          const artifactIds = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
            abi: TOTEM_MANAGER_ABI,
            functionName: "getTotemArtifactIds",
            args: [BigInt(i)],
          });

          totems.push({
            id: Number(id),
            creator,
            power,
            artifactCount: Number(artifactCount),
            artifactIds: artifactIds as bigint[],
          });
        } catch (err) {
          console.warn(`Error fetching totem ${i}:`, err);
        }
      }

      setAllTotems(totems);
    } catch (err) {
      console.error("Error fetching totems:", err);
      setError(err instanceof Error ? err.message : "Failed to load totems");
    } finally {
      setIsLoadingTotems(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchAllTotems();
    }
  }, [isSignedIn, fetchAllTotems]);

  const toggleArtifact = (artifactId: number) => {
    if (selectedArtifacts.includes(artifactId)) {
      setSelectedArtifacts(selectedArtifacts.filter(id => id !== artifactId));
    } else {
      setSelectedArtifacts([...selectedArtifacts, artifactId]);
    }
  };

  const handleCreateTotem = async () => {
    if (selectedArtifacts.length === 0) {
      setError("Please select at least one artifact");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Determine which account will be used for the transaction
      let transactionAccount: `0x${string}` | null = null;

      const evmAccount = currentUser?.evmAccounts?.[0];
      if (evmAccount) {
        transactionAccount = (typeof evmAccount === 'string' ? evmAccount : (evmAccount as any).address) as `0x${string}`;
      } else if (typeof window !== "undefined" && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        transactionAccount = accounts[0] as `0x${string}`;
      }

      if (!transactionAccount) {
        throw new Error("No wallet account available. Please ensure you're properly connected.");
      }

      // Verify ownership before creating the transaction
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      // Check ownership of all selected artifacts
      for (const artifactId of selectedArtifacts) {
        try {
          const owner = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.ARTIFACT_COLLECTION as `0x${string}`,
            abi: ERC721_ABI,
            functionName: "ownerOf",
            args: [BigInt(artifactId)],
          });

          if (owner.toLowerCase() !== transactionAccount.toLowerCase()) {
            throw new Error(`You do not own artifact #${artifactId}. Current owner: ${owner}`);
          }

          // Also check if artifact is already in a totem
          const totemId = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
            abi: TOTEM_MANAGER_ABI,
            functionName: "artifactToTotem",
            args: [BigInt(artifactId)],
          }).catch(() => 0n);

          if (totemId !== 0n) {
            throw new Error(`Artifact #${artifactId} is already in totem #${totemId}`);
          }
        } catch (err) {
          if (err instanceof Error && (err.message.includes("You do not own") || err.message.includes("already in totem"))) {
            throw err;
          }
          throw new Error(`Failed to verify ownership of artifact #${artifactId}. It may not exist.`);
        }
      }

      const data = encodeFunctionData({
        abi: TOTEM_MANAGER_ABI,
        functionName: "createTotem",
        args: [selectedArtifacts.map(id => BigInt(id))],
      });

      let hash: string | undefined;

      if (evmAccount) {
        const accountAddress = transactionAccount;
        
        const gasPrice = await publicClient.getGasPrice();
        const nonce = await publicClient.getTransactionCount({
          address: accountAddress,
        });

        const gasEstimate = await publicClient.estimateGas({
          account: accountAddress,
          to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
        });

        const { signedTransaction } = await signEvmTransaction({
          evmAccount,
          transaction: {
            to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
            data: data as `0x${string}`,
            value: 0n,
            nonce,
            gas: gasEstimate,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice / 2n,
            chainId: SAGA_CHAINLET.id,
            type: "eip1559",
          },
        });

        hash = await publicClient.sendRawTransaction({
          serializedTransaction: signedTransaction,
        });
      } else if (typeof window !== "undefined" && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        const walletClient = createWalletClient({
          chain: SAGA_CHAINLET as any,
          transport: custom(ethereum),
        });

        const accountAddress = transactionAccount;

        const gasPrice = await publicClient.getGasPrice();
        const gasEstimate = await publicClient.estimateGas({
          account: accountAddress,
          to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
        });

        hash = await walletClient.sendTransaction({
          account: accountAddress,
          chain: SAGA_CHAINLET as any,
          to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
          gas: gasEstimate,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice / 2n,
        });
      } else {
        throw new Error("No wallet available. Please ensure you're properly connected.");
      }

      setTransactionHash(hash || "");
      setSuccess("Totem created successfully!");
      setSelectedArtifacts([]);
      setShowCreateForm(false);
      
      // Refresh totems list and artifacts
      setTimeout(() => {
        fetchAllTotems();
        // Trigger artifact refetch by re-setting the transaction account
        if (transactionAccount) {
          setTransactionAccount(null);
          setTimeout(() => setTransactionAccount(transactionAccount), 100);
        }
      }, 2000);
    } catch (error) {
      console.error("Error creating totem:", error);
      setError(error instanceof Error ? error.message : "Failed to create totem");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetPower = async (totemId: number) => {
    const powerValue = BigInt(newPower);
    if (powerValue < 0n) {
      setError("Power must be non-negative");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const data = encodeFunctionData({
        abi: TOTEM_MANAGER_ABI,
        functionName: "adminSetPower",
        args: [BigInt(totemId), powerValue],
      });

      let hash: string | undefined;

      const evmAccount = currentUser?.evmAccounts?.[0];
      if (evmAccount) {
        const accountAddress = (typeof evmAccount === 'string' ? evmAccount : (evmAccount as any).address) as `0x${string}`;
        if (!accountAddress) {
          throw new Error("No EOA account address available.");
        }
        
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const gasPrice = await publicClient.getGasPrice();
        const nonce = await publicClient.getTransactionCount({
          address: accountAddress,
        });

        const gasEstimate = await publicClient.estimateGas({
          account: accountAddress,
          to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
        });

        const { signedTransaction } = await signEvmTransaction({
          evmAccount,
          transaction: {
            to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
            data: data as `0x${string}`,
            value: 0n,
            nonce,
            gas: gasEstimate,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice / 2n,
            chainId: SAGA_CHAINLET.id,
            type: "eip1559",
          },
        });

        hash = await publicClient.sendRawTransaction({
          serializedTransaction: signedTransaction,
        });
      } else if (typeof window !== "undefined" && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const walletClient = createWalletClient({
          chain: SAGA_CHAINLET as any,
          transport: custom(ethereum),
        });

        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const accountAddress = accounts[0] as `0x${string}`;

        const gasPrice = await publicClient.getGasPrice();
        const gasEstimate = await publicClient.estimateGas({
          account: accountAddress,
          to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
        });

        hash = await walletClient.sendTransaction({
          account: accountAddress,
          chain: SAGA_CHAINLET as any,
          to: CONTRACT_ADDRESSES.TOTEM_MANAGER as `0x${string}`,
          data: data as `0x${string}`,
          value: 0n,
          gas: gasEstimate,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice / 2n,
        });
      } else {
        throw new Error("No wallet available.");
      }

      setTransactionHash(hash || "");
      setSuccess(`Power updated for totem ${totemId}!`);
      setEditingPower(null);
      setNewPower("");
      
      setTimeout(() => {
        fetchAllTotems();
      }, 2000);
    } catch (error) {
      console.error("Error setting power:", error);
      setError(error instanceof Error ? error.message : "Failed to set power");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isSignedIn) {
    return (
      <>
        <Head>
          <title>Admin - Totems - Mystic Island</title>
          <meta name="description" content="Admin page for managing totems" />
        </Head>
        <PageContainer>
          <Container>
            <BackLink href="/">← Back to Home</BackLink>
            <Header>
              <Title>Admin - Totems</Title>
              <Subtitle>Manage island totems</Subtitle>
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
        <title>Admin - Totems - Mystic Island</title>
        <meta name="description" content="Admin page for managing totems" />
      </Head>
      <PageContainer>
        <Container>
          <BackLink href="/dashboard">← Back to Dashboard</BackLink>
          <Header>
            <Title>Admin - Totems</Title>
            <Subtitle>Create and manage all totems on the island</Subtitle>
          </Header>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && (
            <SuccessMessage>
              {success}
              {transactionHash && (
                <>
                  <br />
                  Transaction: {transactionHash}
                </>
              )}
            </SuccessMessage>
          )}

          {transactionAccount && (
            <Card>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>Transaction Account</InfoLabel>
                  <InfoValue style={{ fontSize: "0.9rem", wordBreak: "break-all", fontFamily: "monospace" }}>
                    {transactionAccount}
                  </InfoValue>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: colors.textMuted }}>
                    This account will be used for all transactions. Artifacts shown are owned by this account.
                  </div>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Available Artifacts</InfoLabel>
                  <InfoValue>{artifacts.length}</InfoValue>
                  <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: colors.textMuted }}>
                    Artifacts not yet in a totem
                  </div>
                </InfoItem>
              </InfoGrid>
            </Card>
          )}

          <Card>
            <ToggleButton onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? "✕ Cancel" : "➕ Create New Totem"}
            </ToggleButton>
            {showCreateForm && (
              <>
                <h3 style={{ color: colors.sunlitGold, marginTop: "1rem", marginBottom: "1rem", fontFamily: "var(--font-cormorant)" }}>
                  Select artifacts to combine into a totem
                </h3>
                {isLoadingArtifacts ? (
                  <LoadingMessage>Loading artifacts...</LoadingMessage>
                ) : artifactsError ? (
                  <ErrorMessage>{artifactsError}</ErrorMessage>
                ) : artifacts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: colors.textSecondary }}>
                    <p>You don&apos;t have any available artifacts.</p>
                    <p style={{ marginTop: "1rem" }}>All your artifacts are already in totems, or you need to create some first.</p>
                  </div>
                ) : (
                  <>
                    <ArtifactGrid>
                      {artifacts.map((artifact) => (
                        <ArtifactCard
                          key={artifact.id}
                          selected={selectedArtifacts.includes(artifact.id)}
                          onClick={() => toggleArtifact(artifact.id)}
                        >
                          <ArtifactId>#{artifact.id}</ArtifactId>
                          {selectedArtifacts.includes(artifact.id) && (
                            <div style={{ color: colors.jungleCyan, fontSize: "0.9rem" }}>✓ Selected</div>
                          )}
                        </ArtifactCard>
                      ))}
                    </ArtifactGrid>
                    <div style={{ color: colors.textSecondary, marginBottom: "1rem" }}>
                      Selected: {selectedArtifacts.length} artifact{selectedArtifacts.length !== 1 ? "s" : ""}
                    </div>
                    <Button
                      onClick={handleCreateTotem}
                      disabled={isCreating || selectedArtifacts.length === 0}
                    >
                      {isCreating ? "Creating Totem..." : "Create Totem"}
                    </Button>
                  </>
                )}
              </>
            )}
          </Card>

          <Card>
            <SectionTitle>All Totems ({allTotems.length})</SectionTitle>
            <p style={{ color: colors.textSecondary, marginBottom: "1rem", fontSize: "0.9rem" }}>
              Note: Power override function requires contract owner privileges. Regular users can create totems with artifacts they own.
            </p>
            {isLoadingTotems ? (
              <LoadingMessage>Loading totems...</LoadingMessage>
            ) : allTotems.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: "center" }}>
                No totems have been created yet.
              </p>
            ) : (
              allTotems.map((totem) => (
                <TotemCard key={totem.id}>
                  <TotemHeader>
                    <TotemTitle>Totem #{totem.id}</TotemTitle>
                    <InfoValue>Power: {totem.power.toString()}</InfoValue>
                  </TotemHeader>

                  <InfoGrid>
                    <InfoItem>
                      <InfoLabel>Creator</InfoLabel>
                      <InfoValue style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>
                        {totem.creator}
                      </InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Artifact Count</InfoLabel>
                      <InfoValue>{totem.artifactCount}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Artifact IDs</InfoLabel>
                      <InfoValue>
                        {totem.artifactIds.map(id => id.toString()).join(", ") || "None"}
                      </InfoValue>
                    </InfoItem>
                  </InfoGrid>

                  {editingPower === totem.id ? (
                    <PowerForm>
                      <PowerInput
                        type="number"
                        value={newPower}
                        onChange={(e) => setNewPower(e.target.value)}
                        placeholder="New power value"
                        min="0"
                      />
                      <AdminButton
                        onClick={() => handleSetPower(totem.id)}
                        disabled={isCreating || !newPower}
                      >
                        {isCreating ? "Setting..." : "Set Power"}
                      </AdminButton>
                      <Button onClick={() => {
                        setEditingPower(null);
                        setNewPower("");
                      }}>
                        Cancel
                      </Button>
                    </PowerForm>
                  ) : (
                    <AdminButton onClick={() => {
                      setEditingPower(totem.id);
                      setNewPower(totem.power.toString());
                    }}>
                      ⚡ Override Power
                    </AdminButton>
                  )}
                </TotemCard>
              ))
            )}
          </Card>
        </Container>
      </PageContainer>
    </>
  );
}

