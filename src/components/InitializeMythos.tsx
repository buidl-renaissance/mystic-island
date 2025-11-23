import { useState } from "react";
import styled from "styled-components";
import { useSendUserOperation, useCurrentUser } from "@coinbase/cdp-hooks";
import { encodeFunctionData } from "viem";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, ISLAND_MYTHOS_ABI } from "@/utils/contracts";
import { MYSTIC_ISLAND_MYTHOS } from "@/data/realm-content";
import ImageUpload from "@/components/ImageUpload";

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

interface InitializeMythosProps {
  onSuccess?: () => void;
}

export default function InitializeMythos({ onSuccess }: InitializeMythosProps) {
  const { currentUser } = useCurrentUser();
  const { sendUserOperation } = useSendUserOperation();
  const smartAccount = currentUser?.evmSmartAccounts?.[0];

  const [formData, setFormData] = useState({
    islandName: MYSTIC_ISLAND_MYTHOS.islandName,
    shortTheme: MYSTIC_ISLAND_MYTHOS.shortTheme,
    artDirection: MYSTIC_ISLAND_MYTHOS.artDirection,
    coreMyth: MYSTIC_ISLAND_MYTHOS.coreMyth,
    loreURI: MYSTIC_ISLAND_MYTHOS.loreURI,
  });

  const [loreImageUploaded, setLoreImageUploaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smartAccount) {
      setError("Smart account not available. Please ensure you're properly connected.");
      return;
    }

    if (CONTRACT_ADDRESSES.ISLAND_MYTHOS === "0x0000000000000000000000000000000000000000") {
      setError("IslandMythos contract not deployed yet. Please deploy contracts first.");
      return;
    }

    setIsInitializing(true);
    setError(null);
    setSuccess(false);

    try {
      // Encode the initializeMythos function call
      const data = encodeFunctionData({
        abi: ISLAND_MYTHOS_ABI,
        functionName: "initializeMythos",
        args: [
          formData.islandName,
          formData.shortTheme,
          formData.artDirection,
          formData.coreMyth,
          formData.loreURI,
        ],
      });

      // Use sendUserOperation to execute with embedded wallet
      const result = await sendUserOperation({
        evmSmartAccount: smartAccount,
        network: "base-sepolia", // TODO: Update when Saga chainlet is supported
        calls: [
          {
            to: CONTRACT_ADDRESSES.ISLAND_MYTHOS as `0x${string}`,
            data: data as `0x${string}`,
            value: 0n,
          },
        ],
      });

      console.log("Mythos initialization transaction sent:", result);
      setTransactionHash(result.userOperationHash || undefined);
      setSuccess(true);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error("Error initializing mythos:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to initialize mythos. Make sure you have the required permissions."
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="islandName">Island Name</Label>
          <Input
            id="islandName"
            name="islandName"
            type="text"
            value={formData.islandName}
            onChange={handleChange}
            required
            disabled={isInitializing || success}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="shortTheme">Short Theme</Label>
          <TextArea
            id="shortTheme"
            name="shortTheme"
            value={formData.shortTheme}
            onChange={handleChange}
            required
            disabled={isInitializing || success}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="artDirection">Art Direction</Label>
          <TextArea
            id="artDirection"
            name="artDirection"
            value={formData.artDirection}
            onChange={handleChange}
            required
            disabled={isInitializing || success}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="coreMyth">Core Myth</Label>
          <TextArea
            id="coreMyth"
            name="coreMyth"
            value={formData.coreMyth}
            onChange={handleChange}
            required
            disabled={isInitializing || success}
            style={{ minHeight: "150px" }}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="loreImage">Lore Image (Upload to IPFS)</Label>
          <p style={{ color: colors.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            Upload an image representing the realm's lore. AI will generate metadata and the URI will be auto-filled below.
          </p>
          <ImageUpload
            onUploadComplete={(metadata) => {
              setFormData((prev) => ({
                ...prev,
                loreURI: metadata.metadataIpfsUrl,
              }));
              setLoreImageUploaded(true);
              setError(null); // Clear any previous errors
            }}
            onError={(error) => {
              setError(error);
              setLoreImageUploaded(false);
            }}
            disabled={isInitializing || success}
          />
          {loreImageUploaded && (
            <div style={{ marginTop: "0.5rem", color: colors.jungleCyan, fontSize: "0.9rem" }}>
              ✓ Image uploaded to IPFS - URI auto-filled below
            </div>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="loreURI">Lore URI (Auto-filled from image upload, or enter manually)</Label>
          <Input
            id="loreURI"
            name="loreURI"
            type="text"
            value={formData.loreURI}
            onChange={handleChange}
            required
            disabled={isInitializing || success}
            placeholder="ipfs://Qm... (will be auto-filled from image upload)"
          />
          {!loreImageUploaded && formData.loreURI && formData.loreURI !== MYSTIC_ISLAND_MYTHOS.loreURI && (
            <div style={{ marginTop: "0.5rem", color: colors.textSecondary, fontSize: "0.85rem" }}>
              ℹ️ You can also upload an image above to auto-fill this field
            </div>
          )}
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && (
          <SuccessMessage>
            Mythos initialized successfully! {transactionHash && `Transaction: ${transactionHash}`}
          </SuccessMessage>
        )}

        <Button type="submit" disabled={isInitializing || success}>
          {isInitializing ? "Initializing..." : success ? "Initialized!" : "Initialize Mythos"}
        </Button>
      </form>
    </FormContainer>
  );
}

