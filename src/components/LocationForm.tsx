import { useState, useEffect } from "react";
import styled from "styled-components";
import { useCurrentUser } from "@coinbase/cdp-hooks";
import { signEvmTransaction } from "@coinbase/cdp-core";
import { createPublicClient, createWalletClient, http, custom, encodeFunctionData } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_REGISTRY_ABI, ISLAND_MYTHOS_ABI } from "@/utils/contracts";
import MediaUpload from "@/components/MediaUpload";
import { getIpfsProtocolUrl } from "@/utils/ipfs";
import { useIslandMythos } from "@/hooks/useIslandMythos";
import { getLocationSceneURI, hasLocationScene } from "@/utils/location-scenes";

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

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: ${colors.textSecondary};
  font-size: 0.9rem;
  font-weight: 600;
`;

const Input = styled.input`
  padding: 0.75rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${colors.sunlitGold};
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${colors.sunlitGold};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  background: rgba(10, 20, 16, 0.5);
  border: 1px solid rgba(232, 168, 85, 0.2);
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${colors.sunlitGold};
  }

  option {
    background: ${colors.deepForest};
    color: ${colors.textPrimary};
  }
`;

const Button = styled.button<{ disabled?: boolean }>`
  padding: 0.75rem 1.5rem;
  background: ${(props) =>
    props.disabled
      ? "rgba(160, 160, 160, 0.2)"
      : `linear-gradient(135deg, ${colors.sunlitGold} 0%, ${colors.sunsetOrange} 100%)`};
  border: none;
  border-radius: 8px;
  color: ${colors.textPrimary};
  font-size: 1rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.3);
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(199, 106, 42, 0.2);
  border: 1px solid ${colors.sunsetOrange};
  border-radius: 8px;
  padding: 1rem;
  color: ${colors.sunsetOrange};
  margin-top: 1rem;
`;

const SuccessMessage = styled.div`
  background: rgba(74, 154, 122, 0.2);
  border: 1px solid ${colors.jungleCyan};
  border-radius: 8px;
  padding: 1rem;
  color: ${colors.jungleCyan};
  margin-top: 1rem;
