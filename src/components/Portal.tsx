import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useRouter } from "next/router";
import { createPublicClient, createWalletClient, http, custom, encodeFunctionData } from "viem";
import { useEvmAddress, useCurrentUser, useSignEvmTransaction } from "@coinbase/cdp-hooks";
import { CONTRACT_ADDRESSES, SAGA_CHAINLET, PORTAL_ABI, LORD_SMEARINGON_CHAINLET } from "@/utils/contracts";
import { useChainletNavigation } from "@/hooks/useChainletNavigation";

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(232, 168, 85, 0.5); }
  50% { box-shadow: 0 0 40px rgba(232, 168, 85, 0.8); }
`;

// Styled Components
const PortalContainer = styled.div`
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(90, 63, 143, 0.3);
  border: 2px solid rgba(232, 168, 85, 0.5);
  border-radius: 16px;
  backdrop-filter: blur(10px);
`;

const PortalTitle = styled.h3`
  font-size: 1.5rem;
  color: #E8A855;
  margin-bottom: 1rem;
  text-align: center;
  text-shadow: 0 0 10px rgba(232, 168, 85, 0.5);
`;

const PortalDescription = styled.p`
  color: #D0D0D0;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  text-align: center;
`;

const PortalButton = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #5A3F8F 0%, #B85A8F 100%);
  border: 2px solid #E8A855;
  border-radius: 12px;
  color: #F5F5F5;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${glow} 2s ease-in-out infinite;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(232, 168, 85, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    animation: none;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(232, 168, 85, 0.3);
  border-top-color: #E8A855;
  border-radius: 50%;
  animation: ${pulse} 1s linear infinite;
  margin-right: 0.5rem;
`;

const ErrorMessage = styled.div`
  background: rgba(199, 106, 42, 0.2);
  border: 1px solid #C76A2A;
  border-radius: 12px;
  padding: 1rem;
  color: #C76A2A;
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  background: rgba(45, 90, 61, 0.3);
  border: 1px solid #4A9A7A;
  border-radius: 12px;
  padding: 1rem;
  color: #4A9A7A;
  margin-bottom: 1rem;
  text-align: center;
`;

interface PortalProps {
  locationId: bigint;
  locationSlug: string;
}

