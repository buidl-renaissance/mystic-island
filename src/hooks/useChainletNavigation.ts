import { useState, useCallback } from "react";
import { useCurrentUser } from "@coinbase/cdp-hooks";
import { SAGA_CHAINLET, LORD_SMEARINGON_CHAINLET, CHAINLET_REGISTRY } from "@/utils/contracts";

export interface ChainletConfig {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
  rpcUrls: {
    default: {
      http: readonly string[];
    };
    public: {
      http: readonly string[];
    };
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
  };
}

export function useChainletNavigation() {
  const { currentUser } = useCurrentUser();
  const [currentChainletId, setCurrentChainletId] = useState<number>(SAGA_CHAINLET.id);

  // Get current chainlet configuration
  const getCurrentChainlet = useCallback((): ChainletConfig | null => {
    return CHAINLET_REGISTRY[currentChainletId] || null;
  }, [currentChainletId]);

  // Check if currently on a specific chainlet
  const isOnChainlet = useCallback(
    (chainletId: number): boolean => {
      return currentChainletId === chainletId;
    },
    [currentChainletId]
  );

  // Switch to a different chainlet
  const switchChainlet = useCallback(
    async (chainletId: number): Promise<void> => {
      const chainletConfig = CHAINLET_REGISTRY[chainletId];
      if (!chainletConfig) {
        throw new Error(`Chainlet with ID ${chainletId} not found in registry`);
      }

      // For embedded wallets (Coinbase), we need to switch the network
      // For external wallets (MetaMask), we use wallet_addEthereumChain
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;

        try {
          // Try to switch to the chainlet
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${chainletId.toString(16)}` }],
          });
          setCurrentChainletId(chainletId);
        } catch (switchError: any) {
          // If the chainlet is not added, add it
          if (switchError.code === 4902 || switchError.code === -32603) {
            try {
              await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: `0x${chainletId.toString(16)}`,
                    chainName: chainletConfig.name,
                    nativeCurrency: chainletConfig.nativeCurrency,
                    rpcUrls: chainletConfig.rpcUrls.default.http,
                    blockExplorerUrls: chainletConfig.blockExplorers.default.url
                      ? [chainletConfig.blockExplorers.default.url]
                      : [],
                  },
                ],
              });
              setCurrentChainletId(chainletId);
            } catch (addError) {
              console.error("Error adding chainlet:", addError);
              throw new Error(`Failed to add chainlet: ${addError}`);
            }
          } else {
            throw switchError;
          }
        }
      } else {
        // For embedded wallets, we might need to handle differently
        // For now, just update the state
        setCurrentChainletId(chainletId);
      }
    },
    []
  );

  // Switch to main chainlet (Mystic Island)
  const switchToMainChainlet = useCallback(async (): Promise<void> => {
    await switchChainlet(SAGA_CHAINLET.id);
  }, [switchChainlet]);

  // Switch to gallery chainlet (Lord Smearingon's Gallery)
  const switchToGalleryChainlet = useCallback(async (): Promise<void> => {
    if (LORD_SMEARINGON_CHAINLET.id === 0) {
      throw new Error("Gallery chainlet not configured. Please update chainlet ID in contracts.ts");
    }
    await switchChainlet(LORD_SMEARINGON_CHAINLET.id);
  }, [switchChainlet]);

  return {
    currentChainletId,
    currentChainlet: getCurrentChainlet(),
    isOnChainlet,
    switchChainlet,
    switchToMainChainlet,
    switchToGalleryChainlet,
  };
}