`;

// Biome and Difficulty enums (matching contract)
const BIOME_TYPES = [
  { value: 0, label: "Unknown" },
  { value: 1, label: "Meadow" },
  { value: 2, label: "Forest" },
  { value: 3, label: "Marsh" },
  { value: 4, label: "Mountain" },
  { value: 5, label: "Beach" },
  { value: 6, label: "Ruins" },
  { value: 7, label: "Bazaar" },
  { value: 8, label: "Shrine" },
  { value: 9, label: "Cave" },
  { value: 10, label: "Custom" },
];

const DIFFICULTY_TIERS = [
  { value: 0, label: "None" },
  { value: 1, label: "Easy" },
  { value: 2, label: "Normal" },
  { value: 3, label: "Hard" },
  { value: 4, label: "Mythic" },
];

interface LocationFormProps {
  onSuccess?: (locationId: number) => void;
  initialData?: {
    slug?: string;
    displayName?: string;
    description?: string;
    biome?: number;
    difficulty?: number;
    parentLocationId?: number;
    sceneURI?: string;
    metadataURI?: string;
  };
}

export default function LocationForm({ onSuccess, initialData }: LocationFormProps) {
  const { currentUser } = useCurrentUser();
  const { mythos, isLoading: mythosLoading } = useIslandMythos();
  const evmAccount = currentUser?.evmAccounts?.[0];

  const [formData, setFormData] = useState({
    slug: initialData?.slug || "",
    displayName: initialData?.displayName || "",
    description: initialData?.description || "",
    biome: initialData?.biome ?? 0,
    difficulty: initialData?.difficulty ?? 0,
    parentLocationId: initialData?.parentLocationId || 0,
    sceneURI: initialData?.sceneURI || "",
    metadataURI: initialData?.metadataURI || "",
  });

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Track uploaded media
  const [uploadedImageHash, setUploadedImageHash] = useState<string | null>(null);
  const [uploadedVideoHash, setUploadedVideoHash] = useState<string | null>(null);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [hasExistingScene, setHasExistingScene] = useState(false);
  const [existingSceneURI, setExistingSceneURI] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (CONTRACT_ADDRESSES.LOCATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
      setError("LocationRegistry contract not deployed yet. Please deploy contracts first.");
      return;
    }

    // Check if mythos is initialized
    if (mythosLoading) {
      setError("Loading mythos data... Please wait.");
      return;
    }

    if (!mythos || !mythos.initialized) {
      setError("The realm's mythos must be initialized before creating locations. Please initialize the mythos first.");
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      // Encode the createLocation function call
      const data = encodeFunctionData({
        abi: LOCATION_REGISTRY_ABI,
        functionName: "createLocation",
        args: [
          formData.slug,
          formData.displayName,
          formData.description,
          formData.biome,
          formData.difficulty,
          BigInt(formData.parentLocationId),
          formData.sceneURI,
          "0x0000000000000000000000000000000000000000" as `0x${string}`, // No controller for now
          formData.metadataURI,
        ],
      });

      let hash: string;

      // Prioritize embedded wallet for Saga chainlet transactions
      // MetaMask is only used as a fallback if embedded wallet is not available
      const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;
      const useMetaMask = ethereum && (ethereum.isMetaMask || (!ethereum.isCoinbaseWallet && ethereum.selectedAddress));
      
      // Try embedded wallet first (for Saga chainlet)
      if (evmAccount) {
        // Extract address - evmAccount might be an object with .address or just the address string
        const accountAddress = (typeof evmAccount === 'string' ? evmAccount : (evmAccount as any).address) as `0x${string}`;
        if (!accountAddress) {
          throw new Error("No EOA account address available. Please ensure you're properly connected.");
        }
        
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        // Check specific conditions before attempting transaction
        const checks = await Promise.allSettled([
          // Check if mythos is initialized
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.ISLAND_MYTHOS as `0x${string}`,
            abi: ISLAND_MYTHOS_ABI,
            functionName: "isInitialized",
          }),
          // Check if user has LOCATION_EDITOR_ROLE
          (async () => {
            const roleHash = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
              abi: LOCATION_REGISTRY_ABI,
              functionName: "LOCATION_EDITOR_ROLE",
            });
            return publicClient.readContract({
              address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
              abi: LOCATION_REGISTRY_ABI,
              functionName: "hasRole",
              args: [roleHash, accountAddress],
            });
          })(),
          // Check if slug already exists
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
            abi: LOCATION_REGISTRY_ABI,
            functionName: "getLocationBySlug",
            args: [formData.slug],
          }).then((location) => location.id !== 0n).catch(() => false),
          // Check if parent location exists (if parentLocationId !== 0)
          formData.parentLocationId !== 0
            ? publicClient.readContract({
                address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
                abi: LOCATION_REGISTRY_ABI,
                functionName: "getLocation",
                args: [BigInt(formData.parentLocationId)],
              }).then((location) => location.id !== 0n).catch(() => false)
            : Promise.resolve(true),
        ]);

        const mythosInitialized = checks[0].status === 'fulfilled' && checks[0].value === true;
        const hasPermission = checks[1].status === 'fulfilled' && checks[1].value === true;
        const slugExists = checks[2].status === 'fulfilled' && checks[2].value === true;
        const parentExists = checks[3].status === 'fulfilled' && checks[3].value === true;

        // Provide specific error message based on checks
        if (!mythosInitialized) {
          throw new Error("The realm's mythos must be initialized before creating locations. Please initialize the mythos first.");
        }
        if (!hasPermission) {
          throw new Error(`You don't have permission to create locations. Your address (${accountAddress}) needs the LOCATION_EDITOR_ROLE. Please contact an admin to grant you this role.`);
        }
        if (slugExists) {
          throw new Error(`The slug "${formData.slug}" already exists. Please use a different slug.`);
        }
        if (!parentExists && formData.parentLocationId !== 0) {
          throw new Error(`The parent location (ID: ${formData.parentLocationId}) does not exist. Please use 0 for root locations or ensure the parent location exists first.`);
        }

        // Get the current nonce and gas estimates from Saga chainlet
        const [nonce, gasPrice] = await Promise.all([
          publicClient.getTransactionCount({ address: accountAddress }),
          publicClient.getGasPrice(),
        ]);

        // Estimate gas for the transaction
        let gasEstimate: bigint;
        try {
          gasEstimate = await publicClient.estimateGas({
            account: accountAddress,
            to: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
            data: data as `0x${string}`,
            value: 0n,
          });
        } catch (estimateError) {
          throw new Error(`Transaction would revert: ${estimateError instanceof Error ? estimateError.message : 'Unknown error'}`);
        }

        // Sign the transaction with the embedded wallet
        const { signedTransaction } = await signEvmTransaction({
          evmAccount,
          transaction: {
            to: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
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

        // Broadcast the signed transaction to Saga chainlet
        hash = await publicClient.sendRawTransaction({
          serializedTransaction: signedTransaction,
        });
        console.log("Location creation via embedded wallet:", hash);
      } else if (useMetaMask) {
        // Fallback to MetaMask if embedded wallet is not available
          // Use MetaMask for signing
          const publicClient = createPublicClient({
            chain: SAGA_CHAINLET as any,
            transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
          });

          const walletClient = createWalletClient({
            chain: SAGA_CHAINLET as any,
            transport: custom(ethereum),
          });

          // Request account access
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          const accountAddress = accounts[0] as `0x${string}`;

          // Check specific conditions before attempting transaction
          const checks = await Promise.allSettled([
            // Check if mythos is initialized
            publicClient.readContract({
              address: CONTRACT_ADDRESSES.ISLAND_MYTHOS as `0x${string}`,
              abi: ISLAND_MYTHOS_ABI,
              functionName: "isInitialized",
            }),
            // Check if user has LOCATION_EDITOR_ROLE
            (async () => {
              const roleHash = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
                abi: LOCATION_REGISTRY_ABI,
                functionName: "LOCATION_EDITOR_ROLE",
              });
              return publicClient.readContract({
                address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
                abi: LOCATION_REGISTRY_ABI,
                functionName: "hasRole",
                args: [roleHash, accountAddress],
              });
            })(),
            // Check if slug already exists
            publicClient.readContract({
              address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
              abi: LOCATION_REGISTRY_ABI,
              functionName: "getLocationBySlug",
              args: [formData.slug],
            }).then((location) => location.id !== 0n).catch(() => false),
            // Check if parent location exists (if parentLocationId !== 0)
            formData.parentLocationId !== 0
              ? publicClient.readContract({
                  address: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
                  abi: LOCATION_REGISTRY_ABI,
                  functionName: "getLocation",
                  args: [BigInt(formData.parentLocationId)],
                }).then((location) => location.id !== 0n).catch(() => false)
              : Promise.resolve(true),
          ]);

          const mythosInitialized = checks[0].status === 'fulfilled' && checks[0].value === true;
          const hasPermission = checks[1].status === 'fulfilled' && checks[1].value === true;
          const slugExists = checks[2].status === 'fulfilled' && checks[2].value === true;
          const parentExists = checks[3].status === 'fulfilled' && checks[3].value === true;

          // Provide specific error message based on checks
          if (!mythosInitialized) {
            throw new Error("The realm's mythos must be initialized before creating locations. Please initialize the mythos first.");
          }
          if (!hasPermission) {
            throw new Error(`You don't have permission to create locations. Your address (${accountAddress}) needs the LOCATION_EDITOR_ROLE. Please contact an admin to grant you this role.`);
          }
          if (slugExists) {
            throw new Error(`The slug "${formData.slug}" already exists. Please use a different slug.`);
          }
          if (!parentExists && formData.parentLocationId !== 0) {
            throw new Error(`The parent location (ID: ${formData.parentLocationId}) does not exist. Please use 0 for root locations or ensure the parent location exists first.`);
          }

          // Get gas estimates (MetaMask handles nonce automatically)
          const gasPrice = await publicClient.getGasPrice();

          // Try to estimate gas, catch errors for better error messages
          let gasEstimate: bigint;
          try {
            gasEstimate = await publicClient.estimateGas({
              account: accountAddress,
              to: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
              data: data as `0x${string}`,
              value: 0n,
            });
          } catch (estimateError) {
            // This shouldn't happen if our checks above passed, but handle it just in case
            throw new Error(`Transaction would revert: ${estimateError instanceof Error ? estimateError.message : 'Unknown error'}`);
          }

          // Send transaction via MetaMask
          hash = await walletClient.sendTransaction({
            account: accountAddress,
            chain: SAGA_CHAINLET as any,
            to: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
            data: data as `0x${string}`,
            value: 0n,
            gas: gasEstimate,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice / 2n,
          });
          console.log("Location creation via MetaMask:", hash);
      } else {
        throw new Error("No wallet available. Please ensure you're properly connected with an embedded wallet, or install MetaMask as a fallback.");
      }

      setTransactionHash(hash);
      setSuccess(true);

      if (onSuccess) {
        // We don't have the location ID from the transaction, so we'll just call onSuccess
        setTimeout(() => {
          onSuccess(0); // Placeholder - in production, parse from events
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating location:", error);
      
      let errorMessage = "Failed to create location.";
      
      if (error instanceof Error) {
        // Check for specific error messages
        if (error.message.includes("execution reverted") || error.message.includes("EstimateGasExecutionError")) {
          // Try to determine the specific reason
          if (!mythos || !mythos.initialized) {
            errorMessage = "The realm's mythos must be initialized before creating locations. Please initialize the mythos first.";
          } else if (error.message.includes("mythos not initialized")) {
            errorMessage = "The realm's mythos is not initialized. Please initialize the mythos first.";
          } else if (error.message.includes("slug already exists")) {
            errorMessage = "A location with this slug already exists. Please choose a different slug.";
          } else if (error.message.includes("parent location does not exist")) {
            errorMessage = "The specified parent location does not exist. Please use a valid parent location ID or 0 for root locations.";
          } else if (error.message.includes("role") || error.message.includes("permission")) {
            errorMessage = "You don't have permission to create locations. You need the LOCATION_EDITOR_ROLE.";
          } else {
            errorMessage = `Transaction failed: ${error.message}. Make sure the mythos is initialized and you have the required permissions.`;
          }
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "biome" || name === "difficulty" || name === "parentLocationId"
        ? parseInt(value, 10) || 0
        : value,
    }));
  };

  // Handle image upload - populate sceneURI
  const handleImageUpload = (data: { ipfsHash: string; ipfsUrl: string; fileType: "image" | "video" }) => {
    const ipfsUrl = getIpfsProtocolUrl(data.ipfsHash);
    setUploadedImageHash(data.ipfsHash);
    setFormData((prev) => ({
      ...prev,
      sceneURI: ipfsUrl,
    }));
    // Metadata will be generated by useEffect when state updates
  };

  // Handle video upload - include in metadata
  const handleVideoUpload = (data: { ipfsHash: string; ipfsUrl: string; fileType: "image" | "video" }) => {
    setUploadedVideoHash(data.ipfsHash);
    // Metadata will be generated by useEffect when state updates
  };

  // Generate and upload metadata JSON via API
  const generateMetadata = async (imageHash: string, videoHash?: string) => {
    if (!imageHash || !formData.displayName || !formData.description) return;

    setIsGeneratingMetadata(true);
    try {
      const biomeLabel = BIOME_TYPES.find((b) => b.value === formData.biome)?.label || "Unknown";
      const difficultyLabel = DIFFICULTY_TIERS.find((d) => d.value === formData.difficulty)?.label || "None";

      // Call API to generate metadata
      const response = await fetch("/api/generate-location-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageIpfsHash: imageHash,
          videoIpfsHash: videoHash,
          locationName: formData.displayName,
          locationDescription: formData.description,
          biome: biomeLabel,
          difficulty: difficultyLabel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate metadata");
      }

      if (!data.metadataIpfsHash || !data.metadataIpfsUrl) {
        throw new Error("Invalid response from metadata API");
      }

      const metadataUrl = getIpfsProtocolUrl(data.metadataIpfsHash);

      setFormData((prev) => ({
        ...prev,
        metadataURI: metadataUrl,
      }));
    } catch (error) {
      console.error("Error generating metadata:", error);
      setError("Failed to generate metadata. You can manually enter the metadata URI.");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  // Check if location already has a scene URI in the database
  useEffect(() => {
    async function checkExistingScene() {
      if (formData.slug) {
        const exists = await hasLocationScene(formData.slug);
        if (exists) {
          const sceneURI = await getLocationSceneURI(formData.slug);
          if (sceneURI) {
            setHasExistingScene(true);
            setExistingSceneURI(sceneURI);
            setFormData((prev) => ({
              ...prev,
              sceneURI: sceneURI,
            }));
          }
        } else {
          setHasExistingScene(false);
          setExistingSceneURI(null);
        }
      }
    }
    checkExistingScene();
  }, [formData.slug]);

  // Generate metadata when image, video, or form data changes
  useEffect(() => {
    if (
      uploadedImageHash &&
      formData.displayName &&
      formData.description &&
      formData.slug &&
      !isGeneratingMetadata &&
      !hasExistingScene // Don't generate metadata if we're using existing scene
    ) {
      generateMetadata(uploadedImageHash, uploadedVideoHash || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImageHash, uploadedVideoHash, formData.displayName, formData.description, formData.slug, formData.biome, formData.difficulty, hasExistingScene]);

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="slug">Slug (URL-safe identifier)</Label>
          <Input
            id="slug"
            name="slug"
            type="text"
            value={formData.slug}
            onChange={handleChange}
            required
            disabled={isCreating || success}
            placeholder="fountain-path"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            value={formData.displayName}
            onChange={handleChange}
            required
            disabled={isCreating || success}
            placeholder="Fountain Path Sanctuary"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            disabled={isCreating || success}
            placeholder="A detailed description of this location..."
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="biome">Biome Type</Label>
          <Select
            id="biome"
            name="biome"
            value={formData.biome}
            onChange={handleChange}
            required
            disabled={isCreating || success}
          >
            {BIOME_TYPES.map((biome) => (
              <option key={biome.value} value={biome.value}>
                {biome.label}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="difficulty">Difficulty Tier</Label>
          <Select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            required
            disabled={isCreating || success}
          >
            {DIFFICULTY_TIERS.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="parentLocationId">Parent Location ID (0 for root)</Label>
          <Input
            id="parentLocationId"
            name="parentLocationId"
            type="number"
            min="0"
            value={formData.parentLocationId}
            onChange={handleChange}
            required
            disabled={isCreating || success}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="imageUpload">Location Image (Required)</Label>
          {hasExistingScene && existingSceneURI && (
            <div style={{ 
              background: "rgba(74, 154, 122, 0.2)", 
              border: `1px solid ${colors.jungleCyan}`, 
              borderRadius: "8px", 
              padding: "1rem", 
              marginBottom: "1rem" 
            }}>
              <p style={{ color: colors.jungleCyan, margin: 0, fontWeight: 600 }}>
                ✓ Using existing scene from contract: {existingSceneURI}
              </p>
              <p style={{ color: colors.textSecondary, margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
                This location already has a scene uploaded. You can upload a new image to replace it.
              </p>
            </div>
          )}
          <MediaUpload
            accept="image/*"
            onUploadComplete={handleImageUpload}
            onError={(error) => setError(error)}
            disabled={isCreating || success}
            label={hasExistingScene ? "Upload new location image (optional)" : "Upload location image"}
          />
          <Input
            id="sceneURI"
            name="sceneURI"
            type="text"
            value={formData.sceneURI}
            onChange={handleChange}
            disabled={isCreating || success}
            placeholder="ipfs://Qm... (auto-filled when image is uploaded or if existing scene found)"
            style={{ marginTop: "0.5rem" }}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="videoUpload">Location Video (Optional - Unlocked as user explores)</Label>
          <MediaUpload
            accept="video/*"
            onUploadComplete={handleVideoUpload}
            onError={(error) => setError(error)}
            disabled={isCreating || success}
            label="Upload location video"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="metadataURI">Metadata URI (IPFS or HTTPS, optional)</Label>
          {isGeneratingMetadata && (
            <div style={{ color: colors.textSecondary, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              Generating metadata...
            </div>
          )}
          <Input
            id="metadataURI"
            name="metadataURI"
            type="text"
            value={formData.metadataURI}
            onChange={handleChange}
            disabled={isCreating || success}
            placeholder="ipfs://Qm... (auto-filled when metadata is generated)"
          />
        </FormGroup>

        {mythosLoading && (
          <div style={{ color: colors.textSecondary, fontSize: "0.9rem", marginBottom: "1rem" }}>
            Checking mythos initialization status...
          </div>
        )}
        
        {!mythosLoading && mythos && !mythos.initialized && (
          <ErrorMessage>
            ⚠️ The realm's mythos must be initialized before creating locations. Please initialize the mythos first.
          </ErrorMessage>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && (
          <SuccessMessage>
            Location created successfully! {transactionHash && `Transaction: ${transactionHash}`}
          </SuccessMessage>
        )}

        <Button type="submit" disabled={isCreating || success || mythosLoading || (!mythos || !mythos.initialized)}>
          {isCreating ? "Creating..." : success ? "Created!" : "Create Location"}
        </Button>
      </form>
    </FormContainer>
  );
}