export default function Portal({ locationId, locationSlug }: PortalProps) {
  const router = useRouter();
  const { evmAddress } = useEvmAddress();
  const { currentUser } = useCurrentUser();
  const { signEvmTransaction } = useSignEvmTransaction();
  const { switchToGalleryChainlet, isOnChainlet } = useChainletNavigation();
  const [portalId, setPortalId] = useState<bigint | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if this is the planetarium location
  const isPlanetarium = locationSlug === "planetarium-sunset-plains";

  // Find portal for this location
  useEffect(() => {
    async function findPortal() {
      const portalAddress = CONTRACT_ADDRESSES.PORTAL as string;
      if (!isPlanetarium || portalAddress === "0x0000000000000000000000000000000000000000" || !portalAddress) {
        return;
      }

      try {
        const publicClient = createPublicClient({
          chain: SAGA_CHAINLET as any,
          transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
        });

        const foundPortalId = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.PORTAL as `0x${string}`,
          abi: PORTAL_ABI,
          functionName: "findPortalBySourceLocation",
          args: [locationId],
        });

        if (foundPortalId !== 0n) {
          setPortalId(foundPortalId);
        }
      } catch (err) {
        console.error("Error finding portal:", err);
      }
    }

    findPortal();
  }, [locationId, locationSlug, isPlanetarium]);

  const activatePortal = async () => {
    if (!evmAddress || !portalId) {
      setError("Portal not available");
      return;
    }

    setIsActivating(true);
    setError(null);
    setSuccess(null);

    try {
      const publicClient = createPublicClient({
        chain: SAGA_CHAINLET as any,
        transport: http(SAGA_CHAINLET.rpcUrls.default.http[0]),
      });

      const sendTransaction = async (data: `0x${string}`, to: `0x${string}`) => {
        const evmAccount = currentUser?.evmAccounts?.[0];
        if (evmAccount) {
          // Extract address - evmAccount might be an object with .address or just the address string
          const accountAddress = (typeof evmAccount === 'string' ? evmAccount : (evmAccount as any).address) as `0x${string}`;
          if (!accountAddress) {
            throw new Error("No EOA account address available. Please ensure you're properly connected.");
          }
          
          const gasPrice = await publicClient.getGasPrice();
          const nonce = await publicClient.getTransactionCount({
            address: accountAddress,
          });

          const gasEstimate = await publicClient.estimateGas({
            account: accountAddress,
            to,
            data,
            value: 0n,
          });

          const { signedTransaction } = await signEvmTransaction({
            evmAccount,
            transaction: {
              to,
              data,
              value: 0n,
              nonce,
              gas: gasEstimate,
              maxFeePerGas: gasPrice,
              maxPriorityFeePerGas: gasPrice / 2n,
              chainId: SAGA_CHAINLET.id,
              type: "eip1559",
            },
          });

          return await publicClient.sendRawTransaction({
            serializedTransaction: signedTransaction,
          });
        } else if (typeof window !== "undefined" && (window as any).ethereum) {
          const ethereum = (window as any).ethereum;
          const walletClient = createWalletClient({
            chain: SAGA_CHAINLET as any,
            transport: custom(ethereum),
          });

          const accounts = await ethereum.request({ method: "eth_requestAccounts" });
          const accountAddress = accounts[0] as `0x${string}`;

          const gasPrice = await publicClient.getGasPrice();
          const gasEstimate = await publicClient.estimateGas({
            account: accountAddress,
            to,
            data,
            value: 0n,
          });

          return await walletClient.sendTransaction({
            account: accountAddress,
            chain: SAGA_CHAINLET as any,
            to,
            data,
            value: 0n,
            gas: gasEstimate,
            maxFeePerGas: gasPrice,
            maxPriorityFeePerGas: gasPrice / 2n,
          });
        } else {
          throw new Error("No wallet available");
        }
      };

      // Activate portal on-chain
      const activateData = encodeFunctionData({
        abi: PORTAL_ABI,
        functionName: "activatePortal",
        args: [portalId],
      });

      await sendTransaction(activateData, CONTRACT_ADDRESSES.PORTAL as `0x${string}`);

      setSuccess("Portal activated! Switching to gallery chainlet...");

      // Switch to gallery chainlet
      try {
        await switchToGalleryChainlet();
        
        // Navigate to gallery entrance location
        // Note: This will need to be updated once gallery location is created on the new chainlet
        // For now, we'll just show success message
        setSuccess("Portal activated! You have been transported to Lord Smearingon's Gallery.");
        
        // TODO: Navigate to gallery location once it's created
        // router.push(`/location/gallery-entrance`);
      } catch (chainletError) {
        console.error("Error switching chainlet:", chainletError);
        setError(`Portal activated, but failed to switch chainlet: ${chainletError}`);
      }
    } catch (err) {
      console.error("Error activating portal:", err);
      setError(err instanceof Error ? err.message : "Failed to activate portal");
    } finally {
      setIsActivating(false);
    }
  };

  if (!isPlanetarium) {
    return null;
  }

  if (!portalId) {
    return (
      <PortalContainer>
        <PortalTitle>Portal to Lord Smearingon's Gallery</PortalTitle>
        <PortalDescription>
          A portal is being configured for this location. Please check back later.
        </PortalDescription>
      </PortalContainer>
    );
  }

  return (
    <PortalContainer>
      <PortalTitle>Portal to Lord Smearingon's Gallery</PortalTitle>
      <PortalDescription>
        You stand before a shimmering portal that leads to another realm. The portal pulses with
        otherworldly energy, promising passage to Lord Smearingon's Gallery - a place where reality
        bends and the absurd becomes real.
      </PortalDescription>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <PortalButton onClick={activatePortal} disabled={isActivating || !evmAddress}>
        {isActivating ? (
          <>
            <LoadingSpinner />
            Activating Portal...
          </>
        ) : (
          "Activate Portal"
        )}
      </PortalButton>
    </PortalContainer>
  );
}

