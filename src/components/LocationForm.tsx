import { useState } from "react";
import styled from "styled-components";
import { useSendUserOperation, useCurrentUser } from "@coinbase/cdp-hooks";
import { encodeFunctionData } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, LOCATION_REGISTRY_ABI } from "@/utils/contracts";

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
  const { sendUserOperation } = useSendUserOperation();
  const smartAccount = currentUser?.evmSmartAccounts?.[0];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smartAccount) {
      setError("Smart account not available. Please ensure you're properly connected.");
      return;
    }

    if (CONTRACT_ADDRESSES.LOCATION_REGISTRY === "0x0000000000000000000000000000000000000000") {
      setError("LocationRegistry contract not deployed yet. Please deploy contracts first.");
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

      // Use sendUserOperation to execute with embedded wallet
      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: "base-sepolia", // TODO: Update when Saga chainlet is supported
        calls: [
          {
            to: CONTRACT_ADDRESSES.LOCATION_REGISTRY as `0x${string}`,
            data: data as `0x${string}`,
            value: 0n,
          },
        ],
      });

      console.log("Location creation transaction sent:", result);
      setTransactionHash(result.userOperationHash || undefined);
      setSuccess(true);

      if (onSuccess) {
        // We don't have the location ID from the transaction, so we'll just call onSuccess
        setTimeout(() => {
          onSuccess(0); // Placeholder - in production, parse from events
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating location:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create location. Make sure you have the required permissions and the mythos is initialized."
      );
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
          <Label htmlFor="sceneURI">Scene URI (IPFS or HTTPS)</Label>
          <Input
            id="sceneURI"
            name="sceneURI"
            type="text"
            value={formData.sceneURI}
            onChange={handleChange}
            disabled={isCreating || success}
            placeholder="ipfs://Qm..."
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="metadataURI">Metadata URI (IPFS or HTTPS, optional)</Label>
          <Input
            id="metadataURI"
            name="metadataURI"
            type="text"
            value={formData.metadataURI}
            onChange={handleChange}
            disabled={isCreating || success}
            placeholder="ipfs://Qm..."
          />
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && (
          <SuccessMessage>
            Location created successfully! {transactionHash && `Transaction: ${transactionHash}`}
          </SuccessMessage>
        )}

        <Button type="submit" disabled={isCreating || success}>
          {isCreating ? "Creating..." : success ? "Created!" : "Create Location"}
        </Button>
      </form>
    </FormContainer>
  );
}

